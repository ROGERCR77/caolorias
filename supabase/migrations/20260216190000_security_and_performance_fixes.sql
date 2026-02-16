-- Migration: Security and Performance Fixes
-- Date: 2026-02-16
-- Description:
--   1. Fix delete_user function to only allow self-deletion (CRITICAL security fix)
--   2. Add missing FK constraints on health tables
--   3. Add performance indexes for common query patterns
--   4. Create reminder_sends table (required by process-reminders)
--   5. Add unique constraint on user_achievements

-- =============================================================================
-- 1. Fix delete_user function (CRITICAL SECURITY FIX)
--    The previous version allowed ANY user to delete ANY other user.
--    This version restricts deletion to the authenticated user's own account.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.delete_user()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only allow users to delete their own account
  DELETE FROM auth.users WHERE id = auth.uid();
END;
$$;

-- =============================================================================
-- 2. Add missing FK constraints on health tables
--    Using DO blocks with exception handling since the constraints may already exist.
-- =============================================================================

-- poop_logs -> dogs
DO $$
BEGIN
  ALTER TABLE public.poop_logs ADD CONSTRAINT fk_poop_logs_dog FOREIGN KEY (dog_id) REFERENCES public.dogs(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- health_symptoms -> dogs
DO $$
BEGIN
  ALTER TABLE public.health_symptoms ADD CONSTRAINT fk_health_symptoms_dog FOREIGN KEY (dog_id) REFERENCES public.dogs(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- energy_logs -> dogs
DO $$
BEGIN
  ALTER TABLE public.energy_logs ADD CONSTRAINT fk_energy_logs_dog FOREIGN KEY (dog_id) REFERENCES public.dogs(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- health_records -> dogs
DO $$
BEGIN
  ALTER TABLE public.health_records ADD CONSTRAINT fk_health_records_dog FOREIGN KEY (dog_id) REFERENCES public.dogs(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- food_intolerances -> dogs
DO $$
BEGIN
  ALTER TABLE public.food_intolerances ADD CONSTRAINT fk_food_intolerances_dog FOREIGN KEY (dog_id) REFERENCES public.dogs(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- activity_logs -> dogs
DO $$
BEGIN
  ALTER TABLE public.activity_logs ADD CONSTRAINT fk_activity_logs_dog FOREIGN KEY (dog_id) REFERENCES public.dogs(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- =============================================================================
-- 3. Add performance indexes
-- =============================================================================

-- User ID indexes for all main tables
CREATE INDEX IF NOT EXISTS idx_dogs_user_id ON public.dogs(user_id);
CREATE INDEX IF NOT EXISTS idx_meals_user_id ON public.meals(user_id);
CREATE INDEX IF NOT EXISTS idx_meals_dog_id ON public.meals(dog_id);
CREATE INDEX IF NOT EXISTS idx_foods_user_id ON public.foods(user_id);
CREATE INDEX IF NOT EXISTS idx_weight_logs_dog_id ON public.weight_logs(dog_id);
CREATE INDEX IF NOT EXISTS idx_meal_items_meal_id ON public.meal_items(meal_id);
CREATE INDEX IF NOT EXISTS idx_poop_logs_dog_id ON public.poop_logs(dog_id);
CREATE INDEX IF NOT EXISTS idx_health_symptoms_dog_id ON public.health_symptoms(dog_id);
CREATE INDEX IF NOT EXISTS idx_energy_logs_dog_id ON public.energy_logs(dog_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_dog_id ON public.activity_logs(dog_id);
CREATE INDEX IF NOT EXISTS idx_health_records_dog_id ON public.health_records(dog_id);
CREATE INDEX IF NOT EXISTS idx_food_intolerances_dog_id ON public.food_intolerances(dog_id);
CREATE INDEX IF NOT EXISTS idx_reminders_user_id ON public.reminders(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON public.user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_streaks_user_id ON public.user_streaks(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON public.user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);

-- Date/time indexes for time-series queries
CREATE INDEX IF NOT EXISTS idx_meals_date_time ON public.meals(date_time DESC);
CREATE INDEX IF NOT EXISTS idx_weight_logs_date ON public.weight_logs(date DESC);
CREATE INDEX IF NOT EXISTS idx_poop_logs_logged_at ON public.poop_logs(logged_at DESC);
CREATE INDEX IF NOT EXISTS idx_health_symptoms_logged_at ON public.health_symptoms(logged_at DESC);
CREATE INDEX IF NOT EXISTS idx_energy_logs_logged_at ON public.energy_logs(logged_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_logged_at ON public.activity_logs(logged_at DESC);

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_meals_dog_date ON public.meals(dog_id, date_time DESC);
CREATE INDEX IF NOT EXISTS idx_weight_logs_dog_date ON public.weight_logs(dog_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_reminders_enabled_time ON public.reminders(enabled, time) WHERE enabled = true;

-- =============================================================================
-- 4. Create reminder_sends table
--    Referenced by process-reminders edge function but was missing from schema.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.reminder_sends (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  reminder_id uuid NOT NULL REFERENCES public.reminders(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sent_date text NOT NULL,
  sent_time text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(reminder_id, sent_date, sent_time)
);

ALTER TABLE public.reminder_sends ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  CREATE POLICY "Users can view their own reminder sends"
    ON public.reminder_sends FOR SELECT
    USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- =============================================================================
-- 5. Add unique constraint on user_achievements
--    Prevents duplicate achievement entries for the same user.
-- =============================================================================

DO $$
BEGIN
  ALTER TABLE public.user_achievements ADD CONSTRAINT uq_user_achievements UNIQUE (user_id, achievement_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
