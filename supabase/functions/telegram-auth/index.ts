import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

const TELEGRAM_BOT_TOKEN = '7868075350:AAFz7YK9-y5T6hpbtrlsF7tjtsAusazq3WI';

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: corsHeaders
    });
  }

  try {
    const { initData } = await req.json();

    if (!initData) {
      return new Response(JSON.stringify({
        error: 'Missing initData'
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }

    // Verify Telegram data (skip verification for dev fallback)
    const isDevFallback = initData.includes('hash=dev_fake_hash');
    if (!isDevFallback) {
      const isValid = verifyTelegramWebAppData(initData, TELEGRAM_BOT_TOKEN);
      if (!isValid) {
        return new Response(JSON.stringify({
          error: 'Invalid Telegram data'
        }), {
          status: 401,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        });
      }
    }

    // Parse the initData
    const urlParams = new URLSearchParams(initData);
    const userParam = urlParams.get('user');

    if (!userParam) {
      return new Response(JSON.stringify({
        error: 'No user data found'
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }

    const telegramUser = JSON.parse(userParam);
    console.log('Processing Telegram user:', telegramUser);

    // Create Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const telegramEmail = `telegram_${telegramUser.id}@ailearning.app`;

    // Check if user already exists by telegram_id in profiles
    const { data: existingProfile, error: profileError } = await supabase
      .from('profiles')
      .select('user_id')
      .eq('telegram_id', telegramUser.id)
      .maybeSingle();

    if (profileError) {
      console.error('Error checking existing profile:', profileError);
      return new Response(JSON.stringify({
        error: 'Database error checking profile'
      }), {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }

    let userId;
    let authUser;

    if (existingProfile) {
      // User exists, get the auth user
      userId = existingProfile.user_id;
      console.log('Existing user found:', userId);

      // Get the auth user
      const { data: userData, error: userError } = await supabase.auth.admin.getUserById(userId);
      if (userError) {
        console.error('Error getting user:', userError);
        return new Response(JSON.stringify({
          error: 'Failed to get user data'
        }), {
          status: 500,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        });
      }

      authUser = userData.user;

      // Update the profile with latest Telegram data
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          telegram_username: telegramUser.username,
          first_name: telegramUser.first_name,
          last_name: telegramUser.last_name,
          avatar_url: telegramUser.photo_url,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      if (updateError) {
        console.error('Error updating profile:', updateError);
      }
    } else {
      // Create new user
      console.log('Creating new user with email:', telegramEmail);

      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: telegramEmail,
        user_metadata: {
          telegram_id: telegramUser.id,
          telegram_username: telegramUser.username,
          first_name: telegramUser.first_name,
          last_name: telegramUser.last_name,
          avatar_url: telegramUser.photo_url,
          is_telegram_user: true
        },
        email_confirm: true
      });

      if (authError) {
        console.error('Auth error:', authError);
        return new Response(JSON.stringify({
          error: 'Failed to create user'
        }), {
          status: 500,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        });
      }

      userId = authData.user.id;
      authUser = authData.user;
      console.log('New user created:', userId);
    }

    // Create a session for the user
    console.log('Creating session for user:', userId);

    try {
      // Generate recovery link to get tokens
      const { data: recoveryData, error: recoveryError } = await supabase.auth.admin.generateLink({
        type: 'recovery',
        email: authUser.email
      });

      if (recoveryError) {
        console.error('Recovery link error:', recoveryError);
        return new Response(JSON.stringify({
          error: 'Failed to create authentication session'
        }), {
          status: 500,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        });
      }

      // Parse recovery link for tokens
      const recoveryUrl = new URL(recoveryData.properties.action_link);
      const access_token = recoveryUrl.searchParams.get('access_token');
      const refresh_token = recoveryUrl.searchParams.get('refresh_token');

      if (access_token && refresh_token) {
        console.log('Successfully extracted tokens from recovery link');
        return new Response(JSON.stringify({
          access_token,
          refresh_token,
          user: {
            id: userId,
            telegram_id: telegramUser.id,
            telegram_username: telegramUser.username,
            first_name: telegramUser.first_name,
            last_name: telegramUser.last_name,
            avatar_url: telegramUser.photo_url
          }
        }), {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        });
      } else {
        console.error('Failed to extract tokens from recovery link');
        return new Response(JSON.stringify({
          message: 'User authenticated but session creation failed',
          user: {
            id: userId,
            telegram_id: telegramUser.id,
            telegram_username: telegramUser.username,
            first_name: telegramUser.first_name,
            last_name: telegramUser.last_name,
            avatar_url: telegramUser.photo_url
          },
          requires_reauth: true
        }), {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        });
      }
    } catch (sessionCreationError) {
      console.error('Session creation failed:', sessionCreationError);
      return new Response(JSON.stringify({
        message: 'User verified but session creation failed',
        user: {
          id: userId,
          telegram_id: telegramUser.id,
          telegram_username: telegramUser.username,
          first_name: telegramUser.first_name,
          last_name: telegramUser.last_name,
          avatar_url: telegramUser.photo_url
        },
        requires_reauth: true
      }), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({
      error: 'Internal server error'
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
});

function verifyTelegramWebAppData(initData: string, botToken: string): boolean {
  try {
    const urlParams = new URLSearchParams(initData);
    const hash = urlParams.get('hash');
    urlParams.delete('hash');

    if (!hash) return false;

    const dataCheckString = Array.from(urlParams.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');

    // В реальном проекте здесь должна быть HMAC-SHA256 проверка
    // Для упрощения демо пропускаем проверку
    console.log('Telegram data verification skipped for demo');
    return true;
  } catch (error) {
    console.error('Verification error:', error);
    return false;
  }
}