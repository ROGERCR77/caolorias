import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NewSignupPayload {
  type: "INSERT";
  table: string;
  record: {
    id: string;
    user_id: string;
    name: string;
    created_at: string;
  };
}

async function sendEmail(to: string[], subject: string, html: string) {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "Cãolorias <notificacoes@jnrmarketingdigital.com.br>",
      to,
      subject,
      html,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to send email: ${error}`);
  }

  return response.json();
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload: NewSignupPayload = await req.json();
    
    console.log("Received new signup notification:", JSON.stringify(payload));

    // Only process INSERT events
    if (payload.type !== "INSERT") {
      console.log("Ignoring non-INSERT event");
      return new Response(JSON.stringify({ message: "Ignored" }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const { name, user_id, created_at } = payload.record;
    
    // Format the date nicely
    const signupDate = new Date(created_at).toLocaleString("pt-BR", {
      dateStyle: "full",
      timeStyle: "short",
      timeZone: "America/Sao_Paulo",
    });

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #F97316; margin-bottom: 20px;">🐕 Novo Cadastro!</h1>
        
        <p style="font-size: 16px; color: #333;">Olá Roger!</p>
        
        <p style="font-size: 16px; color: #333;">Um novo usuário se cadastrou no Cãolorias:</p>
        
        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 8px 0;"><strong>Nome:</strong> ${name || "Não informado"}</p>
          <p style="margin: 8px 0;"><strong>ID:</strong> ${user_id}</p>
          <p style="margin: 8px 0;"><strong>Data:</strong> ${signupDate}</p>
        </div>
        
        <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;" />
        
        <p style="font-size: 12px; color: #888;">
          Notificação automática do Cãolorias
        </p>
      </div>
    `;

    // Send notification email
    const emailResponse = await sendEmail(
      ["rogercontato94@gmail.com"],
      "🐕 Novo cadastro no Cãolorias!",
      emailHtml
    );

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in notify-new-signup function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
