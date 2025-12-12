import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface UserEngagementData {
  user_id: string;
  dog_name: string | null;
  days_since_meal: number | null;
  days_since_weight: number | null;
}

serve(async (req) => {
  // Handle CORS preflight requests
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

    console.log('Starting engagement notifications check...');

    // Query users with engagement data
    const { data: engagementData, error: queryError } = await supabase.rpc('get_user_engagement_data');

    if (queryError) {
      // If RPC doesn't exist, use fallback query
      console.log('RPC not found, using fallback query...');
      
      // Get all users with dogs and their last meal/weight dates
      const { data: users, error: usersError } = await supabase
        .from('dogs')
        .select('user_id, name')
        .order('created_at', { ascending: true });

      if (usersError) {
        throw usersError;
      }

      // Group by user_id, take first dog
      const userDogs = new Map<string, string>();
      users?.forEach(dog => {
        if (!userDogs.has(dog.user_id)) {
          userDogs.set(dog.user_id, dog.name);
        }
      });

      // Check meals for each user
      const notifications: { user_id: string; title: string; message: string }[] = [];
      const today = new Date();

      for (const [userId, dogName] of userDogs) {
        // Check last meal
        const { data: lastMeal } = await supabase
          .from('meals')
          .select('date_time')
          .eq('user_id', userId)
          .order('date_time', { ascending: false })
          .limit(1)
          .single();

        if (lastMeal) {
          const daysSinceMeal = Math.floor((today.getTime() - new Date(lastMeal.date_time).getTime()) / (1000 * 60 * 60 * 24));
          
          if (daysSinceMeal >= 2 && daysSinceMeal < 7) {
            notifications.push({
              user_id: userId,
              title: '🍖 Hora da refeição!',
              message: `${dogName} está esperando o registro da refeição! Faz ${daysSinceMeal} dias desde o último registro.`
            });
          }
        }

        // Check last weight
        const { data: lastWeight } = await supabase
          .from('weight_logs')
          .select('date')
          .eq('user_id', userId)
          .order('date', { ascending: false })
          .limit(1)
          .single();

        if (lastWeight) {
          const daysSinceWeight = Math.floor((today.getTime() - new Date(lastWeight.date).getTime()) / (1000 * 60 * 60 * 24));
          
          if (daysSinceWeight >= 7 && daysSinceWeight < 14) {
            notifications.push({
              user_id: userId,
              title: '⚖️ Que tal pesar?',
              message: `Faz ${daysSinceWeight} dias que você não pesa ${dogName}. Vamos atualizar?`
            });
          }
        }
      }

      console.log(`Found ${notifications.length} notifications to send`);

      // Send notifications via OneSignal
      let sentCount = 0;
      for (const notification of notifications) {
        try {
          const response = await fetch('https://onesignal.com/api/v1/notifications', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Basic ${ONESIGNAL_REST_API_KEY}`,
            },
            body: JSON.stringify({
              app_id: ONESIGNAL_APP_ID,
              headings: { en: notification.title, pt: notification.title },
              contents: { en: notification.message, pt: notification.message },
              include_aliases: {
                external_id: [notification.user_id]
              },
              target_channel: "push"
            }),
          });

          const result = await response.json();
          
          if (response.ok) {
            sentCount++;
            console.log(`Notification sent to user ${notification.user_id}:`, result.id);
          } else {
            console.error(`Failed to send notification to ${notification.user_id}:`, result);
          }
        } catch (err) {
          console.error(`Error sending notification to ${notification.user_id}:`, err);
        }
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          checked: userDogs.size,
          notifications_found: notifications.length,
          notifications_sent: sentCount 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Engagement check completed' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in engagement-notifications function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
