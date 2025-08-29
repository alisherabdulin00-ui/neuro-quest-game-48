import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

const supabase = createClient(supabaseUrl!, supabaseServiceKey!);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Model pricing in USD per 1M tokens
const modelPrices = {
  'gpt-5-2025-08-07': { input: 1.25, output: 10.00 },
  'gpt-5-mini-2025-08-07': { input: 0.25, output: 2.00 },
  'gpt-5-nano-2025-08-07': { input: 0.05, output: 0.40 },
  'gpt-4.1-2025-04-14': { input: 2.00, output: 8.00 },
  'gpt-4.1-mini-2025-04-14': { input: 0.40, output: 1.60 },
  'gpt-4o': { input: 2.50, output: 10.00 },
  'gpt-4o-mini': { input: 0.15, output: 0.60 },
  'o3-2025-04-16': { input: 150.00, output: 600.00 },
  'o4-mini-2025-04-16': { input: 150.00, output: 600.00 },
};

function calculateCost(inputTokens: number, outputTokens: number, model: string, multiplier = 3) {
  const prices = modelPrices[model as keyof typeof modelPrices];
  if (!prices) {
    throw new Error(`Unknown model: ${model}`);
  }
  
  const costInput = (inputTokens / 1_000_000) * prices.input;
  const costOutput = (outputTokens / 1_000_000) * prices.output;
  const totalUsd = (costInput + costOutput) * multiplier;
  
  const coinRate = 0.001; // $0.001 per coin
  const coins = Math.round(totalUsd / coinRate);
  
  return { coins, totalUsd };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!openAIApiKey) {
      console.error('OPENAI_API_KEY is not set');
      return new Response(
        JSON.stringify({ error: 'OpenAI API ключ не настроен' }), 
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Get user ID from auth header
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Требуется авторизация для использования AI' }), 
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const { prompt, model = 'gpt-5-2025-08-07' } = await req.json();

    // Get user from auth token
    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
    if (authError || !user) {
      console.error('Auth error:', authError);
      return new Response(
        JSON.stringify({ error: 'Ошибка авторизации' }), 
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Check user's current coin balance
    const { data: userPoints, error: pointsError } = await supabase
      .from('user_points')
      .select('total_points')
      .eq('user_id', user.id)
      .maybeSingle();

    if (pointsError) {
      console.error('Error fetching user points:', pointsError);
      return new Response(
        JSON.stringify({ error: 'Ошибка получения баланса монет' }), 
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const currentCoins = userPoints?.total_points || 0;

    // Check user subscription for limits
    const { data: subscription, error: subError } = await supabase
      .from('user_subscriptions')
      .select('subscription_tier, max_coins')
      .eq('user_id', user.id)
      .maybeSingle();

    if (subError) {
      console.error('Error fetching subscription:', subError);
    }

    const userTier = subscription?.subscription_tier || 'free';
    const maxCoins = subscription?.max_coins || 50;

    // For free tier, check if user has exceeded their limit
    if (userTier === 'free' && currentCoins <= 0) {
      return new Response(
        JSON.stringify({ 
          error: 'Недостаточно монет. Выполните уроки чтобы заработать монеты или перейдите на Pro.',
          coinsNeeded: 1,
          currentCoins: currentCoins
        }), 
        { 
          status: 402, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (!prompt) {
      return new Response(
        JSON.stringify({ error: 'Требуется текст запроса' }), 
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Define model categories with appropriate token limits
    const gpt5Models = ['gpt-5-2025-08-07'];
    const gpt5MiniModels = ['gpt-5-mini-2025-08-07'];
    const gpt5NanoModels = ['gpt-5-nano-2025-08-07'];
    const reasoningModels = ['o3-2025-04-16', 'o4-mini-2025-04-16'];
    const gpt4Models = ['gpt-4.1-2025-04-14', 'gpt-4.1-mini-2025-04-14'];
    const legacyModels = ['gpt-4o', 'gpt-4o-mini'];

    const isNewerModel = [...gpt5Models, ...gpt5MiniModels, ...gpt5NanoModels, ...reasoningModels, ...gpt4Models].includes(model);

    const requestBody: any = {
      model: model,
      messages: [
        { 
          role: 'system', 
          content: 'Отвечай на русском языке кратко и по делу.' 
        },
        { role: 'user', content: prompt }
      ],
    };

    // Set token limits based on model type
    if (isNewerModel) {
      if (gpt5Models.includes(model)) {
        requestBody.max_completion_tokens = 8000;
      } else if (gpt5MiniModels.includes(model)) {
        requestBody.max_completion_tokens = 4000;
      } else if (gpt5NanoModels.includes(model)) {
        requestBody.max_completion_tokens = 3000;
      } else if (reasoningModels.includes(model)) {
        requestBody.max_completion_tokens = 6000;
      } else if (gpt4Models.includes(model)) {
        requestBody.max_completion_tokens = 4000;
      }
      // Don't add temperature for newer models as it's not supported
    } else {
      requestBody.max_tokens = 2000;
      requestBody.temperature = 0.7;
    }

    console.log('Sending request to OpenAI with model:', model);
    console.log('Request body:', JSON.stringify(requestBody, null, 2));

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    console.log('OpenAI response status:', response.status);

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenAI API error:', response.status, errorData);
      
      return new Response(
        JSON.stringify({ 
          error: `Ошибка OpenAI API: ${response.status}. ${errorData}` 
        }), 
        { 
          status: response.status, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const data = await response.json();
    console.log('OpenAI response data:', JSON.stringify(data, null, 2));
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error('Unexpected OpenAI response structure:', data);
      return new Response(
        JSON.stringify({ error: 'Неожиданная структура ответа от OpenAI' }), 
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const generatedText = data.choices[0].message.content;
    const finishReason = data.choices[0].finish_reason;
    console.log('Generated text length:', generatedText ? generatedText.length : 'null');
    console.log('Finish reason:', finishReason);
    
    // Extract token usage from OpenAI response
    const inputTokens = data.usage?.prompt_tokens || 0;
    const outputTokens = data.usage?.completion_tokens || 0;
    
    console.log('Token usage - Input:', inputTokens, 'Output:', outputTokens);
    
    // Calculate cost in coins
    const { coins, totalUsd } = calculateCost(inputTokens, outputTokens, model);
    console.log('Calculated cost:', coins, 'coins (', totalUsd, 'USD)');
    
    // For Pro users, skip coin deduction
    if (userTier !== 'pro') {
      // Check if user has enough coins for this request
      if (currentCoins < coins) {
        return new Response(
          JSON.stringify({ 
            error: `Недостаточно монет. Требуется: ${coins}, доступно: ${currentCoins}`,
            coinsNeeded: coins,
            currentCoins: currentCoins
          }), 
          { 
            status: 402, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      // Deduct coins from user's balance
      const newBalance = currentCoins - coins;
      const { error: updateError } = await supabase
        .from('user_points')
        .update({ total_points: newBalance, updated_at: new Date().toISOString() })
        .eq('user_id', user.id);

      if (updateError) {
        console.error('Error updating user balance:', updateError);
        return new Response(
          JSON.stringify({ error: 'Ошибка списания монет' }), 
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
    }

    // Log AI usage
    const { error: logError } = await supabase
      .from('ai_usage_log')
      .insert({
        user_id: user.id,
        model: model,
        input_tokens: inputTokens,
        output_tokens: outputTokens,
        cost_usd: totalUsd,
        coins_deducted: userTier === 'pro' ? 0 : coins,
        multiplier: 3.0
      });

    if (logError) {
      console.error('Error logging AI usage:', logError);
    }
    
    // Log reasoning tokens for debugging if available
    if (data.usage?.reasoning_tokens) {
      console.log('Reasoning tokens used:', data.usage.reasoning_tokens);
    }

    // Check if content is null or empty
    if (!generatedText || generatedText.trim() === '') {
      console.error('OpenAI returned empty content, finish_reason:', finishReason);
      
      let errorMessage = 'OpenAI вернул пустой ответ.';
      if (finishReason === 'length') {
        errorMessage = 'Превышен лимит токенов. Попробуйте сократить запрос или использовать другую модель.';
      } else if (finishReason === 'content_filter') {
        errorMessage = 'Контент заблокирован фильтром безопасности.';
      } else {
        errorMessage += ' Попробуйте другую модель.';
      }
      
      return new Response(
        JSON.stringify({ error: errorMessage }), 
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    return new Response(
      JSON.stringify({ 
        response: generatedText.trim(),
        coinsDeducted: userTier === 'pro' ? 0 : coins,
        remainingCoins: userTier === 'pro' ? 'unlimited' : (currentCoins - coins)
      }), 
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in generate-text function:', error);
    return new Response(
      JSON.stringify({ error: 'Внутренняя ошибка сервера' }), 
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});