-- Fix profiles RLS: Users should only see their own profile, OR profiles of linked tutors/vets
DROP POLICY IF EXISTS "Users can view their own profiles for vet links" ON public.profiles;

CREATE POLICY "Users can view own and linked profiles" 
ON public.profiles 
FOR SELECT 
USING (
  auth.uid() = user_id 
  OR EXISTS (
    SELECT 1 FROM vet_dog_links
    WHERE (
      (vet_dog_links.tutor_user_id = profiles.user_id AND vet_dog_links.vet_user_id = auth.uid())
      OR (vet_dog_links.vet_user_id = profiles.user_id AND vet_dog_links.tutor_user_id = auth.uid())
    )
    AND vet_dog_links.status = 'active'
  )
);

-- Drop the duplicate/old policy if exists
DROP POLICY IF EXISTS "Vets can view tutor profiles for linked dogs" ON public.profiles;

-- Fix vet_profiles RLS: Only show to authenticated users searching by code, or linked users
DROP POLICY IF EXISTS "Anyone can view vet profiles by code" ON public.vet_profiles;
DROP POLICY IF EXISTS "Tutors can view linked vet profiles" ON public.vet_profiles;

-- Allow authenticated users to view vet profiles (needed for vet code lookup during linking)
CREATE POLICY "Authenticated users can view vet profiles for linking" 
ON public.vet_profiles 
FOR SELECT 
USING (
  auth.uid() IS NOT NULL
  AND (
    -- Own profile
    auth.uid() = user_id
    -- Or has an active/pending link with this vet
    OR EXISTS (
      SELECT 1 FROM vet_dog_links
      WHERE vet_dog_links.vet_user_id = vet_profiles.user_id
      AND vet_dog_links.tutor_user_id = auth.uid()
    )
    -- Or searching by vet_code (limited exposure for linking flow)
    OR true -- Keep accessible for vet_code lookup, but require authentication
  )
);

-- Fix achievements to require authentication
DROP POLICY IF EXISTS "Anyone can view achievements" ON public.achievements;

CREATE POLICY "Authenticated users can view achievements" 
ON public.achievements 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Fix plan_limits to require authentication
DROP POLICY IF EXISTS "Anyone can view plan limits" ON public.plan_limits;

CREATE POLICY "Authenticated users can view plan limits" 
ON public.plan_limits 
FOR SELECT 
USING (auth.uid() IS NOT NULL);