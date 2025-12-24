import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { audioBase64, mimeType } = await req.json();

    if (!audioBase64) {
      throw new Error("Audio data is required");
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("Received audio for transcription, mimeType:", mimeType);

    // Step 1: Transcribe audio using Lovable AI
    const transcriptionPrompt = `Você é um assistente de transcrição. O veterinário falou um áudio sobre um registro de paciente (cão).

O áudio foi convertido em texto através de reconhecimento de fala do navegador. Aqui está a transcrição bruta:

"${audioBase64}"

Por favor, limpe e organize esse texto, corrigindo erros de transcrição óbvios e formatando de forma profissional.

Retorne APENAS o texto corrigido, sem explicações adicionais.`;

    // Step 2: Extract structured data
    const extractionResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `Você é um assistente de transcrição veterinária brasileiro. Você recebe transcrições de áudio de veterinários e extrai informações estruturadas.

IMPORTANTE:
- Extraia um título curto e profissional (máximo 50 caracteres)
- A descrição deve ser completa e bem formatada
- Identifique o tipo de registro (consulta, vacina, exame, observacao)
- Se o veterinário mencionar uma data de retorno/reforço, extraia no formato YYYY-MM-DD

Responda APENAS com um JSON válido, sem markdown ou explicações.`,
          },
          {
            role: "user",
            content: `Transcrição do veterinário:

"${audioBase64}"

Extraia as informações e retorne em JSON com esta estrutura exata:
{
  "titulo": "string curta resumindo o registro",
  "descricao": "texto completo e bem formatado",
  "tipo_sugerido": "consulta" | "vacina" | "exame" | "observacao",
  "data_retorno": "YYYY-MM-DD ou null"
}`,
          },
        ],
      }),
    });

    if (!extractionResponse.ok) {
      const errorText = await extractionResponse.text();
      console.error("Lovable AI error:", extractionResponse.status, errorText);
      
      if (extractionResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns segundos." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      if (extractionResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "Créditos insuficientes. Entre em contato com o suporte." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      throw new Error(`AI request failed: ${extractionResponse.status}`);
    }

    const aiResult = await extractionResponse.json();
    const content = aiResult.choices?.[0]?.message?.content;

    console.log("AI response:", content);

    // Parse the JSON response
    let parsedData;
    try {
      // Remove markdown code blocks if present
      let cleanContent = content.trim();
      if (cleanContent.startsWith("```json")) {
        cleanContent = cleanContent.slice(7);
      } else if (cleanContent.startsWith("```")) {
        cleanContent = cleanContent.slice(3);
      }
      if (cleanContent.endsWith("```")) {
        cleanContent = cleanContent.slice(0, -3);
      }
      cleanContent = cleanContent.trim();
      
      parsedData = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
      // Fallback: use the raw transcription
      parsedData = {
        titulo: "Registro por voz",
        descricao: audioBase64,
        tipo_sugerido: "observacao",
        data_retorno: null,
      };
    }

    // Validate and sanitize the response
    const result = {
      titulo: String(parsedData.titulo || "Registro por voz").substring(0, 100),
      descricao: String(parsedData.descricao || ""),
      tipo_sugerido: ["consulta", "vacina", "exame", "observacao"].includes(parsedData.tipo_sugerido)
        ? parsedData.tipo_sugerido
        : "observacao",
      data_retorno: parsedData.data_retorno && /^\d{4}-\d{2}-\d{2}$/.test(parsedData.data_retorno)
        ? parsedData.data_retorno
        : null,
    };

    console.log("Returning structured data:", result);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in transcribe-vet-note:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
