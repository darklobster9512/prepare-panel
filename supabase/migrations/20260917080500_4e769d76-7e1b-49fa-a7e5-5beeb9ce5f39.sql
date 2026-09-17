CREATE TABLE public.vic_auftraege (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vic_id UUID NOT NULL REFERENCES public.vics(id) ON DELETE CASCADE,
  auftrag_id UUID NOT NULL REFERENCES public.auftraege(id) ON DELETE CASCADE,
  login_name TEXT,
  password TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (vic_id, auftrag_id)
);

CREATE INDEX idx_vic_auftraege_vic_id ON public.vic_auftraege(vic_id);
CREATE INDEX idx_vic_auftraege_auftrag_id ON public.vic_auftraege(auftrag_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.vic_auftraege TO authenticated;
GRANT ALL ON public.vic_auftraege TO service_role;

ALTER TABLE public.vic_auftraege ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view vic_auftraege" ON public.vic_auftraege FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can insert vic_auftraege" ON public.vic_auftraege FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update vic_auftraege" ON public.vic_auftraege FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete vic_auftraege" ON public.vic_auftraege FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_vic_auftraege_updated_at BEFORE UPDATE ON public.vic_auftraege FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();