-- Add new fields to dogs table for goals
ALTER TABLE public.dogs 
ADD COLUMN IF NOT EXISTS objetivo text DEFAULT 'manter_peso',
ADD COLUMN IF NOT EXISTS nivel_atividade text DEFAULT 'moderada',
ADD COLUMN IF NOT EXISTS condicao_corporal text DEFAULT 'ideal',
ADD COLUMN IF NOT EXISTS meta_kcal_dia numeric DEFAULT NULL,
ADD COLUMN IF NOT EXISTS meta_gramas_dia numeric DEFAULT NULL;

-- Create meal_plans table
CREATE TABLE public.meal_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  dog_id UUID NOT NULL REFERENCES public.dogs(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  objetivo text NOT NULL,
  meta_kcal_dia_snapshot numeric NOT NULL,
  meta_gramas_dia_snapshot numeric NOT NULL,
  numero_refeicoes_dia integer NOT NULL DEFAULT 2,
  percentual_proteina numeric NOT NULL DEFAULT 50,
  percentual_carbo numeric NOT NULL DEFAULT 30,
  percentual_vegetais numeric NOT NULL DEFAULT 20,
  observacoes text,
  ativo boolean NOT NULL DEFAULT true
);

-- Create meal_plan_items table
CREATE TABLE public.meal_plan_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  meal_plan_id UUID NOT NULL REFERENCES public.meal_plans(id) ON DELETE CASCADE,
  refeicao_ordem integer NOT NULL,
  refeicao_nome text NOT NULL,
  food_id UUID REFERENCES public.foods(id) ON DELETE SET NULL,
  categoria text NOT NULL,
  gramas_sugeridas numeric NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on meal_plans
ALTER TABLE public.meal_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own meal plans"
ON public.meal_plans FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own meal plans"
ON public.meal_plans FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own meal plans"
ON public.meal_plans FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own meal plans"
ON public.meal_plans FOR DELETE
USING (auth.uid() = user_id);

-- Enable RLS on meal_plan_items
ALTER TABLE public.meal_plan_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view meal plan items of their plans"
ON public.meal_plan_items FOR SELECT
USING (EXISTS (
  SELECT 1 FROM meal_plans
  WHERE meal_plans.id = meal_plan_items.meal_plan_id
  AND meal_plans.user_id = auth.uid()
));

CREATE POLICY "Users can insert meal plan items for their plans"
ON public.meal_plan_items FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM meal_plans
  WHERE meal_plans.id = meal_plan_items.meal_plan_id
  AND meal_plans.user_id = auth.uid()
));

CREATE POLICY "Users can update meal plan items of their plans"
ON public.meal_plan_items FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM meal_plans
  WHERE meal_plans.id = meal_plan_items.meal_plan_id
  AND meal_plans.user_id = auth.uid()
));

CREATE POLICY "Users can delete meal plan items of their plans"
ON public.meal_plan_items FOR DELETE
USING (EXISTS (
  SELECT 1 FROM meal_plans
  WHERE meal_plans.id = meal_plan_items.meal_plan_id
  AND meal_plans.user_id = auth.uid()
));