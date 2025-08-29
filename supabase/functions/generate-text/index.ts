import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

    const { prompt, model = 'gpt-5-2025-08-07' } = await req.json();

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
      JSON.stringify({ response: generatedText.trim() }), 
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