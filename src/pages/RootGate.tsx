import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Login from "./Login";

/**
 * RootGate: Decide o que mostrar na rota "/"
 * - Se carregando: loader
 * - Se tem sessão: redireciona para /app/hoje
 * - Se não tem sessão: mostra Login
 */
export default function RootGate() {
  const { session, isLoading } = useAuth();

  console.log("[RootGate] Checking:", { isLoading, hasSession: !!session });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground text-sm">Carregando...</p>
        </div>
      </div>
    );
  }

  // Se tem sessão, redireciona para o app
  if (session) {
    console.log("[RootGate] Session found, redirecting to /app/hoje");
    return <Navigate to="/app/hoje" replace />;
  }

  // Sem sessão, mostra Login
  console.log("[RootGate] No session, showing Login");
  return <Login />;
}
