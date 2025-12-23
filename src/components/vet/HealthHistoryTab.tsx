import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Scale, TrendingUp, TrendingDown, Minus, AlertTriangle, Droplets, Zap, Activity, Heart } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";

interface WeightLog {
  id: string;
  weight_kg: number;
  date: string;
}

interface PoopLog {
  id: string;
  texture: string;
  color: string;
  has_mucus: boolean;
  has_blood: boolean;
  notes: string | null;
  logged_at: string;
}

interface EnergyLog {
  id: string;
  energy_level: string;
  notes: string | null;
  logged_at: string;
}

interface ActivityLog {
  id: string;
  type: string;
  duration_minutes: number;
  intensity: string;
  notes: string | null;
  logged_at: string;
}

interface HealthSymptom {
  id: string;
  symptoms: string[];
  severity: string;
  notes: string | null;
  logged_at: string;
}

interface HealthHistoryTabProps {
  dogId: string;
}

const TEXTURE_LABELS: Record<string, string> = {
  dura: "Dura",
  firme: "Firme",
  mole: "Mole",
  pastosa: "Pastosa",
  liquida: "Líquida",
};

const COLOR_LABELS: Record<string, string> = {
  marrom: "Marrom",
  marrom_claro: "Marrom claro",
  marrom_escuro: "Marrom escuro",
  amarelado: "Amarelado",
  esverdeado: "Esverdeado",
  avermelhado: "Avermelhado",
  preto: "Preto",
};

const ENERGY_CONFIG: Record<string, { label: string; emoji: string; color: string }> = {
  muito_baixa: { label: "Muito baixa", emoji: "😴", color: "text-red-500" },
  baixa: { label: "Baixa", emoji: "😐", color: "text-orange-500" },
  normal: { label: "Normal", emoji: "😊", color: "text-green-500" },
  alta: { label: "Alta", emoji: "😄", color: "text-blue-500" },
  muito_alta: { label: "Muito alta", emoji: "🤩", color: "text-purple-500" },
};

const INTENSITY_LABELS: Record<string, string> = {
  leve: "Leve",
  moderada: "Moderada",
  intensa: "Intensa",
};

const SEVERITY_CONFIG: Record<string, { label: string; color: string }> = {
  leve: { label: "Leve", color: "bg-yellow-100 text-yellow-700" },
  moderado: { label: "Moderado", color: "bg-orange-100 text-orange-700" },
  grave: { label: "Grave", color: "bg-red-100 text-red-700" },
};

export const HealthHistoryTab = ({ dogId }: HealthHistoryTabProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [weightLogs, setWeightLogs] = useState<WeightLog[]>([]);
  const [poopLogs, setPoopLogs] = useState<PoopLog[]>([]);
  const [energyLogs, setEnergyLogs] = useState<EnergyLog[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [healthSymptoms, setHealthSymptoms] = useState<HealthSymptom[]>([]);

  useEffect(() => {
    const fetchHealthData = async () => {
      setIsLoading(true);
      try {
        const [weightRes, poopRes, energyRes, activityRes, symptomsRes] = await Promise.all([
          supabase
            .from("weight_logs")
            .select("id, weight_kg, date")
            .eq("dog_id", dogId)
            .order("date", { ascending: false })
            .limit(30),
          supabase
            .from("poop_logs")
            .select("id, texture, color, has_mucus, has_blood, notes, logged_at")
            .eq("dog_id", dogId)
            .order("logged_at", { ascending: false })
            .limit(14),
          supabase
            .from("energy_logs")
            .select("id, energy_level, notes, logged_at")
            .eq("dog_id", dogId)
            .order("logged_at", { ascending: false })
            .limit(14),
          supabase
            .from("activity_logs")
            .select("id, type, duration_minutes, intensity, notes, logged_at")
            .eq("dog_id", dogId)
            .order("logged_at", { ascending: false })
            .limit(14),
          supabase
            .from("health_symptoms")
            .select("id, symptoms, severity, notes, logged_at")
            .eq("dog_id", dogId)
            .order("logged_at", { ascending: false })
            .limit(30),
        ]);

        setWeightLogs((weightRes.data as WeightLog[]) || []);
        setPoopLogs((poopRes.data as PoopLog[]) || []);
        setEnergyLogs((energyRes.data as EnergyLog[]) || []);
        setActivityLogs((activityRes.data as ActivityLog[]) || []);
        setHealthSymptoms((symptomsRes.data as HealthSymptom[]) || []);
      } catch (error) {
        console.error("Error fetching health data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (dogId) {
      fetchHealthData();
    }
  }, [dogId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
      </div>
    );
  }

  const chartData = [...weightLogs]
    .reverse()
    .map((log) => ({
      date: format(new Date(log.date), "dd/MM"),
      peso: log.weight_kg,
    }));

  const getWeightTrend = () => {
    if (weightLogs.length < 2) return null;
    const diff = weightLogs[0].weight_kg - weightLogs[1].weight_kg;
    if (diff > 0.1) return { icon: TrendingUp, label: `+${diff.toFixed(1)} kg`, color: "text-green-500" };
    if (diff < -0.1) return { icon: TrendingDown, label: `${diff.toFixed(1)} kg`, color: "text-red-500" };
    return { icon: Minus, label: "Estável", color: "text-muted-foreground" };
  };

  const trend = getWeightTrend();

  const hasAnyData = weightLogs.length > 0 || poopLogs.length > 0 || energyLogs.length > 0 || activityLogs.length > 0 || healthSymptoms.length > 0;

  if (!hasAnyData) {
    return (
      <Card className="p-8 text-center">
        <Activity className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
        <p className="text-muted-foreground">Nenhum dado de saúde registrado ainda.</p>
        <p className="text-xs text-muted-foreground mt-1">
          Os dados aparecem quando o tutor registrar no app.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Weight Section */}
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <Scale className="w-5 h-5 text-blue-500" />
          <h3 className="font-semibold">Peso</h3>
          {trend && (
            <Badge variant="secondary" className={`ml-auto ${trend.color}`}>
              <trend.icon className="w-3 h-3 mr-1" />
              {trend.label}
            </Badge>
          )}
        </div>

        {weightLogs.length > 0 ? (
          <>
            {chartData.length > 1 && (
              <div className="h-32 mb-4">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                    <YAxis domain={["auto", "auto"]} tick={{ fontSize: 10 }} width={35} />
                    <Tooltip 
                      formatter={(value: number) => [`${value} kg`, "Peso"]}
                      labelStyle={{ fontSize: 12 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="peso"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      dot={{ fill: "hsl(var(--primary))", strokeWidth: 0, r: 3 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {weightLogs.slice(0, 5).map((log, idx) => (
                <div key={log.id} className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">
                    {format(new Date(log.date), "dd/MM/yyyy", { locale: ptBR })}
                  </span>
                  <span className="font-medium">{log.weight_kg} kg</span>
                </div>
              ))}
            </div>
          </>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">
            Nenhum registro de peso
          </p>
        )}
      </Card>

      {/* Poop Section */}
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <Droplets className="w-5 h-5 text-amber-500" />
          <h3 className="font-semibold">Fezes</h3>
          <Badge variant="secondary" className="ml-auto">
            {poopLogs.length} registros
          </Badge>
        </div>

        {poopLogs.length > 0 ? (
          <div className="space-y-3 max-h-60 overflow-y-auto">
            {poopLogs.map((log) => {
              const hasAlert = log.has_blood || log.has_mucus || log.texture === "liquida";
              return (
                <div 
                  key={log.id} 
                  className={`p-3 rounded-lg ${hasAlert ? "bg-red-50 border border-red-200" : "bg-muted"}`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(log.logged_at), "dd/MM 'às' HH:mm", { locale: ptBR })}
                    </span>
                    {hasAlert && <AlertTriangle className="w-4 h-4 text-red-500" />}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline">{TEXTURE_LABELS[log.texture] || log.texture}</Badge>
                    <Badge variant="outline">{COLOR_LABELS[log.color] || log.color}</Badge>
                    {log.has_mucus && <Badge variant="destructive">Muco</Badge>}
                    {log.has_blood && <Badge variant="destructive">Sangue</Badge>}
                  </div>
                  {log.notes && (
                    <p className="text-xs text-muted-foreground mt-2">{log.notes}</p>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">
            Nenhum registro de fezes
          </p>
        )}
      </Card>

      {/* Energy Section */}
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <Zap className="w-5 h-5 text-yellow-500" />
          <h3 className="font-semibold">Energia</h3>
          <Badge variant="secondary" className="ml-auto">
            {energyLogs.length} registros
          </Badge>
        </div>

        {energyLogs.length > 0 ? (
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {energyLogs.map((log) => {
              const config = ENERGY_CONFIG[log.energy_level] || { label: log.energy_level, emoji: "😊", color: "text-muted-foreground" };
              return (
                <div key={log.id} className="flex items-center gap-3 p-2 rounded-lg bg-muted">
                  <span className="text-xl">{config.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className={`font-medium text-sm ${config.color}`}>{config.label}</p>
                    {log.notes && (
                      <p className="text-xs text-muted-foreground truncate">{log.notes}</p>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(log.logged_at), "dd/MM", { locale: ptBR })}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">
            Nenhum registro de energia
          </p>
        )}
      </Card>

      {/* Activity Section */}
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="w-5 h-5 text-green-500" />
          <h3 className="font-semibold">Atividades</h3>
          <Badge variant="secondary" className="ml-auto">
            {activityLogs.length} registros
          </Badge>
        </div>

        {activityLogs.length > 0 ? (
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {activityLogs.map((log) => (
              <div key={log.id} className="flex items-center justify-between p-2 rounded-lg bg-muted">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm capitalize">{log.type}</p>
                  <p className="text-xs text-muted-foreground">
                    {log.duration_minutes} min • {INTENSITY_LABELS[log.intensity] || log.intensity}
                  </p>
                </div>
                <span className="text-xs text-muted-foreground">
                  {format(new Date(log.logged_at), "dd/MM", { locale: ptBR })}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">
            Nenhum registro de atividade
          </p>
        )}
      </Card>

      {/* Symptoms Section */}
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <Heart className="w-5 h-5 text-red-500" />
          <h3 className="font-semibold">Sintomas</h3>
          {healthSymptoms.length > 0 && (
            <Badge variant="destructive" className="ml-auto">
              {healthSymptoms.length} ocorrências
            </Badge>
          )}
        </div>

        {healthSymptoms.length > 0 ? (
          <div className="space-y-3 max-h-60 overflow-y-auto">
            {healthSymptoms.map((log) => {
              const severityConfig = SEVERITY_CONFIG[log.severity] || { label: log.severity, color: "bg-muted" };
              return (
                <div key={log.id} className="p-3 rounded-lg bg-muted">
                  <div className="flex items-center justify-between mb-2">
                    <Badge className={severityConfig.color}>{severityConfig.label}</Badge>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(log.logged_at), "dd/MM/yyyy", { locale: ptBR })}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {log.symptoms.map((symptom, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {symptom}
                      </Badge>
                    ))}
                  </div>
                  {log.notes && (
                    <p className="text-xs text-muted-foreground mt-2">{log.notes}</p>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">
            Nenhum sintoma registrado ✅
          </p>
        )}
      </Card>
    </div>
  );
};
