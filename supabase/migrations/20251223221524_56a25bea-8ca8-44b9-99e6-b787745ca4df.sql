-- Fase 1: Infraestrutura de banco de dados para Portal Veterinário
-- Criado com cuidado para não afetar tabelas existentes

-- 1. Criar enum para roles (tutor e vet)
CREATE TYPE public.app_role AS ENUM ('tutor', 'vet');

-- 2. Criar tabela user_roles (separada de profiles por segurança)
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- 3. Criar tabela vet_profiles para dados do veterinário
CREATE TABLE public.vet_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    name TEXT NOT NULL,
    crmv TEXT NOT NULL,
    uf TEXT NOT NULL,
    clinic_name TEXT,
    phone TEXT,
    vet_code TEXT NOT NULL UNIQUE DEFAULT UPPER(SUBSTR(MD5(RANDOM()::TEXT), 1, 8)),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 4. Criar tabela vet_dog_links para vinculação veterinário-cão
CREATE TABLE public.vet_dog_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vet_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    dog_id UUID REFERENCES public.dogs(id) ON DELETE CASCADE NOT NULL,
    tutor_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'revoked')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (vet_user_id, dog_id)
);

-- 5. Criar tabela vet_notes para prontuário digital
CREATE TABLE public.vet_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vet_dog_link_id UUID REFERENCES public.vet_dog_links(id) ON DELETE CASCADE NOT NULL,
    vet_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    note_type TEXT NOT NULL CHECK (note_type IN ('consulta', 'vacina', 'exame', 'observacao')),
    title TEXT NOT NULL,
    content TEXT,
    scheduled_date DATE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 6. Habilitar RLS em todas as tabelas
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vet_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vet_dog_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vet_notes ENABLE ROW LEVEL SECURITY;

-- 7. Criar função SECURITY DEFINER para verificar role (evita recursão RLS)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE user_id = _user_id
          AND role = _role
    )
$$;

-- 8. RLS Policies para user_roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own role"
ON public.user_roles FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- 9. RLS Policies para vet_profiles
CREATE POLICY "Anyone can view vet profiles by code"
ON public.vet_profiles FOR SELECT
USING (true);

CREATE POLICY "Vets can insert their own profile"
ON public.vet_profiles FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Vets can update their own profile"
ON public.vet_profiles FOR UPDATE
USING (auth.uid() = user_id);

-- 10. RLS Policies para vet_dog_links
CREATE POLICY "Tutors can view their dog links"
ON public.vet_dog_links FOR SELECT
USING (auth.uid() = tutor_user_id);

CREATE POLICY "Vets can view their dog links"
ON public.vet_dog_links FOR SELECT
USING (auth.uid() = vet_user_id);

CREATE POLICY "Tutors can create dog links"
ON public.vet_dog_links FOR INSERT
WITH CHECK (auth.uid() = tutor_user_id);

CREATE POLICY "Vets can update link status"
ON public.vet_dog_links FOR UPDATE
USING (auth.uid() = vet_user_id);

CREATE POLICY "Tutors can revoke links"
ON public.vet_dog_links FOR UPDATE
USING (auth.uid() = tutor_user_id);

CREATE POLICY "Tutors can delete their links"
ON public.vet_dog_links FOR DELETE
USING (auth.uid() = tutor_user_id);

-- 11. RLS Policies para vet_notes
CREATE POLICY "Vets can CRUD their own notes"
ON public.vet_notes FOR ALL
USING (auth.uid() = vet_user_id)
WITH CHECK (auth.uid() = vet_user_id);

CREATE POLICY "Tutors can view notes of their dogs"
ON public.vet_notes FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.vet_dog_links
        WHERE vet_dog_links.id = vet_notes.vet_dog_link_id
          AND vet_dog_links.tutor_user_id = auth.uid()
          AND vet_dog_links.status = 'active'
    )
);

-- 12. Trigger para atualizar updated_at em vet_profiles
CREATE TRIGGER update_vet_profiles_updated_at
BEFORE UPDATE ON public.vet_profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 13. Trigger para atualizar updated_at em vet_dog_links
CREATE TRIGGER update_vet_dog_links_updated_at
BEFORE UPDATE ON public.vet_dog_links
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();