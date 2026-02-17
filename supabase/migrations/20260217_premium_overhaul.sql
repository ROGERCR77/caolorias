-- Premium Overhaul Migration
-- Adds: trial for new users trigger, trial for existing free users, achievements unique constraint, premium achievements

-- 1. Trial para novos usuarios: atualizar trigger
CREATE OR REPLACE FUNCTION public.handle_new_user_subscription()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.user_subscriptions (user_id, plan_type, subscription_status, plan_source, trial_started_at, trial_ends_at)
  VALUES (NEW.id, 'trial', 'trialing', 'none', now(), now() + interval '7 days');
  RETURN NEW;
END;
$$;

-- 2. Trial para existentes free (guard: so quem nunca teve trial)
UPDATE public.user_subscriptions
SET plan_type = 'trial',
    subscription_status = 'trialing',
    trial_started_at = now(),
    trial_ends_at = now() + interval '7 days',
    updated_at = now()
WHERE plan_type = 'free' AND trial_ends_at IS NULL;

-- 3. Unique constraint para achievements.code (necessario para ON CONFLICT)
DO $$ BEGIN
  ALTER TABLE public.achievements ADD CONSTRAINT uq_achievements_code UNIQUE (code);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 4. Premium achievements seed
INSERT INTO public.achievements (code, name, description, icon, category, threshold)
VALUES
  ('premium_7days',    'Guardiao Premium',       '7 dias como assinante Premium',                'crown',  'premium', 7),
  ('premium_streak30', 'Mestre da Consistencia', '30 dias consecutivos de registros (premium)',  'flame',  'premium', 30),
  ('health_score_80',  'Saude em Dia',           'Score de Saude acima de 80',                   'heart',  'premium', 80),
  ('comparator_used',  'Nutricionista',          'Comparou alimentos no comparador',             'scale',  'premium', 3)
ON CONFLICT (code) DO NOTHING;
