import { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { 
  Drumstick, 
  Heart, 
  Wheat, 
  Carrot, 
  Droplets, 
  Pill, 
  Apple,
  ArrowLeftRight,
  Loader2,
  AlertTriangle,
  Lightbulb
} from "lucide-react";
import { cn } from "@/lib/utils";

interface FoodMacros {
  per_100g_kcal: number;
  per_100g_protein_g: number | null;
  per_100g_fat_g: number | null;
  per_100g_carb_g: number | null;
}

interface Substitution {
  id: string;
  can_replace_food_id: string;
  ratio_hint: string | null;
  reason: string | null;
  food_name?: string;
}

interface FoodDetails {
  id: string;
  name: string;
  aliases: string[];
  category_main: string;
  default_unit: string;
  unit_gram_equivalence: number | null;
  cost_level: string;
  notes_simple: string | null;
  cautions: string | null;
  macros?: FoodMacros;
  substitutions?: Substitution[];
}

interface FoodDetailsSheetProps {
  foodId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const categoryConfig: Record<string, { label: string; icon: typeof Drumstick; color: string }> = {
  PROTEINA: { label: "Proteína Animal", icon: Drumstick, color: "text-red-500 bg-red-100 dark:bg-red-900/30" },
  VISCERA: { label: "Víscera", icon: Heart, color: "text-purple-500 bg-purple-100 dark:bg-purple-900/30" },
  CARBO: { label: "Carboidrato", icon: Wheat, color: "text-amber-600 bg-amber-100 dark:bg-amber-900/30" },
  VEGETAL: { label: "Vegetal", icon: Carrot, color: "text-green-500 bg-green-100 dark:bg-green-900/30" },
  GORDURA: { label: "Gordura", icon: Droplets, color: "text-yellow-500 bg-yellow-100 dark:bg-yellow-900/30" },
  SUPLEMENTO: { label: "Suplemento", icon: Pill, color: "text-blue-500 bg-blue-100 dark:bg-blue-900/30" },
  EXTRA: { label: "Extra", icon: Apple, color: "text-gray-500 bg-gray-100 dark:bg-gray-800" },
};

const unitLabels: Record<string, string> = {
  GRAMA: "gramas",
  UNIDADE: "unidade",
  COLHER_SOPA: "colher de sopa",
  COLHER_CHA: "colher de chá",
  XICARA: "xícara",
};

const costLabels: Record<string, { label: string; icon: string }> = {
  BAIXO: { label: "Baixo custo", icon: "💰" },
  MEDIO: { label: "Custo médio", icon: "💰💰" },
  ALTO: { label: "Custo alto", icon: "💰💰💰" },
};

export function FoodDetailsSheet({ foodId, open, onOpenChange }: FoodDetailsSheetProps) {
  const [food, setFood] = useState<FoodDetails | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!foodId || !open) {
      setFood(null);
      return;
    }

    const fetchFoodDetails = async () => {
      setIsLoading(true);
      try {
        // Fetch food reference
        const { data: foodData, error: foodError } = await supabase
          .from("food_reference")
          .select("*")
          .eq("id", foodId)
          .single();

        if (foodError) throw foodError;

        // Fetch macros
        const { data: macrosData } = await supabase
          .from("food_macros_reference")
          .select("*")
          .eq("food_reference_id", foodId)
          .single();

        // Fetch substitutions
        const { data: subsData } = await supabase
          .from("food_substitutions")
          .select("*")
          .eq("food_id", foodId);

        // Fetch names for substitution foods
        let substitutionsWithNames: Substitution[] = [];
        if (subsData && subsData.length > 0) {
          const foodIds = subsData.map((s) => s.can_replace_food_id);
          const { data: foodNames } = await supabase
            .from("food_reference")
            .select("id, name")
            .in("id", foodIds);

          const namesMap = new Map(foodNames?.map((f) => [f.id, f.name]));
          substitutionsWithNames = subsData.map((s) => ({
            ...s,
            food_name: namesMap.get(s.can_replace_food_id) || "Alimento",
          }));
        }

        setFood({
          ...foodData,
          macros: macrosData
            ? {
                per_100g_kcal: macrosData.per_100g_kcal,
                per_100g_protein_g: macrosData.per_100g_protein_g,
                per_100g_fat_g: macrosData.per_100g_fat_g,
                per_100g_carb_g: macrosData.per_100g_carb_g,
              }
            : undefined,
          substitutions: substitutionsWithNames,
        });
      } catch (error) {
        console.error("Error fetching food details:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFoodDetails();
  }, [foodId, open]);

  const category = food ? categoryConfig[food.category_main] : null;
  const CategoryIcon = category?.icon || Apple;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : food ? (
          <>
            <SheetHeader className="text-left">
              <div className="flex items-start gap-3">
                <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", category?.color)}>
                  <CategoryIcon className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <SheetTitle className="text-xl">{food.name}</SheetTitle>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <Badge variant="secondary" className={cn("text-xs", category?.color)}>
                      {category?.label}
                    </Badge>
                    <span className="text-sm">
                      {costLabels[food.cost_level]?.icon} {costLabels[food.cost_level]?.label}
                    </span>
                  </div>
                </div>
              </div>
            </SheetHeader>

            <div className="mt-6 space-y-6">
              {/* Unit conversion */}
              {food.default_unit !== "GRAMA" && food.unit_gram_equivalence && (
                <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                  <p className="text-sm font-medium">
                    1 {unitLabels[food.default_unit]} ≈ {food.unit_gram_equivalence}g
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Medida padrão: {unitLabels[food.default_unit]}
                  </p>
                </div>
              )}

              {/* Macros */}
              {food.macros && (
                <div>
                  <h3 className="font-semibold mb-3">Informação Nutricional (por 100g)</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-2xl font-bold text-primary">{food.macros.per_100g_kcal}</p>
                      <p className="text-xs text-muted-foreground">kcal</p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-2xl font-bold text-red-500">{food.macros.per_100g_protein_g ?? 0}g</p>
                      <p className="text-xs text-muted-foreground">Proteína</p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-2xl font-bold text-yellow-500">{food.macros.per_100g_fat_g ?? 0}g</p>
                      <p className="text-xs text-muted-foreground">Gordura</p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-2xl font-bold text-amber-600">{food.macros.per_100g_carb_g ?? 0}g</p>
                      <p className="text-xs text-muted-foreground">Carboidrato</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Cautions */}
              {food.cautions && (
                <div className="p-4 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-yellow-800 dark:text-yellow-200">Atenção</p>
                      <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">{food.cautions}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Educational note */}
              {food.notes_simple && (
                <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                  <div className="flex items-start gap-2">
                    <Lightbulb className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-blue-800 dark:text-blue-200">Dica</p>
                      <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">{food.notes_simple}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Substitutions */}
              {food.substitutions && food.substitutions.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <ArrowLeftRight className="w-4 h-4" />
                    Pode substituir
                  </h3>
                  <div className="space-y-2">
                    {food.substitutions.map((sub) => (
                      <div key={sub.id} className="p-3 rounded-lg bg-muted/50 border">
                        <p className="font-medium">{sub.food_name}</p>
                        {sub.ratio_hint && (
                          <p className="text-sm text-muted-foreground">{sub.ratio_hint}</p>
                        )}
                        {sub.reason && (
                          <p className="text-xs text-primary mt-1">{sub.reason}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <Separator />

              <Button variant="outline" className="w-full" onClick={() => onOpenChange(false)}>
                Fechar
              </Button>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center py-12">
            <p className="text-muted-foreground">Alimento não encontrado</p>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
