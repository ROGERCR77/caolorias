import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { AuthProvider } from "@/contexts/AuthContext";
import { DataProvider } from "@/contexts/DataContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";

// Pages
import Index from "./pages/Index";
import Login from "./pages/Login";
import Cadastro from "./pages/Cadastro";
import Dashboard from "./pages/app/Dashboard";
import Dogs from "./pages/app/Dogs";
import Foods from "./pages/app/Foods";
import Meals from "./pages/app/Meals";
import WeightProgress from "./pages/app/WeightProgress";
import MealPlan from "./pages/app/MealPlan";
import Breeds from "./pages/app/Breeds";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
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

                {/* Protected app routes */}
                <Route
                  path="/app/hoje"
                  element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/app/caes"
                  element={
                    <ProtectedRoute>
                      <Dogs />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/app/alimentos"
                  element={
                    <ProtectedRoute>
                      <Foods />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/app/refeicoes"
                  element={
                    <ProtectedRoute>
                      <Meals />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/app/peso-progresso"
                  element={
                    <ProtectedRoute>
                      <WeightProgress />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/app/plano-alimentar"
                  element={
                    <ProtectedRoute>
                      <MealPlan />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/app/racas"
                  element={
                    <ProtectedRoute>
                      <Breeds />
                    </ProtectedRoute>
                  }
                />

                {/* Redirect /app to /app/hoje */}
                <Route path="/app" element={<Navigate to="/app/hoje" replace />} />

                {/* Catch-all */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </DataProvider>
      </AuthProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;