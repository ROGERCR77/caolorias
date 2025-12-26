import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { AppLayout } from "@/components/app/AppLayout";
import { DogSelector } from "@/components/app/DogSelector";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { useData, Food } from "@/contexts/DataContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Trash2, UtensilsCrossed, X, Dog, Loader2, Info, Bell } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format, parseISO, isToday, isThisWeek, isThisMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { FoodSearchCombobox, FoodReferenceWithMacros } from "@/components/app/FoodSearchCombobox";
import { formatFoodShort } from "@/lib/formatFoodDisplay";

// Map food_reference category_main to foods category
const categoryMainToCategory: Record<string, string> = {
  "PROTEINA": "protein",
  "CARBOIDRATO": "carb",
  "VEGETAL": "vegetable",
  "VISCERA": "viscera",
  "GORDURA": "fat",
  "SUPLEMENTO": "supplement",
  "RACAO": "kibble",
  "PETISCO": "treat",
  "EXTRA": "extra",
  "OUTRO": "other",
};

type FilterPeriod = "today" | "week" | "month" | "all";

const categoryOptions = [
  { value: "protein", label: "Proteína" },
  { value: "carb", label: "Carboidrato" },
  { value: "vegetable", label: "Vegetal" },
  { value: "viscera", label: "Víscera" },
  { value: "fat", label: "Gordura" },
  { value: "supplement", label: "Suplemento" },
  { value: "kibble", label: "Ração" },
  { value: "treat", label: "Petisco" },
  { value: "extra", label: "Extra" },
  { value: "other", label: "Outro" },
];

const Meals = () => {
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { dogs, foods, meals, selectedDogId, setSelectedDogId, addMeal, deleteMeal, addFood, isLoading: dataLoading } = useData();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [filterPeriod, setFilterPeriod] = useState<FilterPeriod>("today");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createReminder, setCreateReminder] = useState(false);
  
  // Custom food creation state
  const [isCreatingCustomFood, setIsCreatingCustomFood] = useState(false);
  const [customFoodItemIndex, setCustomFoodItemIndex] = useState<number | null>(null);
  const [customFoodForm, setCustomFoodForm] = useState({
    name: "",
    category: "other" as Food["category"],
    kcal_per_100g: "",
    unit_type: "GRAMA",
    grams_per_unit: "",
  });

  const selectedDog = dogs.find((d) => d.id === selectedDogId);

  // Form state
  const [formData, setFormData] = useState({
    dogId: selectedDogId || "",
    dateTime: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
    title: "",
    items: [] as { foodId: string; grams: number; foodName?: string; unitType?: string; gramsPerUnit?: number | null }[],
  });

  // Open dialog if ?new=true
  useEffect(() => {
    if (searchParams.get("new") === "true") {
      openNewMealDialog();
    }
  }, [searchParams]);

  // Update form dogId when selectedDogId changes
  useEffect(() => {
    if (selectedDogId) {
      setFormData((prev) => ({ ...prev, dogId: selectedDogId }));
    }
  }, [selectedDogId]);

  const resetForm = () => {
    setFormData({
      dogId: selectedDogId || "",
      dateTime: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
      title: "",
      items: [],
    });
    setCreateReminder(false);
  };

  const openNewMealDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const openCustomFoodForm = (itemIndex: number) => {
    setCustomFoodItemIndex(itemIndex);
    setCustomFoodForm({
      name: "",
      category: "other",
      kcal_per_100g: "",
      unit_type: "GRAMA",
      grams_per_unit: "",
    });
    setIsCreatingCustomFood(true);
  };

  const handleCreateCustomFood = async () => {
    if (!customFoodForm.name.trim()) {
      toast({
        title: "Nome obrigatório",
        description: "Informe o nome do alimento.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const newFood = await addFood({
        name: customFoodForm.name.trim(),
        category: customFoodForm.category,
        kcal_per_100g: customFoodForm.kcal_per_100g ? parseInt(customFoodForm.kcal_per_100g) : null,
        unit_type: customFoodForm.unit_type,
        grams_per_unit: customFoodForm.grams_per_unit ? parseFloat(customFoodForm.grams_per_unit) : null,
      });

      // Update the meal item with the new food
      if (customFoodItemIndex !== null) {
        setFormData((prev) => ({
          ...prev,
          items: prev.items.map((item, i) =>
            i === customFoodItemIndex
              ? {
                  ...item,
                  foodId: newFood.id,
                  foodName: newFood.name,
                  unitType: newFood.unit_type || "GRAMA",
                  gramsPerUnit: newFood.grams_per_unit || null,
                  grams: newFood.grams_per_unit || 100,
                }
              : item
          ),
        }));
      }

      toast({
        title: "Alimento criado!",
        description: `${newFood.name} foi adicionado à sua lista.`,
      });

      setIsCreatingCustomFood(false);
      setCustomFoodItemIndex(null);
    } catch (error) {
      toast({
        title: "Erro ao criar alimento",
        description: "Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const addItem = () => {
    setFormData((prev) => ({
      ...prev,
      items: [...prev.items, { foodId: "", grams: 0, foodName: "", unitType: "GRAMA", gramsPerUnit: null }],
    }));
  };

  const updateItemFromReference = (index: number, food: FoodReferenceWithMacros | null) => {
    if (!food) return;
    
    // Check if food already exists in user's foods
    const existingFood = foods.find(f => f.reference_food_id === food.id);
    
    setFormData((prev) => ({
      ...prev,
      items: prev.items.map((item, i) =>
        i === index ? { 
          ...item, 
          foodId: existingFood?.id || food.id, // Use existing or will create on submit
          foodName: food.name,
          unitType: food.default_unit,
          gramsPerUnit: food.unit_gram_equivalence,
          grams: food.unit_gram_equivalence || 100, // Default to 1 unit or 100g
          _referenceFood: food, // Store reference for creation
        } : item
      ),
    }));
  };

  const updateItem = (index: number, field: "foodId" | "grams", value: string | number) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      ),
    }));
  };

  const removeItem = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const createMealReminder = async (dogId: string, dogName: string, mealTime: string) => {
    if (!user) return;
    
    // Extract time from datetime
    const time = mealTime.split('T')[1]?.substring(0, 5) || '08:00';
    
    // Check if reminder already exists for this time and dog
    const { data: existingReminders } = await supabase
      .from('reminders')
      .select('id')
      .eq('user_id', user.id)
      .eq('dog_id', dogId)
      .eq('time', time)
      .eq('type', 'meal');

    if (existingReminders && existingReminders.length > 0) {
      toast({
        title: "Lembrete já existe",
        description: `Você já tem um lembrete de refeição configurado para ${time}.`,
      });
      return;
    }

    // Create new reminder
    const { error } = await supabase.from('reminders').insert({
      user_id: user.id,
      dog_id: dogId,
      title: `Hora de alimentar ${dogName}`,
      type: 'meal',
      time: time,
      days_of_week: [0, 1, 2, 3, 4, 5, 6], // All days
      enabled: true,
    });

    if (!error) {
      toast({
        title: "Lembrete criado! 🔔",
        description: `Você será lembrado às ${time} todos os dias.`,
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.dogId) {
      toast({
        title: "Selecione um cão",
        description: "Por favor, selecione para qual cão é essa refeição.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.title.trim()) {
      toast({
        title: "Nome da refeição",
        description: "Por favor, informe um nome para a refeição (ex: Café da manhã).",
        variant: "destructive",
      });
      return;
    }

    if (formData.items.length === 0 || formData.items.some(item => !item.foodId)) {
      toast({
        title: "Adicione alimentos",
        description: "Por favor, adicione pelo menos um alimento à refeição.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Process reference foods that don't exist in user's foods yet
      const processedItems: { foodId: string; grams: number }[] = [];
      let totalKcalEstimated = 0;

      for (const item of formData.items) {
        const referenceFood = (item as any)._referenceFood as FoodReferenceWithMacros | undefined;
        
        // Check if this is a reference food that needs to be created
        const existingFood = foods.find(f => f.id === item.foodId);
        
        if (referenceFood && !existingFood) {
          // Create the food from reference
          const category = categoryMainToCategory[referenceFood.category_main] || "other";
          const newFood = await addFood({
            name: referenceFood.name,
            category: category as Food["category"],
            kcal_per_100g: referenceFood.macros?.per_100g_kcal ? Math.round(referenceFood.macros.per_100g_kcal) : null,
            reference_food_id: referenceFood.id,
            unit_type: referenceFood.default_unit,
            grams_per_unit: referenceFood.unit_gram_equivalence,
            protein_g: referenceFood.macros?.per_100g_protein_g,
            fat_g: referenceFood.macros?.per_100g_fat_g,
            carb_g: referenceFood.macros?.per_100g_carb_g,
            cost_level: referenceFood.cost_level,
          });
          
          processedItems.push({ foodId: newFood.id, grams: item.grams });
          
          // Calculate kcal from reference data
          if (referenceFood.macros?.per_100g_kcal) {
            totalKcalEstimated += Math.round((item.grams * referenceFood.macros.per_100g_kcal) / 100);
          }
        } else {
          processedItems.push({ foodId: item.foodId, grams: item.grams });
          
          // Calculate kcal from existing food
          if (existingFood?.kcal_per_100g) {
            totalKcalEstimated += Math.round((item.grams * existingFood.kcal_per_100g) / 100);
          }
        }
      }

      const totalGrams = processedItems.reduce((sum, item) => sum + item.grams, 0);

      await addMeal(
        {
          dog_id: formData.dogId,
          date_time: new Date(formData.dateTime).toISOString(),
          title: formData.title.trim(),
          total_grams: totalGrams,
          total_kcal_estimated: totalKcalEstimated > 0 ? totalKcalEstimated : null,
        },
        processedItems
      );

      // Create reminder if checkbox is checked
      if (createReminder && selectedDog) {
        await createMealReminder(formData.dogId, selectedDog.name, formData.dateTime);
      }

      const dogName = selectedDog?.name || "seu cão";
      toast({
        title: "Refeição registrada!",
        description: `Quanto mais dias você registrar, mais fácil ficará entender a rotina alimentar de ${dogName}.`,
      });

      setIsDialogOpen(false);
      resetForm();
    } catch (error: any) {
      toast({
        title: "Algo deu errado",
        description: "Tente novamente. Se o problema continuar, entre em contato com o suporte.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (mealId: string) => {
    if (confirm(`Tem certeza que deseja remover essa refeição?`)) {
      try {
        await deleteMeal(mealId);
        toast({
          title: "Refeição removida",
          description: "A refeição foi removida.",
        });
      } catch (error: any) {
        toast({
          title: "Algo deu errado",
          description: "Tente novamente. Se o problema continuar, entre em contato com o suporte.",
          variant: "destructive",
        });
      }
    }
  };

  // Filter meals
  const filteredMeals = meals
    .filter((meal) => {
      if (selectedDogId && meal.dog_id !== selectedDogId) return false;
      
      const date = parseISO(meal.date_time);
      switch (filterPeriod) {
        case "today":
          return isToday(date);
        case "week":
          return isThisWeek(date, { locale: ptBR });
        case "month":
          return isThisMonth(date);
        default:
          return true;
      }
    })
    .sort((a, b) => new Date(b.date_time).getTime() - new Date(a.date_time).getTime());

  const getFood = (foodId: string) => {
    return foods.find((f) => f.id === foodId);
  };

  const getFoodDisplayName = (foodId: string, grams: number) => {
    const food = getFood(foodId);
    if (!food) return `Alimento (${grams}g)`;
    
    return formatFoodShort({
      name: food.name,
      grams,
      unit_type: food.unit_type,
      grams_per_unit: food.grams_per_unit,
    });
  };

  const getDogName = (dogId: string) => {
    return dogs.find((d) => d.id === dogId)?.name || "Cão";
  };

  if (dataLoading) {
    return (
      <AppLayout>
        <div className="page-container flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  if (dogs.length === 0) {
    return (
      <AppLayout>
        <div className="page-container">
          <Card variant="elevated" className="max-w-md mx-auto text-center">
            <CardContent className="pt-8 pb-8">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary-light flex items-center justify-center">
                <Dog className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-xl font-bold mb-2">Cadastre um cão primeiro</h2>
              <p className="text-muted-foreground mb-6">
                Para registrar refeições, você precisa ter pelo menos um cão cadastrado.
              </p>
              <Button asChild variant="hero" size="lg">
                <Link to="/app/caes">
                  <Plus className="w-4 h-4" />
                  Cadastrar meu cão
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="page-container page-content">
        <div className="flex flex-col gap-items">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Refeições</h1>
            <Button onClick={openNewMealDialog} variant="accent">
              <Plus className="w-4 h-4" />
              Nova refeição
            </Button>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <DogSelector className="flex-1 sm:max-w-48" />
            <Select value={filterPeriod} onValueChange={(v) => setFilterPeriod(v as FilterPeriod)}>
              <SelectTrigger className="flex-1 sm:max-w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-card">
                <SelectItem value="today">Hoje</SelectItem>
                <SelectItem value="week">Esta semana</SelectItem>
                <SelectItem value="month">Este mês</SelectItem>
                <SelectItem value="all">Todas</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {filteredMeals.length === 0 ? (
          <Card variant="elevated" className="text-center py-12">
            <CardContent>
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-accent-light flex items-center justify-center">
                <UtensilsCrossed className="w-8 h-8 text-accent" />
              </div>
              <h2 className="text-lg font-semibold mb-2">Nenhuma refeição encontrada</h2>
              <p className="text-muted-foreground mb-4">
                {filterPeriod === "today"
                  ? "Nenhuma refeição registrada hoje."
                  : "Nenhuma refeição registrada nesse período."}
              </p>
              <Button onClick={openNewMealDialog} variant="hero">
                <Plus className="w-4 h-4" />
                Registrar primeira refeição
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredMeals.map((meal) => (
              <Card key={meal.id} variant="interactive">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold">{meal.title}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-primary-light text-primary">
                          {getDogName(meal.dog_id)}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {format(parseISO(meal.date_time), "dd/MM 'às' HH:mm", { locale: ptBR })}
                      </p>
                      {meal.meal_items && meal.meal_items.length > 0 && (
                        <p className="text-sm text-muted-foreground">
                          {meal.meal_items.map((item) => getFoodDisplayName(item.food_id, item.grams)).join(", ")}
                        </p>
                      )}
                      <div className="mt-2 flex gap-4 text-sm">
                        <span className="text-primary font-medium">{meal.total_grams}g total</span>
                        {meal.total_kcal_estimated && (
                          <span className="text-accent font-medium">~{meal.total_kcal_estimated} kcal</span>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="text-destructive hover:text-destructive shrink-0"
                      onClick={() => handleDelete(meal.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* New Meal Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-lg bg-card max-h-[85dvh] flex flex-col">
            <DialogHeader className="flex-shrink-0">
              <DialogTitle>Registrar refeição</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto keyboard-scroll-container space-y-4 pr-1">
              {/* Help text */}
              <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50 text-sm">
                <Info className="w-4 h-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                <p className="text-muted-foreground">
                  Inclua aqui tudo o que {selectedDog?.name || "seu cão"} comeu nessa refeição, incluindo petiscos, se forem dados junto.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Cão *</Label>
                  <Select
                    value={formData.dogId}
                    onValueChange={(v) => setFormData({ ...formData, dogId: v })}
                    disabled={isSubmitting}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecionar" />
                    </SelectTrigger>
                    <SelectContent className="bg-card">
                      {dogs.map((dog) => (
                        <SelectItem key={dog.id} value={dog.id}>{dog.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dateTime">Data e hora</Label>
                  <Input
                    id="dateTime"
                    type="datetime-local"
                    value={formData.dateTime}
                    onChange={(e) => setFormData({ ...formData, dateTime: e.target.value })}
                    disabled={isSubmitting}
                    className="w-full"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">Nome da refeição *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Ex: Café da manhã, Jantar, Petisco da tarde"
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Alimentos</Label>
                  <Button type="button" variant="soft" size="sm" onClick={addItem} disabled={isSubmitting}>
                    <Plus className="w-4 h-4" />
                    Adicionar
                  </Button>
                </div>

                {formData.items.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4 border rounded-lg border-dashed">
                    Clique em "Adicionar" para incluir alimentos
                  </p>
                ) : (
                  <div className="space-y-3">
                    {formData.items.map((item, index) => (
                      <div key={index} className="p-3 rounded-lg bg-muted/50 space-y-3">
                        <div className="flex items-start gap-2">
                          <div className="flex-1 space-y-1">
                            <Label className="text-xs">Alimento</Label>
                            <FoodSearchCombobox
                              selectedFood={item.foodName ? {
                                id: item.foodId,
                                name: item.foodName,
                                aliases: [],
                                category_main: "PROTEINA",
                                default_unit: item.unitType || "GRAMA",
                                unit_gram_equivalence: item.gramsPerUnit || null,
                                cost_level: "MEDIO",
                                notes_simple: null,
                                cautions: null,
                              } : null}
                              onSelect={(food) => updateItemFromReference(index, food)}
                              onCreateCustom={() => openCustomFoodForm(index)}
                              disabled={isSubmitting}
                            />
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            className="text-destructive shrink-0 mt-6"
                            onClick={() => removeItem(index)}
                            disabled={isSubmitting}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                        
                        <div className="flex items-end gap-3">
                          {item.unitType && item.unitType !== "GRAMA" && item.gramsPerUnit && item.gramsPerUnit > 0 ? (
                            <>
                              <div className="flex-1 space-y-1">
                                <Label className="text-xs">Quantidade</Label>
                                <div className="flex items-center gap-2">
                                  <Input
                                    type="number"
                                    step="0.5"
                                    className="h-9 w-20"
                                    value={item.gramsPerUnit ? Math.round((item.grams / item.gramsPerUnit) * 10) / 10 || "" : ""}
                                    onChange={(e) => {
                                      const units = parseFloat(e.target.value) || 0;
                                      const grams = Math.round(units * (item.gramsPerUnit || 1));
                                      updateItem(index, "grams", grams);
                                    }}
                                    disabled={isSubmitting}
                                  />
                                  <span className="text-sm text-muted-foreground">
                                    {item.unitType === "UNIDADE" ? "unid." : item.unitType === "COLHER_SOPA" ? "colher" : item.unitType}
                                  </span>
                                </div>
                              </div>
                              <div className="text-sm text-muted-foreground pb-2">
                                = {item.grams}g
                              </div>
                            </>
                          ) : (
                            <div className="flex-1 space-y-1">
                              <Label className="text-xs">Gramas</Label>
                              <Input
                                type="number"
                                className="h-9"
                                value={item.grams || ""}
                                onChange={(e) => updateItem(index, "grams", parseInt(e.target.value) || 0)}
                                placeholder="g"
                                disabled={isSubmitting}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                    <p className="text-xs text-muted-foreground">
                      Use a mesma forma de pesagem do cardápio do veterinário (cru ou cozido).
                    </p>
                  </div>
                )}
              </div>

              {/* Reminder checkbox */}
              <div className="flex items-start gap-3 p-3 rounded-lg bg-primary/5 border border-primary/20">
                <Checkbox
                  id="createReminder"
                  checked={createReminder}
                  onCheckedChange={(checked) => setCreateReminder(!!checked)}
                  disabled={isSubmitting}
                />
                <div className="space-y-1">
                  <Label htmlFor="createReminder" className="cursor-pointer flex items-center gap-2">
                    <Bell className="w-4 h-4 text-primary" />
                    Lembrar neste horário todos os dias
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Você receberá uma notificação diária para alimentar {selectedDog?.name || "seu cão"}
                  </p>
                </div>
              </div>

              <div className="flex gap-3 pt-4 pb-safe sticky bottom-0 bg-card">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setIsDialogOpen(false)} disabled={isSubmitting}>
                  Cancelar
                </Button>
                <Button type="submit" variant="accent" className="flex-1" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Salvar refeição"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Custom Food Creation Dialog */}
        <Dialog open={isCreatingCustomFood} onOpenChange={setIsCreatingCustomFood}>
          <DialogContent className="sm:max-w-md bg-card">
            <DialogHeader>
              <DialogTitle>Criar alimento personalizado</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="customFoodName">Nome do alimento *</Label>
                <Input
                  id="customFoodName"
                  value={customFoodForm.name}
                  onChange={(e) => setCustomFoodForm({ ...customFoodForm, name: e.target.value })}
                  placeholder="Ex: Frango desfiado"
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <Label>Categoria</Label>
                <Select
                  value={customFoodForm.category}
                  onValueChange={(v) => setCustomFoodForm({ ...customFoodForm, category: v as Food["category"] })}
                  disabled={isSubmitting}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card">
                    {categoryOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="customFoodKcal">Calorias por 100g (opcional)</Label>
                <Input
                  id="customFoodKcal"
                  type="number"
                  value={customFoodForm.kcal_per_100g}
                  onChange={(e) => setCustomFoodForm({ ...customFoodForm, kcal_per_100g: e.target.value })}
                  placeholder="Ex: 165"
                  disabled={isSubmitting}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Unidade de medida</Label>
                  <Select
                    value={customFoodForm.unit_type}
                    onValueChange={(v) => setCustomFoodForm({ ...customFoodForm, unit_type: v })}
                    disabled={isSubmitting}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-card">
                      <SelectItem value="GRAMA">Gramas</SelectItem>
                      <SelectItem value="UNIDADE">Unidade</SelectItem>
                      <SelectItem value="COLHER_SOPA">Colher de sopa</SelectItem>
                      <SelectItem value="COLHER_CHA">Colher de chá</SelectItem>
                      <SelectItem value="XICARA">Xícara</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {customFoodForm.unit_type !== "GRAMA" && (
                  <div className="space-y-2">
                    <Label htmlFor="customFoodGramsPerUnit">Gramas por unidade</Label>
                    <Input
                      id="customFoodGramsPerUnit"
                      type="number"
                      value={customFoodForm.grams_per_unit}
                      onChange={(e) => setCustomFoodForm({ ...customFoodForm, grams_per_unit: e.target.value })}
                      placeholder="Ex: 50"
                      disabled={isSubmitting}
                    />
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  className="flex-1" 
                  onClick={() => setIsCreatingCustomFood(false)}
                  disabled={isSubmitting}
                >
                  Cancelar
                </Button>
                <Button 
                  type="button" 
                  variant="accent" 
                  className="flex-1" 
                  onClick={handleCreateCustomFood}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Criar alimento"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
};

export default Meals;