-- Add foreign key from vet_dog_links.vet_user_id to vet_profiles.user_id
-- Using a different constraint name since the original points to auth.users

ALTER TABLE public.vet_dog_links
ADD CONSTRAINT vet_dog_links_vet_profile_fkey
FOREIGN KEY (vet_user_id)
REFERENCES public.vet_profiles(user_id)
ON DELETE CASCADE;

-- Add foreign key from vet_notes.vet_user_id to vet_profiles.user_id  
ALTER TABLE public.vet_notes
ADD CONSTRAINT vet_notes_vet_profile_fkey
FOREIGN KEY (vet_user_id)
REFERENCES public.vet_profiles(user_id)
ON DELETE CASCADE;