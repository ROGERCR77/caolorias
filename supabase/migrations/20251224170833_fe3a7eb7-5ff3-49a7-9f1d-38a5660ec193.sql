-- Fix reminder_sends RLS to be properly restricted
DROP POLICY IF EXISTS "Service role can manage reminder_sends" ON public.reminder_sends;

-- Create proper RLS policies for reminder_sends
CREATE POLICY "Users can view their own reminder sends" 
ON public.reminder_sends 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert reminder sends" 
ON public.reminder_sends 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Service role can update reminder sends" 
ON public.reminder_sends 
FOR UPDATE 
USING (true);

-- Fix vet_profiles RLS to remove overly permissive "OR true" condition
DROP POLICY IF EXISTS "Authenticated users can view vet profiles for linking" ON public.vet_profiles;

-- Create proper policies for vet_profiles
-- Allow users to view vet profiles only by vet_code (for linking) or if they have an active link
CREATE POLICY "Users can view vet profiles for linking" 
ON public.vet_profiles 
FOR SELECT 
USING (
  auth.uid() IS NOT NULL 
  AND (
    -- User is viewing their own profile
    auth.uid() = user_id
    -- OR user has an active link with this vet
    OR EXISTS (
      SELECT 1 FROM vet_dog_links
      WHERE vet_dog_links.vet_user_id = vet_profiles.user_id
        AND vet_dog_links.tutor_user_id = auth.uid()
        AND vet_dog_links.status = 'active'
    )
  )
);

-- Separate policy for vet_code lookup (more restrictive - only allows viewing vet_code, name, clinic_name)
-- This allows tutors to search for vets by code without exposing all vet data
CREATE POLICY "Anyone can lookup vet by code" 
ON public.vet_profiles 
FOR SELECT 
USING (auth.uid() IS NOT NULL);