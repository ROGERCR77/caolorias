import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type AppRole = "tutor" | "vet" | null;

export function useUserRole() {
  const { user } = useAuth();
  const [role, setRole] = useState<AppRole>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRole = async () => {
      if (!user) {
        setRole(null);
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .maybeSingle();

        if (error) {
          console.error("Error fetching role:", error);
          setRole(null);
        } else if (data) {
          setRole(data.role as AppRole);
        } else {
          // No role found, default to tutor (for existing users)
          setRole("tutor");
        }
      } catch (err) {
        console.error("Error in useUserRole:", err);
        setRole(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRole();
  }, [user]);

  return { role, isLoading, isVet: role === "vet", isTutor: role === "tutor" || role === null };
}
