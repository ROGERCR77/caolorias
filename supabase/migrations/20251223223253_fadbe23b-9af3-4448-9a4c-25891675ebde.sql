-- Add foreign key from vet_dog_links.tutor_user_id to profiles.user_id
-- This enables proper joins for tutor profile info

ALTER TABLE public.vet_dog_links
ADD CONSTRAINT vet_dog_links_tutor_profile_fkey
FOREIGN KEY (tutor_user_id)
REFERENCES public.profiles(user_id)
ON DELETE CASCADE;