import { ReactNode, useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { OnboardingScreen } from "@/components/app/OnboardingScreen";

interface ProtectedRouteProps {
  children: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState<boolean | null>(null);
  const [checkingOnboarding, setCheckingOnboarding] = useState(true);

  useEffect(() => {
    async function checkOnboardingStatus() {
      if (!user) {
        setCheckingOnboarding(false);
        return;
      }

      try {
        const { data: profile, error } = await supabase
          .from("profiles")
          .select("has_seen_onboarding")
          .eq("user_id", user.id)
          .maybeSingle();

        if (error) {
          console.error("Error checking onboarding status:", error);
          // If there's an error, assume they've seen it to not block the app
          setHasSeenOnboarding(true);
        } else if (profile) {
          setHasSeenOnboarding(profile.has_seen_onboarding ?? false);
        } else {
          // No profile yet, show onboarding
          setHasSeenOnboarding(false);
        }
      } catch (err) {
        console.error("Error in onboarding check:", err);
        setHasSeenOnboarding(true);
      } finally {
        setCheckingOnboarding(false);
      }
    }

    if (!isLoading && user) {
      checkOnboardingStatus();
    } else if (!isLoading && !user) {
      setCheckingOnboarding(false);
    }
  }, [user, isLoading]);

  const handleOnboardingComplete = async () => {
    if (!user) return;

    try {
      // Try to update existing profile
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ has_seen_onboarding: true })
        .eq("user_id", user.id);

      if (updateError) {
        // If update fails (no row exists), try to insert
        const { error: insertError } = await supabase
          .from("profiles")
          .insert({
            user_id: user.id,
            name: user.email?.split("@")[0] || "Usuário",
            has_seen_onboarding: true
          });

        if (insertError) {
          console.error("Error saving onboarding status:", insertError);
        }
      }
    } catch (err) {
      console.error("Error completing onboarding:", err);
    }

    setHasSeenOnboarding(true);
  };

  if (isLoading || checkingOnboarding) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  // Show onboarding if user hasn't seen it yet
  if (hasSeenOnboarding === false) {
    return <OnboardingScreen onComplete={handleOnboardingComplete} />;
  }

  return <>{children}</>;
}
