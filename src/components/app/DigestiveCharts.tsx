import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { format, subDays, startOfWeek, endOfWeek, isWithinInterval, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { TrendingUp, BarChart3, AlertTriangle } from "lucide-react";

interface PoopLog {
  id: string;
  texture: string;
  logged_at: string;
}

interface EnergyLog {
  id: string;
  energy_level: string;
  logged_at: string;
}

interface HealthSymptom {
  id: string;
  symptoms: string[];
  logged_at: string;
}

interface DigestiveChartsProps {
  poopLogs: PoopLog[];
  energyLogs: EnergyLog[];
  symptoms: HealthSymptom[];
}

const ENERGY_VALUES: Record<string, number> = {
  muito_agitado: 3,
  normal: 2,
  muito_quieto: 1,
};

const SYMPTOM_LABELS: Record<string, string> = {
  vomito: "Vomito",
  apatia: "Apatia",
  coceira: "Coceira",
  diarreia: "Diarreia",
  perda_apetite: "Perda de apetite",
  tosse: "Tosse",
  espirro: "Espirro",
};

export function DigestiveCharts({ poopLogs, energyLogs, symptoms }: DigestiveChartsProps) {
  // Texture frequency by week (last 4 weeks)
  const textureData = useMemo(() => {
    const weeks: { week: string; duro: number; firme: number; normal: number; mole: number; diarreia: number }[] = [];

    for (let i = 3; i >= 0; i--) {
      const weekStart = startOfWeek(subDays(new Date(), i * 7), { weekStartsOn: 0 });
      const weekEnd = endOfWeek(subDays(new Date(), i * 7), { weekStartsOn: 0 });

      const weekLogs = poopLogs.filter(p => {
        const date = parseISO(p.logged_at);
        return isWithinInterval(date, { start: weekStart, end: weekEnd });
      });

      weeks.push({
        week: format(weekStart, "dd/MM", { locale: ptBR }),
        duro: weekLogs.filter(p => p.texture === "duro").length,
        firme: weekLogs.filter(p => p.texture === "firme").length,
        normal: weekLogs.filter(p => p.texture === "normal").length,
        mole: weekLogs.filter(p => p.texture === "mole").length,
        diarreia: weekLogs.filter(p => p.texture === "diarreia").length,
      });
    }

    return weeks;
  }, [poopLogs]);

  // Energy trend (last 30 days, grouped by day)
  const energyData = useMemo(() => {
    const days: { date: string; energy: number }[] = [];

    for (let i = 29; i >= 0; i--) {
      const day = subDays(new Date(), i);
      const dayStr = format(day, "yyyy-MM-dd");

      const dayLogs = energyLogs.filter(e =>
        format(parseISO(e.logged_at), "yyyy-MM-dd") === dayStr
      );

      if (dayLogs.length > 0) {
        const avgEnergy = dayLogs.reduce((sum, e) => sum + (ENERGY_VALUES[e.energy_level] || 2), 0) / dayLogs.length;
        days.push({
          date: format(day, "dd/MM"),
          energy: Math.round(avgEnergy * 10) / 10,
        });
      }
    }

    return days;
  }, [energyLogs]);

  // Top 3 symptoms
  const topSymptoms = useMemo(() => {
    const counts: Record<string, number> = {};
    symptoms.forEach(s => {
      s.symptoms.forEach(symptom => {
        counts[symptom] = (counts[symptom] || 0) + 1;
      });
    });

    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([symptom, count]) => ({
        symptom,
        label: SYMPTOM_LABELS[symptom] || symptom,
        count,
      }));
  }, [symptoms]);

  return (
    <div className="space-y-4">
      {/* Texture Bar Chart */}
      <Card>
        <CardHeader className="pb-2 px-4 pt-4">
          <CardTitle className="text-sm flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-primary" />
            Texturas - Ultimas 4 semanas
          </CardTitle>
        </CardHeader>
        <CardContent className="px-2 pb-4">
          {textureData.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={textureData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="week" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="firme" stackId="a" fill="#22c55e" name="Firme" />
                <Bar dataKey="normal" stackId="a" fill="#3b82f6" name="Normal" />
                <Bar dataKey="mole" stackId="a" fill="#eab308" name="Mole" />
                <Bar dataKey="diarreia" stackId="a" fill="#ef4444" name="Diarreia" />
                <Bar dataKey="duro" stackId="a" fill="#92400e" name="Duro" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-sm text-muted-foreground py-8">Sem dados suficientes</p>
          )}
        </CardContent>
      </Card>

      {/* Energy Trend */}
      <Card>
        <CardHeader className="pb-2 px-4 pt-4">
          <CardTitle className="text-sm flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            Tendencia de Energia - 30 dias
          </CardTitle>
        </CardHeader>
        <CardContent className="px-2 pb-4">
          {energyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={160}>
              <LineChart data={energyData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
                <YAxis domain={[0, 3]} ticks={[1, 2, 3]} tick={{ fontSize: 10 }} />
                <Tooltip
                  formatter={(value: number) =>
                    value >= 2.5 ? "Agitado" : value >= 1.5 ? "Normal" : "Quieto"
                  }
                />
                <Line type="monotone" dataKey="energy" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-sm text-muted-foreground py-8">Sem dados suficientes</p>
          )}
        </CardContent>
      </Card>

      {/* Top Symptoms */}
      {topSymptoms.length > 0 && (
        <Card>
          <CardHeader className="pb-2 px-4 pt-4">
            <CardTitle className="text-sm flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-warning" />
              Sintomas mais frequentes
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="space-y-2">
              {topSymptoms.map(({ symptom, label, count }) => (
                <div key={symptom} className="flex items-center justify-between">
                  <span className="text-sm">{label}</span>
                  <Badge variant="secondary">{count}x</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
