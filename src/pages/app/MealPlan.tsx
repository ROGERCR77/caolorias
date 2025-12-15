import { useState, useMemo } from "react";
import { AppLayout } from "@/components/app/AppLayout";
import { DogSelector } from "@/components/app/DogSelector";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useData, MealPlanItem } from "@/contexts/DataContext";
import { Link } from "react-router-dom";
import { 
  Loader2, AlertTriangle, Target, UtensilsCrossed, RefreshCcw, 
  Info, ChevronRight, Beef, Wheat, Salad, Crown, Lock, Sparkles, Lightbulb
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { UpgradeModal } from "@/components/app/UpgradeModal";
import { MealPlanWeekly } from "@/components/app/MealPlanWeekly";

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

// Presets based on objectives
const DISTRIBUTION_PRESETS = {
  perder_peso: { protein: 55, carb: 25, veg: 20, label: "Perder peso" },
  ganhar_peso: { protein: 45, carb: 35, veg: 20, label: "Ganhar peso" },
  manter_peso: { protein: 50, carb: 30, veg: 20, label: "Manter peso" },
  alimentacao_saudavel: { protein: 50, carb: 30, veg: 20, label: "Alimentação saudável" },
  filhote: { protein: 55, carb: 30, veg: 15, label: "Filhote (mais proteína)" },
};

const MealPlan = () => {
  const { dogs, foods, mealPlans, selectedDogId, addMealPlan, isLoading } = useData();
  const { toast } = useToast();
  const { isPremium, canAccessFeature } = useSubscription();
  const [isGenerating, setIsGenerating] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [showWeekly, setShowWeekly] = useState(false);

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

  // Food counts by category
  const foodCounts = useMemo(() => {
    return {
      protein: foods.filter((f) => f.category === "protein").length,
      carb: foods.filter((f) => f.category === "carb").length,
      vegetable: foods.filter((f) => f.category === "vegetable").length,
    };
  }, [foods]);

  // Validate percentages
  const totalPercentage = 
    parseInt(formData.percentual_proteina || "0") +
    parseInt(formData.percentual_carbo || "0") +
    parseInt(formData.percentual_vegetais || "0");

  const isValidPercentage = totalPercentage === 100;

  // Check if dog has goals set
  const hasGoals = selectedDog?.meta_kcal_dia && selectedDog?.meta_gramas_dia;

  // Apply preset
  const applyPreset = (presetKey: string) => {
    const preset = DISTRIBUTION_PRESETS[presetKey as keyof typeof DISTRIBUTION_PRESETS];
    if (preset) {
      setFormData({
        ...formData,
        percentual_proteina: preset.protein.toString(),
        percentual_carbo: preset.carb.toString(),
        percentual_vegetais: preset.veg.toString(),
      });
    }
  };

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

      // Generate plan items WITH ROTATION
      const items: Omit<MealPlanItem, "id" | "meal_plan_id">[] = [];
      const refeicaoNomes = numRefeicoes === 2 
        ? ["Café da manhã", "Jantar"]
        : ["Café da manhã", "Almoço", "Jantar"];

      for (let i = 0; i < numRefeicoes; i++) {
        const ordem = i + 1;
        const nome = refeicaoNomes[i];
        const divisor = numRefeicoes;

        // ROTATE: Use different foods for each meal
        const proteinFood = proteinFoods[i % proteinFoods.length];
        const carbFood = carbFoods[i % carbFoods.length];
        const vegFood = vegFoods[i % vegFoods.length];

        // Protein item
        items.push({
          refeicao_ordem: ordem,
          refeicao_nome: nome,
          food_id: proteinFood?.id || null,
          categoria: "protein",
          gramas_sugeridas: Math.round(gramasProteina / divisor),
        });

        // Carb item
        items.push({
          refeicao_ordem: ordem,
          refeicao_nome: nome,
          food_id: carbFood?.id || null,
          categoria: "carb",
          gramas_sugeridas: Math.round(gramasCarbo / divisor),
        });

        // Vegetable item
        items.push({
          refeicao_ordem: ordem,
          refeicao_nome: nome,
          food_id: vegFood?.id || null,
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
        description: `O plano de ${selectedDog.name} foi criado com variação de alimentos.`,
      });
    } catch (error: any) {
      toast({
        title: "Algo deu errado",
        description: "Tente novamente.",
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
                  As quantidades sugeridas aqui são uma estimativa. Elas <strong>não substituem</strong> um cardápio 
                  formulado por médico-veterinário nutrólogo.
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

            {/* Food inventory status */}
            <Card className="bg-muted/30">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Info className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium">Seus alimentos cadastrados</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className={`p-2 rounded-lg ${foodCounts.protein > 0 ? "bg-red-500/10" : "bg-muted"}`}>
                    <Beef className={`w-4 h-4 mx-auto mb-1 ${foodCounts.protein > 0 ? "text-red-500" : "text-muted-foreground"}`} />
                    <p className="text-xs font-medium">{foodCounts.protein} proteínas</p>
                  </div>
                  <div className={`p-2 rounded-lg ${foodCounts.carb > 0 ? "bg-amber-500/10" : "bg-muted"}`}>
                    <Wheat className={`w-4 h-4 mx-auto mb-1 ${foodCounts.carb > 0 ? "text-amber-500" : "text-muted-foreground"}`} />
                    <p className="text-xs font-medium">{foodCounts.carb} carboidratos</p>
                  </div>
                  <div className={`p-2 rounded-lg ${foodCounts.vegetable > 0 ? "bg-green-500/10" : "bg-muted"}`}>
                    <Salad className={`w-4 h-4 mx-auto mb-1 ${foodCounts.vegetable > 0 ? "text-green-500" : "text-muted-foreground"}`} />
                    <p className="text-xs font-medium">{foodCounts.vegetable} vegetais</p>
                  </div>
                </div>
                {(foodCounts.protein === 0 || foodCounts.carb === 0 || foodCounts.vegetable === 0) && (
                  <p className="text-xs text-muted-foreground mt-2 text-center">
                    💡 Cadastre mais alimentos para ter mais variedade no plano
                  </p>
                )}
              </CardContent>
            </Card>

            {/* No goals message */}
            {!hasGoals && (
              <Card className="text-center py-8">
                <CardContent>
                  <Target className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">Metas não definidas</h3>
                  <p className="text-muted-foreground mb-4">
                    Para gerar um plano sugerido, primeiro calcule a meta deste cão.
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

                    {/* Preset buttons */}
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Lightbulb className="w-4 h-4 text-primary" />
                        Sugestões rápidas
                      </Label>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(DISTRIBUTION_PRESETS).map(([key, preset]) => (
                          <Button
                            key={key}
                            variant="outline"
                            size="sm"
                            onClick={() => applyPreset(key)}
                            className="text-xs"
                          >
                            {preset.label}
                          </Button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Label>Distribuição por grupo (total = 100%)</Label>
                      
                      <div className="grid grid-cols-3 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs flex items-center gap-1">
                            <Beef className="w-3 h-3 text-red-500" /> Proteínas
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
                            <Wheat className="w-3 h-3 text-amber-500" /> Carboidratos
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
                            <Salad className="w-3 h-3 text-green-500" /> Vegetais
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

                {/* Toggle weekly view */}
                <Button 
                  variant="outline" 
                  className="w-full gap-2"
                  onClick={() => setShowWeekly(!showWeekly)}
                >
                  <Sparkles className="w-4 h-4 text-primary" />
                  {showWeekly ? "Ocultar cardápio semanal" : "Ver cardápio semanal variado"}
                </Button>

                {/* Weekly plan preview */}
                {showWeekly && (
                  <MealPlanWeekly
                    foods={foods}
                    metaGramasDia={selectedDog.meta_gramas_dia || 0}
                    percentualProteina={parseInt(formData.percentual_proteina)}
                    percentualCarbo={parseInt(formData.percentual_carbo)}
                    percentualVegetais={parseInt(formData.percentual_vegetais)}
                    numeroRefeicoes={parseInt(formData.numero_refeicoes)}
                  />
                )}

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
                          Esse plano é um modelo para ajudar você a organizar as marmitinhas de {selectedDog.name}. 
                          Ajuste sempre com base no que o veterinário orientar.
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
                      <div className="space-y-3">
                        {Array.from(groupedItems.entries()).map(([ordem, items]) => (
                          <Card key={ordem} className="bg-muted/30">
                            <CardHeader className="pb-2">
                              <CardTitle className="text-sm">
                                {items[0]?.refeicao_nome || `Refeição ${ordem}`}
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-0">
                              <div className="space-y-2">
                                {items.map((item) => {
                                  const Icon = categoryIcons[item.categoria];
                                  return (
                                    <div
                                      key={item.id}
                                      className="flex items-center justify-between p-2 rounded-lg bg-background/50"
                                    >
                                      <div className="flex items-center gap-2">
                                        {Icon && <Icon className="w-4 h-4 text-muted-foreground" />}
                                        <span className="text-sm">{getFoodName(item.food_id)}</span>
                                        <Badge variant="outline" className="text-xs">
                                          {categoryLabels[item.categoria]}
                                        </Badge>
                                      </div>
                                      <span className="font-mono text-sm font-medium">
                                        {item.gramas_sugeridas}g
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </div>
        )}

        <UpgradeModal 
          open={showUpgrade} 
          onOpenChange={setShowUpgrade}
          feature="meal_plan"
        />
      </div>
    </AppLayout>
  );
};

export default MealPlan;
