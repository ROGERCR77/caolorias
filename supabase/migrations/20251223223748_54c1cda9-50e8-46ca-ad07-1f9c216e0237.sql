-- Tabela para armazenar relatórios de saúde gerados pelo tutor
CREATE TABLE public.tutor_health_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dog_id uuid NOT NULL REFERENCES public.dogs(id) ON DELETE CASCADE,
  tutor_user_id uuid NOT NULL,
  generated_at timestamptz NOT NULL DEFAULT now(),
  report_data jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Índices para consultas eficientes
CREATE INDEX idx_tutor_health_reports_dog_id ON public.tutor_health_reports(dog_id);
CREATE INDEX idx_tutor_health_reports_tutor_user_id ON public.tutor_health_reports(tutor_user_id);
CREATE INDEX idx_tutor_health_reports_generated_at ON public.tutor_health_reports(generated_at DESC);

-- Habilitar RLS
ALTER TABLE public.tutor_health_reports ENABLE ROW LEVEL SECURITY;

-- Tutores podem inserir e visualizar seus próprios relatórios
CREATE POLICY "Tutors can insert their own reports" 
ON public.tutor_health_reports 
FOR INSERT 
WITH CHECK (auth.uid() = tutor_user_id);

CREATE POLICY "Tutors can view their own reports" 
ON public.tutor_health_reports 
FOR SELECT 
USING (auth.uid() = tutor_user_id);

CREATE POLICY "Tutors can delete their own reports" 
ON public.tutor_health_reports 
FOR DELETE 
USING (auth.uid() = tutor_user_id);

-- Veterinários podem visualizar relatórios de cães vinculados ativos
CREATE POLICY "Vets can view linked dogs reports" 
ON public.tutor_health_reports 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM vet_dog_links
    WHERE vet_dog_links.dog_id = tutor_health_reports.dog_id
      AND vet_dog_links.vet_user_id = auth.uid()
      AND vet_dog_links.status = 'active'
  )
);