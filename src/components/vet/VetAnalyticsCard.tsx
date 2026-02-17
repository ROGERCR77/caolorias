import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart3, Users, TrendingUp, Syringe, Loader2 } from "lucide-react";
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns";

interface AnalyticsData {
  totalActivePatients: number;
  consultationsThisMonth: number;
  consultationsLastMonth: number;
  vaccineUpToDatePercent: number;
}

export function VetAnalyticsCard() {
  const { user } = useAuth();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!user) return;

      try {
        // Get active links with dog IDs
        const { data: links } = await supabase
          .from("vet_dog_links")
          .select("id, dog_id")
          .eq("vet_user_id", user.id)
          .eq("status", "active");

        const linkIds = links?.map((l) => l.id) || [];
        const dogIds = [...new Set(links?.map((l) => l.dog_id) || [])];
        const totalActivePatients = dogIds.length;

        // Date ranges
        const now = new Date();
        const thisMonthStart = format(startOfMonth(now), "yyyy-MM-dd");
        const thisMonthEnd = format(endOfMonth(now), "yyyy-MM-dd");
        const lastMonth = subMonths(now, 1);
        const lastMonthStart = format(startOfMonth(lastMonth), "yyyy-MM-dd");
        const lastMonthEnd = format(endOfMonth(lastMonth), "yyyy-MM-dd");

        let consultationsThisMonth = 0;
        let consultationsLastMonth = 0;

        if (linkIds.length > 0) {
          // Consultations this month
          const { count: thisMonthCount } = await supabase
            .from("vet_notes")
            .select("*", { count: "exact", head: true })
            .in("vet_dog_link_id", linkIds)
            .eq("note_type", "consulta")
            .gte("created_at", thisMonthStart)
            .lte("created_at", thisMonthEnd);

          consultationsThisMonth = thisMonthCount || 0;

          // Consultations last month
          const { count: lastMonthCount } = await supabase
            .from("vet_notes")
            .select("*", { count: "exact", head: true })
            .in("vet_dog_link_id", linkIds)
            .eq("note_type", "consulta")
            .gte("created_at", lastMonthStart)
            .lte("created_at", lastMonthEnd);

          consultationsLastMonth = lastMonthCount || 0;
        }

        // Vaccine up-to-date percentage
        let vaccineUpToDatePercent = 0;

        if (dogIds.length > 0) {
          const today = format(now, "yyyy-MM-dd");

          // Get dogs that have at least one vaccine record with next_due_at in the future
          const { data: vaccineRecords } = await supabase
            .from("health_records")
            .select("dog_id")
            .in("dog_id", dogIds)
            .eq("type", "vacina")
            .gte("next_due_at", today);

          const dogsWithUpToDateVaccines = new Set(
            (vaccineRecords || []).map((r) => r.dog_id)
          );

          vaccineUpToDatePercent = dogIds.length > 0
            ? Math.round((dogsWithUpToDateVaccines.size / dogIds.length) * 100)
            : 0;
        }

        setData({
          totalActivePatients,
          consultationsThisMonth,
          consultationsLastMonth,
          vaccineUpToDatePercent,
        });
      } catch (error) {
        console.error("Error fetching vet analytics:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalytics();
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

  if (!data) return null;

  const trendDiff = data.consultationsThisMonth - data.consultationsLastMonth;
  const trendLabel = trendDiff > 0
    ? `+${trendDiff}`
    : trendDiff < 0
      ? `${trendDiff}`
      : "=";
  const trendColor = trendDiff > 0
    ? "text-green-600"
    : trendDiff < 0
      ? "text-red-600"
      : "text-muted-foreground";

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <BarChart3 className="w-5 h-5 text-blue-500" />
        <h3 className="font-semibold text-sm">Analytics</h3>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {/* Total active patients */}
        <Card className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-600">{data.totalActivePatients}</p>
              <p className="text-xs text-muted-foreground">Pacientes ativos</p>
            </div>
          </div>
        </Card>

        {/* Consultations this month */}
        <Card className="p-4 bg-gradient-to-br from-teal-50 to-teal-100 dark:from-teal-950 dark:to-teal-900 border-teal-200/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-teal-500/10">
              <TrendingUp className="w-5 h-5 text-teal-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-teal-600">{data.consultationsThisMonth}</p>
              <p className="text-xs text-muted-foreground">Consultas este mês</p>
            </div>
          </div>
        </Card>

        {/* Consultations last month */}
        <Card className="p-4 bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950 dark:to-amber-900 border-amber-200/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/10">
              <BarChart3 className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-2xl font-bold text-amber-600">{data.consultationsLastMonth}</p>
                <Badge variant="secondary" className={`text-xs ${trendColor}`}>
                  {trendLabel}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">Consultas mês anterior</p>
            </div>
          </div>
        </Card>

        {/* Vaccine up-to-date */}
        <Card className="p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-500/10">
              <Syringe className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">{data.vaccineUpToDatePercent}%</p>
              <p className="text-xs text-muted-foreground">Com vacinas em dia</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
