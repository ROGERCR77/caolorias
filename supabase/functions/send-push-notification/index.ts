import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PushNotificationRequest {
  // Send to specific user by external_user_id (Supabase user id)
  user_id?: string;
  // Or send to users with specific tags
  tags?: { key: string; value: string; relation?: string }[];
  // Or send to all subscribed users
  send_to_all?: boolean;
  // Notification content
  title: string;
  message: string;
  // Optional data payload
  data?: Record<string, string>;
  // Optional URL to open when notification is clicked
  url?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const ONESIGNAL_APP_ID = Deno.env.get('ONESIGNAL_APP_ID');
    const ONESIGNAL_REST_API_KEY = Deno.env.get('ONESIGNAL_REST_API_KEY');

    if (!ONESIGNAL_APP_ID || !ONESIGNAL_REST_API_KEY) {
      console.error('Missing OneSignal credentials');
      return new Response(
        JSON.stringify({ error: 'OneSignal not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body: PushNotificationRequest = await req.json();
    console.log('Push notification request:', JSON.stringify(body, null, 2));

    const { user_id, tags, send_to_all, title, message, data, url } = body;

    if (!title || !message) {
      return new Response(
        JSON.stringify({ error: 'title and message are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build OneSignal notification payload
    const notificationPayload: Record<string, unknown> = {
      app_id: ONESIGNAL_APP_ID,
      headings: { en: title, pt: title },
      contents: { en: message, pt: message },
    };

    // Add optional data
    if (data) {
      notificationPayload.data = data;
    }

    // Add optional URL
    if (url) {
      notificationPayload.url = url;
    }

    // Target audience
    if (user_id) {
      // Send to specific user by external_user_id
      notificationPayload.include_aliases = {
        external_id: [user_id]
      };
      notificationPayload.target_channel = "push";
    } else if (tags && tags.length > 0) {
      // Send to users matching tags
      notificationPayload.filters = tags.map((tag, index) => {
        const filter: Record<string, string> = {
          field: 'tag',
          key: tag.key,
          value: tag.value,
          relation: tag.relation || '='
        };
        // Add OR operator between filters if not the first one
        if (index > 0) {
          return [{ operator: 'OR' }, filter];
        }
        return filter;
      }).flat();
    } else if (send_to_all) {
      // Send to all subscribed users
      notificationPayload.included_segments = ['Subscribed Users'];
    } else {
      return new Response(
        JSON.stringify({ error: 'Must specify user_id, tags, or send_to_all' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Sending to OneSignal:', JSON.stringify(notificationPayload, null, 2));

    // Send notification via OneSignal REST API
    const response = await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${ONESIGNAL_REST_API_KEY}`,
      },
      body: JSON.stringify(notificationPayload),
    });

    const result = await response.json();
    console.log('OneSignal response:', JSON.stringify(result, null, 2));

    if (!response.ok) {
      return new Response(
        JSON.stringify({ error: 'Failed to send notification', details: result }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, result }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error sending push notification:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
