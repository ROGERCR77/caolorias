import { useState, useMemo } from "react";
import { AppLayout } from "@/components/app/AppLayout";
import { DogSelector } from "@/components/app/DogSelector";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useData, MealPlanItem } from "@/contexts/DataContext";
import { Link } from "react-router-dom";
import { 
  Loader2, AlertTriangle, Target, UtensilsCrossed, RefreshCcw, 
  Info, ChevronRight, Beef, Wheat, Salad, Crown, Lock
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { UpgradeModal } from "@/components/app/UpgradeModal";

const objetivoLabels: Record<string, string> = {
  manter_peso: "Manter peso",
  perder_peso: "Perder peso",
  ganhar_peso: "Ganhar peso",
  alimentacao_saudavel: "Alimentação mais saudável",
};

const categoryLabels: Record<string, string> = {
  protein: "Proteína",
  carb: "Carboidrato",
  vegetable: "Vegetal",
};

const categoryIcons: Record<string, React.ElementType> = {
  protein: Beef,
  carb: Wheat,
  vegetable: Salad,
};

const MealPlan = () => {
  const { dogs, foods, mealPlans, selectedDogId, addMealPlan, isLoading } = useData();
  const { toast } = useToast();
  const { isPremium, canAccessFeature } = useSubscription();
  const [isGenerating, setIsGenerating] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);

  const [formData, setFormData] = useState({
    numero_refeicoes: "2",
    percentual_proteina: "50",
    percentual_carbo: "30",
    percentual_vegetais: "20",
  });

  const selectedDog = dogs.find((d) => d.id === selectedDogId);

  // Get active plan for selected dog
  const activePlan = useMemo(() => {
    return mealPlans.find((p) => p.dog_id === selectedDogId && p.ativo);
  }, [mealPlans, selectedDogId]);

  // Validate percentages
  const totalPercentage = 
    parseInt(formData.percentual_proteina || "0") +
    parseInt(formData.percentual_carbo || "0") +
    parseInt(formData.percentual_vegetais || "0");

  const isValidPercentage = totalPercentage === 100;

  // Check if dog has goals set
  const hasGoals = selectedDog?.meta_kcal_dia && selectedDog?.meta_gramas_dia;

  const handleGeneratePlan = async () => {
    if (!selectedDog || !hasGoals || !isValidPercentage) return;

    setIsGenerating(true);

    try {
      const numRefeicoes = parseInt(formData.numero_refeicoes);
      const percProteina = parseInt(formData.percentual_proteina);
      const percCarbo = parseInt(formData.percentual_carbo);
      const percVegetais = parseInt(formData.percentual_vegetais);

      const metaGramas = selectedDog.meta_gramas_dia!;
      const gramasProteina = Math.round((metaGramas * percProteina) / 100);
      const gramasCarbo = Math.round((metaGramas * percCarbo) / 100);
      const gramasVegetais = Math.round((metaGramas * percVegetais) / 100);

      // Find foods by category
      const proteinFoods = foods.filter((f) => f.category === "protein");
      const carbFoods = foods.filter((f) => f.category === "carb");
      const vegFoods = foods.filter((f) => f.category === "vegetable");

      // Generate plan items
      const items: Omit<MealPlanItem, "id" | "meal_plan_id">[] = [];
      const refeicaoNomes = numRefeicoes === 2 
        ? ["Café da manhã", "Jantar"]
        : ["Café da manhã", "Almoço", "Jantar"];

      for (let i = 0; i < numRefeicoes; i++) {
        const ordem = i + 1;
        const nome = refeicaoNomes[i];
        const divisor = numRefeicoes;

        // Protein item
        items.push({
          refeicao_ordem: ordem,
          refeicao_nome: nome,
          food_id: proteinFoods[0]?.id || null,
          categoria: "protein",
          gramas_sugeridas: Math.round(gramasProteina / divisor),
        });

        // Carb item
        items.push({
          refeicao_ordem: ordem,
          refeicao_nome: nome,
          food_id: carbFoods[0]?.id || null,
          categoria: "carb",
          gramas_sugeridas: Math.round(gramasCarbo / divisor),
        });

        // Vegetable item
        items.push({
          refeicao_ordem: ordem,
          refeicao_nome: nome,
          food_id: vegFoods[0]?.id || null,
          categoria: "vegetable",
          gramas_sugeridas: Math.round(gramasVegetais / divisor),
        });
      }

      await addMealPlan(
        {
          dog_id: selectedDog.id,
          objetivo: selectedDog.objetivo,
          meta_kcal_dia_snapshot: selectedDog.meta_kcal_dia!,
          meta_gramas_dia_snapshot: selectedDog.meta_gramas_dia!,
          numero_refeicoes_dia: numRefeicoes,
          percentual_proteina: percProteina,
          percentual_carbo: percCarbo,
          percentual_vegetais: percVegetais,
          observacoes: null,
          ativo: true,
        },
        items
      );

      toast({
        title: "Plano gerado!",
        description: `O plano sugerido de ${selectedDog.name} foi criado. Lembre-se de ajustar conforme orientação do veterinário.`,
      });
    } catch (error: any) {
      toast({
        title: "Algo deu errado",
        description: "Tente novamente. Se o problema continuar, entre em contato com o suporte.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Get food name by id
  const getFoodName = (foodId: string | null) => {
    if (!foodId) return "Não definido";
    return foods.find((f) => f.id === foodId)?.name || "Alimento";
  };

  // Group plan items by meal
  const groupedItems = useMemo(() => {
    if (!activePlan?.meal_plan_items) return new Map();
    
    const grouped = new Map<number, typeof activePlan.meal_plan_items>();
    activePlan.meal_plan_items.forEach((item) => {
      const existing = grouped.get(item.refeicao_ordem) || [];
      grouped.set(item.refeicao_ordem, [...existing, item]);
    });
    return grouped;
  }, [activePlan]);

  if (isLoading) {
    return (
      <AppLayout>
        <div className="page-container flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  // Block free users
  if (!canAccessFeature("meal_plan")) {
    return (
      <AppLayout>
        <div className="page-container page-content">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-items">
            <h1 className="text-2xl font-bold">Plano Alimentar</h1>
          </div>

          <Card className="max-w-md mx-auto text-center">
            <CardContent className="pt-8 pb-8">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-warning/10 flex items-center justify-center">
                <Lock className="w-8 h-8 text-warning" />
              </div>
              <h2 className="text-xl font-bold mb-2">Recurso Premium</h2>
              <p className="text-muted-foreground mb-6">
                O Plano Alimentar com sugestões automáticas está disponível apenas para assinantes Premium.
              </p>
              <Button onClick={() => setShowUpgrade(true)} className="gap-2">
                <Crown className="w-4 h-4" />
                Conhecer o Premium
              </Button>
            </CardContent>
          </Card>

          <UpgradeModal 
            open={showUpgrade} 
            onOpenChange={setShowUpgrade}
            feature="meal_plan"
          />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="page-container page-content">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-items">
          <h1 className="text-2xl font-bold">Plano Alimentar</h1>
          <DogSelector className="w-full sm:w-48" />
        </div>

        {/* Warning card */}
        <Card className="mb-6 bg-yellow-500/10 border-yellow-500/30">
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-yellow-700 dark:text-yellow-400 mb-1">
                  Aviso importante
                </h4>
                <p className="text-sm text-yellow-700/80 dark:text-yellow-400/80">
                  As quantidades sugeridas aqui são uma estimativa baseada nas metas que você definiu. Elas <strong>não substituem</strong> um cardápio formulado por médico-veterinário nutrólogo. Sempre que você tiver um plano prescrito, siga o plano do profissional e use o Cãolorias apenas para registrar e acompanhar.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {selectedDog && (
          <div className="space-y-4">
            {/* Dog info card */}
            <Card>
              <CardContent className="pt-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                  <div>
                    <p className="text-xs text-muted-foreground">Cão</p>
                    <p className="font-semibold">{selectedDog.name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Objetivo</p>
                    <p className="font-semibold">{objetivoLabels[selectedDog.objetivo]}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Meta kcal/dia</p>
                    <p className="font-semibold text-primary">
                      {selectedDog.meta_kcal_dia || "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Meta gramas/dia</p>
                    <p className="font-semibold text-primary">
                      {selectedDog.meta_gramas_dia || "—"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* No goals message */}
            {!hasGoals && (
              <Card className="text-center py-8">
                <CardContent>
                  <Target className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">Metas não definidas</h3>
                  <p className="text-muted-foreground mb-4">
                    Para gerar um plano sugerido, primeiro calcule a meta deste cão na tela de cadastro/edição.
                  </p>
                  <Button asChild>
                    <Link to="/app/caes">
                      Definir metas de {selectedDog.name}
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Plan generator */}
            {hasGoals && (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <UtensilsCrossed className="w-5 h-5 text-primary" />
                      Configurar plano
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Número de refeições por dia</Label>
                      <Select
                        value={formData.numero_refeicoes}
                        onValueChange={(v) => setFormData({ ...formData, numero_refeicoes: v })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-card">
                          <SelectItem value="2">2 refeições</SelectItem>
                          <SelectItem value="3">3 refeições</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-3">
                      <Label>Distribuição por grupo (total = 100%)</Label>
                      
                      <div className="grid grid-cols-3 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs flex items-center gap-1">
                            <Beef className="w-3 h-3" /> Proteínas
                          </Label>
                          <Input
                            type="number"
                            value={formData.percentual_proteina}
                            onChange={(e) => setFormData({ ...formData, percentual_proteina: e.target.value })}
                            min="0"
                            max="100"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs flex items-center gap-1">
                            <Wheat className="w-3 h-3" /> Carboidratos
                          </Label>
                          <Input
                            type="number"
                            value={formData.percentual_carbo}
                            onChange={(e) => setFormData({ ...formData, percentual_carbo: e.target.value })}
                            min="0"
                            max="100"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs flex items-center gap-1">
                            <Salad className="w-3 h-3" /> Vegetais
                          </Label>
                          <Input
                            type="number"
                            value={formData.percentual_vegetais}
                            onChange={(e) => setFormData({ ...formData, percentual_vegetais: e.target.value })}
                            min="0"
                            max="100"
                          />
                        </div>
                      </div>

                      <div className={`text-sm ${isValidPercentage ? "text-green-600" : "text-red-500"}`}>
                        Total: {totalPercentage}% {isValidPercentage ? "✓" : "(deve ser 100%)"}
                      </div>
                    </div>

                    <Button
                      className="w-full"
                      onClick={handleGeneratePlan}
                      disabled={!isValidPercentage || isGenerating}
                    >
                      {isGenerating ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <RefreshCcw className="w-4 h-4" />
                          {activePlan ? "Regerar plano sugerido" : "Gerar plano sugerido"}
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>

                {/* Active plan display */}
                {activePlan && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Target className="w-5 h-5 text-primary" />
                        Plano sugerido ativo
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Plan description */}
                      <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50 text-sm">
                        <Info className="w-4 h-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                        <p className="text-muted-foreground">
                          Esse plano é um modelo para ajudar você a organizar as marmitinhas e a rotina de {selectedDog.name}. Ajuste sempre com base no que o veterinário orientar.
                        </p>
                      </div>

                      {/* Summary */}
                      <div className="p-4 rounded-lg bg-muted/50">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center text-sm">
                          <div>
                            <p className="text-muted-foreground">Objetivo</p>
                            <p className="font-medium">{objetivoLabels[activePlan.objetivo]}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Meta kcal</p>
                            <p className="font-medium">{activePlan.meta_kcal_dia_snapshot}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Meta gramas</p>
                            <p className="font-medium">{activePlan.meta_gramas_dia_snapshot}g</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Refeições</p>
                            <p className="font-medium">{activePlan.numero_refeicoes_dia}x</p>
                          </div>
                        </div>
                        <div className="mt-3 pt-3 border-t flex justify-center gap-6 text-sm">
                          <span className="flex items-center gap-1">
                            <Beef className="w-4 h-4 text-red-500" />
                            {activePlan.percentual_proteina}%
                          </span>
                          <span className="flex items-center gap-1">
                            <Wheat className="w-4 h-4 text-amber-500" />
                            {activePlan.percentual_carbo}%
                          </span>
                          <span className="flex items-center gap-1">
                            <Salad className="w-4 h-4 text-green-500" />
                            {activePlan.percentual_vegetais}%
                          </span>
                        </div>
                      </div>

                      {/* Meals */}
                      <div className="space-y-4">
                        {Array.from(groupedItems.entries()).map(([ordem, items]) => (
                          <div key={ordem} className="border rounded-lg overflow-hidden">
                            <div className="bg-primary/5 px-4 py-2 font-semibold">
                              {items[0]?.refeicao_nome}
                            </div>
                            <div className="divide-y">
                              {items.map((item) => {
                                const IconComponent = categoryIcons[item.categoria] || Info;
                                return (
                                  <div key={item.id} className="px-4 py-3 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                      <IconComponent className="w-4 h-4 text-muted-foreground" />
                                      <div>
                                        <p className="font-medium">
                                          {item.food_id ? getFoodName(item.food_id) : (
                                            <span className="text-muted-foreground italic">
                                              {categoryLabels[item.categoria]} - não definido
                                            </span>
                                          )}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                          {categoryLabels[item.categoria]}
                                        </p>
                                      </div>
                                    </div>
                                    <span className="font-semibold text-primary">
                                      {item.gramas_sugeridas}g
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Bottom disclaimer */}
                      <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/30 text-xs">
                        <AlertTriangle className="w-4 h-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                        <p className="text-muted-foreground">
                          Dietas caseiras mal balanceadas podem causar deficiências nutricionais ao longo do tempo. 
                          Sempre use estas informações como apoio, e não como orientação definitiva.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default MealPlan;
