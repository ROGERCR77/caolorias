import { Link } from "react-router-dom";
import { AppLayout } from "@/components/app/AppLayout";
import { DogSelector } from "@/components/app/DogSelector";
import { AIInsightsCard } from "@/components/app/AIInsightsCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useData } from "@/contexts/DataContext";
import { calculateConsecutiveDays } from "@/lib/insights";
import { 
  Plus, Scale, UtensilsCrossed, Dog, TrendingUp, Calendar, Loader2, 
  Target, Flame, Info
} from "lucide-react";
import { format, isToday, parseISO, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";

const Dashboard = () => {
  const { dogs, meals, weightLogs, foods, selectedDogId, isLoading } = useData();

  const selectedDog = dogs.find((d) => d.id === selectedDogId);

  // Get today's meals for selected dog
  const todaysMeals = meals.filter((meal) => {
    if (meal.dog_id !== selectedDogId) return false;
    return isToday(parseISO(meal.date_time));
  });

  // Calculate today's totals
  const todayTotalGrams = todaysMeals.reduce((sum, m) => sum + m.total_grams, 0);
  const todayTotalKcal = todaysMeals.reduce((sum, m) => sum + (m.total_kcal_estimated || 0), 0);

  // Get latest weight for selected dog
  const dogWeightLogs = weightLogs
    .filter((w) => w.dog_id === selectedDogId)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const latestWeight = dogWeightLogs[0];

  // Check if weight is old (14+ days)
  const needsWeightUpdate = latestWeight 
    ? new Date(latestWeight.date) < subDays(new Date(), 14)
    : true;

  // Get food name by id
  const getFoodName = (foodId: string) => {
    return foods.find((f) => f.id === foodId)?.name || "Alimento";
  };

  // Calculate streak
  const streak = selectedDogId 
    ? calculateConsecutiveDays(meals, selectedDogId)
    : 0;

  // Progress percentages
  const kcalProgress = selectedDog?.meta_kcal_dia 
    ? Math.min(100, (todayTotalKcal / selectedDog.meta_kcal_dia) * 100)
    : 0;
  const gramsProgress = selectedDog?.meta_gramas_dia
    ? Math.min(100, (todayTotalGrams / selectedDog.meta_gramas_dia) * 100)
    : 0;

  if (isLoading) {
    return (
      <AppLayout>
        <div className="container px-4 py-8 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  if (dogs.length === 0) {
    return (
      <AppLayout>
        <div className="container px-4 py-8">
          <Card variant="elevated" className="max-w-md mx-auto text-center">
            <CardContent className="pt-8 pb-8">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary-light flex items-center justify-center">
                <Dog className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-xl font-bold mb-2">Bem-vindo ao Cãolorias!</h2>
              <p className="text-muted-foreground mb-6">
                Você ainda não cadastrou nenhum cão. Vamos começar?
              </p>
              <Button asChild variant="hero" size="lg">
                <Link to="/app/caes">
                  <Plus className="w-4 h-4" />
                  Cadastrar meu primeiro cão
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
      <div className="container px-4 py-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold">Hoje</h1>
            <p className="text-muted-foreground">
              {format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR })}
            </p>
          </div>
          <DogSelector className="w-full sm:w-48" />
        </div>

        {selectedDog && (
          <div className="space-y-4">
            {/* Streak badge */}
            {streak >= 2 && (
              <Card className="bg-gradient-to-r from-accent/10 to-primary/10 border-accent/20">
                <CardContent className="py-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-accent/20">
                      <Flame className="w-5 h-5 text-accent" />
                    </div>
                    <div>
                      <p className="font-semibold text-accent">{streak} dias seguidos!</p>
                      <p className="text-sm text-muted-foreground">
                        Ótimo hábito! Você está registrando a alimentação de {selectedDog.name} há {streak} dias seguidos.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Goal progress cards */}
            {(selectedDog.meta_kcal_dia || selectedDog.meta_gramas_dia) && (
              <Card variant="gradient">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Target className="w-4 h-4 text-primary" />
                    Meta do dia
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {selectedDog.meta_kcal_dia && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Calorias</span>
                        <span className="font-medium">
                          {todayTotalKcal} / {selectedDog.meta_kcal_dia} kcal
                        </span>
                      </div>
                      <Progress value={kcalProgress} className="h-2" />
                    </div>
                  )}
                  {selectedDog.meta_gramas_dia && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Gramas</span>
                        <span className="font-medium">
                          {todayTotalGrams} / {selectedDog.meta_gramas_dia} g
                        </span>
                      </div>
                      <Progress value={gramsProgress} className="h-2" />
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Quick stats */}
            <div className="grid grid-cols-2 gap-4">
              <Card variant="gradient">
                <CardContent className="pt-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <UtensilsCrossed className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Total hoje</p>
                      <p className="text-xl font-bold">{todayTotalGrams}g</p>
                      {todayTotalKcal > 0 && (
                        <p className="text-xs text-muted-foreground">~{todayTotalKcal} kcal</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card variant="gradient">
                <CardContent className="pt-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-accent/10">
                      <Scale className="w-5 h-5 text-accent" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Peso atual</p>
                      <p className="text-xl font-bold">{selectedDog.current_weight_kg} kg</p>
                      {latestWeight && (
                        <p className="text-xs text-muted-foreground">
                          {format(parseISO(latestWeight.date), "dd/MM")}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Weight reminder */}
            {needsWeightUpdate && (
              <Card className="bg-muted/50 border-dashed">
                <CardContent className="py-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Scale className="w-5 h-5 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        Já faz um tempo que você não atualiza o peso de {selectedDog.name}. Que tal registrá-lo esta semana?
                      </p>
                    </div>
                    <Button asChild variant="outline" size="sm">
                      <Link to="/app/peso-progresso">Pesar</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Today's meals */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary" />
                  Refeições de hoje
                </CardTitle>
              </CardHeader>
              <CardContent>
                {todaysMeals.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">
                    Nenhuma refeição registrada hoje.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {todaysMeals.map((meal) => (
                      <div
                        key={meal.id}
                        className="p-3 rounded-lg bg-muted/50 border"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold">{meal.title}</span>
                          <span className="text-sm text-muted-foreground">
                            {format(parseISO(meal.date_time), "HH:mm")}
                          </span>
                        </div>
                        {meal.meal_items && meal.meal_items.length > 0 && (
                          <p className="text-sm text-muted-foreground">
                            {meal.meal_items.map((item) => `${getFoodName(item.food_id)} (${item.grams}g)`).join(", ")}
                          </p>
                        )}
                        <div className="mt-2 flex gap-4 text-xs">
                          <span className="text-primary font-medium">{meal.total_grams}g</span>
                          {meal.total_kcal_estimated && (
                            <span className="text-accent font-medium">~{meal.total_kcal_estimated} kcal</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <Button asChild variant="accent" className="w-full mt-4" size="lg">
                  <Link to="/app/refeicoes?new=true">
                    <Plus className="w-4 h-4" />
                    Registrar refeição
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* AI Insights section */}
            <AIInsightsCard dog={selectedDog} />

            {/* Weight section */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  Peso recente
                </CardTitle>
              </CardHeader>
              <CardContent>
                {latestWeight ? (
                  <div className="text-center py-2">
                    <p className="text-3xl font-bold text-primary">{latestWeight.weight_kg} kg</p>
                    <p className="text-sm text-muted-foreground">
                      Registrado em {format(parseISO(latestWeight.date), "dd/MM/yyyy")}
                    </p>
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-4">
                    Nenhum peso registrado ainda.
                  </p>
                )}

                <Button asChild variant="outline" className="w-full mt-4">
                  <Link to="/app/peso-progresso">
                    <Scale className="w-4 h-4" />
                    {latestWeight ? "Ver evolução" : "Registrar peso"}
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* Disclaimer footer */}
            <Card className="bg-muted/30 border-dashed">
              <CardContent className="py-4">
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-muted-foreground">
                    O Cãolorias é uma ferramenta de organização e apoio. Ele não substitui a orientação de um médico-veterinário nutrólogo.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default Dashboard;
