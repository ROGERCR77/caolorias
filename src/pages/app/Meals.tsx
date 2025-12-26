import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { AppLayout } from "@/components/app/AppLayout";
import { DogSelector } from "@/components/app/DogSelector";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { useData } from "@/contexts/DataContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Trash2, UtensilsCrossed, X, Dog, Loader2, Info, Bell } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format, parseISO, isToday, isThisWeek, isThisMonth } from "date-fns";
import { ptBR } from "date-fns/locale";

type FilterPeriod = "today" | "week" | "month" | "all";

const Meals = () => {
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { dogs, foods, meals, selectedDogId, setSelectedDogId, addMeal, deleteMeal, isLoading: dataLoading } = useData();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [filterPeriod, setFilterPeriod] = useState<FilterPeriod>("today");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createReminder, setCreateReminder] = useState(false);

  const selectedDog = dogs.find((d) => d.id === selectedDogId);

  // Form state
  const [formData, setFormData] = useState({
    dogId: selectedDogId || "",
    dateTime: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
    title: "",
    items: [] as { foodId: string; grams: number }[],
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

  const addItem = () => {
    setFormData((prev) => ({
      ...prev,
      items: [...prev.items, { foodId: "", grams: 0 }],
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
      // Calculate totals
      const totalGrams = formData.items.reduce((sum, item) => sum + item.grams, 0);
      const totalKcalEstimated = formData.items.reduce((sum, item) => {
        const food = foods.find((f) => f.id === item.foodId);
        if (food?.kcal_per_100g) {
          return sum + Math.round((item.grams * food.kcal_per_100g) / 100);
        }
        return sum;
      }, 0);

      await addMeal(
        {
          dog_id: formData.dogId,
          date_time: new Date(formData.dateTime).toISOString(),
          title: formData.title.trim(),
          total_grams: totalGrams,
          total_kcal_estimated: totalKcalEstimated > 0 ? totalKcalEstimated : null,
        },
        formData.items
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

  const getFoodName = (foodId: string) => {
    return foods.find((f) => f.id === foodId)?.name || "Alimento";
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
                          {meal.meal_items.map((item) => `${getFoodName(item.food_id)} (${item.grams}g)`).join(", ")}
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
                  <div className="space-y-2">
                    {formData.items.map((item, index) => (
                      <div key={index} className="flex gap-2 items-end p-3 rounded-lg bg-muted/50">
                        <div className="flex-1 space-y-1">
                          <Label className="text-xs">Alimento</Label>
                          <Select
                            value={item.foodId}
                            onValueChange={(v) => updateItem(index, "foodId", v)}
                            disabled={isSubmitting}
                          >
                            <SelectTrigger className="h-9">
                              <SelectValue placeholder="Selecionar" />
                            </SelectTrigger>
                            <SelectContent className="bg-card">
                              {foods.map((food) => (
                                <SelectItem key={food.id} value={food.id}>{food.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="w-24 space-y-1">
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
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          className="text-destructive shrink-0"
                          onClick={() => removeItem(index)}
                          disabled={isSubmitting}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                    <p className="text-xs text-muted-foreground">
                      Use a mesma forma de pesagem do cardápio do veterinário (cru ou cozido). O Cãolorias não converte automaticamente.
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
      </div>
    </AppLayout>
  );
};

export default Meals;