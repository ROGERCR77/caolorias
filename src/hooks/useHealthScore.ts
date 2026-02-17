import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useData } from "@/contexts/DataContext";
import { supabase } from "@/lib/supabaseClient";
import { subDays, isAfter, parseISO } from "date-fns";
import { calculateConsecutiveDays } from "@/lib/insights";

interface HealthBreakdown {
  meals: number;
  weight: number;
  activity: number;
  digestive: number;
  vaccines: number;
}

interface HealthScoreResult {
  score: number;
  breakdown: HealthBreakdown;
  isLoading: boolean;
}

export function useHealthScore(dogId: string | undefined): HealthScoreResult {
  const { user } = useAuth();
  const { meals, weightLogs, dogs, getActivityReference } = useData();
  const [digestiveScore, setDigestiveScore] = useState(15);
  const [vaccineScore, setVaccineScore] = useState(15);
  const [activityMinutes, setActivityMinutes] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const dog = dogs.find(d => d.id === dogId);

  useEffect(() => {
    if (!user || !dogId) {
      setIsLoading(false);
      return;
    }

    const fetchHealthData = async () => {
      setIsLoading(true);
      try {
        const sevenDaysAgo = subDays(new Date(), 7).toISOString();

        const [poopRes, symptomsRes, activityRes, healthRecordsRes] = await Promise.all([
          supabase
            .from("poop_logs")
            .select("texture, has_blood, has_mucus, color")
            .eq("dog_id", dogId)
            .gte("logged_at", sevenDaysAgo),
          supabase
            .from("health_symptoms")
            .select("severity")
            .eq("dog_id", dogId)
            .gte("logged_at", sevenDaysAgo),
          supabase
            .from("activity_logs")
            .select("duration_minutes")
            .eq("dog_id", dogId)
            .gte("logged_at", sevenDaysAgo),
          supabase
            .from("health_records")
            .select("record_type, next_due_date")
            .eq("dog_id", dogId)
            .eq("record_type", "vaccine"),
        ]);

        // Digestive score (15 pts max)
        const poopLogs = poopRes.data || [];
        const symptomLogs = symptomsRes.data || [];
        const hasDigestiveAlerts = poopLogs.some(
          (p: any) =>
            p.texture === "diarreia" ||
            p.has_blood ||
            p.has_mucus ||
            p.color === "vermelho" ||
            p.color === "preto"
        );
        const hasSymptoms = symptomLogs.some((s: any) => s.severity === "grave");
        let dScore = 15;
        if (hasDigestiveAlerts) dScore -= 8;
        if (hasSymptoms) dScore -= 7;
        setDigestiveScore(Math.max(0, dScore));

        // Activity score data
        const activities = activityRes.data || [];
        const totalMinutes = activities.reduce(
          (sum: number, a: any) => sum + (a.duration_minutes || 0),
          0
        );
        setActivityMinutes(totalMinutes);

        // Vaccine score (15 pts max)
        const healthRecords = healthRecordsRes.data || [];
        const now = new Date();
        const expiredVaccines = healthRecords.filter(
          (r: any) => r.next_due_date && isAfter(now, parseISO(r.next_due_date))
        );
        let vScore = 15;
        if (expiredVaccines.length > 0) {
          vScore = Math.max(0, 15 - expiredVaccines.length * 5);
        }
        setVaccineScore(vScore);
      } catch (error) {
        console.error("Error fetching health score data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHealthData();
  }, [user, dogId]);

  const result = useMemo(() => {
    if (!dog || !dogId) {
      return {
        score: 0,
        breakdown: { meals: 0, weight: 0, activity: 0, digestive: 0, vaccines: 0 },
        isLoading,
      };
    }

    // Meals consistency (25 pts): streak / 7 * 25
    const streak = calculateConsecutiveDays(meals, dogId);
    const mealsScore = Math.min(25, Math.round((streak / 7) * 25));

    // Weight vs goal (25 pts)
    const dogWeightLogs = weightLogs
      .filter(w => w.dog_id === dogId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    let weightScore = 12; // Default middle score
    if (dogWeightLogs.length > 0) {
      const latestWeight = dogWeightLogs[0].weight_kg;
      const targetWeight = dog.current_weight_kg;
      if (targetWeight > 0) {
        const deviation = Math.abs(latestWeight - targetWeight) / targetWeight;
        weightScore = Math.max(0, Math.round(25 * (1 - deviation * 2)));
      }
    }

    // Activity (20 pts): actual vs recommended
    const sizeToPorte: Record<string, string> = {
      small: "pequeno",
      medium: "medio",
      large: "grande",
      giant: "gigante",
    };
    const dogPorte = sizeToPorte[dog.size || "medium"] || "medio";
    const activityRef = getActivityReference(
      dogPorte as any,
      dog.nivel_atividade || "moderada"
    );
    const dailyGoalAvg = activityRef
      ? (activityRef.minutos_min_dia + activityRef.minutos_max_dia) / 2
      : 45;
    const weeklyGoal = dailyGoalAvg * 7;
    const activityScore = Math.min(
      20,
      Math.round((activityMinutes / weeklyGoal) * 20)
    );

    const totalScore = mealsScore + weightScore + activityScore + digestiveScore + vaccineScore;

    return {
      score: Math.min(100, Math.max(0, totalScore)),
      breakdown: {
        meals: mealsScore,
        weight: weightScore,
        activity: activityScore,
        digestive: digestiveScore,
        vaccines: vaccineScore,
      },
      isLoading,
    };
  }, [dog, dogId, meals, weightLogs, activityMinutes, digestiveScore, vaccineScore, isLoading]);

  return result;
}
