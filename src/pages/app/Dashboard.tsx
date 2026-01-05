import { Link } from "react-router-dom";
import { useMemo, useState, useEffect } from "react";
import { AppLayout } from "@/components/app/AppLayout";
import { DogSelector } from "@/components/app/DogSelector";
import { AIInsightsCard } from "@/components/app/AIInsightsCard";
import { HealthQuickCard } from "@/components/app/HealthQuickCard";
import { WeeklyInsightsCard } from "@/components/app/WeeklyInsightsCard";
import { StreakCard } from "@/components/app/StreakCard";
import { VetAppointmentsCard } from "@/components/app/VetAppointmentsCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useData } from "@/contexts/DataContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabaseClient";
import { calculateConsecutiveDays } from "@/lib/insights";
import { 
  Plus, Scale, UtensilsCrossed, Dog, TrendingUp, 
  Target, Info, ChevronRight, Baby
} from "lucide-react";
import { format, isToday, parseISO, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { calculateAgeInMonths, getSuggestedMealsPerDay } from "@/contexts/DataContext";

const Dashboard = () => {
  const { dogs, meals, weightLogs, selectedDogId, isLoading } = useData();
  const { user } = useAuth();
  const [longestStreak, setLongestStreak] = useState(0);

  const selectedDog = useMemo(() => 
    dogs.find((d) => d.id === selectedDogId),
    [dogs, selectedDogId]
  );

  // Memoize today's meals calculation
  const todaysMeals = useMemo(() => 
    meals.filter((meal) => {
      if (meal.dog_id !== selectedDogId) return false;
      return isToday(parseISO(meal.date_time));
    }),
    [meals, selectedDogId]
  );

  // Memoize totals calculation
  const { todayTotalGrams, todayTotalKcal } = useMemo(() => ({
    todayTotalGrams: todaysMeals.reduce((sum, m) => sum + m.total_grams, 0),
    todayTotalKcal: todaysMeals.reduce((sum, m) => sum + (m.total_kcal_estimated || 0), 0),
  }), [todaysMeals]);

  // Memoize weight logs for selected dog
  const { latestWeight, needsWeightUpdate } = useMemo(() => {
    const dogWeightLogs = weightLogs
      .filter((w) => w.dog_id === selectedDogId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const latest = dogWeightLogs[0];
    return {
      latestWeight: latest,
      needsWeightUpdate: latest 
        ? new Date(latest.date) < subDays(new Date(), 14)
        : true,
    };
  }, [weightLogs, selectedDogId]);

  // Memoize streak calculation
  const streak = useMemo(() => 
    selectedDogId ? calculateConsecutiveDays(meals, selectedDogId) : 0,
    [meals, selectedDogId]
  );

  // Memoize progress percentages
  const { kcalProgress, gramsProgress } = useMemo(() => ({
    kcalProgress: selectedDog?.meta_kcal_dia 
      ? Math.min(100, (todayTotalKcal / selectedDog.meta_kcal_dia) * 100)
      : 0,
    gramsProgress: selectedDog?.meta_gramas_dia
      ? Math.min(100, (todayTotalGrams / selectedDog.meta_gramas_dia) * 100)
      : 0,
  }), [selectedDog, todayTotalKcal, todayTotalGrams]);

  // Load user's longest streak
  useEffect(() => {
    const loadStreak = async () => {
      if (!user) return;
      const { data } = await supabase
        .from("user_streaks")
        .select("longest_streak")
        .eq("user_id", user.id)
        .maybeSingle();
      if (data) setLongestStreak(data.longest_streak);
    };
    loadStreak();
  }, [user]);

  if (isLoading) {
    return (
      <AppLayout>
        <div className="page-container flex flex-col items-center justify-center gap-items">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center animate-pulse">
            <Dog className="w-8 h-8 text-primary" />
          </div>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </AppLayout>
    );
  }

  if (dogs.length === 0) {
    return (
      <AppLayout>
        <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
          <div className="max-w-sm w-full text-center space-y-8">
            <div className="w-28 h-28 mx-auto rounded-[28px] bg-gradient-hero flex items-center justify-center shadow-xl animate-float">
              <Dog className="w-14 h-14 text-primary-foreground" strokeWidth={1.5} />
            </div>
            
            <div className="space-y-3">
              <h2 className="text-2xl font-bold text-foreground">Bem-vindo ao Cãolorias!</h2>
              <p className="text-muted-foreground text-base">
                Você ainda não cadastrou nenhum cão. Vamos começar?
              </p>
            </div>
            
            <Button asChild variant="hero" size="lg" className="w-full h-14 rounded-2xl text-base font-semibold shadow-lg">
              <Link to="/app/caes">
                <Plus className="w-5 h-5" />
                Cadastrar meu primeiro cão
              </Link>
            </Button>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="page-container page-content">
        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold">Hoje</h1>
            <p className="text-sm text-muted-foreground">
              {format(new Date(), "EEEE, d MMM", { locale: ptBR })}
            </p>
          </div>
          <DogSelector className="w-auto" />
        </div>

        {/* Puppy Badge */}
        {selectedDog?.is_puppy && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-primary/10 border border-primary/20">
            <Baby className="w-4 h-4 text-primary" />
            <div className="flex-1">
              <span className="text-sm font-medium text-primary">
                🐕 Filhote {selectedDog.birth_date ? `(${calculateAgeInMonths(selectedDog.birth_date) || 0} meses)` : ''}
              </span>
              {selectedDog.birth_date && (
                <span className="text-xs text-muted-foreground ml-2">
                  • {getSuggestedMealsPerDay(calculateAgeInMonths(selectedDog.birth_date) || 0)}
                </span>
              )}
            </div>
          </div>
        )}

        {selectedDog && (
          <div className="section-content">
            {/* Quick Stats Row */}
            <div className="card-grid-2">
              <Card variant="interactive" className="press-effect">
                <Link to="/app/refeicoes">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-primary/10">
                        <UtensilsCrossed className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Hoje</p>
                        <p className="text-xl font-bold truncate">{todayTotalGrams}g</p>
                        {todayTotalKcal > 0 && (
                          <p className="text-[11px] text-muted-foreground">~{todayTotalKcal} kcal</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Link>
              </Card>

              <Card variant="interactive" className="press-effect">
                <Link to="/app/peso-progresso">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-accent/10">
                        <Scale className="w-5 h-5 text-accent" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Peso</p>
                        <p className="text-xl font-bold truncate">{selectedDog.current_weight_kg} kg</p>
                        {latestWeight && (
                          <p className="text-[11px] text-muted-foreground">
                            {format(parseISO(latestWeight.date), "dd/MM")}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Link>
              </Card>
            </div>

            {/* Streak Card */}
            <StreakCard 
              currentStreak={streak} 
              longestStreak={longestStreak} 
              dogName={selectedDog.name} 
            />

            {/* Health Quick Card */}
            <HealthQuickCard />

            {/* Vet Appointments Card */}
            <VetAppointmentsCard />

            {/* Goal progress */}
            {(selectedDog.meta_kcal_dia || selectedDog.meta_gramas_dia) && (
              <Card>
                <CardHeader className="pb-2 px-4 pt-4">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Target className="w-4 h-4 text-primary" />
                    Meta do dia
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4 space-y-3">
                  {selectedDog.meta_kcal_dia && (
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Calorias</span>
                        <span className="font-semibold">
                          {todayTotalKcal} / {selectedDog.meta_kcal_dia} kcal
                        </span>
                      </div>
                      <Progress value={kcalProgress} className="h-2" />
                    </div>
                  )}
                  {selectedDog.meta_gramas_dia && (
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Gramas</span>
                        <span className="font-semibold">
                          {todayTotalGrams} / {selectedDog.meta_gramas_dia} g
                        </span>
                      </div>
                      <Progress value={gramsProgress} className="h-2" />
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Add Meal CTA */}
            <Button asChild variant="hero" size="lg" className="w-full h-14 rounded-xl shadow-lg">
              <Link to="/app/refeicoes?new=true">
                <Plus className="w-5 h-5" />
                Registrar refeição
              </Link>
            </Button>

            {/* Weight reminder */}
            {needsWeightUpdate && (
              <Card className="bg-muted/30 border-dashed press-effect">
                <Link to="/app/peso-progresso">
                  <CardContent className="p-3">
                    <div className="flex items-center gap-3">
                      <Scale className="w-5 h-5 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground flex-1">
                        Hora de atualizar o peso de {selectedDog.name}
                      </p>
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Link>
              </Card>
            )}

            {/* Today's meals */}
            {todaysMeals.length > 0 && (
              <Card>
                <CardHeader className="pb-2 px-4 pt-4">
                  <CardTitle className="text-sm flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <UtensilsCrossed className="w-4 h-4 text-primary" />
                      Refeições de hoje
                    </span>
                    <span className="text-xs font-normal text-muted-foreground">
                      {todaysMeals.length} refeição{todaysMeals.length > 1 ? "ões" : ""}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <div className="space-y-2">
                    {todaysMeals.slice(0, 3).map((meal) => (
                      <div
                        key={meal.id}
                        className="p-3 rounded-xl bg-muted/50 press-effect"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-semibold text-sm">{meal.title}</span>
                          <span className="text-xs text-muted-foreground">
                            {format(parseISO(meal.date_time), "HH:mm")}
                          </span>
                        </div>
                        <div className="flex gap-3 text-xs">
                          <span className="text-primary font-semibold">{meal.total_grams}g</span>
                          {meal.total_kcal_estimated && (
                            <span className="text-accent font-semibold">~{meal.total_kcal_estimated} kcal</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  {todaysMeals.length > 3 && (
                    <Link 
                      to="/app/refeicoes" 
                      className="mt-3 text-xs text-primary font-medium flex items-center justify-center gap-1"
                    >
                      Ver todas as refeições
                      <ChevronRight className="w-3 h-3" />
                    </Link>
                  )}
                </CardContent>
              </Card>
            )}

            {/* AI Insights */}
            <AIInsightsCard dog={selectedDog} />

            {/* Weekly Insights */}
            <WeeklyInsightsCard dogId={selectedDog.id} />

            {/* Weight section */}
            <Card variant="interactive" className="press-effect">
              <Link to="/app/peso-progresso">
                <CardHeader className="pb-2 px-4 pt-4">
                  <CardTitle className="text-sm flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-primary" />
                      Peso recente
                    </span>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  {latestWeight ? (
                    <div className="flex items-baseline gap-2">
                      <p className="text-2xl font-bold text-primary">{latestWeight.weight_kg} kg</p>
                      <p className="text-xs text-muted-foreground">
                        em {format(parseISO(latestWeight.date), "dd/MM")}
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Nenhum peso registrado ainda
                    </p>
                  )}
                </CardContent>
              </Link>
            </Card>

            {/* Disclaimer */}
            <div className="flex items-start gap-2 p-3 rounded-xl bg-muted/30">
              <Info className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                O Cãolorias é uma ferramenta de organização. Não substitui a orientação de um médico-veterinário.
              </p>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default Dashboard;
