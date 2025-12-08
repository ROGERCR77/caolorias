import { Dog, Meal, WeightLog } from "@/contexts/DataContext";
import { subDays, parseISO, isWithinInterval, startOfDay } from "date-fns";

export interface Insight {
  id: string;
  type: "warning" | "info" | "success" | "danger";
  title: string;
  message: string;
  icon: string;
}

export function generateInsights(
  dog: Dog,
  meals: Meal[],
  weightLogs: WeightLog[]
): Insight[] {
  const insights: Insight[] = [];
  const today = new Date();
  const sevenDaysAgo = subDays(today, 7);
  const thirtyDaysAgo = subDays(today, 30);
  const threeDaysAgo = subDays(today, 3);

  // Filter meals for last 7 days
  const recentMeals = meals.filter((meal) => {
    const mealDate = parseISO(meal.date_time);
    return isWithinInterval(mealDate, { start: sevenDaysAgo, end: today }) && meal.dog_id === dog.id;
  });

  // Group meals by day
  const mealsByDay = new Map<string, Meal[]>();
  recentMeals.forEach((meal) => {
    const dayKey = startOfDay(parseISO(meal.date_time)).toISOString();
    const existing = mealsByDay.get(dayKey) || [];
    mealsByDay.set(dayKey, [...existing, meal]);
  });

  // Calculate daily totals
  const dailyTotals: { kcal: number; grams: number; treatKcal: number }[] = [];
  mealsByDay.forEach((dayMeals) => {
    const kcal = dayMeals.reduce((sum, m) => sum + (m.total_kcal_estimated || 0), 0);
    const grams = dayMeals.reduce((sum, m) => sum + m.total_grams, 0);
    // Estimate treat kcal from meal items - simplified
    const treatKcal = 0; // Would need food data to calculate
    dailyTotals.push({ kcal, grams, treatKcal });
  });

  // 1. Excess calories check
  if (dog.meta_kcal_dia && dailyTotals.length >= 3) {
    const excessDays = dailyTotals.filter((d) => d.kcal > dog.meta_kcal_dia! * 1.1).length;
    if (excessDays >= 3) {
      insights.push({
        id: "excess_calories",
        type: "warning",
        title: `Talvez ${dog.name} esteja comendo um pouco demais`,
        message: `Percebemos que, em vários dias, ${dog.name} passou da meta diária de comida. Isso pode, aos poucos, levar a ganho de peso. Vale revisar porções e petiscos, sempre alinhando com o plano que o veterinário recomendou.`,
        icon: "alert-triangle",
      });
    }
  }

  // 2. Below target check
  if (dog.meta_kcal_dia && dailyTotals.length >= 3) {
    const belowDays = dailyTotals.filter((d) => d.kcal > 0 && d.kcal < dog.meta_kcal_dia! * 0.9).length;
    if (belowDays >= 3) {
      insights.push({
        id: "below_target",
        type: "info",
        title: `Fique de olho se ${dog.name} não está comendo pouco`,
        message: `Nos últimos dias, ${dog.name} ficou abaixo da meta de alimentação. Se ele anda deixando comida no pote, mais desanimado ou diferente do normal, converse com o veterinário para entender o que está acontecendo.`,
        icon: "trending-down",
      });
    }
  }

  // 3. Weight gain check
  const dogWeightLogs = weightLogs
    .filter((w) => w.dog_id === dog.id)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  if (dogWeightLogs.length >= 2) {
    const latestWeight = dogWeightLogs[0];
    const oldWeight = dogWeightLogs.find((w) => {
      const logDate = parseISO(w.date);
      return isWithinInterval(logDate, { start: thirtyDaysAgo, end: subDays(today, 7) });
    });

    if (oldWeight) {
      const weightChange = ((latestWeight.weight_kg - oldWeight.weight_kg) / oldWeight.weight_kg) * 100;

      if (weightChange > 5) {
        insights.push({
          id: "weight_gain",
          type: "warning",
          title: `${dog.name} pode estar ganhando peso`,
          message: `${dog.name} ganhou mais de 5% do peso nas últimas semanas. Isso pode ser esperado em alguns casos, mas vale acompanhar de perto. Mudanças rápidas de peso podem ser sinal de algo importante. Use esses dados como apoio e marque uma consulta com o veterinário para avaliar melhor.`,
          icon: "trending-up",
        });
      } else if (weightChange < -5) {
        insights.push({
          id: "weight_loss",
          type: "danger",
          title: `Atenção à perda de peso de ${dog.name}`,
          message: `${dog.name} perdeu mais de 5% do peso em pouco tempo. Se isso não foi planejado, é um sinal importante. Mudanças rápidas de peso podem indicar algo que precisa de atenção. Use esses dados como apoio e marque uma consulta com o veterinário para avaliar melhor.`,
          icon: "trending-down",
        });
      }
    }
  }

  // 4. No recent meals check
  const hasRecentMeals = recentMeals.some((meal) => {
    const mealDate = parseISO(meal.date_time);
    return isWithinInterval(mealDate, { start: threeDaysAgo, end: today });
  });

  if (!hasRecentMeals && mealsByDay.size > 0) {
    insights.push({
      id: "no_recent_meals",
      type: "info",
      title: `Sem registros recentes de ${dog.name}`,
      message: `Percebemos que você não tem registrado as refeições de ${dog.name} nos últimos dias. Que tal retomar hoje? O acompanhamento regular ajuda a manter a rotina alimentar no trilho.`,
      icon: "calendar-x",
    });
  }

  // 5. Calculate streak
  const uniqueDaysWithMeals = mealsByDay.size;
  if (uniqueDaysWithMeals >= 5) {
    insights.push({
      id: "streak",
      type: "success",
      title: "Ótima consistência!",
      message: `Você registrou a alimentação de ${dog.name} por ${uniqueDaysWithMeals} dias seguidos. Continue assim!`,
      icon: "flame",
    });
  }

  return insights;
}

export function calculateConsecutiveDays(meals: Meal[], dogId: string): number {
  const today = startOfDay(new Date());
  const dogMeals = meals.filter((m) => m.dog_id === dogId);
  
  if (dogMeals.length === 0) return 0;

  const uniqueDays = new Set<string>();
  dogMeals.forEach((meal) => {
    uniqueDays.add(startOfDay(parseISO(meal.date_time)).toISOString());
  });

  let streak = 0;
  let currentDay = today;

  while (true) {
    const dayKey = startOfDay(currentDay).toISOString();
    if (uniqueDays.has(dayKey)) {
      streak++;
      currentDay = subDays(currentDay, 1);
    } else {
      break;
    }
  }

  return streak;
}
