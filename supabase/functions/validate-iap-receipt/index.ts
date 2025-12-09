import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface IAPReceiptRequest {
  receipt_data: string;
  platform: 'apple' | 'google';
  product_id?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('No authorization header provided');
      return new Response(
        JSON.stringify({ error: 'Authorization header required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client with service role for updating subscriptions
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

    // Get user from JWT
    const supabaseAuth = createClient(
      supabaseUrl,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );
    
    const { data: { user }, error: userError } = await supabaseAuth.auth.getUser();
    
    if (userError || !user) {
      console.error('Error getting user:', userError);
      return new Response(
        JSON.stringify({ error: 'Invalid user token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const { receipt_data, platform, product_id }: IAPReceiptRequest = await req.json();

    if (!receipt_data || !platform) {
      return new Response(
        JSON.stringify({ error: 'receipt_data and platform are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Validating ${platform} receipt for user ${user.id}`);

    // TODO: Implement actual receipt validation with Apple/Google servers
    // Apple: POST to https://buy.itunes.apple.com/verifyReceipt (production)
    //        or https://sandbox.itunes.apple.com/verifyReceipt (sandbox)
    // Google: Use Google Play Developer API
    
    // For now, we'll trust the receipt and update the subscription
    // In production, you MUST validate with Apple/Google before granting access!
    
    const isApple = platform === 'apple';
    const planSource = isApple ? 'appstore' : 'playstore';
    
    // Calculate subscription period (default 30 days for monthly)
    const now = new Date();
    const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    // Update user subscription
    const { data: subscription, error: updateError } = await supabaseClient
      .from('user_subscriptions')
      .update({
        plan_type: 'premium',
        subscription_status: 'active',
        plan_source: planSource,
        current_period_start: now.toISOString(),
        current_period_end: periodEnd.toISOString(),
        updated_at: now.toISOString(),
      })
      .eq('user_id', user.id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating subscription:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to update subscription' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Successfully activated ${planSource} subscription for user ${user.id}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        subscription: {
          plan_type: subscription.plan_type,
          plan_source: subscription.plan_source,
          subscription_status: subscription.subscription_status,
          current_period_end: subscription.current_period_end,
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
