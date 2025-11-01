import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageUrl } = await req.json();
    
    if (!imageUrl) {
      throw new Error('imageUrl é obrigatório');
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY não configurada');
    }

    console.log('Analisando imagem:', imageUrl);

    // Chamar Lovable AI para análise da imagem
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
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
                text: 'Analise esta foto de batismo e forneça informações detalhadas.'
              },
              {
                type: 'image_url',
                image_url: { url: imageUrl }
              }
            ]
          }
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'analyze_baptism_photo',
              description: 'Análise detalhada de foto de batismo',
              parameters: {
                type: 'object',
                properties: {
                  description: {
                    type: 'string',
                    description: 'Descrição detalhada da foto em português, incluindo pessoas, ambiente, emoções e momento capturado'
                  },
                  tags: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'Array de palavras-chave relevantes em português (ex: batismo, igreja, família, bebê, padre, água benta)'
                  },
                  faces_count: {
                    type: 'integer',
                    description: 'Número estimado de rostos visíveis na foto'
                  },
                  setting: {
                    type: 'string',
                    description: 'Tipo de ambiente (ex: igreja, salão de festas, ao ar livre, residência)'
                  }
                },
                required: ['description', 'tags', 'faces_count', 'setting'],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: 'function', function: { name: 'analyze_baptism_photo' } }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Erro na API Lovable AI:', response.status, errorText);
      throw new Error(`Erro ao chamar Lovable AI: ${response.status}`);
    }

    const data = await response.json();
    console.log('Resposta da IA:', JSON.stringify(data, null, 2));

    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      throw new Error('IA não retornou análise estruturada');
    }

    const metadata = JSON.parse(toolCall.function.arguments);

    return new Response(
      JSON.stringify(metadata),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Erro em generate-photo-metadata:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro desconhecido' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
