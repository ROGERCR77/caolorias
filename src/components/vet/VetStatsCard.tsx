import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dog, Stethoscope, Calendar, Loader2 } from "lucide-react";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";

interface VetStats {
  totalPatients: number;
  consultationsThisMonth: number;
  upcomingReturns: { dogName: string; date: string; type: string }[];
}

export const VetStatsCard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<VetStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      if (!user) return;

      try {
        // Get active links count (total patients)
        const { count: totalPatients } = await supabase
          .from("vet_dog_links")
          .select("*", { count: "exact", head: true })
          .eq("vet_user_id", user.id)
          .eq("status", "active");

        // Get all link IDs for this vet
        const { data: links } = await supabase
          .from("vet_dog_links")
          .select("id, dog:dogs(name)")
          .eq("vet_user_id", user.id)
          .eq("status", "active");

        const linkIds = links?.map((l) => l.id) || [];
        const linkDogMap = new Map(links?.map(l => [l.id, Array.isArray(l.dog) ? l.dog[0]?.name : l.dog?.name]) || []);

        // Get consultations this month
        const monthStart = format(startOfMonth(new Date()), "yyyy-MM-dd");
        const monthEnd = format(endOfMonth(new Date()), "yyyy-MM-dd");

        let consultationsThisMonth = 0;
        if (linkIds.length > 0) {
          const { count } = await supabase
            .from("vet_notes")
            .select("*", { count: "exact", head: true })
            .in("vet_dog_link_id", linkIds)
            .eq("note_type", "consulta")
            .gte("created_at", monthStart)
            .lte("created_at", monthEnd);
          consultationsThisMonth = count || 0;
        }

        // Get upcoming returns (scheduled_date in the future)
        let upcomingReturns: VetStats["upcomingReturns"] = [];
        if (linkIds.length > 0) {
          const today = format(new Date(), "yyyy-MM-dd");
          const { data: upcomingNotes } = await supabase
            .from("vet_notes")
            .select("vet_dog_link_id, scheduled_date, note_type")
            .in("vet_dog_link_id", linkIds)
            .not("scheduled_date", "is", null)
            .gte("scheduled_date", today)
            .order("scheduled_date", { ascending: true })
            .limit(5);

          upcomingReturns = (upcomingNotes || []).map((note) => ({
            dogName: linkDogMap.get(note.vet_dog_link_id) || "Paciente",
            date: note.scheduled_date!,
            type: note.note_type,
          }));
        }

        setStats({
          totalPatients: totalPatients || 0,
          consultationsThisMonth,
          upcomingReturns,
        });
      } catch (error) {
        console.error("Error fetching vet stats:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, [user]);

  if (isLoading) {
    return (
      <Card className="p-4">
        <div className="flex items-center justify-center py-4">
          <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
        </div>
      </Card>
    );
  }

  if (!stats) return null;

  const noteTypeLabels: Record<string, string> = {
    consulta: "Retorno",
    vacina: "Reforço",
    exame: "Exame",
    observacao: "Acompanhamento",
  };

  return (
    <div className="space-y-3">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10">
              <Dog className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-600">{stats.totalPatients}</p>
              <p className="text-xs text-muted-foreground">Pacientes ativos</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-teal-50 to-teal-100 dark:from-teal-950 dark:to-teal-900 border-teal-200/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-teal-500/10">
              <Stethoscope className="w-5 h-5 text-teal-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-teal-600">{stats.consultationsThisMonth}</p>
              <p className="text-xs text-muted-foreground">Consultas este mês</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Upcoming Returns */}
      {stats.upcomingReturns.length > 0 && (
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="w-4 h-4 text-amber-500" />
            <p className="font-medium text-sm">Próximos retornos</p>
          </div>
          <div className="space-y-2">
            {stats.upcomingReturns.map((ret, idx) => (
              <div key={idx} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{ret.dogName}</span>
                  <Badge variant="outline" className="text-xs">
                    {noteTypeLabels[ret.type] || ret.type}
                  </Badge>
                </div>
                <span className="text-muted-foreground">
                  {format(new Date(ret.date), "dd/MM", { locale: ptBR })}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};
