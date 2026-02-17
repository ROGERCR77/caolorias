import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useData } from "@/contexts/DataContext";
import { supabase } from "@/lib/supabaseClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from "recharts";
import { format, subDays, parseISO } from "date-fns";
import { TrendingUp, Lightbulb, Loader2 } from "lucide-react";

interface ActivityLog {
  duration_minutes: number;
  logged_at: string;
}

interface ActivityChartsProps {
  dogId: string | undefined;
}

export function ActivityCharts({ dogId }: ActivityChartsProps) {
  const { user } = useAuth();
  const { dogs, getActivityReference } = useData();
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const dog = dogs.find(d => d.id === dogId);

  const sizeToPorte: Record<string, string> = {
    small: "pequeno",
    medium: "medio",
    large: "grande",
    giant: "gigante",
  };

  const dogPorte = sizeToPorte[dog?.size || "medium"] || "medio";
  const activityRef = dog
    ? getActivityReference(dogPorte as any, dog.nivel_atividade || "moderada")
    : null;
  const dailyGoalAvg = activityRef
    ? (activityRef.minutos_min_dia + activityRef.minutos_max_dia) / 2
    : 45;

  useEffect(() => {
    if (!user || !dogId) {
      setIsLoading(false);
      return;
    }

    const fetchActivities = async () => {
      setIsLoading(true);
      const thirtyDaysAgo = subDays(new Date(), 30).toISOString();

      const { data } = await supabase
        .from("activity_logs")
        .select("duration_minutes, logged_at")
        .eq("dog_id", dogId)
        .gte("logged_at", thirtyDaysAgo)
        .order("logged_at", { ascending: true });

      setActivities(data || []);
      setIsLoading(false);
    };

    fetchActivities();
  }, [user, dogId]);

  const chartData = useMemo(() => {
    const days: { date: string; minutes: number }[] = [];

    for (let i = 29; i >= 0; i--) {
      const day = subDays(new Date(), i);
      const dayStr = format(day, "yyyy-MM-dd");

      const dayActivities = activities.filter(
        a => format(parseISO(a.logged_at), "yyyy-MM-dd") === dayStr
      );

      const totalMinutes = dayActivities.reduce(
        (sum, a) => sum + a.duration_minutes,
        0
      );

      days.push({
        date: format(day, "dd/MM"),
        minutes: totalMinutes,
      });
    }

    return days;
  }, [activities]);

  const avgMinutes = useMemo(() => {
    const daysWithActivity = chartData.filter(d => d.minutes > 0);
    if (daysWithActivity.length === 0) return 0;
    return Math.round(
      daysWithActivity.reduce((sum, d) => sum + d.minutes, 0) / daysWithActivity.length
    );
  }, [chartData]);

  const recommendation = useMemo(() => {
    if (!dog || !activityRef) return null;

    if (avgMinutes < activityRef.minutos_min_dia) {
      return `${dog.name} esta abaixo da meta de atividade. Tente incluir mais ${activityRef.minutos_min_dia - avgMinutes} min/dia de exercicio.`;
    }
    if (avgMinutes > activityRef.minutos_max_dia) {
      return `${dog.name} esta muito ativo! Otimo, mas fique atento a sinais de cansaco excessivo.`;
    }
    return `${dog.name} esta dentro da faixa ideal de atividade. Continue assim!`;
  }, [dog, activityRef, avgMinutes]);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-4 flex items-center justify-center min-h-[120px]">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Activity Line Chart */}
      <Card>
        <CardHeader className="pb-2 px-4 pt-4">
          <CardTitle className="text-sm flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            Atividade Diaria - 30 dias
          </CardTitle>
        </CardHeader>
        <CardContent className="px-2 pb-4">
          {chartData.some(d => d.minutes > 0) ? (
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip formatter={(value: number) => `${value} min`} />
                <ReferenceLine
                  y={dailyGoalAvg}
                  stroke="#22c55e"
                  strokeDasharray="5 5"
                  label={{ value: "Meta", position: "right", fontSize: 10 }}
                />
                <Line
                  type="monotone"
                  dataKey="minutes"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-sm text-muted-foreground py-8">
              Sem dados de atividade ainda
            </p>
          )}
        </CardContent>
      </Card>

      {/* Recommendation Card */}
      {recommendation && (
        <Card className="bg-muted/30">
          <CardContent className="p-4 flex items-start gap-3">
            <Lightbulb className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium mb-1">Recomendacao</p>
              <p className="text-xs text-muted-foreground">{recommendation}</p>
              {avgMinutes > 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  Media: {avgMinutes} min/dia | Meta: {activityRef?.minutos_min_dia}-{activityRef?.minutos_max_dia} min/dia
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
