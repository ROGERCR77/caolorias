-- Add has_seen_onboarding column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS has_seen_onboarding BOOLEAN DEFAULT FALSE;