import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Capacitor } from "@capacitor/core";

interface SubscriptionState {
  isLoading: boolean;
  isIAPLoading: boolean;
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
  startInAppSubscription: (productId?: string) => Promise<void>;
  restorePurchases: () => Promise<void>;
  isPremium: boolean;
  canAccessFeature: (feature: string) => boolean;
  isNativePlatform: boolean;
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

const PRODUCT_IDS = {
  PREMIUM_MONTHLY: "caolorias_premium_1month",
};

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const { user, session } = useAuth();
  const { toast } = useToast();
  const [state, setState] = useState<SubscriptionState>({
    isLoading: true,
    isIAPLoading: true,
    planType: "free",
    planSource: null,
    subscriptionStatus: "inactive",
    trialEndsAt: null,
    subscriptionEnd: null,
    isTrialExpired: false,
    daysUntilTrialExpires: null,
  });

  const isNativePlatform = Capacitor.isNativePlatform();
  const platform = Capacitor.getPlatform();

  // Initialize IAP store
  useEffect(() => {
    const initializeIAP = async () => {
      if (!isNativePlatform) {
        console.log("IAP: Not running on native platform, skipping initialization");
        setState(prev => ({ ...prev, isIAPLoading: false }));
        return;
      }

      // Wait for the plugin to be available with retry logic
      let retries = 0;
      const maxRetries = 10;
      const retryDelay = 500;

      while (retries < maxRetries) {
        // @ts-ignore - cordova-plugin-purchase
        if (typeof CdvPurchase !== "undefined") {
          break;
        }
        console.log(`IAP: Waiting for CdvPurchase plugin... attempt ${retries + 1}/${maxRetries}`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        retries++;
      }

      // @ts-ignore - cordova-plugin-purchase
      if (typeof CdvPurchase === "undefined") {
        console.error("IAP: CdvPurchase plugin not available after retries");
        setState(prev => ({ ...prev, isIAPLoading: false }));
        return;
      }

      try {
        // @ts-ignore - cordova-plugin-purchase
        const { store, Platform, ProductType } = CdvPurchase;

        if (!store) {
          console.error("IAP: Store not available");
          setState(prev => ({ ...prev, isIAPLoading: false }));
          return;
        }

        console.log("IAP: Initializing store...");

        // Set verbose logging for debugging
        store.verbosity = 4; // DEBUG level

        const platformId = platform === "ios" ? Platform.APPLE_APPSTORE : Platform.GOOGLE_PLAY;

        // Register products
        store.register([
          {
            id: PRODUCT_IDS.PREMIUM_MONTHLY,
            type: ProductType.PAID_SUBSCRIPTION,
            platform: platformId,
          },
        ]);

        // Handle ready event
        store.ready(() => {
          console.log("IAP: Store is ready");
          setState(prev => ({ ...prev, isIAPLoading: false }));
        });

        // Handle errors
        store.error((error: any) => {
          console.error("IAP: Store error", error);
        });

        // Initialize the store
        await store.initialize([platformId]);

        console.log("IAP: Store initialized successfully");
        
        // Log available products for debugging
        store.products.forEach((product: any) => {
          console.log("IAP: Product available:", product.id, product.title, product.offers?.length, "offers");
        });

      } catch (error) {
        console.error("IAP: Failed to initialize store", error);
      } finally {
        setState(prev => ({ ...prev, isIAPLoading: false }));
      }
    };

    initializeIAP();
  }, [isNativePlatform, platform]);

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

        setState(prev => ({
          ...prev,
          isLoading: false,
          planType: effectivePlanType,
          planSource: subscription.plan_source || null,
          subscriptionStatus: subscription.subscription_status,
          trialEndsAt: subscription.trial_ends_at,
          subscriptionEnd: subscription.current_period_end,
          isTrialExpired,
          daysUntilTrialExpires,
        }));
      } else {
        setState(prev => ({ ...prev, isLoading: false, planType: "free" }));
      }
    } catch (error) {
      console.error("Error refreshing subscription:", error);
      setState(prev => ({ ...prev, isLoading: false }));
    }
  };

  // Start In-App Purchase flow
  const startInAppSubscription = async (productId?: string) => {
    const selectedProductId = productId || PRODUCT_IDS.PREMIUM_MONTHLY;

    if (!isNativePlatform) {
      toast({
        title: "Compra no app",
        description: "As compras nativas só estão disponíveis no aplicativo iOS ou Android.",
      });
      return;
    }

    // Wait for IAP to be ready
    if (state.isIAPLoading) {
      toast({
        title: "Aguarde",
        description: "O sistema de compras está sendo carregado...",
      });
      return;
    }

    try {
      console.log("IAP: Starting purchase for product:", selectedProductId);

      // @ts-ignore - cordova-plugin-purchase
      if (typeof CdvPurchase === "undefined") {
        console.error("IAP: CdvPurchase not available");
        toast({
          title: "Sistema indisponível",
          description: "O sistema de compras não está disponível. Por favor, reinicie o aplicativo e tente novamente.",
          variant: "destructive",
        });
        return;
      }

      // @ts-ignore - cordova-plugin-purchase
      const { store } = CdvPurchase;
      
      // Log all registered products for debugging
      console.log("IAP: Registered products:", store.products.map((p: any) => ({
        id: p.id,
        title: p.title,
        offers: p.offers?.length || 0
      })));

      const product = store.get(selectedProductId);
      console.log("IAP: Retrieved product:", product);

      if (!product) {
        console.error("IAP: Product not found:", selectedProductId);
        toast({
          title: "Produto não encontrado",
          description: "O produto de assinatura não está disponível no momento. Verifique se o Paid Apps Agreement foi aceito no App Store Connect.",
          variant: "destructive",
        });
        return;
      }

      const offer = product.getOffer();
      console.log("IAP: Retrieved offer:", offer);

      if (!offer) {
        console.error("IAP: No offer available for product:", selectedProductId);
        toast({
          title: "Oferta indisponível",
          description: "A oferta de assinatura não está disponível. Tente novamente mais tarde.",
          variant: "destructive",
        });
        return;
      }

      console.log("IAP: Ordering offer...");
      
      // Start purchase flow
      await offer.order();
      
      console.log("IAP: Order initiated successfully");
      // The transaction will be handled by the store.when().approved() callback
      // which is set up in the useInAppPurchase hook
    } catch (error: any) {
      console.error("IAP: Error starting purchase:", error);
      toast({
        title: "Erro na compra",
        description: error.message || "Não foi possível iniciar a compra. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  // Restore previous purchases
  const restorePurchases = async () => {
    if (!isNativePlatform) {
      toast({
        title: "Restauração",
        description: "A restauração de compras só está disponível no aplicativo nativo.",
      });
      return;
    }

    try {
      console.log("IAP: Restoring purchases...");

      // @ts-ignore - cordova-plugin-purchase
      if (typeof CdvPurchase === "undefined") {
        toast({
          title: "Indisponível",
          description: "O sistema de compras não está disponível no momento.",
        });
        return;
      }

      // @ts-ignore - cordova-plugin-purchase
      const { store } = CdvPurchase;
      await store.restorePurchases();

      // Refresh subscription status after restore
      await refreshSubscription();

      toast({
        title: "Compras restauradas",
        description: "Suas compras anteriores foram verificadas.",
      });
    } catch (error: any) {
      console.error("IAP: Error restoring purchases:", error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível restaurar as compras",
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
        restorePurchases,
        isPremium,
        canAccessFeature,
        isNativePlatform,
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

export { PRODUCT_IDS };