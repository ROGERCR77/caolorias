import { useState, useMemo, useEffect } from "react";
import { AppLayout } from "@/components/app/AppLayout";
import { DogSelector } from "@/components/app/DogSelector";
import { useData } from "@/contexts/DataContext";
import { supabase } from "@/lib/supabaseClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { 
  ShoppingCart, Share2, Copy, Loader2, RefreshCw, 
  Apple, Beef, Wheat, Carrot, Package
} from "lucide-react";

interface ShoppingItem {
  id: string;
  name: string;
  category: string;
  grams: number;
  checked: boolean;
}

const categoryIcons: Record<string, typeof Apple> = {
  protein: Beef,
  carbohydrate: Wheat,
  vegetable: Carrot,
  other: Package,
  proteína: Beef,
  carboidrato: Wheat,
  vegetal: Carrot,
  outro: Package,
};

const categoryLabels: Record<string, string> = {
  protein: "Proteínas",
  carbohydrate: "Carboidratos",
  vegetable: "Vegetais",
  other: "Outros",
  proteína: "Proteínas",
  carboidrato: "Carboidratos",
  vegetal: "Vegetais",
  outro: "Outros",
};

const STORAGE_KEY = "caolorias_shopping_list";

export default function ShoppingList() {
  const { selectedDogId, dogs, foods, isLoading: dataLoading } = useData();
  const [days, setDays] = useState(7);
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const selectedDog = dogs.find((d) => d.id === selectedDogId);

  // Load checked state from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setItems((prev) =>
          prev.map((item) => ({
            ...item,
            checked: parsed[item.id] || false,
          }))
        );
      } catch (e) {
        console.error("Error loading shopping list state:", e);
      }
    }
  }, []);

  // Save checked state to localStorage
  const saveCheckedState = (updatedItems: ShoppingItem[]) => {
    const checkedState = updatedItems.reduce((acc, item) => {
      acc[item.id] = item.checked;
      return acc;
    }, {} as Record<string, boolean>);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(checkedState));
  };

  // Generate shopping list from meal plan
  const generateList = async () => {
    if (!selectedDogId || !selectedDog) {
      toast.error("Selecione um cão primeiro");
      return;
    }

    setIsLoading(true);
    try {
      // Get active meal plan
      const { data: mealPlan, error: planError } = await supabase
        .from("meal_plans")
        .select("*, meal_plan_items(*)")
        .eq("dog_id", selectedDogId)
        .eq("ativo", true)
        .single();

      if (planError || !mealPlan) {
        // Fallback: use dog's daily goals
        const dailyGrams = selectedDog.meta_gramas_dia || 300;
        const totalGrams = dailyGrams * days;

        // Create basic shopping list based on typical proportions
        const basicItems: ShoppingItem[] = [
          {
            id: "protein",
            name: "Proteína (carne/frango/peixe)",
            category: "protein",
            grams: Math.round(totalGrams * 0.5),
            checked: false,
          },
          {
            id: "carb",
            name: "Carboidrato (arroz/batata)",
            category: "carbohydrate",
            grams: Math.round(totalGrams * 0.3),
            checked: false,
          },
          {
            id: "veg",
            name: "Vegetais (legumes variados)",
            category: "vegetable",
            grams: Math.round(totalGrams * 0.2),
            checked: false,
          },
        ];

        setItems(basicItems);
        toast.info("Lista gerada com base nas metas diárias");
        return;
      }

      // Calculate items from meal plan
      const planItems = mealPlan.meal_plan_items || [];
      const itemsMap = new Map<string, ShoppingItem>();

      planItems.forEach((item: any) => {
        const food = foods.find((f) => f.id === item.food_id);
        const category = item.categoria || food?.category || "other";
        const name = food?.name || item.categoria || "Item";
        const dailyGrams = Number(item.gramas_sugeridas) || 0;
        const totalGrams = dailyGrams * days * (mealPlan.numero_refeicoes_dia || 2);

        const key = name.toLowerCase();
        if (itemsMap.has(key)) {
          const existing = itemsMap.get(key)!;
          existing.grams += totalGrams;
        } else {
          itemsMap.set(key, {
            id: key,
            name,
            category,
            grams: totalGrams,
            checked: false,
          });
        }
      });

      const newItems = Array.from(itemsMap.values());
      setItems(newItems);
      toast.success(`Lista gerada para ${days} dias`);
    } catch (error) {
      console.error("Error generating shopping list:", error);
      toast.error("Erro ao gerar lista");
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle item checked state
  const toggleItem = (id: string) => {
    const updatedItems = items.map((item) =>
      item.id === id ? { ...item, checked: !item.checked } : item
    );
    setItems(updatedItems);
    saveCheckedState(updatedItems);
  };

  // Group items by category
  const groupedItems = useMemo(() => {
    return items.reduce((acc, item) => {
      const category = item.category || "other";
      if (!acc[category]) acc[category] = [];
      acc[category].push(item);
      return acc;
    }, {} as Record<string, ShoppingItem[]>);
  }, [items]);

  // Format list as text
  const formatListAsText = () => {
    let text = `🛒 Lista de Compras - ${selectedDog?.name || "Cão"} (${days} dias)\n\n`;
    
    Object.entries(groupedItems).forEach(([category, categoryItems]) => {
      text += `📦 ${categoryLabels[category] || category}\n`;
      categoryItems.forEach((item) => {
        const checkbox = item.checked ? "✅" : "⬜";
        text += `${checkbox} ${item.name} - ${item.grams}g\n`;
      });
      text += "\n";
    });

    text += "Gerado pelo Cãolorias 🐕";
    return text;
  };

  // Copy to clipboard
  const copyList = async () => {
    try {
      await navigator.clipboard.writeText(formatListAsText());
      toast.success("Lista copiada!");
    } catch (error) {
      toast.error("Erro ao copiar");
    }
  };

  // Share via WhatsApp
  const shareWhatsApp = () => {
    const text = encodeURIComponent(formatListAsText());
    window.open(`https://wa.me/?text=${text}`, "_blank");
  };

  // Reset checked state
  const resetChecked = () => {
    const resetItems = items.map((item) => ({ ...item, checked: false }));
    setItems(resetItems);
    localStorage.removeItem(STORAGE_KEY);
    toast.success("Lista resetada");
  };

  const checkedCount = items.filter((i) => i.checked).length;
  const totalGrams = items.reduce((sum, i) => sum + i.grams, 0);

  if (dataLoading) {
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
      <div className="page-container page-content">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-primary" />
              Lista de Compras
            </h1>
            <p className="text-sm text-muted-foreground">
              Gere uma lista baseada no plano alimentar
            </p>
          </div>
          <DogSelector />
        </div>

        {/* Settings */}
        <Card>
          <CardContent className="p-4 space-y-4">
            <div className="flex items-end gap-4">
              <div className="flex-1 space-y-2">
                <Label htmlFor="days">Quantidade de dias</Label>
                <Input
                  id="days"
                  type="number"
                  min={1}
                  max={30}
                  value={days}
                  onChange={(e) => setDays(Number(e.target.value) || 7)}
                />
              </div>
              <Button onClick={generateList} disabled={isLoading} className="gap-2">
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
                Gerar Lista
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Shopping List */}
        {items.length > 0 && (
          <>
            {/* Summary */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="secondary">
                  {checkedCount}/{items.length} itens
                </Badge>
                <Badge variant="outline">{Math.round(totalGrams / 1000)}kg total</Badge>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={resetChecked}>
                  Limpar
                </Button>
                <Button variant="outline" size="sm" onClick={copyList}>
                  <Copy className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={shareWhatsApp}>
                  <Share2 className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Items by Category */}
            {Object.entries(groupedItems).map(([category, categoryItems]) => {
              const Icon = categoryIcons[category] || Package;
              return (
                <Card key={category}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Icon className="w-4 h-4 text-primary" />
                      {categoryLabels[category] || category}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {categoryItems.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <Checkbox
                          id={item.id}
                          checked={item.checked}
                          onCheckedChange={() => toggleItem(item.id)}
                        />
                        <label
                          htmlFor={item.id}
                          className={`flex-1 text-sm cursor-pointer ${
                            item.checked ? "line-through text-muted-foreground" : ""
                          }`}
                        >
                          {item.name}
                        </label>
                        <span className="text-sm font-medium text-muted-foreground">
                          {item.grams >= 1000
                            ? `${(item.grams / 1000).toFixed(1)}kg`
                            : `${item.grams}g`}
                        </span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              );
            })}
          </>
        )}

        {/* Empty State */}
        {items.length === 0 && (
          <Card className="border-dashed">
            <CardContent className="p-8 text-center">
              <ShoppingCart className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                Clique em "Gerar Lista" para criar sua lista de compras
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
