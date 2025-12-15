-- Add photo_url column to health-related tables for visual documentation

-- Add photo_url to poop_logs
ALTER TABLE public.poop_logs 
ADD COLUMN IF NOT EXISTS photo_url text;

-- Add photo_url to health_symptoms
ALTER TABLE public.health_symptoms 
ADD COLUMN IF NOT EXISTS photo_url text;

-- Add photo_url to energy_logs
ALTER TABLE public.energy_logs 
ADD COLUMN IF NOT EXISTS photo_url text;