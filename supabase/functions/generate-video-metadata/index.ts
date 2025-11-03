import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { videoUrl } = await req.json();
    console.log('Processing video:', videoUrl);

    if (!videoUrl) {
      throw new Error('videoUrl is required');
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Análise com IA
    console.log('Calling Lovable AI for video analysis...');
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Analise este vídeo de batizado e forneça uma descrição detalhada e tags relevantes. Foque em elementos visuais, ambiente, pessoas e momentos importantes.'
              },
              {
                type: 'image_url',
                image_url: {
                  url: videoUrl
                }
              }
            ]
          }
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'analyze_video',
              description: 'Analyze a baptism video and return structured metadata',
              parameters: {
                type: 'object',
                properties: {
                  description: {
                    type: 'string',
                    description: 'Detailed description in Portuguese'
                  },
                  tags: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'Relevant tags in Portuguese'
                  },
                  setting: {
                    type: 'string',
                    description: 'Location type (church, home, outdoor, etc)'
                  }
                },
                required: ['description', 'tags']
              }
            }
          }
        ],
        tool_choice: { type: 'function', function: { name: 'analyze_video' } }
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', aiResponse.status, errorText);
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    console.log('AI response received');

    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) {
      console.error('No tool call in AI response:', JSON.stringify(aiData));
      throw new Error('AI did not return structured data');
    }

    const metadata = JSON.parse(toolCall.function.arguments);
    console.log('Generated metadata:', metadata);

    return new Response(
      JSON.stringify({
        description: metadata.description,
        tags: metadata.tags || [],
        setting: metadata.setting,
        thumbnail_url: videoUrl // Use video URL as thumbnail for now
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-video-metadata:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        description: 'Vídeo de batizado',
        tags: ['batizado', 'vídeo'],
        setting: 'church'
      }),
      { 
        status: 200, // Return 200 with fallback data
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});