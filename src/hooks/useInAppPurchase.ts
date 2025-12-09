import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Capacitor } from "@capacitor/core";

// Product IDs - configure these in App Store Connect / Google Play Console
const PRODUCT_IDS = {
  PREMIUM_MONTHLY: "caolorias_premium_monthly",
  PREMIUM_YEARLY: "caolorias_premium_yearly",
};

interface IAPProduct {
  id: string;
  title: string;
  description: string;
  price: string;
  priceMicros: number;
  currency: string;
}

interface UseInAppPurchaseReturn {
  isAvailable: boolean;
  isLoading: boolean;
  products: IAPProduct[];
  purchaseProduct: (productId: string) => Promise<boolean>;
  restorePurchases: () => Promise<boolean>;
}

export function useInAppPurchase(): UseInAppPurchaseReturn {
  const { toast } = useToast();
  const [isAvailable, setIsAvailable] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [products, setProducts] = useState<IAPProduct[]>([]);

  const isNativePlatform = Capacitor.isNativePlatform();
  const platform = Capacitor.getPlatform();

  // Initialize IAP store
  useEffect(() => {
    const initializeStore = async () => {
      if (!isNativePlatform) {
        console.log("IAP: Not running on native platform, skipping initialization");
        setIsLoading(false);
        return;
      }

      try {
        // Wait for the store to be ready
        // @ts-ignore - cordova-plugin-purchase types
        if (typeof CdvPurchase === "undefined") {
          console.log("IAP: CdvPurchase not available yet, waiting...");
          // Wait for plugin to load
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }

        // @ts-ignore - cordova-plugin-purchase
        const { store, Platform, ProductType } = CdvPurchase;

        if (!store) {
          console.error("IAP: Store not available");
          setIsLoading(false);
          return;
        }

        console.log("IAP: Initializing store...");

        // Register products
        const platformId = platform === "ios" ? Platform.APPLE_APPSTORE : Platform.GOOGLE_PLAY;

        store.register([
          {
            id: PRODUCT_IDS.PREMIUM_MONTHLY,
            type: ProductType.PAID_SUBSCRIPTION,
            platform: platformId,
          },
          {
            id: PRODUCT_IDS.PREMIUM_YEARLY,
            type: ProductType.PAID_SUBSCRIPTION,
            platform: platformId,
          },
        ]);

        // Handle approved transactions
        store.when().approved((transaction: any) => {
          console.log("IAP: Transaction approved", transaction);
          handleApprovedTransaction(transaction);
        });

        // Handle verified transactions
        store.when().verified((receipt: any) => {
          console.log("IAP: Receipt verified", receipt);
          receipt.finish();
        });

        // Handle errors
        store.error((error: any) => {
          console.error("IAP: Store error", error);
          toast({
            title: "Erro na compra",
            description: error.message || "Ocorreu um erro ao processar a compra",
            variant: "destructive",
          });
        });

        // Initialize the store
        await store.initialize([platformId]);

        // Update products list
        const availableProducts: IAPProduct[] = [];
        store.products.forEach((product: any) => {
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

        setProducts(availableProducts);
        setIsAvailable(true);
        console.log("IAP: Store initialized with", availableProducts.length, "products");
      } catch (error) {
        console.error("IAP: Failed to initialize store", error);
        setIsAvailable(false);
      } finally {
        setIsLoading(false);
      }
    };

    initializeStore();
  }, [isNativePlatform, platform, toast]);

  // Handle approved transaction - validate with our backend
  const handleApprovedTransaction = async (transaction: any) => {
    try {
      console.log("IAP: Validating transaction with backend...");

      const receiptData = transaction.transactionId || transaction.purchaseToken;
      const platformType = platform === "ios" ? "apple" : "google";

      // Call our Edge Function to validate and update subscription
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.access_token) {
        throw new Error("User not authenticated");
      }

      const response = await supabase.functions.invoke("validate-iap-receipt", {
        body: {
          receipt_data: receiptData,
          platform: platformType,
          product_id: transaction.productId,
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      console.log("IAP: Backend validation successful", response.data);

      // Finish the transaction
      transaction.finish();

      toast({
        title: "Assinatura ativada! 🎉",
        description: "Bem-vindo ao Cãolorias Premium!",
      });

      return true;
    } catch (error) {
      console.error("IAP: Failed to validate transaction", error);
      toast({
        title: "Erro na validação",
        description: "Não foi possível ativar sua assinatura. Tente restaurar as compras.",
        variant: "destructive",
      });
      return false;
    }
  };

  // Purchase a product
  const purchaseProduct = useCallback(
    async (productId: string): Promise<boolean> => {
      if (!isAvailable) {
        toast({
          title: "Compras indisponíveis",
          description: "As compras no app não estão disponíveis neste momento.",
          variant: "destructive",
        });
        return false;
      }

      try {
        setIsLoading(true);
        console.log("IAP: Initiating purchase for", productId);

        // @ts-ignore - cordova-plugin-purchase
        const { store } = CdvPurchase;
        const product = store.get(productId);

        if (!product) {
          throw new Error("Produto não encontrado");
        }

        const offer = product.getOffer();
        if (!offer) {
          throw new Error("Oferta não disponível");
        }

        // Start the purchase flow
        await offer.order();

        return true;
      } catch (error: any) {
        console.error("IAP: Purchase failed", error);
        toast({
          title: "Erro na compra",
          description: error.message || "Não foi possível completar a compra",
          variant: "destructive",
        });
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [isAvailable, toast]
  );

  // Restore previous purchases
  const restorePurchases = useCallback(async (): Promise<boolean> => {
    if (!isNativePlatform) {
      toast({
        title: "Restauração indisponível",
        description: "A restauração de compras só está disponível no app nativo.",
      });
      return false;
    }

    try {
      setIsLoading(true);
      console.log("IAP: Restoring purchases...");

      // @ts-ignore - cordova-plugin-purchase
      const { store } = CdvPurchase;
      await store.restorePurchases();

      toast({
        title: "Compras restauradas",
        description: "Suas compras anteriores foram verificadas.",
      });

      return true;
    } catch (error: any) {
      console.error("IAP: Restore failed", error);
      toast({
        title: "Erro ao restaurar",
        description: error.message || "Não foi possível restaurar as compras",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isNativePlatform, toast]);

  return {
    isAvailable,
    isLoading,
    products,
    purchaseProduct,
    restorePurchases,
  };
}

export { PRODUCT_IDS };
