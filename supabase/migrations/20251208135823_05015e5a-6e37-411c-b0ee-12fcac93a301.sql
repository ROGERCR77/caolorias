-- Create profiles table for user data
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- Create dogs table
CREATE TABLE public.dogs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  breed TEXT DEFAULT '',
  birth_date DATE,
  current_weight_kg DECIMAL(5,2) DEFAULT 0,
  size TEXT CHECK (size IN ('small', 'medium', 'large')) DEFAULT 'medium',
  feeding_type TEXT CHECK (feeding_type IN ('natural', 'kibble', 'mixed')) DEFAULT 'natural',
  photo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on dogs
ALTER TABLE public.dogs ENABLE ROW LEVEL SECURITY;

-- Dogs policies
CREATE POLICY "Users can view their own dogs"
  ON public.dogs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own dogs"
  ON public.dogs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own dogs"
  ON public.dogs FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own dogs"
  ON public.dogs FOR DELETE
  USING (auth.uid() = user_id);

-- Create foods table
CREATE TABLE public.foods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  category TEXT CHECK (category IN ('protein', 'carb', 'vegetable', 'kibble', 'treat', 'other')) DEFAULT 'other',
  kcal_per_100g INTEGER,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on foods
ALTER TABLE public.foods ENABLE ROW LEVEL SECURITY;

-- Foods policies
CREATE POLICY "Users can view their own foods"
  ON public.foods FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own foods"
  ON public.foods FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own foods"
  ON public.foods FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own foods"
  ON public.foods FOR DELETE
  USING (auth.uid() = user_id);

-- Create meals table
CREATE TABLE public.meals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  dog_id UUID REFERENCES public.dogs(id) ON DELETE CASCADE NOT NULL,
  date_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  title TEXT NOT NULL,
  total_grams INTEGER NOT NULL DEFAULT 0,
  total_kcal_estimated INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on meals
ALTER TABLE public.meals ENABLE ROW LEVEL SECURITY;

-- Meals policies
CREATE POLICY "Users can view their own meals"
  ON public.meals FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own meals"
  ON public.meals FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own meals"
  ON public.meals FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own meals"
  ON public.meals FOR DELETE
  USING (auth.uid() = user_id);

-- Create meal_items table
CREATE TABLE public.meal_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meal_id UUID REFERENCES public.meals(id) ON DELETE CASCADE NOT NULL,
  food_id UUID REFERENCES public.foods(id) ON DELETE CASCADE NOT NULL,
  grams INTEGER NOT NULL DEFAULT 0,
  kcal_estimated INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on meal_items
ALTER TABLE public.meal_items ENABLE ROW LEVEL SECURITY;

-- Meal items policies (access through parent meal)
CREATE POLICY "Users can view meal items of their meals"
  ON public.meal_items FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.meals WHERE meals.id = meal_items.meal_id AND meals.user_id = auth.uid()));

CREATE POLICY "Users can insert meal items for their meals"
  ON public.meal_items FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.meals WHERE meals.id = meal_items.meal_id AND meals.user_id = auth.uid()));

CREATE POLICY "Users can delete meal items of their meals"
  ON public.meal_items FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.meals WHERE meals.id = meal_items.meal_id AND meals.user_id = auth.uid()));

-- Create weight_logs table
CREATE TABLE public.weight_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dog_id UUID REFERENCES public.dogs(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  weight_kg DECIMAL(5,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on weight_logs
ALTER TABLE public.weight_logs ENABLE ROW LEVEL SECURITY;

-- Weight logs policies
CREATE POLICY "Users can view their own weight logs"
  ON public.weight_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own weight logs"
  ON public.weight_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own weight logs"
  ON public.weight_logs FOR DELETE
  USING (auth.uid() = user_id);

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_dogs_updated_at
  BEFORE UPDATE ON public.dogs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data ->> 'name', NEW.email));
  RETURN NEW;
END;
$$;

-- Trigger to create profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to seed default foods for new users
CREATE OR REPLACE FUNCTION public.seed_default_foods()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.foods (user_id, name, category, kcal_per_100g, notes) VALUES
    (NEW.id, 'Frango cozido sem pele', 'protein', 165, 'Usar sem tempero, sem sal'),
    (NEW.id, 'Arroz integral cozido', 'carb', 123, NULL),
    (NEW.id, 'Abóbora cozida', 'vegetable', 26, NULL),
    (NEW.id, 'Cenoura cozida', 'vegetable', 35, NULL),
    (NEW.id, 'Batata doce cozida', 'carb', 86, NULL),
    (NEW.id, 'Carne moída magra', 'protein', 137, 'Preferir patinho ou coxão mole'),
    (NEW.id, 'Ração seca padrão', 'kibble', 350, 'Verificar tabela nutricional da marca'),
    (NEW.id, 'Petisco industrializado', 'treat', 300, 'Usar com moderação');
  RETURN NEW;
END;
$$;

-- Trigger to seed foods for new users
CREATE TRIGGER on_auth_user_created_seed_foods
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.seed_default_foods();