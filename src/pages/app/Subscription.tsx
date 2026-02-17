import { useState } from "react";
import { Link } from "react-router-dom";
import { AppLayout } from "@/components/app/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useSubscription, PRODUCT_IDS } from "@/contexts/SubscriptionContext";
import { Check, Crown, Loader2, RefreshCw, RotateCcw, ExternalLink, AlertCircle, Sparkles } from "lucide-react";
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
    retryLoadProducts,
    isPremium,
    isNativePlatform,
    isIAPLoading,
    hasProducts,
    products,
    iapError,
  } = useSubscription();

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<"monthly" | "annual">("annual");

  const monthlyProduct = products.find(p => p.id === PRODUCT_IDS.PREMIUM_MONTHLY);
  const annualProduct = products.find(p => p.id === PRODUCT_IDS.PREMIUM_YEARLY);
  const monthlyPrice = monthlyProduct?.price || "R$ 19,90";
  const annualPrice = annualProduct?.price || "R$ 118,80";

  const neverHadTrial = planType === "free" && !trialEndsAt;

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshSubscription();
    setIsRefreshing(false);
  };

  const handleSubscribe = async (plan: "monthly" | "annual") => {
    setIsPurchasing(true);
    try {
      const productId = plan === "annual"
        ? PRODUCT_IDS.PREMIUM_YEARLY
        : PRODUCT_IDS.PREMIUM_MONTHLY;
      await startInAppSubscription(productId);
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

  const handleRetryLoad = async () => {
    setIsRetrying(true);
    try {
      await retryLoadProducts();
    } finally {
      setIsRetrying(false);
    }
  };

  const getPlanBadge = () => {
    if (planType === "premium") {
      return <Badge className="bg-warning text-warning-foreground">Premium</Badge>;
    }
    if (planType === "trial" && !isTrialExpired) {
      return <Badge variant="secondary">Teste Premium</Badge>;
    }
    return <Badge variant="outline">Gratis</Badge>;
  };

  const getPlanSourceText = () => {
    if (!isPremium) return null;
    switch (planSource) {
      case "appstore": return "Assinatura via App Store";
      case "playstore": return "Assinatura via Google Play";
      case "stripe": return "Assinatura via site";
      default: return "Assinatura ativa";
    }
  };

  const getStatusMessage = () => {
    if (planType === "premium") {
      const sourceText = getPlanSourceText();
      if (subscriptionEnd) {
        return `${sourceText} • Renova em ${format(new Date(subscriptionEnd), "dd 'de' MMMM", { locale: ptBR })}`;
      }
      return sourceText || "Voce e assinante Premium do Caolorias";
    }
    if (planType === "trial" && !isTrialExpired && trialEndsAt) {
      return `Teste expira em ${daysUntilTrialExpires} dia${daysUntilTrialExpires !== 1 ? "s" : ""}`;
    }
    if (isTrialExpired) {
      return "Seu teste Premium expirou";
    }
    return "Voce esta no plano gratuito. Alguns recursos avancados estao bloqueados.";
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

  const PREMIUM_FEATURES = [
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
    "Relatorio Veterinario",
  ];

  return (
    <AppLayout>
      <div className="page-container page-content">
        <div>
          <h1 className="text-2xl font-bold">Assinatura</h1>
          <p className="text-muted-foreground">Gerencie seu plano do Caolorias</p>
        </div>

        {/* Current Plan Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                Seu Plano {getPlanBadge()}
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
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
                  Voce e assinante Premium do Caolorias
                </p>
                {getPlanSourceText() && (
                  <p className="text-xs text-muted-foreground mt-1">{getPlanSourceText()}</p>
                )}
              </div>
            )}

            {/* Trial countdown */}
            {planType === "trial" && !isTrialExpired && daysUntilTrialExpires != null && (
              <div className="p-4 rounded-xl bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                    <span className="text-xl font-black text-primary">{daysUntilTrialExpires}</span>
                  </div>
                  <div>
                    <p className="font-semibold text-sm">
                      {daysUntilTrialExpires <= 3
                        ? "Seu teste esta acabando!"
                        : "Teste Premium ativo"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {daysUntilTrialExpires} dia{daysUntilTrialExpires !== 1 ? "s" : ""} restante{daysUntilTrialExpires !== 1 ? "s" : ""}. Assine para nao perder acesso!
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Expired trial */}
            {isTrialExpired && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                <p className="text-sm">
                  Seu teste Premium expirou. Assine para recuperar acesso a todos os recursos!
                </p>
              </div>
            )}

            {/* IAP Error */}
            {iapError && isNativePlatform && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                <p className="text-sm text-destructive mb-2">
                  <AlertCircle className="w-4 h-4 inline mr-1" />
                  {iapError}
                </p>
                <Button variant="outline" size="sm" onClick={handleRetryLoad} disabled={isRetrying}>
                  {isRetrying ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
                  Tentar novamente
                </Button>
              </div>
            )}

            {/* Restore purchases */}
            {isNativePlatform && (
              <Button variant="ghost" onClick={handleRestore} disabled={isRestoring} className="w-full">
                {isRestoring ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RotateCcw className="w-4 h-4 mr-2" />}
                Restaurar compras
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Plan Selection - show when not premium */}
        {!isPremium && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Crown className="w-5 h-5 text-warning" />
                Escolha seu plano
              </CardTitle>
              {neverHadTrial && (
                <div className="p-3 rounded-xl bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20 text-center mt-2">
                  <Sparkles className="w-5 h-5 text-primary mx-auto mb-1" />
                  <p className="text-sm font-semibold">Comece com 7 dias gratis!</p>
                </div>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Plan Cards */}
              <div className="grid grid-cols-2 gap-3">
                {/* Monthly */}
                <button
                  onClick={() => setSelectedPlan("monthly")}
                  className={`p-4 rounded-xl border-2 transition-all text-left ${
                    selectedPlan === "monthly"
                      ? "border-primary bg-primary/5"
                      : "border-muted hover:border-muted-foreground/30"
                  }`}
                >
                  <p className="text-xs text-muted-foreground font-medium">Mensal</p>
                  <p className="text-2xl font-bold mt-1">{monthlyPrice}</p>
                  <p className="text-xs text-muted-foreground">/mes</p>
                </button>

                {/* Annual */}
                <button
                  onClick={() => setSelectedPlan("annual")}
                  className={`p-4 rounded-xl border-2 transition-all text-left relative ${
                    selectedPlan === "annual"
                      ? "border-primary bg-primary/5"
                      : "border-muted hover:border-muted-foreground/30"
                  }`}
                >
                  <Badge className="absolute -top-2 left-1/2 -translate-x-1/2 bg-success text-success-foreground text-[10px]">
                    Mais popular
                  </Badge>
                  <p className="text-xs text-muted-foreground font-medium">Anual</p>
                  <p className="text-2xl font-bold mt-1">R$ 9,90</p>
                  <p className="text-xs text-muted-foreground">/mes</p>
                  <Badge variant="outline" className="mt-2 text-[10px]">Economize 50%</Badge>
                </button>
              </div>

              {/* Subscribe Buttons */}
              <Button
                onClick={() => handleSubscribe(selectedPlan)}
                className="w-full"
                size="lg"
                disabled={isPurchasing || isIAPLoading || (!hasProducts && isNativePlatform)}
              >
                {isPurchasing ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processando...</>
                ) : isIAPLoading ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Carregando planos...</>
                ) : (
                  <>
                    <Crown className="w-4 h-4 mr-2" />
                    {selectedPlan === "annual"
                      ? `Assinar Anual — R$ 9,90/mes`
                      : `Assinar Mensal — ${monthlyPrice}/mes`}
                  </>
                )}
              </Button>

              {/* Products not loaded */}
              {!hasProducts && !isIAPLoading && isNativePlatform && !iapError && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <AlertCircle className="w-4 h-4" />
                  <span>Produtos nao carregados.</span>
                  <Button variant="link" size="sm" className="p-0 h-auto" onClick={handleRetryLoad} disabled={isRetrying}>
                    {isRetrying ? "Carregando..." : "Tentar novamente"}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Subscription Info Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Caolorias Premium</CardTitle>
            <CardDescription>Todos os recursos inclusos</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {PREMIUM_FEATURES.map((feat) => (
                <li key={feat} className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4 text-success flex-shrink-0" />
                  {feat}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Legal */}
        <Card>
          <CardContent className="p-4 space-y-2">
            <p className="text-xs text-muted-foreground">
              A assinatura sera cobrada na sua conta do iTunes/Google Play.
              A renovacao automatica pode ser cancelada a qualquer momento nas configuracoes da sua conta.
            </p>
            <div className="flex flex-wrap gap-4 pt-2">
              <Link to="/termos" className="text-xs text-primary hover:underline flex items-center gap-1">
                Termos de Uso <ExternalLink className="w-3 h-3" />
              </Link>
              <Link to="/privacidade" className="text-xs text-primary hover:underline flex items-center gap-1">
                Politica de Privacidade <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default Subscription;
