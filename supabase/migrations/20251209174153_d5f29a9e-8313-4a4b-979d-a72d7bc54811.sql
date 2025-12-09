-- Tabela para acompanhamento da transição alimentar
CREATE TABLE public.dietary_transitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dog_id UUID NOT NULL,
  user_id UUID NOT NULL,
  started_at DATE NOT NULL DEFAULT CURRENT_DATE,
  total_days INT NOT NULL DEFAULT 10,
  current_day INT NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'em_andamento' CHECK (status IN ('em_andamento', 'concluida', 'pausada', 'cancelada')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela para registros diários da transição
CREATE TABLE public.transition_daily_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transition_id UUID NOT NULL REFERENCES dietary_transitions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  day_number INT NOT NULL,
  logged_at DATE NOT NULL DEFAULT CURRENT_DATE,
  kibble_percentage INT NOT NULL,
  natural_percentage INT NOT NULL,
  symptoms TEXT[],
  notes TEXT,
  completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela para insights semanais salvos
CREATE TABLE public.weekly_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dog_id UUID NOT NULL,
  user_id UUID NOT NULL,
  week_start DATE NOT NULL,
  week_end DATE NOT NULL,
  insights_data JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.dietary_transitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transition_daily_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_insights ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can CRUD their own dietary transitions"
ON public.dietary_transitions FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can CRUD their own transition logs"
ON public.transition_daily_logs FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can CRUD their own weekly insights"
ON public.weekly_insights FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);