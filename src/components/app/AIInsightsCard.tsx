import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useData, Dog } from "@/contexts/DataContext";
import { useAuth } from "@/contexts/AuthContext";
import { useAIInsights, AIResponse } from "@/hooks/useAIInsights";
import { 
  Sparkles, Loader2, AlertTriangle, TrendingUp, TrendingDown, 
  Cookie, Target, CalendarX, Info, Activity, Scale, RefreshCcw,
  ChevronDown, ChevronUp
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AIInsightsCardProps {
  dog: Dog;
}

const insightIcons: Record<string, React.ElementType> = {
  excesso_comida: AlertTriangle,
  pouca_comida: TrendingDown,
  muitos_petiscos: Cookie,
  ganho_peso: TrendingUp,
  perda_peso: TrendingDown,
  falta_registro: CalendarX,
  meta_alcancada: Target,
  geral: Info,
};

const alertColors: Record<string, string> = {
  baixo: "bg-blue-500/10 border-blue-500/30 text-blue-700 dark:text-blue-400",
  moderado: "bg-yellow-500/10 border-yellow-500/30 text-yellow-700 dark:text-yellow-400",
  alto: "bg-red-500/10 border-red-500/30 text-red-700 dark:text-red-400",
};

export function AIInsightsCard({ dog }: AIInsightsCardProps) {
  const { meals, weightLogs, foods, mealPlans } = useData();
  const { user } = useAuth();
  const { isLoading, error, response, generateInsights } = useAIInsights();
  const { toast } = useToast();
  const [expanded, setExpanded] = useState(false);

  const activePlan = mealPlans.find((p) => p.dog_id === dog.id && p.ativo);
  const tutorName = user?.user_metadata?.name || user?.email?.split("@")[0] || "Tutor";

  const handleGenerate = async () => {
    try {
      await generateInsights(dog, meals, weightLogs, foods, activePlan, tutorName);
      setExpanded(true);
    } catch (err: any) {
      toast({
        title: "Algo deu errado",
        description: "Não foi possível gerar a análise. Tente novamente. Se o problema continuar, entre em contato com o suporte.",
        variant: "destructive",
      });
    }
  };

  if (!response) {
    return (
      <Card className="bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
        <CardContent className="py-6">
          <div className="text-center">
            <Sparkles className="w-10 h-10 text-primary mx-auto mb-3" />
            <h3 className="font-semibold mb-2">Análise personalizada com IA</h3>
            <p className="text-sm text-muted-foreground mb-4">
              A IA do Cãolorias analisa os dados e oferece observações sobre a alimentação de {dog.name}. Lembre-se: isso não substitui a avaliação de um veterinário.
            </p>
            <Button onClick={handleGenerate} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Analisando...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Ver análise personalizada
                </>
              )}
            </Button>
            {error && (
              <p className="text-sm text-destructive mt-2">{error}</p>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Análise de IA
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={handleGenerate} disabled={isLoading}>
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCcw className="w-4 h-4" />}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setExpanded(!expanded)}>
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Insights */}
        {response.insights && response.insights.length > 0 && (
          <div className="space-y-2">
            {response.insights.slice(0, expanded ? undefined : 2).map((insight, index) => {
              const IconComponent = insightIcons[insight.tipo] || Info;
              return (
                <div
                  key={index}
                  className={`p-3 rounded-lg border ${alertColors[insight.nivel_alerta] || alertColors.baixo}`}
                >
                  <div className="flex items-start gap-3">
                    <IconComponent className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-sm">{insight.titulo}</h4>
                      <p className="text-sm opacity-90 mt-1">{insight.mensagem}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {expanded && (
          <>
            {/* Weight comment */}
            {response.comentario_peso_raca && response.comentario_peso_raca.status !== "sem_dados" && (
              <div className="p-3 rounded-lg bg-muted/50 border">
                <div className="flex items-start gap-3">
                  <Scale className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-sm">Sobre o peso</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      {response.comentario_peso_raca.mensagem}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Activity recommendation */}
            {response.recomendacao_atividade && response.recomendacao_atividade.mensagem && (
              <div className="p-3 rounded-lg bg-muted/50 border">
                <div className="flex items-start gap-3">
                  <Activity className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-sm">
                      Atividade física sugerida
                      {response.recomendacao_atividade.minutos_min && response.recomendacao_atividade.minutos_max && (
                        <span className="font-normal text-primary ml-2">
                          ({response.recomendacao_atividade.minutos_min}-{response.recomendacao_atividade.minutos_max} min/dia)
                        </span>
                      )}
                    </h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      {response.recomendacao_atividade.mensagem}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {!expanded && response.insights && response.insights.length > 2 && (
          <Button variant="ghost" size="sm" onClick={() => setExpanded(true)} className="w-full">
            Ver mais ({response.insights.length - 2} insights)
            <ChevronDown className="w-4 h-4 ml-1" />
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
