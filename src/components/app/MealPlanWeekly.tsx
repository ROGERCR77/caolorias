import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Beef, Wheat, Salad, Calendar } from "lucide-react";

interface Food {
  id: string;
  name: string;
  category: string | null;
  kcal_per_100g?: number | null;
}

interface MealPlanWeeklyProps {
  foods: Food[];
  metaGramasDia: number;
  percentualProteina: number;
  percentualCarbo: number;
  percentualVegetais: number;
  numeroRefeicoes: number;
}

const DIAS_SEMANA = [
  { short: "Seg", full: "Segunda" },
  { short: "Ter", full: "Terça" },
  { short: "Qua", full: "Quarta" },
  { short: "Qui", full: "Quinta" },
  { short: "Sex", full: "Sexta" },
  { short: "Sáb", full: "Sábado" },
  { short: "Dom", full: "Domingo" },
];

const categoryConfig = {
  protein: { icon: Beef, color: "text-red-500", bgColor: "bg-red-500/10" },
  carb: { icon: Wheat, color: "text-amber-500", bgColor: "bg-amber-500/10" },
  vegetable: { icon: Salad, color: "text-green-500", bgColor: "bg-green-500/10" },
};

export function MealPlanWeekly({
  foods,
  metaGramasDia,
  percentualProteina,
  percentualCarbo,
  percentualVegetais,
  numeroRefeicoes,
}: MealPlanWeeklyProps) {
  const weeklyPlan = useMemo(() => {
    const proteinFoods = foods.filter((f) => f.category === "protein");
    const carbFoods = foods.filter((f) => f.category === "carb");
    const vegFoods = foods.filter((f) => f.category === "vegetable");

    const gramasProteina = Math.round((metaGramasDia * percentualProteina) / 100);
    const gramasCarbo = Math.round((metaGramasDia * percentualCarbo) / 100);
    const gramasVegetais = Math.round((metaGramasDia * percentualVegetais) / 100);

    // Rotate foods throughout the week
    return DIAS_SEMANA.map((dia, dayIndex) => {
      const protein = proteinFoods[dayIndex % proteinFoods.length];
      const carb = carbFoods[dayIndex % carbFoods.length];
      const veg = vegFoods[dayIndex % vegFoods.length];

      return {
        dia,
        items: [
          {
            category: "protein",
            food: protein,
            grams: Math.round(gramasProteina / numeroRefeicoes),
          },
          {
            category: "carb",
            food: carb,
            grams: Math.round(gramasCarbo / numeroRefeicoes),
          },
          {
            category: "vegetable",
            food: veg,
            grams: Math.round(gramasVegetais / numeroRefeicoes),
          },
        ],
      };
    });
  }, [foods, metaGramasDia, percentualProteina, percentualCarbo, percentualVegetais, numeroRefeicoes]);

  const hasAllCategories = useMemo(() => {
    const proteinFoods = foods.filter((f) => f.category === "protein");
    const carbFoods = foods.filter((f) => f.category === "carb");
    const vegFoods = foods.filter((f) => f.category === "vegetable");
    return proteinFoods.length > 0 && carbFoods.length > 0 && vegFoods.length > 0;
  }, [foods]);

  if (!hasAllCategories) {
    return (
      <Card className="bg-muted/30">
        <CardContent className="p-4 text-center">
          <Calendar className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm font-medium mb-1">Cadastre mais alimentos</p>
          <p className="text-xs text-muted-foreground">
            Para gerar um cardápio semanal variado, você precisa de pelo menos 1 alimento em cada categoria
            (proteína, carboidrato e vegetal).
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Calendar className="w-4 h-4 text-primary" />
          Cardápio Semanal Sugerido
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Variação automática usando seus alimentos cadastrados (por refeição)
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {weeklyPlan.map((day, index) => (
            <div
              key={day.dia.short}
              className={`p-3 rounded-lg ${index % 2 === 0 ? "bg-muted/30" : "bg-muted/50"}`}
            >
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline" className="font-semibold">
                  {day.dia.short}
                </Badge>
                <span className="text-xs text-muted-foreground">{day.dia.full}</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {day.items.map((item) => {
                  const config = categoryConfig[item.category as keyof typeof categoryConfig];
                  const Icon = config.icon;
                  return (
                    <div key={item.category} className={`p-2 rounded ${config.bgColor}`}>
                      <div className="flex items-center gap-1 mb-1">
                        <Icon className={`w-3 h-3 ${config.color}`} />
                        <span className={`text-xs font-medium ${config.color}`}>
                          {item.grams}g
                        </span>
                      </div>
                      <p className="text-[10px] text-muted-foreground truncate">
                        {item.food?.name || "Não definido"}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <p className="text-[11px] text-muted-foreground text-center mt-3">
          💡 Quantidades por refeição. Se fizer {numeroRefeicoes}x, multiplique os totais.
        </p>
      </CardContent>
    </Card>
  );
}
