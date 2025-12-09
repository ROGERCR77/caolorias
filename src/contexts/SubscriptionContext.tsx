import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface SubscriptionState {
  isLoading: boolean;
  planType: "free" | "premium" | "trial";
  subscriptionStatus: string;
  trialEndsAt: string | null;
  subscriptionEnd: string | null;
  isTrialExpired: boolean;
  daysUntilTrialExpires: number | null;
}

interface SubscriptionContextType extends SubscriptionState {
  refreshSubscription: () => Promise<void>;
  openCheckout: () => Promise<void>;
  openCustomerPortal: () => Promise<void>;
  isPremium: boolean;
  canAccessFeature: (feature: string) => boolean;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

const PREMIUM_FEATURES = [
  "multiple_dogs",
  "weight_history",
  "ai_insights",
  "meal_plan",
  "favorites",
  "recipes",
  "advanced_alerts",
  "activity_recommendations",
  "pdf_export",
  "all_objectives",
];

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const { user, session } = useAuth();
  const { toast } = useToast();
  const [state, setState] = useState<SubscriptionState>({
    isLoading: true,
    planType: "free",
    subscriptionStatus: "inactive",
    trialEndsAt: null,
    subscriptionEnd: null,
    isTrialExpired: false,
    daysUntilTrialExpires: null,
  });

  const refreshSubscription = async () => {
    if (!user || !session) {
      setState(prev => ({ ...prev, isLoading: false, planType: "free" }));
      return;
    }

    try {
      // Check local database first
      const { data: subscription, error } = await supabase
        .from("user_subscriptions")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error && error.code !== "PGRST116") {
        console.error("Error fetching subscription:", error);
      }

      if (subscription) {
        const now = new Date();
        const trialEndsAt = subscription.trial_ends_at ? new Date(subscription.trial_ends_at) : null;
        const isTrialActive = subscription.subscription_status === "trialing" && trialEndsAt && trialEndsAt > now;
        const isTrialExpired = subscription.subscription_status === "trialing" && trialEndsAt && trialEndsAt <= now;
        
        let daysUntilTrialExpires: number | null = null;
        if (isTrialActive && trialEndsAt) {
          daysUntilTrialExpires = Math.ceil((trialEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        }

        // Try to check Stripe subscription status
        try {
          const { data: stripeData, error: stripeError } = await supabase.functions.invoke("check-subscription", {
            headers: {
              Authorization: `Bearer ${session.access_token}`,
            },
          });

          if (!stripeError && stripeData?.subscribed) {
            setState({
              isLoading: false,
              planType: "premium",
              subscriptionStatus: "active",
              trialEndsAt: subscription.trial_ends_at,
              subscriptionEnd: stripeData.subscription_end,
              isTrialExpired: false,
              daysUntilTrialExpires: null,
            });
            return;
          }
        } catch (e) {
          console.log("Stripe check failed, using local data");
        }

        setState({
          isLoading: false,
          planType: isTrialActive ? "trial" : isTrialExpired ? "free" : subscription.plan_type as "free" | "premium" | "trial",
          subscriptionStatus: subscription.subscription_status,
          trialEndsAt: subscription.trial_ends_at,
          subscriptionEnd: subscription.current_period_end,
          isTrialExpired,
          daysUntilTrialExpires,
        });
      } else {
        setState(prev => ({ ...prev, isLoading: false, planType: "free" }));
      }
    } catch (error) {
      console.error("Error refreshing subscription:", error);
      setState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const openCheckout = async () => {
    if (!session) {
      toast({
        title: "Erro",
        description: "Você precisa estar logado para assinar.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, "_blank");
      }
    } catch (error: any) {
      console.error("Checkout error:", error);
      toast({
        title: "Erro ao iniciar pagamento",
        description: error.message || "Tente novamente em alguns instantes.",
        variant: "destructive",
      });
    }
  };

  const openCustomerPortal = async () => {
    if (!session) {
      toast({
        title: "Erro",
        description: "Você precisa estar logado.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke("customer-portal", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, "_blank");
      }
    } catch (error: any) {
      console.error("Portal error:", error);
      toast({
        title: "Erro ao abrir portal",
        description: error.message || "Tente novamente em alguns instantes.",
        variant: "destructive",
      });
    }
  };

  const canAccessFeature = (feature: string): boolean => {
    if (state.planType === "premium") return true;
    if (state.planType === "trial" && !state.isTrialExpired) return true;
    return !PREMIUM_FEATURES.includes(feature);
  };

  useEffect(() => {
    refreshSubscription();
  }, [user, session]);

  // Auto-refresh when window gains focus (user returns from Stripe)
  useEffect(() => {
    const handleFocus = () => {
      refreshSubscription();
    };

    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [user, session]);

  const isPremium = state.planType === "premium" || (state.planType === "trial" && !state.isTrialExpired);

  return (
    <SubscriptionContext.Provider
      value={{
        ...state,
        refreshSubscription,
        openCheckout,
        openCustomerPortal,
        isPremium,
        canAccessFeature,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error("useSubscription must be used within a SubscriptionProvider");
  }
  return context;
}
