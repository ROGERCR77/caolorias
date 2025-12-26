-- ============================================
-- FASE 1: Criar tabelas de referência de alimentos
-- ============================================

-- 1.1 Tabela food_reference (catálogo master público)
CREATE TABLE public.food_reference (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  aliases text[] DEFAULT '{}',
  category_main text NOT NULL CHECK (category_main IN ('PROTEINA', 'VISCERA', 'CARBO', 'VEGETAL', 'GORDURA', 'SUPLEMENTO', 'EXTRA')),
  default_unit text NOT NULL DEFAULT 'GRAMA' CHECK (default_unit IN ('UNIDADE', 'GRAMA', 'COLHER_SOPA', 'COLHER_CHA', 'XICARA')),
  unit_gram_equivalence numeric,
  cost_level text DEFAULT 'MEDIO' CHECK (cost_level IN ('BAIXO', 'MEDIO', 'ALTO')),
  notes_simple text,
  is_common_brazil boolean DEFAULT true,
  cautions text,
  created_at timestamptz DEFAULT now()
);

-- RLS: Leitura pública para autenticados
ALTER TABLE public.food_reference ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view food references" 
  ON public.food_reference FOR SELECT 
  USING (auth.uid() IS NOT NULL);

-- 1.2 Tabela food_macros_reference (dados nutricionais)
CREATE TABLE public.food_macros_reference (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  food_reference_id uuid REFERENCES public.food_reference(id) ON DELETE CASCADE NOT NULL,
  per_100g_kcal numeric NOT NULL,
  per_100g_protein_g numeric DEFAULT 0,
  per_100g_fat_g numeric DEFAULT 0,
  per_100g_carb_g numeric DEFAULT 0,
  source_confidence text DEFAULT 'MEDIA' CHECK (source_confidence IN ('BAIXA', 'MEDIA', 'ALTA')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(food_reference_id)
);

-- RLS: Leitura pública para autenticados
ALTER TABLE public.food_macros_reference ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view food macros" 
  ON public.food_macros_reference FOR SELECT 
  USING (auth.uid() IS NOT NULL);

-- 1.3 Tabela food_substitutions (mapa de trocas)
CREATE TABLE public.food_substitutions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  food_id uuid REFERENCES public.food_reference(id) ON DELETE CASCADE NOT NULL,
  can_replace_food_id uuid REFERENCES public.food_reference(id) ON DELETE CASCADE NOT NULL,
  ratio_hint text,
  reason text,
  created_at timestamptz DEFAULT now()
);

-- RLS: Leitura pública para autenticados
ALTER TABLE public.food_substitutions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view food substitutions" 
  ON public.food_substitutions FOR SELECT 
  USING (auth.uid() IS NOT NULL);

-- 1.4 Expandir tabela foods do usuário
ALTER TABLE public.foods 
  ADD COLUMN IF NOT EXISTS reference_food_id uuid REFERENCES public.food_reference(id),
  ADD COLUMN IF NOT EXISTS unit_type text DEFAULT 'GRAMA',
  ADD COLUMN IF NOT EXISTS grams_per_unit numeric,
  ADD COLUMN IF NOT EXISTS protein_g numeric,
  ADD COLUMN IF NOT EXISTS fat_g numeric,
  ADD COLUMN IF NOT EXISTS carb_g numeric,
  ADD COLUMN IF NOT EXISTS cost_level text;

-- Criar índices para performance
CREATE INDEX idx_food_reference_name ON public.food_reference USING gin (to_tsvector('portuguese', name));
CREATE INDEX idx_food_reference_category ON public.food_reference(category_main);
CREATE INDEX idx_food_reference_cost ON public.food_reference(cost_level);
CREATE INDEX idx_food_macros_food_id ON public.food_macros_reference(food_reference_id);
CREATE INDEX idx_food_substitutions_food_id ON public.food_substitutions(food_id);
CREATE INDEX idx_foods_reference_id ON public.foods(reference_food_id);