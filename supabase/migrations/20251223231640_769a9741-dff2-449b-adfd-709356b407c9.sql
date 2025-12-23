-- Add photo_url column to vet_notes for attaching exam photos, x-rays, etc.
ALTER TABLE public.vet_notes 
ADD COLUMN IF NOT EXISTS photo_url TEXT DEFAULT NULL;