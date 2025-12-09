-- Tabela para registros de saúde (vacinas, vermífugo, antipulgas)
CREATE TABLE public.health_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dog_id UUID NOT NULL,
  user_id UUID NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('vacina', 'vermifugo', 'antipulgas', 'outro')),
  name TEXT NOT NULL,
  applied_at DATE NOT NULL,
  next_due_at DATE,
  notes TEXT,
  photo_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela para intolerâncias e alergias alimentares
CREATE TABLE public.food_intolerances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dog_id UUID NOT NULL,
  user_id UUID NOT NULL,
  food_id UUID,
  food_name TEXT,
  reaction_type TEXT NOT NULL CHECK (reaction_type IN ('alergia', 'intolerancia', 'nao_gostou')),
  symptoms TEXT[],
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela para registro de atividade física
CREATE TABLE public.activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dog_id UUID NOT NULL,
  user_id UUID NOT NULL,
  logged_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  type TEXT NOT NULL CHECK (type IN ('caminhada', 'corrida', 'brincadeira', 'natacao', 'outro')),
  duration_minutes INT NOT NULL,
  intensity TEXT NOT NULL CHECK (intensity IN ('leve', 'moderada', 'intensa')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.health_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.food_intolerances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for health_records
CREATE POLICY "Users can view their own health records"
ON public.health_records FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own health records"
ON public.health_records FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own health records"
ON public.health_records FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own health records"
ON public.health_records FOR DELETE
USING (auth.uid() = user_id);

-- RLS Policies for food_intolerances
CREATE POLICY "Users can view their own food intolerances"
ON public.food_intolerances FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own food intolerances"
ON public.food_intolerances FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own food intolerances"
ON public.food_intolerances FOR DELETE
USING (auth.uid() = user_id);

-- RLS Policies for activity_logs
CREATE POLICY "Users can view their own activity logs"
ON public.activity_logs FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own activity logs"
ON public.activity_logs FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own activity logs"
ON public.activity_logs FOR DELETE
USING (auth.uid() = user_id);