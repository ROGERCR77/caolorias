import { useState } from "react";
import { Link } from "react-router-dom";
import { AppLayout } from "@/components/app/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { Check, Crown, Loader2, RefreshCw, RotateCcw, ExternalLink } from "lucide-react";
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
    isIAPLoading,
  } = useSubscription();

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshSubscription();
    setIsRefreshing(false);
  };

  const handleSubscribe = async () => {
    setIsPurchasing(true);
    try {
      await startInAppSubscription();
    } finally {
      setIsPurchasing(false);
    }
  };

  const handleRestore = async () => {
    setIsRestoring(true);
    try {
      await restorePurchases();
    } finally {
      setIsRestoring(false);
    }
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
        <div className="page-container flex items-center justify-center min-h-[50vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="page-container page-content">
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
                  onClick={handleSubscribe} 
                  className="flex-1"
                  size="lg"
                  disabled={isPurchasing || isIAPLoading}
                >
                  {(isPurchasing || isIAPLoading) ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {isIAPLoading ? "Carregando..." : "Processando..."}
                    </>
                  ) : (
                    <>
                      <Crown className="w-4 h-4 mr-2" />
                      Assinar Premium - R$ 39,90/mês
                    </>
                  )}
                </Button>
              )}

              {isNativePlatform && (
                <Button 
                  variant="ghost" 
                  onClick={handleRestore}
                  disabled={isRestoring}
                >
                  {isRestoring ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <RotateCcw className="w-4 h-4 mr-2" />
                  )}
                  Restaurar compras
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Subscription Info Card - Required by Apple */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Cãolorias Premium</CardTitle>
            <CardDescription>Informações da assinatura</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Título:</span>
                <span className="font-medium">Cãolorias Premium</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Duração:</span>
                <span className="font-medium">Mensal (renovação automática)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Preço:</span>
                <span className="font-medium">R$ 39,90/mês</span>
              </div>
            </div>

            <div className="pt-2 border-t space-y-2">
              <p className="text-xs text-muted-foreground">
                A assinatura será cobrada na sua conta do iTunes/Google Play. 
                A renovação automática pode ser cancelada a qualquer momento nas configurações da sua conta.
              </p>
              
              {/* Legal Links - Required by Apple Guideline 3.1.2 */}
              <div className="flex flex-wrap gap-4 pt-2">
                <Link 
                  to="/termos" 
                  className="text-xs text-primary hover:underline flex items-center gap-1"
                >
                  Termos de Uso
                  <ExternalLink className="w-3 h-3" />
                </Link>
                <Link 
                  to="/privacidade" 
                  className="text-xs text-primary hover:underline flex items-center gap-1"
                >
                  Política de Privacidade
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
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