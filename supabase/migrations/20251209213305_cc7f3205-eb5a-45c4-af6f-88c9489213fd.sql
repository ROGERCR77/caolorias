-- Adicionar coluna plan_source na tabela user_subscriptions
ALTER TABLE public.user_subscriptions 
ADD COLUMN IF NOT EXISTS plan_source text NOT NULL DEFAULT 'none';

-- Adicionar constraint check para valores válidos
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'user_subscriptions_plan_source_check'
  ) THEN
    ALTER TABLE public.user_subscriptions 
    ADD CONSTRAINT user_subscriptions_plan_source_check 
    CHECK (plan_source IN ('none', 'stripe', 'appstore', 'playstore'));
  END IF;
END $$;