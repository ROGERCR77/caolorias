import { ReactNode, useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { OnboardingScreen } from "@/components/app/OnboardingScreen";

const ONBOARDING_STORAGE_KEY = "caolorias_onboarding_seen";

interface ProtectedRouteProps {
  children: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState<boolean | null>(null);
  const [checkingOnboarding, setCheckingOnboarding] = useState(true);

  // Check localStorage first for immediate response
  const getLocalOnboardingSeen = (userId: string): boolean => {
    try {
      const stored = localStorage.getItem(`${ONBOARDING_STORAGE_KEY}_${userId}`);
      return stored === "true";
    } catch {
      return false;
    }
  };

  // Save to localStorage immediately
  const setLocalOnboardingSeen = (userId: string) => {
    try {
      localStorage.setItem(`${ONBOARDING_STORAGE_KEY}_${userId}`, "true");
    } catch {
      // Ignore localStorage errors
    }
  };

  useEffect(() => {
    async function checkOnboardingStatus() {
      if (!user) {
        setCheckingOnboarding(false);
        return;
      }

      // First check localStorage for instant feedback
      if (getLocalOnboardingSeen(user.id)) {
        setHasSeenOnboarding(true);
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
          const seen = profile.has_seen_onboarding ?? false;
          setHasSeenOnboarding(seen);
          // Sync localStorage with DB
          if (seen) {
            setLocalOnboardingSeen(user.id);
          }
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

    // Immediately mark as seen in state and localStorage (for instant UX)
    setHasSeenOnboarding(true);
    setLocalOnboardingSeen(user.id);

    try {
      // Use upsert to avoid update/insert race conditions
      const { error } = await supabase
        .from("profiles")
        .upsert(
          {
            user_id: user.id,
            name: user.email?.split("@")[0] || "Usuário",
            has_seen_onboarding: true,
          },
          {
            onConflict: "user_id",
            ignoreDuplicates: false,
          }
        );

      if (error) {
        console.error("Error saving onboarding status:", error);
        // Even if backend fails, local storage ensures it won't show again
      }
    } catch (err) {
      console.error("Error completing onboarding:", err);
    }
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
