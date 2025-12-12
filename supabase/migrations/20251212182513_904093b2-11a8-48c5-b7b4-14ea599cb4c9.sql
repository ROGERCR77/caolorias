-- Update the trigger function to create users as free (no trial)
CREATE OR REPLACE FUNCTION public.handle_new_user_subscription()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_subscriptions (user_id, plan_type, subscription_status, plan_source)
  VALUES (NEW.id, 'free', 'inactive', 'none');
  RETURN NEW;
END;
$$;