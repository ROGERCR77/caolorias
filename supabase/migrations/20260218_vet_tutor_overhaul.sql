-- =====================================================
-- VET-TUTOR INTEGRATION OVERHAUL
-- Migration: 20260218_vet_tutor_overhaul.sql
-- =====================================================

-- 1. ALTER health_records: add source tracking
ALTER TABLE public.health_records
  ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'tutor' CHECK (source IN ('tutor', 'vet')),
  ADD COLUMN IF NOT EXISTS vet_note_id UUID REFERENCES public.vet_notes(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_health_records_vet_note_id
  ON public.health_records(vet_note_id) WHERE vet_note_id IS NOT NULL;

-- 2. vet_messages (Chat tutor<->vet)
CREATE TABLE IF NOT EXISTS public.vet_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vet_dog_link_id UUID NOT NULL REFERENCES public.vet_dog_links(id) ON DELETE CASCADE,
  sender_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sender_role TEXT NOT NULL CHECK (sender_role IN ('tutor', 'vet')),
  content TEXT NOT NULL CHECK (char_length(content) <= 2000),
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_vet_messages_link_created
  ON public.vet_messages(vet_dog_link_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_vet_messages_unread
  ON public.vet_messages(vet_dog_link_id, sender_user_id) WHERE read_at IS NULL;

ALTER TABLE public.vet_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view messages of their active links" ON public.vet_messages FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.vet_dog_links l
    WHERE l.id = vet_messages.vet_dog_link_id
      AND l.status = 'active'
      AND (l.tutor_user_id = auth.uid() OR l.vet_user_id = auth.uid())
  ));

CREATE POLICY "Users can send messages on their active links" ON public.vet_messages FOR INSERT
  WITH CHECK (
    sender_user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.vet_dog_links l
      WHERE l.id = vet_dog_link_id
        AND l.status = 'active'
        AND (l.tutor_user_id = auth.uid() OR l.vet_user_id = auth.uid())
    )
  );

CREATE POLICY "Non-sender can mark messages as read" ON public.vet_messages FOR UPDATE
  USING (
    sender_user_id != auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.vet_dog_links l
      WHERE l.id = vet_messages.vet_dog_link_id
        AND l.status = 'active'
        AND (l.tutor_user_id = auth.uid() OR l.vet_user_id = auth.uid())
    )
  )
  WITH CHECK (
    sender_user_id != auth.uid()
  );

-- 3. vet_health_alerts (Automatic alerts)
CREATE TABLE IF NOT EXISTS public.vet_health_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dog_id UUID NOT NULL REFERENCES public.dogs(id) ON DELETE CASCADE,
  vet_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL CHECK (alert_type IN ('weight_drop', 'blood_stool', 'low_energy', 'severe_symptoms')),
  alert_data JSONB NOT NULL DEFAULT '{}',
  acknowledged_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_vet_health_alerts_dedup
  ON public.vet_health_alerts(dog_id, vet_user_id, alert_type, (created_at::date));

ALTER TABLE public.vet_health_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Vets can view own alerts" ON public.vet_health_alerts FOR SELECT
  USING (vet_user_id = auth.uid());

CREATE POLICY "Vets can acknowledge own alerts" ON public.vet_health_alerts FOR UPDATE
  USING (vet_user_id = auth.uid())
  WITH CHECK (vet_user_id = auth.uid());

CREATE POLICY "Service role can insert alerts" ON public.vet_health_alerts FOR INSERT
  WITH CHECK (true);

-- 4. vet_prescriptions (Dietary prescriptions)
CREATE TABLE IF NOT EXISTS public.vet_prescriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vet_dog_link_id UUID NOT NULL REFERENCES public.vet_dog_links(id) ON DELETE CASCADE,
  vet_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  notes TEXT,
  total_kcal_target INTEGER,
  meals_per_day INTEGER NOT NULL DEFAULT 2,
  is_active BOOLEAN NOT NULL DEFAULT true,
  valid_until DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.vet_prescriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Vets manage own prescriptions" ON public.vet_prescriptions FOR ALL
  USING (vet_user_id = auth.uid());

CREATE POLICY "Tutors view prescriptions via active link" ON public.vet_prescriptions FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.vet_dog_links l
    WHERE l.id = vet_prescriptions.vet_dog_link_id
      AND l.status = 'active'
      AND l.tutor_user_id = auth.uid()
  ));

-- 5. vet_prescription_items
CREATE TABLE IF NOT EXISTS public.vet_prescription_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prescription_id UUID NOT NULL REFERENCES public.vet_prescriptions(id) ON DELETE CASCADE,
  food_reference_id UUID REFERENCES public.foods(id) ON DELETE SET NULL,
  food_name TEXT NOT NULL,
  grams INTEGER NOT NULL,
  meal_number INTEGER NOT NULL DEFAULT 1,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.vet_prescription_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Vets manage items via prescription" ON public.vet_prescription_items FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.vet_prescriptions p
    WHERE p.id = vet_prescription_items.prescription_id
      AND p.vet_user_id = auth.uid()
  ));

CREATE POLICY "Tutors view items via prescription link" ON public.vet_prescription_items FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.vet_prescriptions p
    JOIN public.vet_dog_links l ON l.id = p.vet_dog_link_id
    WHERE p.id = vet_prescription_items.prescription_id
      AND l.status = 'active'
      AND l.tutor_user_id = auth.uid()
  ));

-- 6. vet_medications
CREATE TABLE IF NOT EXISTS public.vet_medications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vet_dog_link_id UUID NOT NULL REFERENCES public.vet_dog_links(id) ON DELETE CASCADE,
  vet_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  medication_name TEXT NOT NULL,
  dosage TEXT,
  frequency TEXT,
  duration_days INTEGER,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE,
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.vet_medications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Vets manage own medications" ON public.vet_medications FOR ALL
  USING (vet_user_id = auth.uid());

CREATE POLICY "Tutors view medications via active link" ON public.vet_medications FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.vet_dog_links l
    WHERE l.id = vet_medications.vet_dog_link_id
      AND l.status = 'active'
      AND l.tutor_user_id = auth.uid()
  ));

-- 7. vet_treatment_plans
CREATE TABLE IF NOT EXISTS public.vet_treatment_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vet_dog_link_id UUID NOT NULL REFERENCES public.vet_dog_links(id) ON DELETE CASCADE,
  vet_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.vet_treatment_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Vets manage own treatment plans" ON public.vet_treatment_plans FOR ALL
  USING (vet_user_id = auth.uid());

CREATE POLICY "Tutors view treatment plans via active link" ON public.vet_treatment_plans FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.vet_dog_links l
    WHERE l.id = vet_treatment_plans.vet_dog_link_id
      AND l.status = 'active'
      AND l.tutor_user_id = auth.uid()
  ));

-- 8. vet_treatment_steps
CREATE TABLE IF NOT EXISTS public.vet_treatment_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES public.vet_treatment_plans(id) ON DELETE CASCADE,
  step_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  target_date DATE,
  completed_at TIMESTAMPTZ,
  completed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.vet_treatment_steps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Vets manage steps via plan" ON public.vet_treatment_steps FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.vet_treatment_plans p
    WHERE p.id = vet_treatment_steps.plan_id
      AND p.vet_user_id = auth.uid()
  ));

CREATE POLICY "Tutors view and complete steps via plan link" ON public.vet_treatment_steps FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.vet_treatment_plans p
    JOIN public.vet_dog_links l ON l.id = p.vet_dog_link_id
    WHERE p.id = vet_treatment_steps.plan_id
      AND l.status = 'active'
      AND l.tutor_user_id = auth.uid()
  ));

CREATE POLICY "Tutors can mark steps complete" ON public.vet_treatment_steps FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.vet_treatment_plans p
    JOIN public.vet_dog_links l ON l.id = p.vet_dog_link_id
    WHERE p.id = vet_treatment_steps.plan_id
      AND l.status = 'active'
      AND l.tutor_user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.vet_treatment_plans p
    JOIN public.vet_dog_links l ON l.id = p.vet_dog_link_id
    WHERE p.id = vet_treatment_steps.plan_id
      AND l.status = 'active'
      AND l.tutor_user_id = auth.uid()
  ));

-- 9. vet_note_attachments
CREATE TABLE IF NOT EXISTS public.vet_note_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vet_note_id UUID NOT NULL REFERENCES public.vet_notes(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL DEFAULT 'image' CHECK (file_type IN ('image', 'pdf', 'document')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.vet_note_attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Vets manage attachments via note" ON public.vet_note_attachments FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.vet_notes n
    WHERE n.id = vet_note_attachments.vet_note_id
      AND n.vet_user_id = auth.uid()
  ));

CREATE POLICY "Tutors view attachments via note link" ON public.vet_note_attachments FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.vet_notes n
    JOIN public.vet_dog_links l ON l.id = n.vet_dog_link_id
    WHERE n.id = vet_note_attachments.vet_note_id
      AND l.status = 'active'
      AND l.tutor_user_id = auth.uid()
  ));

-- 10. vet_report_comments
CREATE TABLE IF NOT EXISTS public.vet_report_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES public.tutor_health_reports(id) ON DELETE CASCADE,
  vet_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (char_length(content) <= 2000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.vet_report_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Vets manage own comments" ON public.vet_report_comments FOR ALL
  USING (vet_user_id = auth.uid());

CREATE POLICY "Tutors view comments on own reports" ON public.vet_report_comments FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.tutor_health_reports r
    WHERE r.id = vet_report_comments.report_id
      AND r.tutor_user_id = auth.uid()
  ));

-- 11. vet_appointments
CREATE TABLE IF NOT EXISTS public.vet_appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vet_dog_link_id UUID NOT NULL REFERENCES public.vet_dog_links(id) ON DELETE CASCADE,
  requested_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'requested' CHECK (status IN ('requested', 'confirmed', 'canceled', 'completed')),
  requested_date DATE NOT NULL,
  requested_time TIME,
  reason TEXT,
  vet_response_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.vet_appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tutors manage appointments via link" ON public.vet_appointments FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.vet_dog_links l
    WHERE l.id = vet_appointments.vet_dog_link_id
      AND l.status = 'active'
      AND l.tutor_user_id = auth.uid()
  ));

CREATE POLICY "Vets view and update appointments via link" ON public.vet_appointments FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.vet_dog_links l
    WHERE l.id = vet_appointments.vet_dog_link_id
      AND l.status = 'active'
      AND l.vet_user_id = auth.uid()
  ));

CREATE POLICY "Vets can update appointments" ON public.vet_appointments FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.vet_dog_links l
    WHERE l.id = vet_appointments.vet_dog_link_id
      AND l.status = 'active'
      AND l.vet_user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.vet_dog_links l
    WHERE l.id = vet_appointments.vet_dog_link_id
      AND l.status = 'active'
      AND l.vet_user_id = auth.uid()
  ));

-- 12. vet_history_shares
CREATE TABLE IF NOT EXISTS public.vet_history_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tutor_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  dog_id UUID NOT NULL REFERENCES public.dogs(id) ON DELETE CASCADE,
  source_vet_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_vet_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(dog_id, source_vet_user_id, target_vet_user_id)
);

ALTER TABLE public.vet_history_shares ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tutors manage own history shares" ON public.vet_history_shares FOR ALL
  USING (tutor_user_id = auth.uid());

CREATE POLICY "Target vets can view shared history" ON public.vet_history_shares FOR SELECT
  USING (target_vet_user_id = auth.uid());

-- 13. RLS: Vets can view shared notes
CREATE POLICY "Vets can view shared notes" ON public.vet_notes FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.vet_history_shares hs
    WHERE hs.target_vet_user_id = auth.uid()
      AND hs.dog_id = (SELECT l.dog_id FROM public.vet_dog_links l WHERE l.id = vet_notes.vet_dog_link_id)
      AND hs.source_vet_user_id = vet_notes.vet_user_id
  ));

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_vet_prescriptions_link ON public.vet_prescriptions(vet_dog_link_id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_vet_medications_link ON public.vet_medications(vet_dog_link_id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_vet_treatment_plans_link ON public.vet_treatment_plans(vet_dog_link_id);
CREATE INDEX IF NOT EXISTS idx_vet_appointments_link ON public.vet_appointments(vet_dog_link_id);
CREATE INDEX IF NOT EXISTS idx_vet_report_comments_report ON public.vet_report_comments(report_id);
CREATE INDEX IF NOT EXISTS idx_vet_note_attachments_note ON public.vet_note_attachments(vet_note_id);
CREATE INDEX IF NOT EXISTS idx_vet_health_alerts_vet ON public.vet_health_alerts(vet_user_id) WHERE acknowledged_at IS NULL;
