import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const ALLOWED_ORIGINS = ['https://pduddriicbprkflkuyjk.supabase.co', 'capacitor://localhost', 'http://localhost', 'http://localhost:8080'];

function getCorsHeaders(req: Request) {
  const origin = req.headers.get('Origin') || '';
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-cron-secret',
  };
}

const MAX_BODY_SIZE = 100 * 1024; // 100KB

async function parseBody(req: Request) {
  const body = await req.text();
  if (body.length > MAX_BODY_SIZE) {
    throw new Error('Request body too large');
  }
  return JSON.parse(body);
}

async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs = 10000): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

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
  const response = await fetchWithTimeout("https://api.resend.com/emails", {
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
    return new Response(null, { headers: getCorsHeaders(req) });
  }

  try {
    // Verify the request comes from Supabase (check for service_role key)
    const authHeader = req.headers.get('Authorization');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!authHeader || !authHeader.includes(SUPABASE_SERVICE_ROLE_KEY || '')) {
      console.warn('Unauthorized request to notify-new-signup');
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { "Content-Type": "application/json", ...getCorsHeaders(req) },
      });
    }

    if (!RESEND_API_KEY) {
      console.error('RESEND_API_KEY not configured');
      return new Response(JSON.stringify({ error: 'Email service not configured' }), {
        status: 500, headers: { "Content-Type": "application/json", ...getCorsHeaders(req) },
      });
    }

    const payload: NewSignupPayload = await parseBody(req);

    console.log("Received new signup notification:", JSON.stringify(payload));

    // Only process INSERT events
    if (payload.type !== "INSERT") {
      console.log("Ignoring non-INSERT event");
      return new Response(JSON.stringify({ message: "Ignored" }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...getCorsHeaders(req) },
      });
    }

    const { name, user_id, created_at } = payload.record;

    // Format the date nicely
    const signupDate = new Date(created_at).toLocaleString("pt-BR", {
      dateStyle: "full",
      timeStyle: "short",
      timeZone: "America/Sao_Paulo",
    });

    const safeName = escapeHtml(name || "Não informado");

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #F97316; margin-bottom: 20px;">🐕 Novo Cadastro!</h1>

        <p style="font-size: 16px; color: #333;">Olá Roger!</p>

        <p style="font-size: 16px; color: #333;">Um novo usuário se cadastrou no Cãolorias:</p>

        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 8px 0;"><strong>Nome:</strong> ${safeName}</p>
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
      [Deno.env.get('ADMIN_NOTIFICATION_EMAIL') || "rogercontato94@gmail.com"],
      "🐕 Novo cadastro no Cãolorias!",
      emailHtml
    );

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...getCorsHeaders(req) },
    });
  } catch (error: any) {
    console.error("Error in notify-new-signup function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...getCorsHeaders(req) },
      }
    );
  }
};

serve(handler);
