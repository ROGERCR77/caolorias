import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle, CheckCircle, Pause, Stethoscope } from "lucide-react";

interface TransitionAlertsProps {
  symptoms: string[];
  dayNumber: number;
  consecutiveIssues?: number;
}

interface Alert {
  type: "success" | "warning" | "danger" | "info";
  icon: typeof AlertTriangle;
  title: string;
  message: string;
}

export function TransitionAlerts({ symptoms, dayNumber, consecutiveIssues = 0 }: TransitionAlertsProps) {
  const alerts: Alert[] = [];

  // Check for severe symptoms
  if (symptoms.includes("vomito")) {
    alerts.push({
      type: "danger",
      icon: Stethoscope,
      title: "Atenção: Vômito",
      message: "Pause a transição e ofereça apenas a ração por 1-2 dias. Se persistir, consulte o veterinário.",
    });
  }

  if (symptoms.includes("recusa")) {
    alerts.push({
      type: "warning",
      icon: Pause,
      title: "Recusa alimentar",
      message: "Tente aquecer levemente a comida ou adicionar um pouco de caldo de frango (sem sal). Se recusar por mais de 2 refeições, volte às proporções do dia anterior.",
    });
  }

  if (symptoms.includes("fezes_moles") && dayNumber <= 3) {
    alerts.push({
      type: "info",
      icon: AlertTriangle,
      title: "Fezes moles nos primeiros dias",
      message: "É esperado nos primeiros dias de adaptação. Mantenha o ritmo e observe se melhora em 2-3 dias.",
    });
  }

  if (symptoms.includes("fezes_moles") && dayNumber > 3) {
    alerts.push({
      type: "warning",
      icon: AlertTriangle,
      title: "Fezes moles persistentes",
      message: "Reduza 10% do natural e aumente a ração por 2 dias, depois retome gradualmente.",
    });
  }

  if (symptoms.includes("gases") && !symptoms.includes("vomito")) {
    alerts.push({
      type: "info",
      icon: AlertTriangle,
      title: "Gases",
      message: "Normal durante a adaptação intestinal. Evite brócolis e leguminosas por enquanto.",
    });
  }

  if (symptoms.includes("apatia") && symptoms.length > 1) {
    alerts.push({
      type: "warning",
      icon: Stethoscope,
      title: "Apatia + outros sintomas",
      message: "A combinação de apatia com outros sintomas pode indicar mal-estar. Observe por 24h e considere consultar o veterinário.",
    });
  }

  // Consecutive issues warning
  if (consecutiveIssues >= 2) {
    alerts.push({
      type: "warning",
      icon: Pause,
      title: "Sintomas há 2+ dias",
      message: "Considere pausar a transição e manter as proporções atuais por mais alguns dias antes de avançar.",
    });
  }

  // Success message
  if (symptoms.includes("normal") && symptoms.length === 1) {
    alerts.push({
      type: "success",
      icon: CheckCircle,
      title: "Tudo certo!",
      message: dayNumber >= 5 
        ? "Excelente! Seu cão está se adaptando muito bem. Continue assim!"
        : "Ótimo início! Continue observando e registrando diariamente.",
    });
  }

  if (alerts.length === 0) return null;

  const getAlertStyles = (type: string) => {
    switch (type) {
      case "success":
        return "bg-green-500/10 border-green-500/30";
      case "warning":
        return "bg-yellow-500/10 border-yellow-500/30";
      case "danger":
        return "bg-red-500/10 border-red-500/30";
      default:
        return "bg-blue-500/10 border-blue-500/30";
    }
  };

  const getIconColor = (type: string) => {
    switch (type) {
      case "success":
        return "text-green-600";
      case "warning":
        return "text-yellow-600";
      case "danger":
        return "text-red-600";
      default:
        return "text-blue-600";
    }
  };

  return (
    <div className="space-y-2">
      {alerts.map((alert, index) => (
        <Card key={index} className={`border ${getAlertStyles(alert.type)}`}>
          <CardContent className="p-3">
            <div className="flex gap-3">
              <alert.icon className={`w-5 h-5 flex-shrink-0 ${getIconColor(alert.type)}`} />
              <div>
                <p className="text-sm font-medium">{alert.title}</p>
                <p className="text-xs text-muted-foreground mt-1">{alert.message}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
