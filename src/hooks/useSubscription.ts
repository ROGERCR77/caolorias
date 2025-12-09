import { useSubscription as useSubscriptionContext } from "@/contexts/SubscriptionContext";

// Re-export for convenience
export { useSubscription } from "@/contexts/SubscriptionContext";

// Plan limits for feature gating
export const PLAN_LIMITS = {
  free: {
    max_dogs: 1,
    max_meals_per_day: 2,
    max_history_days: 7,
    has_weight_history: false,
    has_ai_features: false,
    has_charts: false,
    has_favorites: false,
    has_recipes: false,
    has_advanced_alerts: false,
    has_activity_recommendations: false,
    has_pdf_export: false,
    has_multi_profile: false,
    allowed_objectives: ["alimentacao_saudavel"],
  },
  premium: {
    max_dogs: 10,
    max_meals_per_day: Infinity,
    max_history_days: Infinity,
    has_weight_history: true,
    has_ai_features: true,
    has_charts: true,
    has_favorites: true,
    has_recipes: true,
    has_advanced_alerts: true,
    has_activity_recommendations: true,
    has_pdf_export: true,
    has_multi_profile: true,
    allowed_objectives: ["alimentacao_saudavel", "manter_peso", "perder_peso", "ganhar_peso"],
  },
  trial: {
    max_dogs: 10,
    max_meals_per_day: Infinity,
    max_history_days: Infinity,
    has_weight_history: true,
    has_ai_features: true,
    has_charts: true,
    has_favorites: true,
    has_recipes: true,
    has_advanced_alerts: true,
    has_activity_recommendations: true,
    has_pdf_export: true,
    has_multi_profile: true,
    allowed_objectives: ["alimentacao_saudavel", "manter_peso", "perder_peso", "ganhar_peso"],
  },
};

export function usePlanLimits() {
  const { planType, isTrialExpired } = useSubscriptionContext();
  
  const effectivePlan = planType === "trial" && isTrialExpired ? "free" : planType;
  return PLAN_LIMITS[effectivePlan];
}
