import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

// Helper para respostas 200 (sucesso ou erro de negócio)
function ok(body: unknown) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

// Helper para 401 (ÚNICO caso de non-2xx - JWT inválido)
function unauthorized(msg = 'Invalid user token') {
  return new Response(JSON.stringify({ success: false, error: msg }), {
    status: 401,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

interface IAPReceiptRequest {
  receipt_data: string;
  platform: 'apple' | 'google';
  product_id?: string;
}

interface AppleReceiptInfo {
  product_id: string;
  expires_date_ms: string;
  purchase_date_ms: string;
  original_transaction_id: string;
  transaction_id: string;
}

interface AppleValidationResponse {
  status: number;
  latest_receipt_info?: AppleReceiptInfo[];
  receipt?: {
    bundle_id: string;
    in_app?: AppleReceiptInfo[];
  };
  environment?: 'Sandbox' | 'Production';
}

// Validate receipt with Apple servers
async function validateAppleReceipt(receiptData: string, sharedSecret: string): Promise<AppleValidationResponse> {
  const productionUrl = 'https://buy.itunes.apple.com/verifyReceipt';
  const sandboxUrl = 'https://sandbox.itunes.apple.com/verifyReceipt';
  
  const payload = {
    'receipt-data': receiptData,
    'password': sharedSecret,
    'exclude-old-transactions': true
  };

  console.log('Validating receipt with Apple production server...');
  
  // Try production first
  let response = await fetch(productionUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  
  let result: AppleValidationResponse = await response.json();
  console.log('Apple production response status:', result.status);
  
  // Status 21007 means receipt is from sandbox, redirect to sandbox server
  if (result.status === 21007) {
    console.log('Receipt is from sandbox, redirecting to sandbox server...');
    response = await fetch(sandboxUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    result = await response.json();
    console.log('Apple sandbox response status:', result.status);
  }
  
  return result;
}

// Get human-readable error message for Apple status codes
function getAppleErrorMessage(status: number): string {
  const errorMessages: Record<number, string> = {
    21000: 'The App Store could not read the JSON object you provided.',
    21002: 'The data in the receipt-data property was malformed or missing.',
    21003: 'The receipt could not be authenticated.',
    21004: 'The shared secret you provided does not match the shared secret on file.',
    21005: 'The receipt server is not currently available.',
    21006: 'This receipt is valid but the subscription has expired.',
    21007: 'This receipt is from the test environment (sandbox).',
    21008: 'This receipt is from the production environment.',
    21009: 'Internal data access error.',
    21010: 'The user account cannot be found or has been deleted.',
  };
  
  return errorMessages[status] || `Unknown Apple error (status: ${status})`;
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
      return unauthorized('Authorization header required');
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
      return unauthorized('Invalid user token');
    }

    // Parse request body
    const { receipt_data, platform, product_id }: IAPReceiptRequest = await req.json();

    if (!receipt_data || !platform) {
      return ok({ success: false, error: 'receipt_data and platform are required' });
    }

    console.log(`Validating ${platform} receipt for user ${user.id}, product: ${product_id || 'not specified'}`);

    let isValid = false;
    let periodEnd: Date | null = null;
    let periodStart: Date | null = null;
    let planSource = '';
    let environment = '';

    if (platform === 'apple') {
      const appleSharedSecret = Deno.env.get('APPLE_SHARED_SECRET');
      
      if (!appleSharedSecret) {
        console.error('APPLE_SHARED_SECRET not configured');
        return ok({ success: false, error: 'Apple shared secret not configured' });
      }

      const appleResult = await validateAppleReceipt(receipt_data, appleSharedSecret);
      
      console.log('Apple validation result:', {
        status: appleResult.status,
        environment: appleResult.environment,
        hasLatestReceiptInfo: !!appleResult.latest_receipt_info,
        receiptInfoCount: appleResult.latest_receipt_info?.length || 0
      });

      // Status 0 = valid, Status 21006 = valid but expired
      if (appleResult.status === 0 || appleResult.status === 21006) {
        const latestReceiptInfo = appleResult.latest_receipt_info;
        
        if (latestReceiptInfo && latestReceiptInfo.length > 0) {
          // Sort by expires_date_ms descending to get the most recent transaction
          const sortedReceipts = [...latestReceiptInfo].sort(
            (a, b) => parseInt(b.expires_date_ms) - parseInt(a.expires_date_ms)
          );
          
          const latestTransaction = sortedReceipts[0];
          
          console.log('Latest transaction:', {
            product_id: latestTransaction.product_id,
            expires_date_ms: latestTransaction.expires_date_ms,
            transaction_id: latestTransaction.transaction_id
          });
          
          const expiresDateMs = parseInt(latestTransaction.expires_date_ms);
          const purchaseDateMs = parseInt(latestTransaction.purchase_date_ms);
          
          periodEnd = new Date(expiresDateMs);
          periodStart = new Date(purchaseDateMs);
          
          // Check if subscription is currently active
          isValid = periodEnd > new Date();
          planSource = 'appstore';
          environment = appleResult.environment || 'Production';
          
          console.log(`Subscription status: ${isValid ? 'ACTIVE' : 'EXPIRED'}, expires: ${periodEnd.toISOString()}, environment: ${environment}`);
        } else {
          console.error('No receipt info found in Apple response');
          return ok({ success: false, valid: false, error: 'No subscription information found in receipt' });
        }
      } else {
        const errorMessage = getAppleErrorMessage(appleResult.status);
        console.error(`Apple validation failed: ${errorMessage}`);
        return ok({ success: false, valid: false, error: errorMessage, apple_status: appleResult.status });
      }
    } else if (platform === 'google') {
      // TODO: Implement Google Play validation
      console.error('Google Play validation not yet implemented');
      return ok({ success: false, error: 'Google Play validation not yet implemented' });
    } else {
      return ok({ success: false, error: 'Invalid platform. Must be "apple" or "google"' });
    }

    // Update user subscription based on validation result using UPSERT
    const now = new Date();
    const subscriptionStatus = isValid ? 'active' : 'expired';
    const planType = isValid ? 'premium' : 'free';

    const payload = {
      user_id: user.id,
      plan_type: planType,
      subscription_status: subscriptionStatus,
      plan_source: planSource,
      current_period_start: periodStart?.toISOString() || now.toISOString(),
      current_period_end: periodEnd?.toISOString() || now.toISOString(),
      updated_at: now.toISOString(),
    };

    const { data: subscription, error: upsertError } = await supabaseClient
      .from('user_subscriptions')
      .upsert(payload, { onConflict: 'user_id' })
      .select()
      .single();

    if (upsertError) {
      console.error('Error upserting subscription:', upsertError);
      return ok({ success: false, error: 'Failed to update subscription' });
    }

    console.log(`Successfully updated subscription for user ${user.id}: ${planType} (${subscriptionStatus}) via ${planSource}`);

    return ok({ 
      success: true,
      valid: isValid,
      environment,
      subscription: {
        plan_type: subscription.plan_type,
        plan_source: subscription.plan_source,
        subscription_status: subscription.subscription_status,
        current_period_start: subscription.current_period_start,
        current_period_end: subscription.current_period_end,
      }
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    return ok({ success: false, error: 'Internal error' });
  }
});
