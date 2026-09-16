CREATE TABLE public.auftraege (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  logo_path text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.auftraege TO authenticated;
GRANT ALL ON public.auftraege TO service_role;

ALTER TABLE public.auftraege ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view auftraege" ON public.auftraege FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can insert auftraege" ON public.auftraege FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update auftraege" ON public.auftraege FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete auftraege" ON public.auftraege FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_auftraege_updated_at BEFORE UPDATE ON public.auftraege FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE POLICY "Admins can read auftrag logos" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'auftrag-logos' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can upload auftrag logos" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'auftrag-logos' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update auftrag logos" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'auftrag-logos' AND public.has_role(auth.uid(), 'admin')) WITH CHECK (bucket_id = 'auftrag-logos' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete auftrag logos" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'auftrag-logos' AND public.has_role(auth.uid(), 'admin'));