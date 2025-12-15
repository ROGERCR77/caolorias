-- Add puppy support fields to dogs table
ALTER TABLE dogs ADD COLUMN IF NOT EXISTS is_puppy BOOLEAN DEFAULT false;
ALTER TABLE dogs ADD COLUMN IF NOT EXISTS estimated_adult_weight_kg NUMERIC(5,2);

-- Add scheduled_date for one-time reminders (vaccines, etc)
ALTER TABLE reminders ADD COLUMN IF NOT EXISTS scheduled_date DATE DEFAULT NULL;

-- Comment explaining the field
COMMENT ON COLUMN reminders.scheduled_date IS 'For one-time reminders (vaccines). NULL = recurring reminder using days_of_week';