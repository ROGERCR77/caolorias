import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { AuthProvider } from "@/contexts/AuthContext";
import { DataProvider } from "@/contexts/DataContext";
import { SubscriptionProvider } from "@/contexts/SubscriptionContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";

// Pages
import Index from "./pages/Index";
import Login from "./pages/Login";
import Cadastro from "./pages/Cadastro";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import Advertising from "./pages/Advertising";
import Dashboard from "./pages/app/Dashboard";
import Dogs from "./pages/app/Dogs";
import Foods from "./pages/app/Foods";
import Meals from "./pages/app/Meals";
import WeightProgress from "./pages/app/WeightProgress";
import MealPlan from "./pages/app/MealPlan";
import Breeds from "./pages/app/Breeds";
import Subscription from "./pages/app/Subscription";
import Profile from "./pages/app/Profile";
import Recipes from "./pages/app/Recipes";
import InsightsHistory from "./pages/app/InsightsHistory";
import DigestiveHealth from "./pages/app/DigestiveHealth";
import HealthWallet from "./pages/app/HealthWallet";
import Activity from "./pages/app/Activity";
import DietaryTransition from "./pages/app/DietaryTransition";
import VetReport from "./pages/app/VetReport";
import ImportantNotice from "./pages/app/ImportantNotice";
import HowToUse from "./pages/app/HowToUse";
import DataPrivacy from "./pages/app/DataPrivacy";
import References from "./pages/app/References";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

let didInit = false;

const App = () => {
  useEffect(() => {
    const init = () => {
      if (didInit) return;

      // @ts-ignore
      const os = (window as any)?.plugins?.OneSignal;

      console.log("OneSignal object:", os);

      if (!os) {
        console.log("OneSignal not ready yet");
        return;
      }

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

    document.addEventListener("deviceready", init, { once: true });
    const t = setInterval(init, 500);

    return () => {
      clearInterval(t);
      document.removeEventListener("deviceready", init);
    };
  }, []);

  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <SubscriptionProvider>
            <DataProvider>
              <TooltipProvider>
                <Toaster />
                <Sonner />
                <BrowserRouter>
                  <Routes>
                    {/* Public routes */}
                    <Route path="/" element={<Index />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/cadastro" element={<Cadastro />} />
                    <Route path="/termos" element={<Terms />} />
                    <Route path="/privacidade" element={<Privacy />} />
                    <Route path="/publicidade" element={<Advertising />} />

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

                    {/* Redirect /app to /app/hoje */}
                    <Route path="/app" element={<Navigate to="/app/hoje" replace />} />

                    {/* Catch-all */}
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </BrowserRouter>
              </TooltipProvider>
            </DataProvider>
          </SubscriptionProvider>
        </AuthProvider>
      </QueryClientProvider>
    </HelmetProvider>
  );
};

export default App;