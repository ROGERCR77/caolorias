import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

const ALLOWED_ORIGINS = ['https://pduddriicbprkflkuyjk.supabase.co', 'capacitor://localhost', 'http://localhost', 'http://localhost:8080'];

function getCorsHeaders(req: Request) {
  const origin = req.headers.get('Origin') || '';
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-cron-secret',
  };
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

interface VetDogLink {
  id: string;
  vet_user_id: string;
  dog_id: string;
  dog: { name: string } | null;
}

interface AlertResult {
  dog_id: string;
  vet_user_id: string;
  dog_name: string;
  alert_type: string;
  alert_data: Record<string, unknown>;
}

const PUSH_TITLES: Record<string, string> = {
  weight_drop: "Alerta: Perda de peso rapida",
  blood_stool: "Alerta: Sangue nas fezes",
  low_energy: "Alerta: Baixa energia persistente",
  severe_symptoms: "Alerta: Sintomas graves",
};

const PUSH_MESSAGES: Record<string, (dogName: string, data: Record<string, unknown>) => string> = {
  weight_drop: (dogName, data) =>
    `${dogName} perdeu ${data.drop_percent}% de peso nos ultimos 7 dias.`,
  blood_stool: (dogName, data) =>
    `${dogName} apresentou sangue nas fezes ${data.occurrences} vezes nos ultimos 7 dias.`,
  low_energy: (dogName) =>
    `${dogName} esta com energia muito baixa nos ultimos 3 registros consecutivos.`,
  severe_symptoms: (dogName, data) =>
    `${dogName} apresentou sintomas graves nos ultimos 3 dias: ${(data.symptoms as string[])?.join(', ') || 'verificar app'}.`,
};

// ==================== ALERT CHECKS ====================

async function checkWeightDrop(
  supabase: SupabaseClient,
  links: VetDogLink[],
  sevenDaysAgo: string
): Promise<AlertResult[]> {
  const alerts: AlertResult[] = [];

  for (const link of links) {
    const { data: weightLogs } = await supabase
      .from('weight_logs')
      .select('weight_kg, date')
      .eq('dog_id', link.dog_id)
      .gte('date', sevenDaysAgo)
      .order('date', { ascending: true });

    if (!weightLogs || weightLogs.length < 2) continue;

    const firstWeight = weightLogs[0].weight_kg;
    const lastWeight = weightLogs[weightLogs.length - 1].weight_kg;

    if (firstWeight <= 0) continue;

    const dropPercent = ((firstWeight - lastWeight) / firstWeight) * 100;

    if (dropPercent > 10) {
      alerts.push({
        dog_id: link.dog_id,
        vet_user_id: link.vet_user_id,
        dog_name: link.dog?.name || 'Paciente',
        alert_type: 'weight_drop',
        alert_data: {
          first_weight: firstWeight,
          last_weight: lastWeight,
          drop_percent: Math.round(dropPercent * 10) / 10,
          period_days: 7,
          records_count: weightLogs.length,
        },
      });
    }
  }

  return alerts;
}

async function checkBloodStool(
  supabase: SupabaseClient,
  links: VetDogLink[],
  sevenDaysAgo: string
): Promise<AlertResult[]> {
  const alerts: AlertResult[] = [];

  for (const link of links) {
    const { data: poopLogs } = await supabase
      .from('poop_logs')
      .select('id, has_blood, logged_at')
      .eq('dog_id', link.dog_id)
      .eq('has_blood', true)
      .gte('logged_at', sevenDaysAgo);

    if (!poopLogs || poopLogs.length < 2) continue;

    alerts.push({
      dog_id: link.dog_id,
      vet_user_id: link.vet_user_id,
      dog_name: link.dog?.name || 'Paciente',
      alert_type: 'blood_stool',
      alert_data: {
        occurrences: poopLogs.length,
        period_days: 7,
        dates: poopLogs.map(p => p.logged_at),
      },
    });
  }

  return alerts;
}

async function checkLowEnergy(
  supabase: SupabaseClient,
  links: VetDogLink[]
): Promise<AlertResult[]> {
  const alerts: AlertResult[] = [];

  for (const link of links) {
    const { data: energyLogs } = await supabase
      .from('energy_logs')
      .select('energy_level, logged_at')
      .eq('dog_id', link.dog_id)
      .order('logged_at', { ascending: false })
      .limit(3);

    if (!energyLogs || energyLogs.length < 3) continue;

    const allVeryQuiet = energyLogs.every(e => e.energy_level === 'muito_quieto');

    if (allVeryQuiet) {
      alerts.push({
        dog_id: link.dog_id,
        vet_user_id: link.vet_user_id,
        dog_name: link.dog?.name || 'Paciente',
        alert_type: 'low_energy',
        alert_data: {
          consecutive_records: 3,
          energy_level: 'muito_quieto',
          dates: energyLogs.map(e => e.logged_at),
        },
      });
    }
  }

  return alerts;
}

async function checkSevereSymptoms(
  supabase: SupabaseClient,
  links: VetDogLink[],
  threeDaysAgo: string
): Promise<AlertResult[]> {
  const alerts: AlertResult[] = [];

  for (const link of links) {
    const { data: symptomLogs } = await supabase
      .from('health_symptoms')
      .select('symptoms, severity, logged_at')
      .eq('dog_id', link.dog_id)
      .eq('severity', 'grave')
      .gte('logged_at', threeDaysAgo)
      .order('logged_at', { ascending: false });

    if (!symptomLogs || symptomLogs.length === 0) continue;

    // Collect all unique symptoms across matching records
    const allSymptoms = new Set<string>();
    symptomLogs.forEach(s => {
      if (Array.isArray(s.symptoms)) {
        s.symptoms.forEach((sym: string) => allSymptoms.add(sym));
      }
    });

    alerts.push({
      dog_id: link.dog_id,
      vet_user_id: link.vet_user_id,
      dog_name: link.dog?.name || 'Paciente',
      alert_type: 'severe_symptoms',
      alert_data: {
        occurrences: symptomLogs.length,
        symptoms: Array.from(allSymptoms),
        period_days: 3,
        dates: symptomLogs.map(s => s.logged_at),
      },
    });
  }

  return alerts;
}

async function sendPushNotification(
  onesignalAppId: string,
  onesignalApiKey: string,
  vetUserId: string,
  alertType: string,
  dogName: string,
  alertData: Record<string, unknown>
): Promise<boolean> {
  const title = PUSH_TITLES[alertType] || 'Alerta de saude';
  const messageFn = PUSH_MESSAGES[alertType];
  const message = messageFn ? messageFn(dogName, alertData) : `Alerta de saude para ${dogName}.`;

  try {
    const response = await fetchWithTimeout('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${onesignalApiKey}`,
      },
      body: JSON.stringify({
        app_id: onesignalAppId,
        headings: { en: title, pt: title },
        contents: { en: message, pt: message },
        include_aliases: {
          external_id: [vetUserId],
        },
        target_channel: "push",
        data: {
          category: 'vet_health_alert',
          alert_type: alertType,
        },
      }),
    });

    const result = await response.json();

    if (response.ok) {
      console.log(`Push sent [${alertType}] to vet ${vetUserId}`);
      return true;
    } else {
      console.error(`Push failed [${alertType}] vet ${vetUserId}:`, JSON.stringify(result));
      return false;
    }
  } catch (err) {
    console.error(`Push error [${alertType}] vet ${vetUserId}:`, err);
    return false;
  }
}

// ==================== MAIN HANDLER ====================

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: getCorsHeaders(req) });
  }

  try {
    // Security: Validate cron secret
    const cronSecret = Deno.env.get('CRON_SECRET');
    const requestSecret = req.headers.get('x-cron-secret');

    if (!cronSecret || requestSecret !== cronSecret) {
      console.warn('Unauthorized request - invalid or missing cron secret');
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' }
      });
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
    const now = new Date();

    console.log('Starting vet auto-alerts check...');

    // 1. Fetch all active vet_dog_links with dog names
    const { data: links, error: linksError } = await supabase
      .from('vet_dog_links')
      .select('id, vet_user_id, dog_id, dog:dogs(name)')
      .eq('status', 'active');

    if (linksError) {
      console.error('Error fetching vet_dog_links:', linksError);
      throw linksError;
    }

    if (!links || links.length === 0) {
      console.log('No active vet_dog_links found');
      return new Response(
        JSON.stringify({ success: true, links_checked: 0, alerts_created: 0, pushes_sent: 0 }),
        { headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
      );
    }

    // Normalize the join result (Supabase may return dog as array or object)
    const normalizedLinks: VetDogLink[] = links.map((l: Record<string, unknown>) => ({
      id: l.id as string,
      vet_user_id: l.vet_user_id as string,
      dog_id: l.dog_id as string,
      dog: Array.isArray(l.dog) ? (l.dog[0] as { name: string } | null) : (l.dog as { name: string } | null),
    }));

    console.log(`Found ${normalizedLinks.length} active vet-dog links`);

    // Date boundaries
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString();

    // 2. Run all alert checks in parallel
    const [weightAlerts, bloodAlerts, energyAlerts, symptomAlerts] = await Promise.all([
      checkWeightDrop(supabase, normalizedLinks, sevenDaysAgo),
      checkBloodStool(supabase, normalizedLinks, sevenDaysAgo),
      checkLowEnergy(supabase, normalizedLinks),
      checkSevereSymptoms(supabase, normalizedLinks, threeDaysAgo),
    ]);

    const allAlerts = [...weightAlerts, ...bloodAlerts, ...energyAlerts, ...symptomAlerts];

    console.log(`Alerts detected: weight_drop=${weightAlerts.length}, blood_stool=${bloodAlerts.length}, low_energy=${energyAlerts.length}, severe_symptoms=${symptomAlerts.length}`);

    // 3. Insert alerts (unique index prevents duplicates per dog+vet+type+date)
    let alertsCreated = 0;
    let pushesSent = 0;
    const errors: string[] = [];

    for (const alert of allAlerts) {
      try {
        const { data: inserted, error: insertError } = await supabase
          .from('vet_health_alerts')
          .insert({
            dog_id: alert.dog_id,
            vet_user_id: alert.vet_user_id,
            alert_type: alert.alert_type,
            alert_data: alert.alert_data,
          })
          .select('id')
          .maybeSingle();

        if (insertError) {
          // Unique constraint violation = duplicate, skip silently
          if (insertError.code === '23505') {
            console.log(`Duplicate alert skipped: ${alert.alert_type} for dog ${alert.dog_id}`);
            continue;
          }
          throw insertError;
        }

        if (inserted) {
          alertsCreated++;
          console.log(`Alert created: ${alert.alert_type} for dog ${alert.dog_name} (${alert.dog_id})`);

          // 4. Send push notification to the vet
          const pushSent = await sendPushNotification(
            ONESIGNAL_APP_ID,
            ONESIGNAL_REST_API_KEY,
            alert.vet_user_id,
            alert.alert_type,
            alert.dog_name,
            alert.alert_data,
          );

          if (pushSent) {
            pushesSent++;
          }
        }
      } catch (err) {
        const errorMsg = `Error processing alert [${alert.alert_type}] dog ${alert.dog_id}: ${err}`;
        console.error(errorMsg);
        errors.push(errorMsg);
      }
    }

    const stats = {
      success: true,
      links_checked: normalizedLinks.length,
      alerts_detected: allAlerts.length,
      alerts_created: alertsCreated,
      pushes_sent: pushesSent,
      by_type: {
        weight_drop: weightAlerts.length,
        blood_stool: bloodAlerts.length,
        low_energy: energyAlerts.length,
        severe_symptoms: symptomAlerts.length,
      },
      errors: errors.length > 0 ? errors : undefined,
    };

    console.log(`Completed: ${alertsCreated} alerts created, ${pushesSent} pushes sent`);

    return new Response(
      JSON.stringify(stats),
      { headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in vet-auto-alerts:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
    );
  }
});
