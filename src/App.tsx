import { useEffect, lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/contexts/AuthContext";
import { DataProvider } from "@/contexts/DataContext";
import { SubscriptionProvider } from "@/contexts/SubscriptionContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Loader2 } from "lucide-react";

import { ProtectedVetRoute } from "@/components/ProtectedVetRoute";
import { NativeNavigationProvider } from "@/components/app/NativeNavigationProvider";

// Lazy load pages for better performance
const Login = lazy(() => import("./pages/Login"));
const Cadastro = lazy(() => import("./pages/Cadastro"));
const CadastroVet = lazy(() => import("./pages/CadastroVet"));
const Terms = lazy(() => import("./pages/Terms"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Advertising = lazy(() => import("./pages/Advertising"));
const Dashboard = lazy(() => import("./pages/app/Dashboard"));
const Dogs = lazy(() => import("./pages/app/Dogs"));
const Foods = lazy(() => import("./pages/app/Foods"));
const Meals = lazy(() => import("./pages/app/Meals"));
const WeightProgress = lazy(() => import("./pages/app/WeightProgress"));
const MealPlan = lazy(() => import("./pages/app/MealPlan"));
const Breeds = lazy(() => import("./pages/app/Breeds"));
const Subscription = lazy(() => import("./pages/app/Subscription"));
const Profile = lazy(() => import("./pages/app/Profile"));
const Recipes = lazy(() => import("./pages/app/Recipes"));
const InsightsHistory = lazy(() => import("./pages/app/InsightsHistory"));
const DigestiveHealth = lazy(() => import("./pages/app/DigestiveHealth"));
const HealthWallet = lazy(() => import("./pages/app/HealthWallet"));
const Activity = lazy(() => import("./pages/app/Activity"));
const DietaryTransition = lazy(() => import("./pages/app/DietaryTransition"));
const VetReport = lazy(() => import("./pages/app/VetReport"));
const ImportantNotice = lazy(() => import("./pages/app/ImportantNotice"));
const HowToUse = lazy(() => import("./pages/app/HowToUse"));
const DataPrivacy = lazy(() => import("./pages/app/DataPrivacy"));
const References = lazy(() => import("./pages/app/References"));
const Achievements = lazy(() => import("./pages/app/Achievements"));
const ShoppingList = lazy(() => import("./pages/app/ShoppingList"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Vet pages
const VetDashboard = lazy(() => import("./pages/vet/VetDashboard"));
const VetDogProfile = lazy(() => import("./pages/vet/VetDogProfile"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes (previously cacheTime)
    },
  },
});

let didInit = false;

// Loading fallback component
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>
);

const App = () => {
  useEffect(() => {
    // Only run OneSignal init on native platforms
    const init = () => {
      if (didInit) return;

      // @ts-ignore
      const os = (window as any)?.plugins?.OneSignal;

      // Don't log on web to avoid spam
      if (!os) return;

      didInit = true;
      console.log("Initializing OneSignal (once)");

      try {
        // init novo (v5)
        os.initialize("a44cb991-eb69-4375-b524-90e7d5036a4c");

        // pedir permissão (iOS)
        os.Notifications.requestPermission(true).then((accepted: boolean) => {
          console.log("Push permission accepted:", accepted);
        });
      } catch (e) {
        console.log("OneSignal init error:", e);
      }
    };

    // Listen for deviceready (Cordova/Capacitor)
    document.addEventListener("deviceready", init, { once: true });
    
    // Fallback: try once after short delay (for native apps)
    const timeout = setTimeout(() => {
      if (!didInit) init();
    }, 1000);

    return () => {
      clearTimeout(timeout);
      document.removeEventListener("deviceready", init);
    };
  }, []);

  return (
    <HelmetProvider>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <SubscriptionProvider>
              <DataProvider>
                <TooltipProvider>
                  <Toaster />
                  <Sonner />
                  <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
                    <NativeNavigationProvider>
                      <Suspense fallback={<PageLoader />}>
                        <Routes>
                      {/* Public routes */}
                      <Route path="/" element={<Login />} />
                      <Route path="/cadastro" element={<Cadastro />} />
                      <Route path="/cadastro-vet" element={<CadastroVet />} />
                      <Route path="/termos" element={<Terms />} />
                      <Route path="/privacidade" element={<Privacy />} />
                      <Route path="/publicidade" element={<Advertising />} />

                      {/* Vet routes */}
                      <Route path="/vet/dashboard" element={<ProtectedVetRoute><VetDashboard /></ProtectedVetRoute>} />
                      <Route path="/vet/dog/:dogId" element={<ProtectedVetRoute><VetDogProfile /></ProtectedVetRoute>} />

                      {/* Protected app routes */}
                      <Route path="/app/hoje" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                      <Route path="/app/caes" element={<ProtectedRoute><Dogs /></ProtectedRoute>} />
                      <Route path="/app/alimentos" element={<ProtectedRoute><Foods /></ProtectedRoute>} />
                      <Route path="/app/refeicoes" element={<ProtectedRoute><Meals /></ProtectedRoute>} />
                      <Route path="/app/peso-progresso" element={<ProtectedRoute><WeightProgress /></ProtectedRoute>} />
                      <Route path="/app/plano-alimentar" element={<ProtectedRoute><MealPlan /></ProtectedRoute>} />
                      <Route path="/app/racas" element={<ProtectedRoute><Breeds /></ProtectedRoute>} />
                      <Route path="/app/assinatura" element={<ProtectedRoute><Subscription /></ProtectedRoute>} />
                      <Route path="/app/perfil" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                      <Route path="/app/receitas" element={<ProtectedRoute><Recipes /></ProtectedRoute>} />
                      <Route path="/app/historico-insights" element={<ProtectedRoute><InsightsHistory /></ProtectedRoute>} />
                      <Route path="/app/saude-digestiva" element={<ProtectedRoute><DigestiveHealth /></ProtectedRoute>} />
                      <Route path="/app/carteira-saude" element={<ProtectedRoute><HealthWallet /></ProtectedRoute>} />
                      <Route path="/app/atividade" element={<ProtectedRoute><Activity /></ProtectedRoute>} />
                      <Route path="/app/transicao" element={<ProtectedRoute><DietaryTransition /></ProtectedRoute>} />
                      <Route path="/app/relatorio-vet" element={<ProtectedRoute><VetReport /></ProtectedRoute>} />
                      <Route path="/app/aviso-importante" element={<ProtectedRoute><ImportantNotice /></ProtectedRoute>} />
                      <Route path="/app/como-usar" element={<ProtectedRoute><HowToUse /></ProtectedRoute>} />
                      <Route path="/app/privacidade-dados" element={<ProtectedRoute><DataPrivacy /></ProtectedRoute>} />
                      <Route path="/app/referencias" element={<ProtectedRoute><References /></ProtectedRoute>} />
                      <Route path="/app/conquistas" element={<ProtectedRoute><Achievements /></ProtectedRoute>} />
                      <Route path="/app/lista-compras" element={<ProtectedRoute><ShoppingList /></ProtectedRoute>} />

                      {/* Redirect /app to /app/hoje */}
                      <Route path="/app" element={<Navigate to="/app/hoje" replace />} />

                      {/* Catch-all */}
                          <Route path="*" element={<NotFound />} />
                        </Routes>
                      </Suspense>
                    </NativeNavigationProvider>
                  </BrowserRouter>
              </TooltipProvider>
            </DataProvider>
          </SubscriptionProvider>
        </AuthProvider>
      </QueryClientProvider>
      </ThemeProvider>
    </HelmetProvider>
  );
};

export default App;
