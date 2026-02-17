import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabaseClient";
import { ChevronRight, Stethoscope } from "lucide-react";

interface VetProntuarioCardProps {
  dogId: string;
}

export function VetProntuarioCard({ dogId }: VetProntuarioCardProps) {
  const { user } = useAuth();
  const [recentCount, setRecentCount] = useState(0);
  const [hasActiveLinks, setHasActiveLinks] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!user || !dogId) {
        setIsLoading(false);
        return;
      }

      try {
        // Get active vet links for this dog
        const { data: links } = await supabase
          .from("vet_dog_links")
          .select("id")
          .eq("dog_id", dogId)
          .eq("tutor_user_id", user.id)
          .eq("status", "active");

        if (!links || links.length === 0) {
          setHasActiveLinks(false);
          setIsLoading(false);
          return;
        }

        setHasActiveLinks(true);
        const linkIds = links.map((l) => l.id);

        // Count vet notes in last 7 days
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const { count } = await supabase
          .from("vet_notes")
          .select("id", { count: "exact", head: true })
          .in("vet_dog_link_id", linkIds)
          .gte("created_at", sevenDaysAgo.toISOString());

        setRecentCount(count || 0);
      } catch (error) {
        console.error("Error fetching vet prontuario data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user, dogId]);

  if (isLoading || !hasActiveLinks) {
    return null;
  }

  return (
    <Card variant="interactive" className="press-effect">
      <Link to="/app/prontuario">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-500/10">
              <Stethoscope className="w-5 h-5 text-blue-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">Prontuario</p>
              {recentCount > 0 ? (
                <p className="text-xs text-muted-foreground">
                  {recentCount} {recentCount === 1 ? "registro" : "registros"} nos ultimos 7 dias
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Ver historico veterinario
                </p>
              )}
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          </div>
        </CardContent>
      </Link>
    </Card>
  );
}
