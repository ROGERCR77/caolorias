import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Capacitor } from "@capacitor/core";

// Extend window for iOS StoreKit
declare global {
  interface Window {
    storekit?: {
      appStoreReceipt?: string;
    };
  }
}

interface IAPProduct {
  id: string;
  title: string;
  description: string;
  price: string;
  priceMicros: number;
  currency: string;
}

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
  products: IAPProduct[];
  iapError: string | null;
}

interface SubscriptionContextType extends SubscriptionState {
  refreshSubscription: () => Promise<void>;
  startInAppSubscription: (productId?: string) => Promise<void>;
  restorePurchases: () => Promise<void>;
  retryLoadProducts: () => Promise<void>;
  isPremium: boolean;
  canAccessFeature: (feature: string) => boolean;
  isNativePlatform: boolean;
  hasProducts: boolean;
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
    products: [],
    iapError: null,
  });

  const isNativePlatform = Capacitor.isNativePlatform();
  const platform = Capacitor.getPlatform();

  // Handle approved transaction - validate with backend
  const handleApprovedTransaction = async (transaction: any) => {
    try {
      console.log("IAP: Validating transaction with backend...");
      console.log("IAP: Transaction details:", {
        transactionId: transaction.transactionId,
        productId: transaction.productId,
        platform: platform,
      });

      let receiptData: string;
      const platformType = platform === "ios" ? "apple" : "google";

      if (platform === "ios") {
        // NOTE: store.getApplicationReceipt() does NOT exist in cordova-plugin-purchase v13+
        // We must use the receipt data that comes with the transaction or its parent receipt
        
        // First try: transaction's parent receipt (v13 approach)
        if (transaction.parentReceipt?.sourceReceipt?.raw) {
          receiptData = transaction.parentReceipt.sourceReceipt.raw;
          console.log("IAP: Got iOS receipt from parentReceipt.sourceReceipt.raw, length:", receiptData.length);
        } else if (transaction.appStoreReceipt) {
          // Fallback: some versions expose it directly on transaction
          receiptData = transaction.appStoreReceipt;
          console.log("IAP: Got iOS receipt from transaction.appStoreReceipt, length:", receiptData.length);
        } else if (window.storekit?.appStoreReceipt) {
          // Fallback: native layer
          receiptData = window.storekit.appStoreReceipt;
          console.log("IAP: Got iOS receipt from native layer, length:", receiptData.length);
        } else {
          // Last resort: try to get from the store's localReceipts
          // @ts-ignore - cordova-plugin-purchase
          const { store } = CdvPurchase;
          const localReceipts = store.localReceipts || [];
          const iosReceipt = localReceipts.find((r: any) => r.platform === "ios-appstore");
          
          if (iosReceipt?.sourceReceipt?.raw) {
            receiptData = iosReceipt.sourceReceipt.raw;
            console.log("IAP: Got iOS receipt from localReceipts, length:", receiptData.length);
          } else {
            throw new Error("Não foi possível obter o receipt da App Store. Tente novamente.");
          }
        }
      } else {
        receiptData = transaction.purchaseToken;
        console.log("IAP: Got Android purchaseToken");
        
        if (!receiptData) {
          throw new Error("Não foi possível obter o token de compra do Google Play");
        }
      }

      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData?.session?.access_token) {
        throw new Error("Usuário não autenticado");
      }

      console.log("IAP: Calling validate-iap-receipt edge function...");
      
      const response = await supabase.functions.invoke("validate-iap-receipt", {
        body: {
          receipt_data: receiptData,
          platform: platformType,
          product_id: transaction.productId,
        },
      });

      if (response.error) {
        console.error("IAP: Edge function error:", response.error);
        throw new Error(response.error.message || "Erro na validação do servidor");
      }

      console.log("IAP: Backend validation successful", response.data);

      transaction.finish();

      toast({
        title: "Assinatura ativada! 🎉",
        description: "Bem-vindo ao Cãolorias Premium!",
      });

      // Refresh subscription status
      await refreshSubscription();

      return true;
    } catch (error: any) {
      console.error("IAP: Failed to validate transaction", error);
      toast({
        title: "Erro na validação",
        description: error.message || "Não foi possível ativar sua assinatura. Tente restaurar as compras.",
        variant: "destructive",
      });
      return false;
    }
  };

  // Load products from store
  const loadProducts = async (store: any): Promise<IAPProduct[]> => {
    const availableProducts: IAPProduct[] = [];
    
    console.log("IAP: Loading products, store has", store.products.length, "products");
    
    store.products.forEach((product: any) => {
      console.log("IAP: Checking product:", {
        id: product.id,
        title: product.title,
        offersCount: product.offers?.length || 0,
        offers: product.offers?.map((o: any) => ({
          id: o.id,
          pricingPhases: o.pricingPhases?.length || 0
        }))
      });
      
      if (product.offers && product.offers.length > 0) {
        const offer = product.offers[0];
        availableProducts.push({
          id: product.id,
          title: product.title || "Cãolorias Premium",
          description: product.description || "Acesso completo ao app",
          price: offer.pricingPhases?.[0]?.price || "R$ 39,90",
          priceMicros: offer.pricingPhases?.[0]?.priceMicros || 3990000,
          currency: offer.pricingPhases?.[0]?.currency || "BRL",
        });
      }
    });

    return availableProducts;
  };

  // Initialize IAP store
  const initializeIAP = async () => {
    if (!isNativePlatform) {
      console.log("IAP: Not running on native platform, skipping initialization");
      setState(prev => ({ ...prev, isIAPLoading: false }));
      return;
    }

    setState(prev => ({ ...prev, isIAPLoading: true, iapError: null }));

    // Wait for the plugin to be available with retry logic
    let retries = 0;
    const maxRetries = 15;
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
      setState(prev => ({ 
        ...prev, 
        isIAPLoading: false, 
        iapError: "Plugin de compras não disponível" 
      }));
      return;
    }

    try {
      // @ts-ignore - cordova-plugin-purchase
      const { store, Platform, ProductType } = CdvPurchase;

      if (!store) {
        console.error("IAP: Store not available");
        setState(prev => ({ 
          ...prev, 
          isIAPLoading: false, 
          iapError: "Loja não disponível" 
        }));
        return;
      }

      console.log("IAP: Initializing store...");

      // Set verbose logging for debugging
      store.verbosity = 4;

      const platformId = platform === "ios" ? Platform.APPLE_APPSTORE : Platform.GOOGLE_PLAY;

      // Register products
      store.register([
        {
          id: PRODUCT_IDS.PREMIUM_MONTHLY,
          type: ProductType.PAID_SUBSCRIPTION,
          platform: platformId,
        },
      ]);

      // Handle approved transactions
      store.when().approved((transaction: any) => {
        console.log("IAP: Transaction approved", {
          transactionId: transaction.transactionId,
          productId: transaction.productId,
        });
        handleApprovedTransaction(transaction);
      });

      // Handle verified transactions
      store.when().verified((receipt: any) => {
        console.log("IAP: Receipt verified", receipt);
        receipt.finish();
      });

      // Handle errors
      store.error((error: any) => {
        console.error("IAP: Store error", {
          code: error.code,
          message: error.message,
        });
      });

      // Initialize the store
      console.log("IAP: Initializing with platform:", platformId);
      await store.initialize([platformId]);

      console.log("IAP: Store initialized, waiting for products...");

      // CRITICAL: Wait for products to actually load with polling
      let productAttempts = 0;
      const maxProductAttempts = 20; // 10 seconds total
      let products: IAPProduct[] = [];

      while (productAttempts < maxProductAttempts) {
        products = await loadProducts(store);
        
        if (products.length > 0) {
          console.log("IAP: Products loaded successfully:", products.length);
          break;
        }

        console.log(`IAP: Waiting for products... attempt ${productAttempts + 1}/${maxProductAttempts}`);
        await new Promise(resolve => setTimeout(resolve, 500));
        productAttempts++;
      }

      if (products.length === 0) {
        console.warn("IAP: No products available after waiting. Check App Store Connect configuration.");
        setState(prev => ({ 
          ...prev, 
          isIAPLoading: false, 
          products: [],
          iapError: "Nenhum produto encontrado. Verifique a configuração no App Store Connect." 
        }));
        return;
      }

      setState(prev => ({ 
        ...prev, 
        isIAPLoading: false, 
        products,
        iapError: null 
      }));

      console.log("IAP: Initialization complete with", products.length, "products");

    } catch (error: any) {
      console.error("IAP: Failed to initialize store", error);
      setState(prev => ({ 
        ...prev, 
        isIAPLoading: false, 
        iapError: error.message || "Erro ao inicializar loja" 
      }));
    }
  };

  // Initial IAP setup
  useEffect(() => {
    initializeIAP();
  }, [isNativePlatform, platform]);

  // Retry loading products
  const retryLoadProducts = async () => {
    console.log("IAP: Retrying product load...");
    await initializeIAP();
  };

  const refreshSubscription = async () => {
    if (!user || !session) {
      setState(prev => ({ ...prev, isLoading: false, planType: "free" }));
      return;
    }

    try {
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

    // CRITICAL: Check if products are loaded
    if (state.products.length === 0) {
      toast({
        title: "Produtos não carregados",
        description: "Os produtos ainda não foram carregados. Toque em 'Tentar novamente' para recarregar.",
        variant: "destructive",
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
          description: "O produto de assinatura não está disponível. Tente recarregar a página.",
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
      await offer.order();
      console.log("IAP: Order initiated successfully");
      
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

  useEffect(() => {
    const handleFocus = () => {
      refreshSubscription();
    };

    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [user, session]);

  const isPremium = state.planType === "premium" || (state.planType === "trial" && !state.isTrialExpired);
  const hasProducts = state.products.length > 0;

  return (
    <SubscriptionContext.Provider
      value={{
        ...state,
        refreshSubscription,
        startInAppSubscription,
        restorePurchases,
        retryLoadProducts,
        isPremium,
        canAccessFeature,
        isNativePlatform,
        hasProducts,
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
