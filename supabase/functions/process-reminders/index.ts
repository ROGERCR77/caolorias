import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

// Convert HH:MM to total minutes
function hhmmToMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

// Convert minutes back to HH:MM
function minutesToHhmm(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

// Get São Paulo timezone date/time parts
function getSaoPauloDateTime() {
  const tz = 'America/Sao_Paulo';
  const parts = new Intl.DateTimeFormat('pt-BR', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    weekday: 'short'
  }).formatToParts(new Date());

  const get = (t: string) => parts.find(p => p.type === t)?.value || '';

  const todayDate = `${get('year')}-${get('month')}-${get('day')}`;
  const currentTime = `${get('hour')}:${get('minute')}`;

  // Map Portuguese weekday abbreviations to day numbers (0=Sunday)
  const weekdayMap: Record<string, number> = {
    'dom': 0, 'seg': 1, 'ter': 2, 'qua': 3,
    'qui': 4, 'sex': 5, 'sáb': 6
  };
  const weekdayAbbr = get('weekday').toLowerCase().replace('.', '');
  const currentDayOfWeek = weekdayMap[weekdayAbbr] ?? new Date().getDay();

  return { todayDate, currentTime, currentDayOfWeek };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: getCorsHeaders(req) });
  }

  try {
    // Security: Validate cron secret header
    const cronSecret = Deno.env.get('CRON_SECRET');
    const requestSecret = req.headers.get('x-cron-secret');

    if (!cronSecret || requestSecret !== cronSecret) {
      console.warn('🚫 Unauthorized request - invalid cron secret');
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
      );
    }

    const ONESIGNAL_APP_ID = Deno.env.get('ONESIGNAL_APP_ID');
    const ONESIGNAL_REST_API_KEY = Deno.env.get('ONESIGNAL_REST_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    if (!ONESIGNAL_APP_ID || !ONESIGNAL_REST_API_KEY) {
      console.error('Missing OneSignal credentials');
      return new Response(
        JSON.stringify({ error: 'OneSignal not configured' }),
        { status: 500, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get São Paulo timezone date/time
    const { todayDate, currentTime, currentDayOfWeek } = getSaoPauloDateTime();
    const currentMinutes = hhmmToMinutes(currentTime);

    // Calculate time range with ±2 minute tolerance
    const TOLERANCE_MINUTES = 2;
    const startMinutes = Math.max(0, currentMinutes - TOLERANCE_MINUTES);
    const endMinutes = Math.min(1439, currentMinutes + TOLERANCE_MINUTES);
    const startTime = minutesToHhmm(startMinutes);
    const endTime = minutesToHhmm(endMinutes);

    console.log(`⏰ Processing reminders at ${currentTime} São Paulo (day ${currentDayOfWeek}, date ${todayDate})`);
    console.log(`📍 Time range: ${startTime} to ${endTime} (±${TOLERANCE_MINUTES} min tolerance)`);

    // Optimized query: filter by time range in database
    const { data: reminders, error } = await supabase
      .from('reminders')
      .select(`
        id,
        user_id,
        dog_id,
        title,
        message,
        type,
        time,
        days_of_week,
        scheduled_date,
        dogs (name)
      `)
      .eq('enabled', true)
      .gte('time', startTime)
      .lte('time', endTime);

    if (error) throw error;

    console.log(`📋 Found ${reminders?.length || 0} reminders in time range`);

    const remindersToTrigger = reminders?.filter(reminder => {
      const reminderTime = reminder.time?.slice(0, 5);
      if (!reminderTime) return false;

      // Check time with tolerance
      const remMin = hhmmToMinutes(reminderTime);
      if (Math.abs(currentMinutes - remMin) > TOLERANCE_MINUTES) return false;

      // Check if it's a scheduled one-time reminder
      if (reminder.scheduled_date) {
        return reminder.scheduled_date === todayDate;
      }

      // Check if it's a recurring reminder for today's day of week
      if (reminder.days_of_week && reminder.days_of_week.length > 0) {
        return reminder.days_of_week.includes(currentDayOfWeek);
      }

      return false;
    }) || [];

    console.log(`📬 ${remindersToTrigger.length} reminders match today's criteria`);

    let sentCount = 0;
    let skippedCount = 0;
    const errors: string[] = [];

    for (const reminder of remindersToTrigger) {
      try {
        const reminderTime = reminder.time?.slice(0, 5) || currentTime;

        // Anti-duplication: check if already sent today at this time
        const { error: dupeError } = await supabase
          .from('reminder_sends')
          .insert({
            reminder_id: reminder.id,
            user_id: reminder.user_id,
            sent_date: todayDate,
            sent_time: reminderTime
          });

        if (dupeError) {
          if (dupeError.code === '23505') { // unique violation
            console.log(`⏭️ Skipping duplicate: ${reminder.id} (already sent at ${reminderTime})`);
            skippedCount++;
            continue;
          }
          console.warn(`⚠️ Failed to log send for ${reminder.id}:`, dupeError.message);
        }

        const dogName = (reminder.dogs as any)?.name || '';
        const title = reminder.title || getDefaultTitle(reminder.type, dogName);
        // Use custom message if available, otherwise default
        const message = reminder.message || getDefaultMessage(reminder.type, dogName);

        const response = await fetchWithTimeout('https://onesignal.com/api/v1/notifications', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Basic ${ONESIGNAL_REST_API_KEY}`,
          },
          body: JSON.stringify({
            app_id: ONESIGNAL_APP_ID,
            headings: { en: title, pt: title },
            contents: { en: message, pt: message },
            include_aliases: {
              external_id: [reminder.user_id]
            },
            target_channel: "push",
            data: {
              type: reminder.type,
              reminder_id: reminder.id
            }
          }),
        });

        const result = await response.json();

        if (response.ok) {
          sentCount++;
          console.log(`✅ Sent reminder ${reminder.id} to user ${reminder.user_id}`);

          // If it's a one-time scheduled reminder, disable it after sending
          if (reminder.scheduled_date) {
            await supabase
              .from('reminders')
              .update({ enabled: false })
              .eq('id', reminder.id);
            console.log(`🔕 Disabled one-time reminder ${reminder.id}`);
          }
        } else {
          errors.push(`Failed ${reminder.id}: ${JSON.stringify(result)}`);
          console.error(`❌ Failed to send reminder ${reminder.id}:`, result);
        }
      } catch (err) {
        errors.push(`Error ${reminder.id}: ${err}`);
        console.error(`❌ Error processing reminder ${reminder.id}:`, err);
      }
    }

    console.log(`🎯 Completed: ${sentCount} sent, ${skippedCount} skipped (duplicates), ${errors.length} errors`);

    return new Response(
      JSON.stringify({
        success: true,
        timezone: 'America/Sao_Paulo',
        time: currentTime,
        day: currentDayOfWeek,
        date: todayDate,
        reminders_in_range: reminders?.length || 0,
        reminders_matched: remindersToTrigger.length,
        reminders_sent: sentCount,
        reminders_skipped: skippedCount,
        errors: errors.length > 0 ? errors : undefined
      }),
      { headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Error in process-reminders:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
    );
  }
});

function getDefaultTitle(type: string, dogName: string): string {
  switch (type) {
    case 'meal':
      return `🍽️ Hora da refeição!`;
    case 'weight':
      return `⚖️ Hora de pesar!`;
    case 'health':
      return `💉 Lembrete de saúde`;
    case 'activity':
      return `🏃 Hora do passeio!`;
    default:
      return `🔔 Lembrete`;
  }
}

function getDefaultMessage(type: string, dogName: string): string {
  const name = dogName || 'seu cão';
  switch (type) {
    case 'meal':
      return `Hora de alimentar ${name}! Não esqueça de registrar.`;
    case 'weight':
      return `Que tal pesar ${name} hoje?`;
    case 'health':
      return `Você tem um compromisso de saúde com ${name}.`;
    case 'activity':
      return `${name} está esperando um passeio!`;
    default:
      return `Não esqueça de cuidar de ${name}!`;
  }
}
