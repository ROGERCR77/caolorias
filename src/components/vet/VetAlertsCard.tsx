import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, CheckCircle, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface HealthAlert {
  id: string;
  dog_id: string;
  vet_user_id: string;
  alert_type: "weight_drop" | "blood_stool" | "low_energy" | "severe_symptoms";
  alert_data: Record<string, unknown>;
  acknowledged_at: string | null;
  created_at: string;
  dog_name: string;
}

const ALERT_CONFIG: Record<
  string,
  { label: string; color: string; bgColor: string; borderColor: string; badgeVariant: "destructive" | "default" | "secondary" | "outline" }
> = {
  weight_drop: {
    label: "Perda de peso rapida",
    color: "text-orange-700 dark:text-orange-400",
    bgColor: "bg-orange-50 dark:bg-orange-950/40",
    borderColor: "border-orange-200 dark:border-orange-800",
    badgeVariant: "default",
  },
  blood_stool: {
    label: "Sangue nas fezes",
    color: "text-red-700 dark:text-red-400",
    bgColor: "bg-red-50 dark:bg-red-950/40",
    borderColor: "border-red-200 dark:border-red-800",
    badgeVariant: "destructive",
  },
  low_energy: {
    label: "Baixa energia persistente",
    color: "text-yellow-700 dark:text-yellow-400",
    bgColor: "bg-yellow-50 dark:bg-yellow-950/40",
    borderColor: "border-yellow-200 dark:border-yellow-800",
    badgeVariant: "secondary",
  },
  severe_symptoms: {
    label: "Sintomas graves",
    color: "text-red-700 dark:text-red-400",
    bgColor: "bg-red-50 dark:bg-red-950/40",
    borderColor: "border-red-200 dark:border-red-800",
    badgeVariant: "destructive",
  },
};

function getAlertDescription(alert: HealthAlert): string {
  const data = alert.alert_data;

  switch (alert.alert_type) {
    case "weight_drop":
      return `Perda de ${data.drop_percent}% (${data.first_weight}kg -> ${data.last_weight}kg) em 7 dias.`;
    case "blood_stool":
      return `Sangue detectado em ${data.occurrences} registros nos ultimos 7 dias.`;
    case "low_energy":
      return `Energia "muito quieto" nos ultimos 3 registros consecutivos.`;
    case "severe_symptoms": {
      const symptoms = Array.isArray(data.symptoms) ? data.symptoms.join(", ") : "";
      return symptoms
        ? `Sintomas graves nos ultimos 3 dias: ${symptoms}.`
        : `Sintomas graves registrados nos ultimos 3 dias.`;
    }
    default:
      return "Alerta de saude detectado.";
  }
}

function getAlertIconColor(alertType: string): string {
  switch (alertType) {
    case "blood_stool":
    case "severe_symptoms":
      return "text-red-500";
    case "weight_drop":
      return "text-orange-500";
    case "low_energy":
      return "text-yellow-500";
    default:
      return "text-red-500";
  }
}

export function VetAlertsCard() {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState<HealthAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [acknowledgingId, setAcknowledgingId] = useState<string | null>(null);

  const fetchAlerts = useCallback(async () => {
    if (!user) return;

    try {
      // Fetch unacknowledged alerts for this vet
      const { data: alertsData, error: alertsError } = await supabase
        .from("vet_health_alerts")
        .select("id, dog_id, vet_user_id, alert_type, alert_data, acknowledged_at, created_at")
        .eq("vet_user_id", user.id)
        .is("acknowledged_at", null)
        .order("created_at", { ascending: false });

      if (alertsError) {
        console.error("Error fetching vet alerts:", alertsError);
        return;
      }

      if (!alertsData || alertsData.length === 0) {
        setAlerts([]);
        return;
      }

      // Get unique dog IDs to fetch names
      const dogIds = [...new Set(alertsData.map((a) => a.dog_id))];

      const { data: dogsData } = await supabase
        .from("dogs")
        .select("id, name")
        .in("id", dogIds);

      const dogNameMap = new Map(
        (dogsData || []).map((d) => [d.id, d.name])
      );

      const enrichedAlerts: HealthAlert[] = alertsData.map((a) => ({
        ...a,
        dog_name: dogNameMap.get(a.dog_id) || "Paciente",
      }));

      setAlerts(enrichedAlerts);
    } catch (error) {
      console.error("Error fetching vet alerts:", error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  const handleAcknowledge = async (alertId: string) => {
    setAcknowledgingId(alertId);

    try {
      const { error } = await supabase
        .from("vet_health_alerts")
        .update({ acknowledged_at: new Date().toISOString() })
        .eq("id", alertId);

      if (error) {
        console.error("Error acknowledging alert:", error);
        return;
      }

      // Remove from local state
      setAlerts((prev) => prev.filter((a) => a.id !== alertId));
    } catch (error) {
      console.error("Error acknowledging alert:", error);
    } finally {
      setAcknowledgingId(null);
    }
  };

  if (isLoading) {
    return (
      <Card className="p-4">
        <div className="flex items-center justify-center py-4">
          <Loader2 className="h-5 w-5 animate-spin text-red-500" />
        </div>
      </Card>
    );
  }

  if (alerts.length === 0) {
    return (
      <Card className="p-6">
        <div className="flex flex-col items-center justify-center text-center py-2">
          <CheckCircle className="w-10 h-10 text-green-500 mb-2" />
          <p className="font-medium text-sm text-muted-foreground">
            Nenhum alerta ativo
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Seus pacientes estao bem!
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <AlertTriangle className="w-5 h-5 text-red-500" />
        <h3 className="font-semibold text-sm">Alertas de saude</h3>
        <Badge variant="destructive" className="ml-auto">
          {alerts.length}
        </Badge>
      </div>

      {alerts.map((alert) => {
        const config = ALERT_CONFIG[alert.alert_type] || ALERT_CONFIG.severe_symptoms;
        const description = getAlertDescription(alert);
        const iconColor = getAlertIconColor(alert.alert_type);
        const isAcknowledging = acknowledgingId === alert.id;

        return (
          <Card
            key={alert.id}
            className={`p-4 border ${config.bgColor} ${config.borderColor}`}
          >
            <div className="flex items-start gap-3">
              <AlertTriangle className={`w-5 h-5 mt-0.5 shrink-0 ${iconColor}`} />

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-sm">{alert.dog_name}</span>
                  <Badge variant={config.badgeVariant} className="text-xs">
                    {config.label}
                  </Badge>
                </div>

                <p className={`text-sm ${config.color}`}>
                  {description}
                </p>

                <p className="text-xs text-muted-foreground mt-1">
                  {formatDistanceToNow(new Date(alert.created_at), {
                    addSuffix: true,
                    locale: ptBR,
                  })}
                </p>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => handleAcknowledge(alert.id)}
                disabled={isAcknowledging}
                className="shrink-0"
              >
                {isAcknowledging ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  "Visto"
                )}
              </Button>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
