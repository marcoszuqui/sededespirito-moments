import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageBase64 } = await req.json();

    if (!imageBase64) {
      return new Response(
        JSON.stringify({ error: "Image data is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("Analyzing image with AI...");

    // Use Lovable AI with vision to analyze the uploaded image
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Analise esta imagem e descreva: 1) As pessoas (quantas, expressões, roupas) 2) O ambiente e cenário 3) A ocasião/evento 4) Cores predominantes 5) Elementos religiosos se houver. Seja detalhado e objetivo.",
              },
              {
                type: "image_url",
                image_url: {
                  url: imageBase64,
                },
              },
            ],
          },
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI API error:", aiResponse.status, errorText);
      throw new Error(`AI analysis failed: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const imageDescription = aiData.choices?.[0]?.message?.content || "";

    console.log("Image description:", imageDescription);

    // Now search for similar photos in the database
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: photos, error: photosError } = await supabase
      .from("photos")
      .select("*")
      .order("uploaded_at", { ascending: false });

    if (photosError) {
      console.error("Database error:", photosError);
      throw photosError;
    }

    console.log(`Found ${photos?.length || 0} photos in database`);

    // If no photos yet, return empty results with the description
    if (!photos || photos.length === 0) {
      return new Response(
        JSON.stringify({
          results: [],
          description: imageDescription,
          message: "Nenhuma foto encontrada no banco de dados ainda.",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Use AI to rank photos by similarity
    const rankingPrompt = `Dada esta descrição de uma imagem: "${imageDescription}"

Compare com estas fotos e retorne os IDs das 6 fotos mais similares, ordenadas por relevância (mais similar primeiro):

${photos.map((p, i) => `${i}. ID: ${p.id} - ${p.description || "Sem descrição"} - Tags: ${p.tags?.join(", ") || "Sem tags"}`).join("\n")}

Retorne APENAS os IDs das fotos mais similares, separados por vírgula. Exemplo: uuid1,uuid2,uuid3`;

    const rankingResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "user",
            content: rankingPrompt,
          },
        ],
      }),
    });

    const rankingData = await rankingResponse.json();
    const rankedIds = rankingData.choices?.[0]?.message?.content || "";

    console.log("AI ranking response:", rankedIds);

    // Parse the IDs and return matching photos
    const ids = rankedIds
      .split(",")
      .map((id: string) => id.trim())
      .filter((id: string) => id.length > 0);

    const rankedPhotos = ids
      .map((id: string) => photos.find((p) => p.id === id))
      .filter(Boolean)
      .slice(0, 6);

    console.log(`Returning ${rankedPhotos.length} ranked photos`);

    return new Response(
      JSON.stringify({
        results: rankedPhotos,
        description: imageDescription,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in search-by-image:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
