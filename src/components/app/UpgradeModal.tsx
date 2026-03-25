import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Crown, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useSubscription, PRODUCT_IDS } from "@/contexts/SubscriptionContext";

interface UpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  feature?: string;
  contextMessage?: string;
}

const FEATURE_NAMES: Record<string, string> = {
  multiple_dogs: "Multiplos caes",
  weight_history: "Historico de peso",
  ai_insights: "Insights de IA",
  ai_insights_history: "Historico de Insights IA",
  meal_plan: "Plano alimentar",
  favorites: "Refeicoes favoritas",
  recipes: "Receitas",
  advanced_alerts: "Alertas avancados",
  activity_recommendations: "Recomendacoes de atividade",
  pdf_export: "Exportar PDF",
  vet_report: "Relatorio Veterinario",
  health_wallet: "Carteira de Saude",
  dietary_transition: "Transicao Alimentar",
  all_objectives: "Todos os objetivos",
  digestive_trends: "Tendencias Digestivas",
  smart_shopping: "Lista Inteligente",
  health_score: "Score de Saude",
  food_comparator: "Comparador de Alimentos",
  unlimited_meals: "Refeicoes ilimitadas",
  full_history: "Historico completo",
};

const PREMIUM_FEATURES_LIST = [
  "Ate 10 caes cadastrados",
  "Refeicoes ilimitadas",
  "Historico completo",
  "Plano alimentar com IA",
  "Score de Saude",
  "Comparador de Alimentos",
  "Tendencias Digestivas",
  "Lista Inteligente",
  "Receitas e favoritos",
  "Exportar PDF",
];

export function UpgradeModal({ open, onOpenChange, feature, contextMessage }: UpgradeModalProps) {
  const navigate = useNavigate();
  const { products, planType, trialEndsAt, isNativePlatform, startInAppSubscription } = useSubscription();
  const [selectedPlan, setSelectedPlan] = useState<"monthly" | "annual">("annual");
  const [isPurchasing, setIsPurchasing] = useState(false);

  const monthlyProduct = products.find(p => p.id === PRODUCT_IDS.PREMIUM_MONTHLY);
  const annualProduct = products.find(p => p.id === PRODUCT_IDS.PREMIUM_YEARLY);

  const monthlyPrice = monthlyProduct?.price || "R$ 19,90";
  const annualPrice = annualProduct?.price || "R$ 118,80";

  const neverHadTrial = planType === "free" && !trialEndsAt;

  const handleSubscribe = async () => {
    if (isNativePlatform) {
      setIsPurchasing(true);
      try {
        const productId = selectedPlan === "annual"
          ? PRODUCT_IDS.PREMIUM_YEARLY
          : PRODUCT_IDS.PREMIUM_MONTHLY;
        await startInAppSubscription(productId);
      } finally {
        setIsPurchasing(false);
      }
    } else {
      onOpenChange(false);
      navigate("/app/assinatura");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader className="text-center">
          <DialogTitle className="flex items-center justify-center gap-2">
            <Crown className="w-6 h-6 text-warning" />
            Caolorias Premium
          </DialogTitle>
          <DialogDescription>
            {feature && FEATURE_NAMES[feature]
              ? `"${FEATURE_NAMES[feature]}" e exclusivo para assinantes Premium.`
              : "Desbloqueie todos os recursos do Caolorias."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Context Message */}
          {contextMessage && (
            <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
              <p className="text-sm text-center">{contextMessage}</p>
            </div>
          )}

          {/* Trial CTA */}
          {neverHadTrial && (
            <div className="p-3 rounded-xl bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20 text-center">
              <Sparkles className="w-5 h-5 text-primary mx-auto mb-1" />
              <p className="text-sm font-semibold">Experimente 7 dias gratis!</p>
              <p className="text-xs text-muted-foreground">Teste todos os recursos sem compromisso</p>
            </div>
          )}

          {/* Plan Toggle */}
          <div className="grid grid-cols-2 gap-3">
            {/* Monthly */}
            <button
              onClick={() => setSelectedPlan("monthly")}
              className={`p-3 rounded-xl border-2 transition-all text-left ${
                selectedPlan === "monthly"
                  ? "border-primary bg-primary/5"
                  : "border-muted hover:border-muted-foreground/30"
              }`}
            >
              <p className="text-xs text-muted-foreground">Mensal</p>
              <p className="text-lg font-bold">{monthlyPrice}</p>
              <p className="text-xs text-muted-foreground">/mes</p>
            </button>

            {/* Annual */}
            <button
              onClick={() => setSelectedPlan("annual")}
              className={`p-3 rounded-xl border-2 transition-all text-left relative ${
                selectedPlan === "annual"
                  ? "border-primary bg-primary/5"
                  : "border-muted hover:border-muted-foreground/30"
              }`}
            >
              <Badge className="absolute -top-2 right-2 bg-success text-success-foreground text-[10px]">
                Economize 50%
              </Badge>
              <p className="text-xs text-muted-foreground">Anual</p>
              <p className="text-lg font-bold">R$ 9,90</p>
              <p className="text-xs text-muted-foreground">/mes ({annualPrice}/ano)</p>
            </button>
          </div>

          {/* Features List */}
          <div className="space-y-1.5 max-h-40 overflow-y-auto">
            {PREMIUM_FEATURES_LIST.map((feat) => (
              <div key={feat} className="flex items-center gap-2 text-sm">
                <Check className="w-3.5 h-3.5 text-success flex-shrink-0" />
                <span>{feat}</span>
              </div>
            ))}
          </div>

          {/* CTA Button */}
          <Button
            onClick={handleSubscribe}
            className="w-full"
            size="lg"
            disabled={isPurchasing}
          >
            <Crown className="w-4 h-4 mr-2" />
            {isPurchasing
              ? "Processando..."
              : neverHadTrial
              ? "Iniciar teste gratis"
              : selectedPlan === "annual"
              ? `Assinar Anual — R$ 9,90/mes`
              : `Assinar Mensal — ${monthlyPrice}/mes`}
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            Cancele quando quiser. Sem compromisso.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
