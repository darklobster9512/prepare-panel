CREATE TABLE public.vics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name text NOT NULL,
  middle_name text,
  last_name text NOT NULL,
  birth_date date,
  birth_place text,
  street text,
  postal_code text,
  city text,
  marital_status text,
  tax_id text,
  bank text,
  notes text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.vics TO authenticated;
GRANT ALL ON public.vics TO service_role;

ALTER TABLE public.vics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view vics" ON public.vics
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can insert vics" ON public.vics
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update vics" ON public.vics
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete vics" ON public.vics
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_vics_updated_at
  BEFORE UPDATE ON public.vics
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();