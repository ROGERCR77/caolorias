import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const ONESIGNAL_APP_ID = Deno.env.get('ONESIGNAL_APP_ID');
    const ONESIGNAL_REST_API_KEY = Deno.env.get('ONESIGNAL_REST_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    if (!ONESIGNAL_APP_ID || !ONESIGNAL_REST_API_KEY) {
      console.error('Missing OneSignal credentials');
      return new Response(
        JSON.stringify({ error: 'OneSignal not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5); // "HH:MM"
    const currentDayOfWeek = now.getDay(); // 0-6, Sunday=0
    const todayDate = now.toISOString().split('T')[0]; // "YYYY-MM-DD"

    console.log(`⏰ Processing reminders at ${currentTime} (day ${currentDayOfWeek})`);

    // Get all enabled reminders
    const { data: reminders, error } = await supabase
      .from('reminders')
      .select(`
        id,
        user_id,
        dog_id,
        title,
        type,
        time,
        days_of_week,
        scheduled_date,
        dogs (name)
      `)
      .eq('enabled', true);

    if (error) throw error;

    const remindersToTrigger = reminders?.filter(reminder => {
      // Check if time matches (with 1-minute tolerance)
      const reminderTime = reminder.time?.slice(0, 5);
      if (reminderTime !== currentTime) return false;

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

    console.log(`📬 Found ${remindersToTrigger.length} reminders to trigger`);

    let sentCount = 0;
    const errors: string[] = [];

    for (const reminder of remindersToTrigger) {
      try {
        const dogName = (reminder.dogs as any)?.name || '';
        const title = reminder.title || getDefaultTitle(reminder.type, dogName);
        const message = getDefaultMessage(reminder.type, dogName);

        const response = await fetch('https://onesignal.com/api/v1/notifications', {
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

    console.log(`🎯 Completed: ${sentCount}/${remindersToTrigger.length} sent`);

    return new Response(
      JSON.stringify({
        success: true,
        time: currentTime,
        day: currentDayOfWeek,
        reminders_found: remindersToTrigger.length,
        reminders_sent: sentCount,
        errors: errors.length > 0 ? errors : undefined
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Error in process-reminders:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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
