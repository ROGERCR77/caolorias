-- Remove the duplicate/conflicting policy
DROP POLICY IF EXISTS "Anyone can lookup vet by code" ON public.vet_profiles;

-- The "Users can view vet profiles for linking" policy now properly restricts access
-- Tutors need to be able to look up vets by vet_code to create links
-- Update the policy to also allow lookup by vet_code for all authenticated users
DROP POLICY IF EXISTS "Users can view vet profiles for linking" ON public.vet_profiles;

CREATE POLICY "Users can view vet profiles for linking" 
ON public.vet_profiles 
FOR SELECT 
USING (
  auth.uid() IS NOT NULL
);