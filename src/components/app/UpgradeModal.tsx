import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Check, Crown, X } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface UpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  feature?: string;
}

const FEATURE_NAMES: Record<string, string> = {
  multiple_dogs: "Múltiplos cães",
  weight_history: "Histórico de peso",
  ai_insights: "Insights de IA",
  ai_insights_history: "Histórico de Insights IA",
  meal_plan: "Plano alimentar",
  favorites: "Refeições favoritas",
  recipes: "Receitas",
  advanced_alerts: "Alertas avançados",
  activity_recommendations: "Recomendações de atividade",
  pdf_export: "Exportar PDF",
  vet_report: "Relatório Veterinário",
  health_wallet: "Carteira de Saúde",
  dietary_transition: "Transição Alimentar",
  all_objectives: "Todos os objetivos",
};

const FREE_FEATURES = [
  { name: "1 cão cadastrado", included: true },
  { name: "2 refeições por dia", included: true },
  { name: "7 dias de histórico", included: true },
  { name: "Registro básico de peso", included: true },
  { name: "Alertas avançados", included: false },
  { name: "Plano alimentar IA", included: false },
  { name: "Receitas e favoritos", included: false },
  { name: "Múltiplos cães", included: false },
];

const PREMIUM_FEATURES = [
  { name: "Até 10 cães cadastrados", included: true },
  { name: "Refeições ilimitadas", included: true },
  { name: "Histórico completo", included: true },
  { name: "Gráficos de peso", included: true },
  { name: "Alertas avançados", included: true },
  { name: "Plano alimentar com IA", included: true },
  { name: "Receitas e favoritos", included: true },
  { name: "Exportar PDF", included: true },
];

export function UpgradeModal({ open, onOpenChange, feature }: UpgradeModalProps) {
  const navigate = useNavigate();

  const handleGoToSubscription = () => {
    onOpenChange(false);
    navigate("/app/assinatura");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Crown className="w-5 h-5 text-warning" />
            Recurso Premium
          </DialogTitle>
          <DialogDescription>
            {feature && FEATURE_NAMES[feature] 
              ? `"${FEATURE_NAMES[feature]}" é exclusivo para assinantes Premium.`
              : "Este recurso é exclusivo para assinantes Premium."}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="p-4 rounded-lg bg-muted/50 border">
            <p className="text-sm text-center">
              Acesse a tela de Assinatura para ativar seu plano Premium e desbloquear todos os recursos.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Free Plan */}
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold mb-2">Plano Grátis</h3>
              <p className="text-2xl font-bold mb-4">R$ 0</p>
              <ul className="space-y-2 text-sm">
                {FREE_FEATURES.map((item) => (
                  <li key={item.name} className="flex items-center gap-2">
                    {item.included ? (
                      <Check className="w-4 h-4 text-success" />
                    ) : (
                      <X className="w-4 h-4 text-muted-foreground" />
                    )}
                    <span className={!item.included ? "text-muted-foreground" : ""}>
                      {item.name}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Premium Plan */}
            <div className="border-2 border-primary rounded-lg p-4 relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full">
                Recomendado
              </div>
              <h3 className="font-semibold mb-2 flex items-center gap-1">
                <Crown className="w-4 h-4 text-warning" />
                Premium
              </h3>
              <p className="text-2xl font-bold mb-1">R$ 39,90</p>
              <p className="text-xs text-muted-foreground mb-4">/mês</p>
              <ul className="space-y-2 text-sm">
                {PREMIUM_FEATURES.map((item) => (
                  <li key={item.name} className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-success" />
                    <span>{item.name}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <Button onClick={handleGoToSubscription} className="w-full" size="lg">
            <Crown className="w-4 h-4 mr-2" />
            Assinar Premium
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            Cancele quando quiser. Sem compromisso.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
