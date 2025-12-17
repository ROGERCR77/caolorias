import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Capacitor } from "@capacitor/core";

// Extend window for iOS StoreKit
declare global {
  interface Window {
    storekit?: {
      appStoreReceipt?: string;
    };
  }
}

// Product IDs - configure these in App Store Connect / Google Play Console
const PRODUCT_IDS = {
  PREMIUM_MONTHLY: "caolorias_premium_1month",
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

      // Wait for the plugin to be available with retry logic
      let retries = 0;
      const maxRetries = 15; // Increased for iPad
      const retryDelay = 500;

      while (retries < maxRetries) {
        // @ts-ignore - cordova-plugin-purchase types
        if (typeof CdvPurchase !== "undefined") {
          break;
        }
        console.log(`IAP: Waiting for CdvPurchase plugin... attempt ${retries + 1}/${maxRetries}`);
        await new Promise((resolve) => setTimeout(resolve, retryDelay));
        retries++;
      }

      // @ts-ignore - cordova-plugin-purchase
      if (typeof CdvPurchase === "undefined") {
        console.error("IAP: CdvPurchase plugin not available after retries");
        setIsLoading(false);
        return;
      }

      try {
        // @ts-ignore - cordova-plugin-purchase
        const { store, Platform, ProductType } = CdvPurchase;

        if (!store) {
          console.error("IAP: Store not available");
          setIsLoading(false);
          return;
        }

        console.log("IAP: Initializing store...");

        // Set verbose logging for debugging in sandbox
        store.verbosity = 4; // DEBUG level

        // Register products
        const platformId = platform === "ios" ? Platform.APPLE_APPSTORE : Platform.GOOGLE_PLAY;

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

        // Handle errors with detailed logging
        store.error((error: any) => {
          console.error("IAP: Store error", {
            code: error.code,
            message: error.message,
          });
          // Don't show toast for every error - some are informational
          if (error.code !== 6777001) { // Skip "user cancelled" errors
            toast({
              title: "Erro na compra",
              description: error.message || "Ocorreu um erro ao processar a compra",
              variant: "destructive",
            });
          }
        });

        // Initialize the store
        console.log("IAP: Initializing with platform:", platformId);
        await store.initialize([platformId]);

        // Wait a bit for products to load
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Update products list
        const availableProducts: IAPProduct[] = [];
        console.log("IAP: Checking products, count:", store.products.length);
        
        store.products.forEach((product: any) => {
          console.log("IAP: Product found:", {
            id: product.id,
            title: product.title,
            offersCount: product.offers?.length || 0,
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

        setProducts(availableProducts);
        setIsAvailable(availableProducts.length > 0);
        console.log("IAP: Store initialized with", availableProducts.length, "products");
        
        if (availableProducts.length === 0) {
          console.warn("IAP: No products available. Check App Store Connect configuration and Paid Apps Agreement.");
        }
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
      console.log("IAP: Transaction details:", {
        transactionId: transaction.transactionId,
        productId: transaction.productId,
        platform: platform,
      });

      let receiptData: string;
      const platformType = platform === "ios" ? "apple" : "google";

      if (platform === "ios") {
        // For iOS, we need the full base64 encoded App Store receipt
        // @ts-ignore - cordova-plugin-purchase
        const { store } = CdvPurchase;
        
        // Get the application receipt (contains all transactions)
        const appReceipt = await store.getApplicationReceipt();
        
        if (appReceipt?.sourceReceipt?.raw) {
          receiptData = appReceipt.sourceReceipt.raw;
          console.log("IAP: Got iOS receipt from applicationReceipt, length:", receiptData.length);
        } else if (transaction.appStoreReceipt) {
          receiptData = transaction.appStoreReceipt;
          console.log("IAP: Got iOS receipt from transaction.appStoreReceipt, length:", receiptData.length);
        } else {
          // Fallback: try to get receipt directly from the native layer
          console.log("IAP: Attempting to get receipt from native layer...");
          const nativeReceipt = await new Promise<string>((resolve, reject) => {
            // @ts-ignore - accessing native receipt
            if (window.storekit?.appStoreReceipt) {
              resolve(window.storekit.appStoreReceipt);
            } else {
              reject(new Error("Receipt não disponível no dispositivo"));
            }
          }).catch(() => null);
          
          if (nativeReceipt) {
            receiptData = nativeReceipt;
            console.log("IAP: Got iOS receipt from native layer, length:", receiptData.length);
          } else {
            throw new Error("Não foi possível obter o receipt da App Store. Tente novamente.");
          }
        }
      } else {
        // For Google Play, use the purchase token
        receiptData = transaction.purchaseToken;
        console.log("IAP: Got Android purchaseToken");
        
        if (!receiptData) {
          throw new Error("Não foi possível obter o token de compra do Google Play");
        }
      }

      // Call our Edge Function to validate and update subscription
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.access_token) {
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

      // Finish the transaction
      transaction.finish();

      toast({
        title: "Assinatura ativada! 🎉",
        description: "Bem-vindo ao Cãolorias Premium!",
      });

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

  // Purchase a product
  const purchaseProduct = useCallback(
    async (productId: string): Promise<boolean> => {
      if (!isAvailable) {
        toast({
          title: "Compras indisponíveis",
          description: "As compras no app não estão disponíveis. Verifique se o Paid Apps Agreement foi aceito no App Store Connect.",
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
          console.error("IAP: Product not found:", productId);
          throw new Error("Produto não encontrado. Verifique a configuração no App Store Connect.");
        }

        const offer = product.getOffer();
        if (!offer) {
          console.error("IAP: No offer for product:", productId);
          throw new Error("Oferta não disponível. Tente novamente mais tarde.");
        }

        console.log("IAP: Starting purchase flow for offer:", offer);
        
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