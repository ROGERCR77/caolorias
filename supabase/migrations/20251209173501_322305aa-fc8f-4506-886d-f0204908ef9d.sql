-- Tabela para registro de fezes
CREATE TABLE public.poop_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dog_id UUID NOT NULL,
  user_id UUID NOT NULL,
  logged_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  texture TEXT NOT NULL CHECK (texture IN ('duro', 'firme', 'normal', 'mole', 'diarreia')),
  color TEXT NOT NULL CHECK (color IN ('marrom', 'escuro', 'claro', 'amarelo', 'vermelho', 'preto')),
  has_mucus BOOLEAN NOT NULL DEFAULT false,
  has_blood BOOLEAN NOT NULL DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela para registro de sintomas de mal-estar
CREATE TABLE public.health_symptoms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dog_id UUID NOT NULL,
  user_id UUID NOT NULL,
  logged_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  symptoms TEXT[] NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('leve', 'moderado', 'grave')),
  notes TEXT,
  related_food_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela para registro de energia/disposição do cão
CREATE TABLE public.energy_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dog_id UUID NOT NULL,
  user_id UUID NOT NULL,
  logged_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  energy_level TEXT NOT NULL CHECK (energy_level IN ('muito_agitado', 'normal', 'muito_quieto')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.poop_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_symptoms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.energy_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for poop_logs
CREATE POLICY "Users can view their own poop logs"
ON public.poop_logs FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own poop logs"
ON public.poop_logs FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own poop logs"
ON public.poop_logs FOR DELETE
USING (auth.uid() = user_id);

-- RLS Policies for health_symptoms
CREATE POLICY "Users can view their own health symptoms"
ON public.health_symptoms FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own health symptoms"
ON public.health_symptoms FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own health symptoms"
ON public.health_symptoms FOR DELETE
USING (auth.uid() = user_id);

-- RLS Policies for energy_logs
CREATE POLICY "Users can view their own energy logs"
ON public.energy_logs FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own energy logs"
ON public.energy_logs FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own energy logs"
ON public.energy_logs FOR DELETE
USING (auth.uid() = user_id);