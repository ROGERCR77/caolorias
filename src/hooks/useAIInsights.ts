import { useState } from "react";
import { Dog, Food, Meal, WeightLog, MealPlan, BreedReference, ActivityReference, DogPorte, NivelAtividade } from "@/contexts/DataContext";
import { subDays, parseISO, isWithinInterval, startOfDay, isToday } from "date-fns";
import { supabase } from "@/integrations/supabase/client";

export interface AIInsight {
  tipo: string;
  titulo: string;
  mensagem: string;
  nivel_alerta: "baixo" | "moderado" | "alto";
}

export interface AIWeightComment {
  status: "abaixo_faixa" | "dentro_faixa" | "acima_faixa" | "sem_dados";
  mensagem: string;
}

export interface AIActivityRecommendation {
  minutos_min: number | null;
  minutos_max: number | null;
  mensagem: string;
}

export interface AIMealPlanSuggestion {
  existe_plano: boolean;
  comentario_geral: string;
  refeicoes: {
    refeicao_ordem: number;
    refeicao_nome: string;
    itens: {
      nome_alimento: string;
      categoria: string;
      gramas_sugeridas: number;
      observacao?: string;
    }[];
  }[];
}

export interface AIResponse {
  insights: AIInsight[];
  comentario_peso_raca: AIWeightComment;
  recomendacao_atividade: AIActivityRecommendation;
  plano_alimentar_sugerido: AIMealPlanSuggestion;
}

function prepareAIData(
  dog: Dog,
  meals: Meal[],
  weightLogs: WeightLog[],
  foods: Food[],
  activePlan: MealPlan | undefined,
  tutorName: string,
  modo: "insights" | "plano_alimentar" | "resumo_completo",
  breedRef?: BreedReference,
  activityRef?: ActivityReference
) {
  const today = new Date();
  const sevenDaysAgo = subDays(today, 7);
  const thirtyDaysAgo = subDays(today, 30);

  // Filter dog's meals
  const dogMeals = meals.filter((m) => m.dog_id === dog.id);
  
  // Today's stats
  const todayMeals = dogMeals.filter((m) => isToday(parseISO(m.date_time)));
  const todayKcal = todayMeals.reduce((sum, m) => sum + (m.total_kcal_estimated || 0), 0);
  const todayGrams = todayMeals.reduce((sum, m) => sum + m.total_grams, 0);

  // Last 7 days stats
  const recentMeals = dogMeals.filter((m) => {
    const date = parseISO(m.date_time);
    return isWithinInterval(date, { start: sevenDaysAgo, end: today });
  });

  const mealsByDay = new Map<string, Meal[]>();
  recentMeals.forEach((meal) => {
    const dayKey = startOfDay(parseISO(meal.date_time)).toISOString();
    const existing = mealsByDay.get(dayKey) || [];
    mealsByDay.set(dayKey, [...existing, meal]);
  });

  const dailyTotals: { kcal: number; grams: number }[] = [];
  mealsByDay.forEach((dayMeals) => {
    const kcal = dayMeals.reduce((sum, m) => sum + (m.total_kcal_estimated || 0), 0);
    const grams = dayMeals.reduce((sum, m) => sum + m.total_grams, 0);
    dailyTotals.push({ kcal, grams });
  });

  const avgKcal = dailyTotals.length > 0
    ? Math.round(dailyTotals.reduce((sum, d) => sum + d.kcal, 0) / dailyTotals.length)
    : null;
  const avgGrams = dailyTotals.length > 0
    ? Math.round(dailyTotals.reduce((sum, d) => sum + d.grams, 0) / dailyTotals.length)
    : null;

  const daysAbove110 = dog.meta_kcal_dia
    ? dailyTotals.filter((d) => d.kcal > dog.meta_kcal_dia! * 1.1).length
    : 0;
  const daysBelow90 = dog.meta_kcal_dia
    ? dailyTotals.filter((d) => d.kcal > 0 && d.kcal < dog.meta_kcal_dia! * 0.9).length
    : 0;

  // Weight stats
  const dogWeights = weightLogs
    .filter((w) => w.dog_id === dog.id)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  
  const currentWeight = dogWeights[0]?.weight_kg || dog.current_weight_kg;
  const weight30DaysAgo = dogWeights.find((w) => {
    const date = parseISO(w.date);
    return isWithinInterval(date, { start: thirtyDaysAgo, end: subDays(today, 7) });
  })?.weight_kg || null;

  // Food list
  const alimentosList = foods.map((f) => ({
    id: f.id,
    nome: f.name,
    categoria: f.category === "protein" ? "Proteina" 
      : f.category === "carb" ? "Carboidrato"
      : f.category === "vegetable" ? "Vegetal"
      : f.category === "treat" ? "Petisco"
      : f.category === "kibble" ? "Racao"
      : "Outro",
    kcal_por_100g: f.kcal_per_100g || null,
  }));

  // Current plan
  const planoAtual = activePlan ? {
    existe: true,
    numero_refeicoes_dia: activePlan.numero_refeicoes_dia,
    meta_gramas_dia: activePlan.meta_gramas_dia_snapshot,
    percentual_proteina: activePlan.percentual_proteina,
    percentual_carbo: activePlan.percentual_carbo,
    percentual_vegetais: activePlan.percentual_vegetais,
    itens: (activePlan.meal_plan_items || []).map((item) => ({
      refeicao_ordem: item.refeicao_ordem,
      refeicao_nome: item.refeicao_nome,
      food_id: item.food_id,
      categoria: item.categoria === "protein" ? "Proteina"
        : item.categoria === "carb" ? "Carboidrato"
        : item.categoria === "vegetable" ? "Vegetal"
        : item.categoria,
      gramas_sugeridas: item.gramas_sugeridas,
    })),
  } : { existe: false, numero_refeicoes_dia: null, meta_gramas_dia: null, percentual_proteina: null, percentual_carbo: null, percentual_vegetais: null, itens: [] };

  return {
    modo,
    tutor: { nome: tutorName },
    cao: {
      nome: dog.name,
      raca: dog.breed || null,
      porte: dog.size === "small" ? "pequeno" : dog.size === "medium" ? "medio" : dog.size === "large" ? "grande" : null,
      peso_atual_kg: currentWeight,
      objetivo: dog.objetivo === "manter_peso" ? "manter" 
        : dog.objetivo === "perder_peso" ? "perder"
        : dog.objetivo === "ganhar_peso" ? "ganhar"
        : dog.objetivo === "alimentacao_saudavel" ? "saudavel"
        : null,
      nivel_atividade: dog.nivel_atividade === "baixa" ? "baixa" 
        : dog.nivel_atividade === "moderada" ? "moderada"
        : dog.nivel_atividade === "alta" ? "alta"
        : null,
      condicao_corporal: dog.condicao_corporal === "magro" ? "magro"
        : dog.condicao_corporal === "ideal" ? "ideal"
        : dog.condicao_corporal === "acima_peso" ? "acima_peso"
        : null,
      meta_kcal_dia: dog.meta_kcal_dia,
      meta_gramas_dia: dog.meta_gramas_dia,
    },
    estatisticas: {
      hoje: {
        kcal_total: todayKcal || null,
        gramas_totais: todayGrams || null,
      },
      ultimos_7_dias: {
        dias_com_registro: mealsByDay.size,
        media_kcal: avgKcal,
        media_gramas: avgGrams,
        dias_acima_110_meta: daysAbove110,
        dias_abaixo_90_meta: daysBelow90,
        percentual_kcal_petiscos: null, // Would need more calculation
      },
      peso: {
        peso_atual_kg: currentWeight,
        peso_30_dias_atras_kg: weight30DaysAgo,
      },
    },
    alimentos: alimentosList,
    plano_atual: planoAtual,
    referencias: {
      raca_peso: breedRef ? {
        disponivel: true,
        peso_min_kg: breedRef.peso_min_kg,
        peso_max_kg: breedRef.peso_max_kg,
      } : { disponivel: false, peso_min_kg: null, peso_max_kg: null },
      atividade: activityRef ? {
        disponivel: true,
        min_minutos_dia: activityRef.minutos_min_dia,
        max_minutos_dia: activityRef.minutos_max_dia,
      } : { disponivel: false, min_minutos_dia: null, max_minutos_dia: null },
    },
  };
}

export function useAIInsights() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [response, setResponse] = useState<AIResponse | null>(null);

  const generateInsights = async (
    dog: Dog,
    meals: Meal[],
    weightLogs: WeightLog[],
    foods: Food[],
    activePlan: MealPlan | undefined,
    tutorName: string,
    modo: "insights" | "plano_alimentar" | "resumo_completo" = "resumo_completo",
    breedRef?: BreedReference,
    activityRef?: ActivityReference
  ) => {
    setIsLoading(true);
    setError(null);

    try {
      const data = prepareAIData(dog, meals, weightLogs, foods, activePlan, tutorName, modo, breedRef, activityRef);

      const { data: result, error: funcError } = await supabase.functions.invoke('ai-insights', {
        body: { data, modo },
      });

      if (funcError) {
        throw new Error(funcError.message);
      }

      if (result.error) {
        throw new Error(result.error);
      }

      setResponse(result as AIResponse);
      return result as AIResponse;
    } catch (err: any) {
      const errorMessage = err.message || 'Erro ao gerar insights';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    error,
    response,
    generateInsights,
    clearResponse: () => setResponse(null),
  };
}