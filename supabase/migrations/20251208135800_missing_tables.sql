-- Migration para tabelas criadas no Lovable Cloud sem migration local
-- Essas 11 tabelas existem no types.ts mas não tinham CREATE TABLE nas migrations

-- 1. achievements
CREATE TABLE IF NOT EXISTS public.achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT '',
  threshold INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view achievements" ON public.achievements FOR SELECT USING (true);

-- 2. user_achievements
CREATE TABLE IF NOT EXISTS public.user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  achievement_id UUID REFERENCES public.achievements(id) ON DELETE CASCADE NOT NULL,
  unlocked_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own achievements" ON public.user_achievements FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own achievements" ON public.user_achievements FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 3. user_streaks
CREATE TABLE IF NOT EXISTS public.user_streaks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  last_activity_date DATE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.user_streaks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own streaks" ON public.user_streaks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own streaks" ON public.user_streaks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own streaks" ON public.user_streaks FOR UPDATE USING (auth.uid() = user_id);

-- 4. user_subscriptions
CREATE TABLE IF NOT EXISTS public.user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  plan_type TEXT NOT NULL DEFAULT 'free',
  subscription_status TEXT NOT NULL DEFAULT 'active',
  plan_source TEXT NOT NULL DEFAULT 'none',
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  trial_started_at TIMESTAMPTZ,
  trial_ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own subscription" ON public.user_subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own subscription" ON public.user_subscriptions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own subscription" ON public.user_subscriptions FOR UPDATE USING (auth.uid() = user_id);

-- 5. plan_limits
CREATE TABLE IF NOT EXISTS public.plan_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_type TEXT NOT NULL UNIQUE,
  max_dogs INTEGER NOT NULL DEFAULT 1,
  max_meals_per_day INTEGER NOT NULL DEFAULT 3,
  max_history_days INTEGER NOT NULL DEFAULT 7,
  has_charts BOOLEAN NOT NULL DEFAULT false,
  has_weight_history BOOLEAN NOT NULL DEFAULT false,
  has_ai_features BOOLEAN NOT NULL DEFAULT false,
  has_recipes BOOLEAN NOT NULL DEFAULT false,
  has_favorites BOOLEAN NOT NULL DEFAULT false,
  has_multi_profile BOOLEAN NOT NULL DEFAULT false,
  has_pdf_export BOOLEAN NOT NULL DEFAULT false,
  has_activity_recommendations BOOLEAN NOT NULL DEFAULT false,
  has_advanced_alerts BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.plan_limits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view plan limits" ON public.plan_limits FOR SELECT USING (true);

-- 6. ai_insights_history
CREATE TABLE IF NOT EXISTS public.ai_insights_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  dog_id UUID REFERENCES public.dogs(id) ON DELETE CASCADE NOT NULL,
  insights JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.ai_insights_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own ai insights" ON public.ai_insights_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own ai insights" ON public.ai_insights_history FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 7. favorite_meals
CREATE TABLE IF NOT EXISTS public.favorite_meals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.favorite_meals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own favorite meals" ON public.favorite_meals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own favorite meals" ON public.favorite_meals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own favorite meals" ON public.favorite_meals FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own favorite meals" ON public.favorite_meals FOR DELETE USING (auth.uid() = user_id);

-- 8. favorite_meal_items
CREATE TABLE IF NOT EXISTS public.favorite_meal_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  favorite_meal_id UUID REFERENCES public.favorite_meals(id) ON DELETE CASCADE NOT NULL,
  food_id UUID REFERENCES public.foods(id) ON DELETE CASCADE NOT NULL,
  grams NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.favorite_meal_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own favorite meal items" ON public.favorite_meal_items FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.favorite_meals WHERE favorite_meals.id = favorite_meal_items.favorite_meal_id AND favorite_meals.user_id = auth.uid()));
CREATE POLICY "Users can insert their own favorite meal items" ON public.favorite_meal_items FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.favorite_meals WHERE favorite_meals.id = favorite_meal_items.favorite_meal_id AND favorite_meals.user_id = auth.uid()));
CREATE POLICY "Users can delete their own favorite meal items" ON public.favorite_meal_items FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.favorite_meals WHERE favorite_meals.id = favorite_meal_items.favorite_meal_id AND favorite_meals.user_id = auth.uid()));

-- 9. recipes
CREATE TABLE IF NOT EXISTS public.recipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  servings INTEGER,
  total_grams NUMERIC,
  total_kcal NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own recipes" ON public.recipes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own recipes" ON public.recipes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own recipes" ON public.recipes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own recipes" ON public.recipes FOR DELETE USING (auth.uid() = user_id);

-- 10. recipe_items
CREATE TABLE IF NOT EXISTS public.recipe_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id UUID REFERENCES public.recipes(id) ON DELETE CASCADE NOT NULL,
  food_id UUID REFERENCES public.foods(id) ON DELETE CASCADE NOT NULL,
  grams NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.recipe_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own recipe items" ON public.recipe_items FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.recipes WHERE recipes.id = recipe_items.recipe_id AND recipes.user_id = auth.uid()));
CREATE POLICY "Users can insert their own recipe items" ON public.recipe_items FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.recipes WHERE recipes.id = recipe_items.recipe_id AND recipes.user_id = auth.uid()));
CREATE POLICY "Users can delete their own recipe items" ON public.recipe_items FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.recipes WHERE recipes.id = recipe_items.recipe_id AND recipes.user_id = auth.uid()));

-- 11. reminders
CREATE TABLE IF NOT EXISTS public.reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  dog_id UUID REFERENCES public.dogs(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  message TEXT,
  type TEXT NOT NULL DEFAULT 'custom',
  time TIME NOT NULL,
  days_of_week INTEGER[] NOT NULL DEFAULT '{1,2,3,4,5,6,0}',
  scheduled_date DATE,
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own reminders" ON public.reminders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own reminders" ON public.reminders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own reminders" ON public.reminders FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own reminders" ON public.reminders FOR DELETE USING (auth.uid() = user_id);
