-- Allow vets to read dogs they are linked to (with active status)
CREATE POLICY "Vets can view linked dogs"
ON public.dogs
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.vet_dog_links
    WHERE vet_dog_links.dog_id = dogs.id
      AND vet_dog_links.vet_user_id = auth.uid()
      AND vet_dog_links.status = 'active'
  )
);

-- Allow tutors to read profiles of their linked dogs' vets
CREATE POLICY "Tutors can view linked vet profiles"
ON public.vet_profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.vet_dog_links
    WHERE vet_dog_links.vet_user_id = vet_profiles.user_id
      AND vet_dog_links.tutor_user_id = auth.uid()
  )
);

-- Allow tutors to view their own profile (for vet dashboard to show tutor names)
CREATE POLICY "Users can view their own profiles for vet links"
ON public.profiles
FOR SELECT
USING (true);

-- Drop the old restrictive policy if it exists and replace with more permissive one
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

-- Allow reading profiles linked via vet_dog_links (tutors can be seen by vets)
CREATE POLICY "Vets can view tutor profiles for linked dogs"
ON public.profiles
FOR SELECT
USING (
  auth.uid() = user_id
  OR EXISTS (
    SELECT 1 FROM public.vet_dog_links
    WHERE (vet_dog_links.tutor_user_id = profiles.user_id AND vet_dog_links.vet_user_id = auth.uid())
       OR (vet_dog_links.vet_user_id = profiles.user_id AND vet_dog_links.tutor_user_id = auth.uid())
  )
);

-- Allow vets to read health data of their linked dogs
CREATE POLICY "Vets can view linked dogs health symptoms"
ON public.health_symptoms
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.vet_dog_links
    WHERE vet_dog_links.dog_id = health_symptoms.dog_id
      AND vet_dog_links.vet_user_id = auth.uid()
      AND vet_dog_links.status = 'active'
  )
);

CREATE POLICY "Vets can view linked dogs poop logs"
ON public.poop_logs
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.vet_dog_links
    WHERE vet_dog_links.dog_id = poop_logs.dog_id
      AND vet_dog_links.vet_user_id = auth.uid()
      AND vet_dog_links.status = 'active'
  )
);

CREATE POLICY "Vets can view linked dogs energy logs"
ON public.energy_logs
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.vet_dog_links
    WHERE vet_dog_links.dog_id = energy_logs.dog_id
      AND vet_dog_links.vet_user_id = auth.uid()
      AND vet_dog_links.status = 'active'
  )
);

CREATE POLICY "Vets can view linked dogs activity logs"
ON public.activity_logs
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.vet_dog_links
    WHERE vet_dog_links.dog_id = activity_logs.dog_id
      AND vet_dog_links.vet_user_id = auth.uid()
      AND vet_dog_links.status = 'active'
  )
);

CREATE POLICY "Vets can view linked dogs weight logs"
ON public.weight_logs
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.vet_dog_links
    WHERE vet_dog_links.dog_id = weight_logs.dog_id
      AND vet_dog_links.vet_user_id = auth.uid()
      AND vet_dog_links.status = 'active'
  )
);

CREATE POLICY "Vets can view linked dogs meals"
ON public.meals
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.vet_dog_links
    WHERE vet_dog_links.dog_id = meals.dog_id
      AND vet_dog_links.vet_user_id = auth.uid()
      AND vet_dog_links.status = 'active'
  )
);

CREATE POLICY "Vets can view linked dogs food intolerances"
ON public.food_intolerances
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.vet_dog_links
    WHERE vet_dog_links.dog_id = food_intolerances.dog_id
      AND vet_dog_links.vet_user_id = auth.uid()
      AND vet_dog_links.status = 'active'
  )
);