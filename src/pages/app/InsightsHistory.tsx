import { useState, useEffect } from "react";
import { AppLayout } from "@/components/app/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useData } from "@/contexts/DataContext";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { supabase } from "@/integrations/supabase/client";
import { Lightbulb, Calendar, Loader2, Dog, Crown } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { UpgradeModal } from "@/components/app/UpgradeModal";

interface InsightRecord {
  id: string;
  dog_id: string;
  insights: any;
  created_at: string;
}

const InsightsHistory = () => {
  const { user } = useAuth();
  const { dogs } = useData();
  const { isPremium } = useSubscription();
  const [history, setHistory] = useState<InsightRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showUpgrade, setShowUpgrade] = useState(false);

  useEffect(() => {
    if (isPremium) {
      fetchHistory();
    } else {
      setIsLoading(false);
    }
  }, [user, isPremium]);

  const fetchHistory = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("ai_insights_history")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      setHistory(data || []);
    } catch (error) {
      console.error("Error fetching insights history:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getDogName = (dogId: string) => {
    const dog = dogs.find((d) => d.id === dogId);
    return dog?.name || "Cão";
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "alto":
        return "bg-destructive/10 text-destructive border-destructive/20";
      case "moderado":
        return "bg-warning/10 text-warning border-warning/20";
      default:
        return "bg-primary/10 text-primary border-primary/20";
    }
  };

  // Premium gate
  if (!isPremium) {
    return (
      <AppLayout>
        <div className="container px-4 py-6">
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Crown className="w-10 h-10 text-primary" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Histórico de Insights</h1>
            <p className="text-muted-foreground mb-6 max-w-md">
              Acesse o histórico completo de insights gerados pela IA. Recurso exclusivo do plano Premium.
            </p>
            <Button onClick={() => setShowUpgrade(true)} variant="hero">
              <Crown className="w-4 h-4 mr-2" />
              Assinar Premium
            </Button>
            <UpgradeModal open={showUpgrade} onOpenChange={setShowUpgrade} feature="ai_insights_history" />
          </div>
        </div>
      </AppLayout>
    );
  }

  if (isLoading) {
    return (
      <AppLayout>
        <div className="container px-4 py-6 flex items-center justify-center min-h-[50vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="container px-4 py-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Lightbulb className="w-6 h-6" />
            Histórico de Insights
          </h1>
          <p className="text-muted-foreground">
            Veja os insights gerados pela IA ao longo do tempo
          </p>
        </div>

        {history.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Lightbulb className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Nenhum insight ainda</h3>
              <p className="text-muted-foreground text-sm">
                Os insights serão salvos aqui quando você usar a análise de IA no Dashboard
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {history.map((record) => {
              const insights = Array.isArray(record.insights) 
                ? record.insights 
                : [record.insights];

              return (
                <Card key={record.id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Dog className="w-4 h-4" />
                        {getDogName(record.dog_id)}
                      </CardTitle>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Calendar className="w-4 h-4" />
                        {format(new Date(record.created_at), "dd MMM yyyy, HH:mm", { locale: ptBR })}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {insights.map((insight: any, idx: number) => (
                        <div 
                          key={idx}
                          className={`p-3 rounded-lg border ${getSeverityColor(insight.severidade || "baixo")}`}
                        >
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <h4 className="font-medium text-sm">{insight.titulo || insight.title}</h4>
                            {insight.severidade && (
                              <Badge variant="outline" className="text-xs capitalize">
                                {insight.severidade}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm opacity-90">
                            {insight.descricao || insight.description}
                          </p>
                          {insight.sugestao && (
                            <p className="text-xs mt-2 opacity-75">
                              💡 {insight.sugestao}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default InsightsHistory;
