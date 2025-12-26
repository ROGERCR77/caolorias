import { useState, useEffect, useMemo, useCallback } from "react";
import { Check, Search, Plus, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
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
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

// Cache configuration
const CACHE_KEY_FOOD_REF = 'caolorias_food_refs';
const CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

export interface FoodReferenceWithMacros {
  id: string;
  name: string;
  aliases: string[];
  category_main: string;
  default_unit: string;
  unit_gram_equivalence: number | null;
  cost_level: string;
  notes_simple: string | null;
  cautions: string | null;
  macros?: {
    per_100g_kcal: number;
    per_100g_protein_g: number;
    per_100g_fat_g: number;
    per_100g_carb_g: number;
  };
}

interface FoodSearchComboboxProps {
  onSelect: (food: FoodReferenceWithMacros | null) => void;
  onCreateCustom: () => void;
  selectedFood: FoodReferenceWithMacros | null;
  disabled?: boolean;
}

const categoryLabels: Record<string, string> = {
  PROTEINA: "Proteína",
  VISCERA: "Víscera",
  CARBO: "Carboidrato",
  VEGETAL: "Vegetal",
  GORDURA: "Gordura",
  SUPLEMENTO: "Suplemento",
  EXTRA: "Extra",
};

const categoryColors: Record<string, string> = {
  PROTEINA: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  VISCERA: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  CARBO: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  VEGETAL: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  GORDURA: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  SUPLEMENTO: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  EXTRA: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400",
};

const costIcons: Record<string, string> = {
  BAIXO: "💰",
  MEDIO: "💰💰",
  ALTO: "💰💰💰",
};

const unitLabels: Record<string, string> = {
  GRAMA: "gramas",
  UNIDADE: "unidade",
  COLHER_SOPA: "colher de sopa",
  COLHER_CHA: "colher de chá",
  XICARA: "xícara",
};

export function FoodSearchCombobox({
  onSelect,
  onCreateCustom,
  selectedFood,
  disabled = false,
}: FoodSearchComboboxProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [foodReferences, setFoodReferences] = useState<FoodReferenceWithMacros[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchFoodReferences = useCallback(async () => {
    setIsLoading(true);
    
    // Check cache first
    try {
      const cached = localStorage.getItem(CACHE_KEY_FOOD_REF);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < CACHE_EXPIRY) {
          setFoodReferences(data);
          setIsLoading(false);
          return;
        }
      }
    } catch (e) {
      // Ignore cache errors
    }

    try {
      const [foodsRes, macrosRes] = await Promise.all([
        supabase.from("food_reference").select("*").order("name"),
        supabase.from("food_macros_reference").select("*"),
      ]);

      if (foodsRes.error) throw foodsRes.error;
      if (macrosRes.error) throw macrosRes.error;

      const macrosMap = new Map(
        macrosRes.data?.map((m) => [m.food_reference_id, m])
      );

      const enrichedFoods: FoodReferenceWithMacros[] = (foodsRes.data || []).map((f) => {
        const macro = macrosMap.get(f.id);
        return {
          ...f,
          macros: macro
            ? {
                per_100g_kcal: macro.per_100g_kcal,
                per_100g_protein_g: macro.per_100g_protein_g,
                per_100g_fat_g: macro.per_100g_fat_g,
                per_100g_carb_g: macro.per_100g_carb_g,
              }
            : undefined,
        };
      });

      setFoodReferences(enrichedFoods);
      
      // Cache the result
      try {
        localStorage.setItem(CACHE_KEY_FOOD_REF, JSON.stringify({ 
          data: enrichedFoods, 
          timestamp: Date.now() 
        }));
      } catch (e) { /* ignore */ }
    } catch (error) {
      console.error("Error fetching food references:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFoodReferences();
  }, [fetchFoodReferences]);

  const filteredFoods = useMemo(() => {
    if (!search.trim()) return foodReferences;

    const searchLower = search.toLowerCase();
    return foodReferences.filter((food) => {
      const nameMatch = food.name.toLowerCase().includes(searchLower);
      const aliasMatch = food.aliases?.some((alias) =>
        alias.toLowerCase().includes(searchLower)
      );
      return nameMatch || aliasMatch;
    });
  }, [search, foodReferences]);

  const formatUnitDisplay = (food: FoodReferenceWithMacros) => {
    if (food.default_unit === "GRAMA") return null;
    if (!food.unit_gram_equivalence) return null;
    return `1 ${unitLabels[food.default_unit]} ≈ ${food.unit_gram_equivalence}g`;
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between h-auto min-h-10 py-2"
          disabled={disabled}
        >
          {selectedFood ? (
            <div className="flex items-center gap-2 text-left flex-1 min-w-0">
              <span className="truncate font-medium">{selectedFood.name}</span>
              <Badge variant="secondary" className={cn("text-xs shrink-0", categoryColors[selectedFood.category_main])}>
                {categoryLabels[selectedFood.category_main]}
              </Badge>
            </div>
          ) : (
            <span className="text-muted-foreground flex items-center gap-2">
              <Search className="w-4 h-4" />
              Buscar alimento...
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[340px] p-0 bg-card" align="start">
        <Command>
          <CommandInput
            placeholder="Digite: ovo, frango, batata..."
            value={search}
            onValueChange={setSearch}
          />
          <CommandList className="max-h-[300px]">
            {isLoading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                <CommandEmpty>
                  <div className="py-4 text-center">
                    <p className="text-sm text-muted-foreground mb-3">
                      Nenhum alimento encontrado
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setOpen(false);
                        onCreateCustom();
                      }}
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Criar alimento personalizado
                    </Button>
                  </div>
                </CommandEmpty>
                <CommandGroup>
                  {filteredFoods.map((food) => (
                    <CommandItem
                      key={food.id}
                      value={food.name}
                      onSelect={() => {
                        onSelect(food);
                        setOpen(false);
                        setSearch("");
                      }}
                      className="flex flex-col items-start gap-1 py-3 cursor-pointer"
                    >
                      <div className="flex items-center gap-2 w-full">
                        <Check
                          className={cn(
                            "w-4 h-4 shrink-0",
                            selectedFood?.id === food.id ? "opacity-100" : "opacity-0"
                          )}
                        />
                        <span className="font-medium truncate flex-1">
                          {food.name}
                        </span>
                        <span className="text-xs shrink-0">
                          {costIcons[food.cost_level]}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 ml-6 flex-wrap">
                        <Badge variant="secondary" className={cn("text-xs", categoryColors[food.category_main])}>
                          {categoryLabels[food.category_main]}
                        </Badge>
                        {food.macros && (
                          <span className="text-xs text-muted-foreground">
                            {food.macros.per_100g_kcal} kcal/100g
                          </span>
                        )}
                        {formatUnitDisplay(food) && (
                          <span className="text-xs text-muted-foreground">
                            • {formatUnitDisplay(food)}
                          </span>
                        )}
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}
          </CommandList>
          <div className="border-t p-2">
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start text-muted-foreground"
              onClick={() => {
                setOpen(false);
                onCreateCustom();
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Criar alimento personalizado
            </Button>
          </div>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
