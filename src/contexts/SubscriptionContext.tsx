import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface SubscriptionState {
  isLoading: boolean;
  planType: "free" | "premium" | "trial";
  planSource: string | null;
  subscriptionStatus: string;
  trialEndsAt: string | null;
  subscriptionEnd: string | null;
  isTrialExpired: boolean;
  daysUntilTrialExpires: number | null;
}

interface SubscriptionContextType extends SubscriptionState {
  refreshSubscription: () => Promise<void>;
  startInAppSubscription: () => void;
  isPremium: boolean;
  canAccessFeature: (feature: string) => boolean;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

const PREMIUM_FEATURES = [
  "multiple_dogs",
  "weight_history",
  "ai_insights",
  "ai_insights_history",
  "meal_plan",
  "favorites",
  "recipes",
  "advanced_alerts",
  "activity_recommendations",
  "pdf_export",
  "vet_report",
  "health_wallet",
  "dietary_transition",
  "all_objectives",
];

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const { user, session } = useAuth();
  const { toast } = useToast();
  const [state, setState] = useState<SubscriptionState>({
    isLoading: true,
    planType: "free",
    planSource: null,
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
      // Check subscription from Supabase database
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

        // Determine effective plan type
        let effectivePlanType: "free" | "premium" | "trial" = subscription.plan_type as "free" | "premium" | "trial";
        if (isTrialActive) {
          effectivePlanType = "trial";
        } else if (isTrialExpired && subscription.plan_type !== "premium") {
          effectivePlanType = "free";
        }

        setState({
          isLoading: false,
          planType: effectivePlanType,
          planSource: subscription.plan_source || null,
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

  // TODO: Integrar In-App Purchase (Apple/Google) aqui
  const startInAppSubscription = () => {
    console.log("TODO: Iniciar fluxo de In-App Purchase nativo (Apple/Google)");
    toast({
      title: "Em breve",
      description: "A assinatura pelo app estará disponível em breve. Aguarde!",
    });
  };

  const canAccessFeature = (feature: string): boolean => {
    if (state.planType === "premium") return true;
    if (state.planType === "trial" && !state.isTrialExpired) return true;
    return !PREMIUM_FEATURES.includes(feature);
  };

  useEffect(() => {
    refreshSubscription();
  }, [user, session]);

  // Auto-refresh when window gains focus
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
        startInAppSubscription,
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
