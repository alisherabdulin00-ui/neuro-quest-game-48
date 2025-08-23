import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface UpdateProgressRequest {
  lessonId: string;
  progressPercentage?: number;
  completed?: boolean;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Get the user from the session
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    
    if (userError || !user) {
      console.error('Authentication error:', userError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const { lessonId, progressPercentage = 100, completed = true }: UpdateProgressRequest = await req.json();

    if (!lessonId) {
      return new Response(
        JSON.stringify({ error: 'Lesson ID is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log(`Updating progress for user ${user.id}, lesson ${lessonId}`);

    // Check if progress record already exists
    const { data: existingProgress, error: fetchError } = await supabaseClient
      .from('user_progress')
      .select('*')
      .eq('user_id', user.id)
      .eq('lesson_id', lessonId)
      .single();

    let result;
    const progressData = {
      user_id: user.id,
      lesson_id: lessonId,
      progress_percentage: progressPercentage,
      completed,
      completed_at: completed ? new Date().toISOString() : null,
      updated_at: new Date().toISOString()
    };

    if (existingProgress) {
      // Update existing progress
      const { data, error } = await supabaseClient
        .from('user_progress')
        .update({
          progress_percentage: progressPercentage,
          completed,
          completed_at: completed ? new Date().toISOString() : null,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id)
        .eq('lesson_id', lessonId)
        .select()
        .single();

      if (error) {
        console.error('Error updating progress:', error);
        throw error;
      }
      result = data;
    } else {
      // Create new progress record
      const { data, error } = await supabaseClient
        .from('user_progress')
        .insert(progressData)
        .select()
        .single();

      if (error) {
        console.error('Error creating progress:', error);
        throw error;
      }
      result = data;
    }

    console.log('Progress updated successfully:', result);

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: result 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error in update-lesson-progress function:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});