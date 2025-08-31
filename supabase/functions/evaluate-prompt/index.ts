import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';
import { corsHeaders } from "../_shared/cors.ts";

const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Evaluate prompt function called');
    
    // Get auth header
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Create Supabase client with service role for auth verification
    const supabase = createClient(supabaseUrl!, supabaseServiceKey!);
    
    // Verify the JWT token
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.error('Auth error:', authError);
      throw new Error('Unauthorized');
    }

    console.log('User authenticated:', user.id);

    const { prompt, content, task, systemPrompt } = await req.json();

    if (!prompt || !content || !task) {
      throw new Error('Prompt, content, and task are required');
    }

    if (!openaiApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    console.log('Evaluating prompt and content...');

    // Create evaluation prompt
    const evaluationPrompt = `
Задание: ${task.description}

Промпт пользователя: "${prompt}"

Сгенерированный контент:
"""
${content}
"""

Критерии оценки:
${task.criteria?.map((criterion: string, index: number) => `${index + 1}. ${criterion}`).join('\n') || '1. Качество выполнения задания\n2. Соответствие требованиям\n3. Креативность и оригинальность'}

Оцени качество промпта и результата по шкале от 1 до 10, где:
Оценка 8-10: отлично, задание выполнено на высшем уровне
Оценка 5-7: хорошо, но можно улучшить
Оценка 1-4: нужно существенно доработать

Верни ответ ТОЛЬКО в формате JSON:
{
  "score": число от 1 до 10,
  "feedback": "подробный отзыв о качестве промпта и результата",
  "strengths": ["сильная сторона 1", "сильная сторона 2"],
  "improvements": ["рекомендация по улучшению 1", "рекомендация по улучшению 2"]
}`;

    const requestBody = {
      model: 'gpt-4.1-2025-04-14',
      messages: [
        { 
          role: 'system', 
          content: systemPrompt || 'Ты эксперт по оценке качества промптов и контента. Всегда отвечай только валидным JSON без дополнительного текста.'
        },
        { role: 'user', content: evaluationPrompt }
      ],
      max_completion_tokens: 1000
    };

    console.log('Sending evaluation request to OpenAI API...');

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', response.status, errorText);
      throw new Error(`OpenAI API error: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    console.log('OpenAI evaluation response received');

    if (!data.choices || data.choices.length === 0) {
      throw new Error('No evaluation response from OpenAI');
    }

    const evaluationText = data.choices[0].message.content;

    if (!evaluationText) {
      throw new Error('Empty evaluation response from OpenAI');
    }

    // Parse the JSON response
    let evaluation;
    try {
      // Clean the response to extract JSON
      const jsonMatch = evaluationText.match(/\{[\s\S]*\}/);
      const cleanedResponse = jsonMatch ? jsonMatch[0] : evaluationText;
      evaluation = JSON.parse(cleanedResponse);
    } catch (parseError) {
      console.error('Failed to parse evaluation JSON:', evaluationText);
      // Fallback evaluation
      evaluation = {
        score: 5,
        feedback: "Не удалось получить детальную оценку. Результат выглядит неплохо, но рекомендуется попробовать еще раз.",
        strengths: ["Задание выполнено"],
        improvements: ["Попробуйте более детальный промпт"]
      };
    }

    console.log('Evaluation completed successfully');

    return new Response(JSON.stringify({ 
      evaluation,
      usage: data.usage
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in evaluate-prompt function:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Unknown error occurred' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});