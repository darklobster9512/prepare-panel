ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS onboarding_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS gologin_email text,
  ADD COLUMN IF NOT EXISTS gologin_password text;

CREATE OR REPLACE FUNCTION public.protect_onboarding_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    NEW.onboarding_enabled := OLD.onboarding_enabled;
    NEW.gologin_email := OLD.gologin_email;
    NEW.gologin_password := OLD.gologin_password;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_onboarding_fields ON public.profiles;
CREATE TRIGGER protect_onboarding_fields
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.protect_onboarding_fields();

DROP POLICY IF EXISTS "Admins can update profiles" ON public.profiles;
CREATE POLICY "Admins can update profiles"
ON public.profiles FOR UPDATE TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));