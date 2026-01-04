-- Enable the pg_net extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Create function to notify new signup via edge function
CREATE OR REPLACE FUNCTION public.notify_new_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  payload json;
  edge_function_url text;
BEGIN
  -- Build the payload
  payload := json_build_object(
    'type', 'INSERT',
    'table', 'profiles',
    'record', json_build_object(
      'id', NEW.id,
      'user_id', NEW.user_id,
      'name', NEW.name,
      'created_at', NEW.created_at
    )
  );

  -- Build the edge function URL
  edge_function_url := 'https://tcriouzorxknubqqnvyj.supabase.co/functions/v1/notify-new-signup';

  -- Call the edge function via pg_net
  PERFORM net.http_post(
    url := edge_function_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('supabase.service_role_key', true)
    ),
    body := payload::jsonb
  );

  RETURN NEW;
END;
$$;

-- Create trigger to call the function after profile insert
DROP TRIGGER IF EXISTS on_profile_created_notify ON public.profiles;
CREATE TRIGGER on_profile_created_notify
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_new_signup();