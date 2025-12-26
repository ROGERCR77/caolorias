import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { useAuth } from "./AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useOneSignal } from "@/hooks/useOneSignal";

// Types
export type DogObjetivo = "manter_peso" | "perder_peso" | "ganhar_peso" | "alimentacao_saudavel";
export type NivelAtividade = "baixa" | "moderada" | "alta";
export type CondicaoCorporal = "magro" | "ideal" | "acima_peso";
export type DogPorte = "pequeno" | "medio" | "grande" | "gigante";

export type DogSex = "macho" | "femea";

export interface Dog {
  id: string;
  name: string;
  breed: string;
  birth_date: string | null;
  current_weight_kg: number;
  size: "small" | "medium" | "large" | "giant";
  feeding_type: "natural" | "kibble" | "mixed";
  sex: DogSex;
  photo_url?: string | null;
  objetivo: DogObjetivo;
  nivel_atividade: NivelAtividade;
  condicao_corporal: CondicaoCorporal;
  meta_kcal_dia: number | null;
  meta_gramas_dia: number | null;
  is_puppy: boolean;
  estimated_adult_weight_kg: number | null;
  created_at: string;
}

export interface BreedReference {
  id: string;
  breed_name: string;
  porte: DogPorte;
  peso_min_kg: number;
  peso_max_kg: number;
  energia_padrao: NivelAtividade;
  braquicefalico: boolean;
  descricao_resumida: string | null;
}

export interface ActivityReference {
  id: string;
  porte: DogPorte;
  energia: NivelAtividade;
  minutos_min_dia: number;
  minutos_max_dia: number;
  observacao: string | null;
}

export interface Food {
  id: string;
  name: string;
  category: "protein" | "viscera" | "carb" | "vegetable" | "fat" | "supplement" | "extra" | "kibble" | "treat" | "other";
  kcal_per_100g?: number | null;
  notes?: string | null;
  created_at: string;
  // New fields for enhanced food system
  reference_food_id?: string | null;
  unit_type?: string;
  grams_per_unit?: number | null;
  protein_g?: number | null;
  fat_g?: number | null;
  carb_g?: number | null;
  cost_level?: string | null;
}

export interface MealItem {
  id: string;
  food_id: string;
  grams: number;
  kcal_estimated?: number | null;
}

export interface Meal {
  id: string;
  dog_id: string;
  date_time: string;
  title: string;
  total_grams: number;
  total_kcal_estimated?: number | null;
  created_at: string;
  meal_items?: MealItem[];
}

export interface WeightLog {
  id: string;
  dog_id: string;
  date: string;
  weight_kg: number;
  created_at: string;
}

export interface MealPlanItem {
  id: string;
  meal_plan_id: string;
  refeicao_ordem: number;
  refeicao_nome: string;
  food_id: string | null;
  categoria: string;
  gramas_sugeridas: number;
}

export interface MealPlan {
  id: string;
  user_id: string;
  dog_id: string;
  created_at: string;
  objetivo: string;
  meta_kcal_dia_snapshot: number;
  meta_gramas_dia_snapshot: number;
  numero_refeicoes_dia: number;
  percentual_proteina: number;
  percentual_carbo: number;
  percentual_vegetais: number;
  observacoes?: string | null;
  ativo: boolean;
  meal_plan_items?: MealPlanItem[];
}

// Goal calculation helpers
export function calculateRER(weightKg: number): number {
  return 70 * Math.pow(weightKg, 0.75);
}

export function calculateMER(
  rer: number,
  objetivo: DogObjetivo,
  condicao: CondicaoCorporal,
  atividade: NivelAtividade
): number {
  let fator = 1.6; // default para manter peso

  if (objetivo === "perder_peso" || condicao === "acima_peso") {
    fator = 1.0;
  } else if (objetivo === "ganhar_peso" || condicao === "magro") {
    fator = 1.7;
  } else if (objetivo === "manter_peso" || objetivo === "alimentacao_saudavel") {
    if (atividade === "baixa") fator = 1.4;
    else if (atividade === "alta") fator = 1.8;
    else fator = 1.6;
  }

  return Math.round(rer * fator);
}

export function calculateMetaGramasDia(weightKg: number, objetivo: DogObjetivo): number {
  let percentual = 0.025; // 2.5% para manter

  if (objetivo === "perder_peso") {
    percentual = 0.02; // 2%
  } else if (objetivo === "ganhar_peso") {
    percentual = 0.03; // 3%
  }

  return Math.round(weightKg * 1000 * percentual);
}

// Puppy-specific calculation helpers
export function calculateAgeInMonths(birthDate: string | null): number | null {
  if (!birthDate) return null;
  const birth = new Date(birthDate);
  const now = new Date();
  const months = (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth());
  return Math.max(0, months);
}

export function calculatePuppyMER(
  weightKg: number,
  ageMonths: number,
  estimatedAdultWeightKg: number
): number {
  const rer = calculateRER(weightKg);
  const halfAdultWeight = estimatedAdultWeightKg * 0.5;
  
  // Phase 1: Until half adult weight or up to 4 months - factor 2.2
  if (weightKg < halfAdultWeight || ageMonths < 4) {
    return Math.round(rer * 2.2);
  }
  // Phase 2: From half to full adult weight - factor 1.5
  return Math.round(rer * 1.5);
}

export function calculatePuppyGramsPerDay(weightKg: number, ageMonths: number): number {
  if (ageMonths < 4) {
    return Math.round(weightKg * 1000 * 0.05); // 5% do peso
  } else if (ageMonths < 8) {
    return Math.round(weightKg * 1000 * 0.04); // 4% do peso
  }
  return Math.round(weightKg * 1000 * 0.03); // 3% do peso
}

export function getSuggestedMealsPerDay(ageMonths: number): string {
  if (ageMonths < 4) return "3-4 refeições/dia";
  if (ageMonths < 8) return "3 refeições/dia";
  return "2-3 refeições/dia";
}

interface DataContextType {
  dogs: Dog[];
  foods: Food[];
  meals: Meal[];
  weightLogs: WeightLog[];
  mealPlans: MealPlan[];
  breedReferences: BreedReference[];
  activityReferences: ActivityReference[];
  selectedDogId: string | null;
  isLoading: boolean;
  setSelectedDogId: (id: string | null) => void;
  // Dog operations
  addDog: (dog: Omit<Dog, "id" | "created_at">) => Promise<void>;
  updateDog: (id: string, dog: Partial<Dog>) => Promise<void>;
  deleteDog: (id: string) => Promise<void>;
  // Food operations
  addFood: (food: Omit<Food, "id" | "created_at">) => Promise<void>;
  updateFood: (id: string, food: Partial<Food>) => Promise<void>;
  deleteFood: (id: string) => Promise<void>;
  // Meal operations
  addMeal: (meal: Omit<Meal, "id" | "created_at">, items: { foodId: string; grams: number }[]) => Promise<void>;
  deleteMeal: (id: string) => Promise<void>;
  // Weight operations
  addWeightLog: (log: Omit<WeightLog, "id" | "created_at">) => Promise<void>;
  deleteWeightLog: (id: string) => Promise<void>;
  // Meal Plan operations
  addMealPlan: (plan: Omit<MealPlan, "id" | "created_at" | "user_id" | "meal_plan_items">, items: Omit<MealPlanItem, "id" | "meal_plan_id">[]) => Promise<void>;
  deleteMealPlan: (id: string) => Promise<void>;
  // Reference helpers
  getBreedByName: (name: string) => BreedReference | undefined;
  getActivityReference: (porte: DogPorte, energia: NivelAtividade) => ActivityReference | undefined;
  // Refresh data
  refreshData: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { trackMealLogged, trackWeightLogged, sendTags, isNative } = useOneSignal();
  const [dogs, setDogs] = useState<Dog[]>([]);
  const [foods, setFoods] = useState<Food[]>([]);
  const [meals, setMeals] = useState<Meal[]>([]);
  const [weightLogs, setWeightLogs] = useState<WeightLog[]>([]);
  const [mealPlans, setMealPlans] = useState<MealPlan[]>([]);
  const [breedReferences, setBreedReferences] = useState<BreedReference[]>([]);
  const [activityReferences, setActivityReferences] = useState<ActivityReference[]>([]);
  const [selectedDogId, setSelectedDogId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch all data
  const fetchData = useCallback(async () => {
    if (!user) {
      setDogs([]);
      setFoods([]);
      setMeals([]);
      setWeightLogs([]);
      setMealPlans([]);
      setSelectedDogId(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    try {
      // Check for cached reference data
      const CACHE_KEY_BREEDS = 'caolorias_breed_refs';
      const CACHE_KEY_ACTIVITY = 'caolorias_activity_refs';
      const CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

      let cachedBreeds: BreedReference[] | null = null;
      let cachedActivity: ActivityReference[] | null = null;

      try {
        const breedsCache = localStorage.getItem(CACHE_KEY_BREEDS);
        const activityCache = localStorage.getItem(CACHE_KEY_ACTIVITY);
        
        if (breedsCache) {
          const { data, timestamp } = JSON.parse(breedsCache);
          if (Date.now() - timestamp < CACHE_EXPIRY) {
            cachedBreeds = data;
          }
        }
        if (activityCache) {
          const { data, timestamp } = JSON.parse(activityCache);
          if (Date.now() - timestamp < CACHE_EXPIRY) {
            cachedActivity = data;
          }
        }
      } catch (e) {
        // Ignore cache errors
      }

      // Fetch user data in parallel
      const [dogsRes, foodsRes, mealsRes, weightRes, plansRes] = await Promise.all([
        supabase.from("dogs").select("*").eq("user_id", user.id).order("created_at", { ascending: true }),
        supabase.from("foods").select("*").eq("user_id", user.id).order("name", { ascending: true }),
        supabase.from("meals").select("*, meal_items(*)").eq("user_id", user.id).order("date_time", { ascending: false }),
        supabase.from("weight_logs").select("*").eq("user_id", user.id).order("date", { ascending: true }),
        supabase.from("meal_plans").select("*, meal_plan_items(*)").eq("user_id", user.id).order("created_at", { ascending: false }),
      ]);

      // Fetch reference data only if not cached
      let breedRefsData = cachedBreeds;
      let activityRefsData = cachedActivity;

      if (!cachedBreeds || !cachedActivity) {
        const [breedsRes, activityRes] = await Promise.all([
          !cachedBreeds ? supabase.from("dog_breed_reference").select("*").order("breed_name", { ascending: true }) : Promise.resolve({ data: null }),
          !cachedActivity ? supabase.from("activity_reference").select("*") : Promise.resolve({ data: null }),
        ]);

        if (breedsRes.data) {
          breedRefsData = breedsRes.data as BreedReference[];
          try {
            localStorage.setItem(CACHE_KEY_BREEDS, JSON.stringify({ data: breedRefsData, timestamp: Date.now() }));
          } catch (e) { /* ignore */ }
        }
        if (activityRes.data) {
          activityRefsData = activityRes.data as ActivityReference[];
          try {
            localStorage.setItem(CACHE_KEY_ACTIVITY, JSON.stringify({ data: activityRefsData, timestamp: Date.now() }));
          } catch (e) { /* ignore */ }
        }
      }

      const typedDogs = (dogsRes.data || []).map(d => ({
        ...d,
        size: d.size as Dog["size"],
        feeding_type: d.feeding_type as Dog["feeding_type"],
        sex: (d.sex || "macho") as DogSex,
        objetivo: (d.objetivo || "manter_peso") as DogObjetivo,
        nivel_atividade: (d.nivel_atividade || "moderada") as NivelAtividade,
        condicao_corporal: (d.condicao_corporal || "ideal") as CondicaoCorporal,
        is_puppy: d.is_puppy || false,
        estimated_adult_weight_kg: d.estimated_adult_weight_kg,
      }));

      const typedFoods = (foodsRes.data || []).map(f => ({
        ...f,
        category: f.category as Food["category"],
      }));

      setDogs(typedDogs);
      setFoods(typedFoods);
      setMeals(mealsRes.data || []);
      setWeightLogs(weightRes.data || []);
      setMealPlans(plansRes.data || []);
      setBreedReferences(breedRefsData || []);
      setActivityReferences(activityRefsData || []);

      // Auto-select first dog
      if (typedDogs.length > 0 && !selectedDogId) {
        setSelectedDogId(typedDogs[0].id);
      }

      // Track last active for engagement notifications
      if (isNative && typedDogs.length > 0) {
        sendTags({
          last_active_at: new Date().toISOString(),
          dog_name: typedDogs[0].name
        });
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsLoading(false);
    }
  }, [user, selectedDogId]);

  useEffect(() => {
    fetchData();
  }, [user]);

  // Dog operations
  const addDog = async (dog: Omit<Dog, "id" | "created_at">) => {
    const { data, error } = await supabase
      .from("dogs")
      .insert({
        user_id: user!.id,
        name: dog.name,
        breed: dog.breed,
        birth_date: dog.birth_date,
        current_weight_kg: dog.current_weight_kg,
        size: dog.size,
        sex: dog.sex,
        feeding_type: dog.feeding_type,
        photo_url: dog.photo_url,
        objetivo: dog.objetivo,
        nivel_atividade: dog.nivel_atividade,
        condicao_corporal: dog.condicao_corporal,
        meta_kcal_dia: dog.meta_kcal_dia,
        meta_gramas_dia: dog.meta_gramas_dia,
        is_puppy: dog.is_puppy,
        estimated_adult_weight_kg: dog.estimated_adult_weight_kg,
      })
      .select()
      .single();

    if (error) throw error;

    const newDog: Dog = {
      ...data,
      size: data.size as Dog["size"],
      sex: (data.sex || "macho") as DogSex,
      feeding_type: data.feeding_type as Dog["feeding_type"],
      objetivo: data.objetivo as DogObjetivo,
      nivel_atividade: data.nivel_atividade as NivelAtividade,
      condicao_corporal: data.condicao_corporal as CondicaoCorporal,
      is_puppy: data.is_puppy || false,
      estimated_adult_weight_kg: data.estimated_adult_weight_kg,
    };
    setDogs((prev) => [...prev, newDog]);
    if (!selectedDogId) setSelectedDogId(newDog.id);
  };

  const updateDog = async (id: string, updates: Partial<Dog>) => {
    const { error } = await supabase
      .from("dogs")
      .update(updates)
      .eq("id", id);

    if (error) throw error;

    setDogs((prev) =>
      prev.map((d) => (d.id === id ? { ...d, ...updates } : d))
    );
  };

  const deleteDog = async (id: string) => {
    const { error } = await supabase.from("dogs").delete().eq("id", id);
    if (error) throw error;

    setDogs((prev) => prev.filter((d) => d.id !== id));
    setMeals((prev) => prev.filter((m) => m.dog_id !== id));
    setWeightLogs((prev) => prev.filter((w) => w.dog_id !== id));
    setMealPlans((prev) => prev.filter((p) => p.dog_id !== id));

    if (selectedDogId === id) {
      const remaining = dogs.filter((d) => d.id !== id);
      setSelectedDogId(remaining[0]?.id || null);
    }
  };

  // Food operations
  const addFood = async (food: Omit<Food, "id" | "created_at">) => {
    const { data, error } = await supabase
      .from("foods")
      .insert({
        user_id: user!.id,
        name: food.name,
        category: food.category,
        kcal_per_100g: food.kcal_per_100g,
        notes: food.notes,
      })
      .select()
      .single();

    if (error) throw error;

    const newFood = {
      ...data,
      category: data.category as Food["category"],
    };
    setFoods((prev) => [...prev, newFood]);
  };

  const updateFood = async (id: string, updates: Partial<Food>) => {
    const { error } = await supabase.from("foods").update(updates).eq("id", id);
    if (error) throw error;

    setFoods((prev) =>
      prev.map((f) => (f.id === id ? { ...f, ...updates } : f))
    );
  };

  const deleteFood = async (id: string) => {
    const { error } = await supabase.from("foods").delete().eq("id", id);
    if (error) throw error;

    setFoods((prev) => prev.filter((f) => f.id !== id));
  };

  // Meal operations
  const addMeal = async (
    meal: Omit<Meal, "id" | "created_at">,
    items: { foodId: string; grams: number }[]
  ) => {
    // Insert meal
    const { data: mealData, error: mealError } = await supabase
      .from("meals")
      .insert({
        user_id: user!.id,
        dog_id: meal.dog_id,
        date_time: meal.date_time,
        title: meal.title,
        total_grams: meal.total_grams,
        total_kcal_estimated: meal.total_kcal_estimated,
      })
      .select()
      .single();

    if (mealError) throw mealError;

    // Insert meal items
    if (items.length > 0) {
      const mealItems = items.map((item) => {
        const food = foods.find((f) => f.id === item.foodId);
        const kcalEstimated = food?.kcal_per_100g
          ? Math.round((item.grams * food.kcal_per_100g) / 100)
          : null;

        return {
          meal_id: mealData.id,
          food_id: item.foodId,
          grams: item.grams,
          kcal_estimated: kcalEstimated,
        };
      });

      const { error: itemsError } = await supabase
        .from("meal_items")
        .insert(mealItems);

      if (itemsError) throw itemsError;
    }

    // Fetch updated meal with items
    const { data: updatedMeal } = await supabase
      .from("meals")
      .select("*, meal_items(*)")
      .eq("id", mealData.id)
      .single();

    if (updatedMeal) {
      setMeals((prev) => [updatedMeal, ...prev]);
      
      // Track meal in OneSignal for engagement notifications
      const dog = dogs.find(d => d.id === meal.dog_id);
      if (dog && isNative) {
        trackMealLogged(dog.name);
      }
    }
  };

  const deleteMeal = async (id: string) => {
    const { error } = await supabase.from("meals").delete().eq("id", id);
    if (error) throw error;

    setMeals((prev) => prev.filter((m) => m.id !== id));
  };

  // Weight operations
  const addWeightLog = async (log: Omit<WeightLog, "id" | "created_at">) => {
    const { data, error } = await supabase
      .from("weight_logs")
      .insert({
        user_id: user!.id,
        dog_id: log.dog_id,
        date: log.date,
        weight_kg: log.weight_kg,
      })
      .select()
      .single();

    if (error) throw error;

    setWeightLogs((prev) => [...prev, data]);

    // Update dog's current weight
    await updateDog(log.dog_id, { current_weight_kg: log.weight_kg });

    // Track weight in OneSignal for engagement notifications
    const dog = dogs.find(d => d.id === log.dog_id);
    if (dog && isNative) {
      trackWeightLogged(dog.name, log.weight_kg);
    }
  };

  const deleteWeightLog = async (id: string) => {
    const { error } = await supabase.from("weight_logs").delete().eq("id", id);
    if (error) throw error;

    setWeightLogs((prev) => prev.filter((w) => w.id !== id));
  };

  // Meal Plan operations
  const addMealPlan = async (
    plan: Omit<MealPlan, "id" | "created_at" | "user_id" | "meal_plan_items">,
    items: Omit<MealPlanItem, "id" | "meal_plan_id">[]
  ) => {
    // Deactivate existing plans for this dog
    await supabase
      .from("meal_plans")
      .update({ ativo: false })
      .eq("dog_id", plan.dog_id);

    // Insert new plan
    const { data: planData, error: planError } = await supabase
      .from("meal_plans")
      .insert({
        user_id: user!.id,
        dog_id: plan.dog_id,
        objetivo: plan.objetivo,
        meta_kcal_dia_snapshot: plan.meta_kcal_dia_snapshot,
        meta_gramas_dia_snapshot: plan.meta_gramas_dia_snapshot,
        numero_refeicoes_dia: plan.numero_refeicoes_dia,
        percentual_proteina: plan.percentual_proteina,
        percentual_carbo: plan.percentual_carbo,
        percentual_vegetais: plan.percentual_vegetais,
        observacoes: plan.observacoes,
        ativo: true,
      })
      .select()
      .single();

    if (planError) throw planError;

    // Insert plan items
    if (items.length > 0) {
      const planItems = items.map((item) => ({
        meal_plan_id: planData.id,
        refeicao_ordem: item.refeicao_ordem,
        refeicao_nome: item.refeicao_nome,
        food_id: item.food_id,
        categoria: item.categoria,
        gramas_sugeridas: item.gramas_sugeridas,
      }));

      const { error: itemsError } = await supabase
        .from("meal_plan_items")
        .insert(planItems);

      if (itemsError) throw itemsError;
    }

    // Fetch updated plan with items
    const { data: updatedPlan } = await supabase
      .from("meal_plans")
      .select("*, meal_plan_items(*)")
      .eq("id", planData.id)
      .single();

    if (updatedPlan) {
      setMealPlans((prev) => [updatedPlan, ...prev.map(p => p.dog_id === plan.dog_id ? { ...p, ativo: false } : p)]);
    }
  };

  const deleteMealPlan = async (id: string) => {
    const { error } = await supabase.from("meal_plans").delete().eq("id", id);
    if (error) throw error;

    setMealPlans((prev) => prev.filter((p) => p.id !== id));
  };

  const refreshData = async () => {
    await fetchData();
  };

  // Reference helpers
  const getBreedByName = (name: string): BreedReference | undefined => {
    return breedReferences.find(
      (b) => b.breed_name.toLowerCase() === name.toLowerCase()
    );
  };

  const getActivityReference = (porte: DogPorte, energia: NivelAtividade): ActivityReference | undefined => {
    return activityReferences.find(
      (a) => a.porte === porte && a.energia === energia
    );
  };

  return (
    <DataContext.Provider
      value={{
        dogs,
        foods,
        meals,
        weightLogs,
        mealPlans,
        breedReferences,
        activityReferences,
        selectedDogId,
        isLoading,
        setSelectedDogId,
        addDog,
        updateDog,
        deleteDog,
        addFood,
        updateFood,
        deleteFood,
        addMeal,
        deleteMeal,
        addWeightLog,
        deleteWeightLog,
        addMealPlan,
        deleteMealPlan,
        getBreedByName,
        getActivityReference,
        refreshData,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error("useData must be used within a DataProvider");
  }
  return context;
}