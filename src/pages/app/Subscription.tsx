import { useState } from "react";
import { AppLayout } from "@/components/app/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { Check, Crown, Loader2, RefreshCw, Smartphone, RotateCcw } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const Subscription = () => {
  const { 
    planType, 
    planSource,
    trialEndsAt, 
    subscriptionEnd,
    daysUntilTrialExpires,
    isTrialExpired,
    isLoading,
    refreshSubscription,
    startInAppSubscription,
    restorePurchases,
    isPremium,
    isNativePlatform,
  } = useSubscription();

  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshSubscription();
    setIsRefreshing(false);
  };

  const getPlanBadge = () => {
    if (planType === "premium") {
      return <Badge className="bg-warning text-warning-foreground">Premium</Badge>;
    }
    if (planType === "trial" && !isTrialExpired) {
      return <Badge variant="secondary">Teste Premium</Badge>;
    }
    return <Badge variant="outline">Grátis</Badge>;
  };

  const getPlanSourceText = () => {
    if (!isPremium) return null;
    
    switch (planSource) {
      case "appstore":
        return "Assinatura via App Store";
      case "playstore":
        return "Assinatura via Google Play";
      case "stripe":
        return "Assinatura via site";
      default:
        return "Assinatura ativa";
    }
  };

  const getStatusMessage = () => {
    if (planType === "premium") {
      const sourceText = getPlanSourceText();
      if (subscriptionEnd) {
        return `${sourceText} • Renova em ${format(new Date(subscriptionEnd), "dd 'de' MMMM", { locale: ptBR })}`;
      }
      return sourceText || "Você é assinante Premium do Cãolorias 🐾";
    }
    if (planType === "trial" && !isTrialExpired && trialEndsAt) {
      return `Teste expira em ${daysUntilTrialExpires} dia${daysUntilTrialExpires !== 1 ? "s" : ""}`;
    }
    if (isTrialExpired) {
      return "Seu teste Premium expirou";
    }
    return "Você está no plano gratuito. Alguns recursos avançados estão bloqueados.";
  };

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
          <h1 className="text-2xl font-bold">Assinatura</h1>
          <p className="text-muted-foreground">Gerencie seu plano do Cãolorias</p>
        </div>

        {/* Current Plan Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                Seu Plano {getPlanBadge()}
              </CardTitle>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleRefresh}
                disabled={isRefreshing}
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
              </Button>
            </div>
            <CardDescription>{getStatusMessage()}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Premium status */}
            {isPremium && planType === "premium" && (
              <div className="p-4 rounded-lg bg-success/10 border border-success/20">
                <p className="text-sm font-medium text-success-foreground flex items-center gap-2">
                  <Crown className="w-4 h-4 text-warning" />
                  Você é assinante Premium do Cãolorias 🐾
                </p>
                {getPlanSourceText() && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {getPlanSourceText()}
                  </p>
                )}
              </div>
            )}

            {/* Trial warning */}
            {planType === "trial" && !isTrialExpired && daysUntilTrialExpires && daysUntilTrialExpires <= 3 && (
              <div className="p-3 rounded-lg bg-warning/10 border border-warning/20">
                <p className="text-sm text-warning-foreground">
                  ⚠️ Seu teste Premium expira em {daysUntilTrialExpires} dia{daysUntilTrialExpires !== 1 ? "s" : ""}. 
                  Assine para não perder acesso aos recursos premium!
                </p>
              </div>
            )}

            {/* Expired trial message */}
            {isTrialExpired && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                <p className="text-sm">
                  Seu teste Premium expirou. Assine para recuperar acesso a todos os recursos!
                </p>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              {!isPremium && (
                <Button 
                  onClick={() => startInAppSubscription()} 
                  className="flex-1"
                >
                  <Smartphone className="w-4 h-4 mr-2" />
                  Assinar pelo app
                </Button>
              )}

              <Button 
                variant="outline" 
                onClick={handleRefresh}
                disabled={isRefreshing}
              >
                {isRefreshing ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4 mr-2" />
                )}
                Verificar status
              </Button>

              {isNativePlatform && (
                <Button 
                  variant="ghost" 
                  onClick={() => restorePurchases()}
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Restaurar compras
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Plan Comparison */}
        <Card>
          <CardHeader>
            <CardTitle>Compare os Planos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              {/* Free */}
              <div className={`p-4 rounded-lg border ${!isPremium ? "border-primary bg-primary/5" : ""}`}>
                <h3 className="font-semibold mb-1">Grátis</h3>
                <p className="text-2xl font-bold mb-4">R$ 0</p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-success" />
                    1 cão cadastrado
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-success" />
                    2 refeições por dia
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-success" />
                    7 dias de histórico
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-success" />
                    Registro de peso básico
                  </li>
                </ul>
              </div>

              {/* Premium */}
              <div className={`p-4 rounded-lg border-2 ${isPremium ? "border-primary bg-primary/5" : "border-warning"}`}>
                <div className="flex items-center gap-2 mb-1">
                  <Crown className="w-4 h-4 text-warning" />
                  <h3 className="font-semibold">Premium</h3>
                  {isPremium && <Badge variant="secondary" className="text-xs">Seu plano</Badge>}
                </div>
                <p className="text-2xl font-bold mb-1">R$ 39,90</p>
                <p className="text-xs text-muted-foreground mb-4">/mês</p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-success" />
                    Até 10 cães
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-success" />
                    Refeições ilimitadas
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-success" />
                    Histórico completo
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-success" />
                    Plano alimentar com IA
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-success" />
                    Receitas e favoritos
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-success" />
                    Alertas avançados
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-success" />
                    Exportar PDF
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default Subscription;
