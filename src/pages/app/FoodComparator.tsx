import { useState, useEffect, useMemo } from "react";
import { AppLayout } from "@/components/app/AppLayout";
import { FeatureGate } from "@/components/app/FeatureGate";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { supabase } from "@/lib/supabaseClient";
import { cn } from "@/lib/utils";
import { ArrowLeftRight, Check, Loader2, Plus, X, Crown } from "lucide-react";

interface FoodRef {
  id: string;
  name: string;
  category_main: string;
  cost_level: string;
}

interface FoodMacros {
  food_reference_id: string;
  per_100g_kcal: number;
  per_100g_protein_g: number;
  per_100g_fat_g: number;
  per_100g_carb_g: number;
}

interface ComparatorFood {
  id: string;
  name: string;
  category: string;
  kcal: number;
  protein: number;
  fat: number;
  carb: number;
  cost_level: string;
}

const COST_LABELS: Record<string, string> = {
  BAIXO: "$",
  MEDIO: "$$",
  ALTO: "$$$",
};

function FoodSelector({
  foods,
  selectedId,
  onSelect,
  placeholder,
}: {
  foods: FoodRef[];
  selectedId: string | null;
  onSelect: (food: FoodRef) => void;
  placeholder: string;
}) {
  const [open, setOpen] = useState(false);
  const selected = foods.find(f => f.id === selectedId);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-full justify-start text-left h-auto py-2">
          {selected ? (
            <span className="truncate">{selected.name}</span>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Buscar alimento..." />
          <CommandList>
            <CommandEmpty>Nenhum encontrado.</CommandEmpty>
            <CommandGroup>
              {foods.map(food => (
                <CommandItem
                  key={food.id}
                  value={food.name}
                  onSelect={() => {
                    onSelect(food);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn("w-4 h-4 mr-2", selectedId === food.id ? "opacity-100" : "opacity-0")}
                  />
                  <span className="truncate">{food.name}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export default function FoodComparator() {
  const [foodRefs, setFoodRefs] = useState<FoodRef[]>([]);
  const [macros, setMacros] = useState<FoodMacros[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<(string | null)[]>([null, null]);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      const [foodRes, macrosRes] = await Promise.all([
        supabase.from("food_reference").select("id, name, category_main, cost_level").order("name"),
        supabase.from("food_macros_reference").select("food_reference_id, per_100g_kcal, per_100g_protein_g, per_100g_fat_g, per_100g_carb_g"),
      ]);

      if (foodRes.data) setFoodRefs(foodRes.data);
      if (macrosRes.data) setMacros(macrosRes.data);
      setIsLoading(false);
    };
    fetchData();
  }, []);

  const getComparatorFood = (id: string | null): ComparatorFood | null => {
    if (!id) return null;
    const food = foodRefs.find(f => f.id === id);
    const macro = macros.find(m => m.food_reference_id === id);
    if (!food) return null;
    return {
      id: food.id,
      name: food.name,
      category: food.category_main,
      kcal: macro?.per_100g_kcal || 0,
      protein: macro?.per_100g_protein_g || 0,
      fat: macro?.per_100g_fat_g || 0,
      carb: macro?.per_100g_carb_g || 0,
      cost_level: food.cost_level || "MEDIO",
    };
  };

  const comparedFoods = selectedIds.map(getComparatorFood).filter(Boolean) as ComparatorFood[];

  const handleSelect = (index: number, food: FoodRef) => {
    setSelectedIds(prev => {
      const updated = [...prev];
      updated[index] = food.id;
      return updated;
    });
  };

  const handleRemove = (index: number) => {
    setSelectedIds(prev => {
      const updated = [...prev];
      updated[index] = null;
      return updated;
    });
  };

  const handleAddSlot = () => {
    if (selectedIds.length < 3) {
      setSelectedIds(prev => [...prev, null]);
    }
  };

  const maxKcal = Math.max(...comparedFoods.map(f => f.kcal), 1);
  const maxProtein = Math.max(...comparedFoods.map(f => f.protein), 1);
  const maxFat = Math.max(...comparedFoods.map(f => f.fat), 1);
  const maxCarb = Math.max(...comparedFoods.map(f => f.carb), 1);

  const COLORS = ["hsl(var(--primary))", "hsl(var(--accent))", "#22c55e"];

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <FeatureGate feature="food_comparator">
        <div className="page-container page-content">
          {/* Header */}
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              <ArrowLeftRight className="w-5 h-5 text-primary" />
              Comparador de Alimentos
            </h1>
            <p className="text-sm text-muted-foreground">
              Compare ate 3 alimentos lado a lado
            </p>
          </div>

          {/* Selectors */}
          <Card>
            <CardContent className="p-4 space-y-3">
              {selectedIds.map((id, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: COLORS[index] }}
                  />
                  <div className="flex-1">
                    <FoodSelector
                      foods={foodRefs}
                      selectedId={id}
                      onSelect={(food) => handleSelect(index, food)}
                      placeholder={`Alimento ${index + 1}`}
                    />
                  </div>
                  {id && (
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleRemove(index)}>
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
              {selectedIds.length < 3 && (
                <Button variant="outline" size="sm" className="w-full gap-2" onClick={handleAddSlot}>
                  <Plus className="w-4 h-4" />
                  Adicionar alimento
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Comparison Table */}
          {comparedFoods.length >= 2 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Comparacao (por 100g)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Kcal */}
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Calorias (kcal)</p>
                  {comparedFoods.map((food, i) => (
                    <div key={food.id} className="flex items-center gap-2 mb-1">
                      <span className="text-xs w-20 truncate">{food.name}</span>
                      <div className="flex-1 h-4 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${(food.kcal / maxKcal) * 100}%`,
                            backgroundColor: COLORS[i],
                          }}
                        />
                      </div>
                      <span className="text-xs font-bold w-12 text-right">{food.kcal}</span>
                    </div>
                  ))}
                </div>

                {/* Protein */}
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Proteina (g)</p>
                  {comparedFoods.map((food, i) => (
                    <div key={food.id} className="flex items-center gap-2 mb-1">
                      <span className="text-xs w-20 truncate">{food.name}</span>
                      <div className="flex-1 h-4 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${(food.protein / maxProtein) * 100}%`,
                            backgroundColor: COLORS[i],
                          }}
                        />
                      </div>
                      <span className="text-xs font-bold w-12 text-right">{food.protein}g</span>
                    </div>
                  ))}
                </div>

                {/* Fat */}
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Gordura (g)</p>
                  {comparedFoods.map((food, i) => (
                    <div key={food.id} className="flex items-center gap-2 mb-1">
                      <span className="text-xs w-20 truncate">{food.name}</span>
                      <div className="flex-1 h-4 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${(food.fat / maxFat) * 100}%`,
                            backgroundColor: COLORS[i],
                          }}
                        />
                      </div>
                      <span className="text-xs font-bold w-12 text-right">{food.fat}g</span>
                    </div>
                  ))}
                </div>

                {/* Carbs */}
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Carboidratos (g)</p>
                  {comparedFoods.map((food, i) => (
                    <div key={food.id} className="flex items-center gap-2 mb-1">
                      <span className="text-xs w-20 truncate">{food.name}</span>
                      <div className="flex-1 h-4 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${(food.carb / maxCarb) * 100}%`,
                            backgroundColor: COLORS[i],
                          }}
                        />
                      </div>
                      <span className="text-xs font-bold w-12 text-right">{food.carb}g</span>
                    </div>
                  ))}
                </div>

                {/* Cost */}
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Custo estimado</p>
                  <div className="flex gap-3">
                    {comparedFoods.map((food, i) => (
                      <div key={food.id} className="flex-1 p-2 rounded-lg bg-muted/50 text-center">
                        <p className="text-xs truncate">{food.name}</p>
                        <p className="font-bold" style={{ color: COLORS[i] }}>
                          {COST_LABELS[food.cost_level] || "$$"}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Empty state */}
          {comparedFoods.length < 2 && (
            <Card className="border-dashed">
              <CardContent className="p-8 text-center">
                <ArrowLeftRight className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  Selecione pelo menos 2 alimentos para comparar
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </FeatureGate>
    </AppLayout>
  );
}
