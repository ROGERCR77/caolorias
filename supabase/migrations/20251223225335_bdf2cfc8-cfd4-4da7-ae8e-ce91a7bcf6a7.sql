-- Add viewed_by_vet column to tutor_health_reports
ALTER TABLE public.tutor_health_reports 
ADD COLUMN viewed_by_vet boolean NOT NULL DEFAULT false;

-- Add index for faster queries on unviewed reports
CREATE INDEX idx_tutor_health_reports_viewed ON public.tutor_health_reports(viewed_by_vet) WHERE viewed_by_vet = false;