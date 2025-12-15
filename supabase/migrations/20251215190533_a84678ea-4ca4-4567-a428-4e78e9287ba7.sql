-- Create reminder_sends table for anti-duplication
CREATE TABLE IF NOT EXISTS public.reminder_sends (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reminder_id uuid NOT NULL REFERENCES public.reminders(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  sent_at timestamptz NOT NULL DEFAULT now(),
  sent_date date NOT NULL,
  sent_time time NOT NULL,
  UNIQUE(reminder_id, sent_date, sent_time)
);

-- Enable RLS
ALTER TABLE public.reminder_sends ENABLE ROW LEVEL SECURITY;

-- Policy for service role only (edge function uses service role)
CREATE POLICY "Service role can manage reminder_sends"
ON public.reminder_sends
FOR ALL
USING (true)
WITH CHECK (true);

-- Add message column to reminders for custom messages
ALTER TABLE public.reminders ADD COLUMN IF NOT EXISTS message text;

-- Create index for faster queries on reminder_sends
CREATE INDEX IF NOT EXISTS idx_reminder_sends_lookup 
ON public.reminder_sends(reminder_id, sent_date, sent_time);

-- Create index for faster time-based queries on reminders
CREATE INDEX IF NOT EXISTS idx_reminders_time_enabled 
ON public.reminders(time, enabled) WHERE enabled = true;