import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/contexts/AuthContext";

export type AppRole = "tutor" | "vet" | null;

const ROLE_CACHE_KEY = "caolorias_user_role";

// Get cached role from localStorage
const getCachedRole = (userId: string): AppRole => {
  try {
    const cached = localStorage.getItem(`${ROLE_CACHE_KEY}_${userId}`);
    if (cached === "vet" || cached === "tutor") {
      return cached;
    }
    return null;
  } catch {
    return null;
  }
};

// Save role to localStorage
const setCachedRole = (userId: string, role: AppRole) => {
  try {
    if (role) {
      localStorage.setItem(`${ROLE_CACHE_KEY}_${userId}`, role);
    } else {
      localStorage.removeItem(`${ROLE_CACHE_KEY}_${userId}`);
    }
  } catch {
    // Ignore localStorage errors
  }
};

export function useUserRole() {
  const { user } = useAuth();
  // Initialize with cached role for instant response
  const [role, setRole] = useState<AppRole>(() => 
    user ? getCachedRole(user.id) : null
  );
  const [isLoading, setIsLoading] = useState(true);

  // Clear all role caches on sign out
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        // Clear all role caches
        try {
          const keys = Object.keys(localStorage).filter(k => k.startsWith(ROLE_CACHE_KEY));
          keys.forEach(k => localStorage.removeItem(k));
        } catch {
          // Ignore localStorage errors
        }
        setRole(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const fetchRole = async () => {
      if (!user) {
        setRole(null);
        setIsLoading(false);
        return;
      }

      // Use cached role immediately if available
      const cachedRole = getCachedRole(user.id);
      if (cachedRole) {
        setRole(cachedRole);
      }

      try {
        const { data, error } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .maybeSingle();

        if (error) {
          console.error("Error fetching role:", error);
          // Keep cached role if fetch fails
          if (!cachedRole) {
            setRole("tutor");
            setCachedRole(user.id, "tutor");
          }
        } else if (data) {
          const fetchedRole = data.role as AppRole;
          setRole(fetchedRole);
          setCachedRole(user.id, fetchedRole);
        } else {
          // No role found, default to tutor (for existing users)
          setRole("tutor");
          setCachedRole(user.id, "tutor");
        }
      } catch (err) {
        console.error("Error in useUserRole:", err);
        // Keep cached role on error
        if (!cachedRole) {
          setRole("tutor");
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchRole();
  }, [user]);

  return { role, isLoading, isVet: role === "vet", isTutor: role === "tutor" || role === null };
}
