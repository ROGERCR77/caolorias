import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { Loader2 } from "lucide-react";

interface ProtectedVetRouteProps {
  children: React.ReactNode;
}

export function ProtectedVetRoute({ children }: ProtectedVetRouteProps) {
  const { user, isLoading: authLoading } = useAuth();
  const { role, isLoading: roleLoading, isVet } = useUserRole();

  if (authLoading || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/?mode=vet" replace />;
  }

  if (!isVet) {
    // User is not a vet, redirect to tutor app
    return <Navigate to="/app/hoje" replace />;
  }

  return <>{children}</>;
}
