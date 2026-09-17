CREATE TABLE public.anosim_numbers (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_booking_id bigint NOT NULL UNIQUE,
  number text,
  note text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.anosim_numbers TO authenticated;
GRANT ALL ON public.anosim_numbers TO service_role;

ALTER TABLE public.anosim_numbers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view anosim_numbers" ON public.anosim_numbers FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can insert anosim_numbers" ON public.anosim_numbers FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update anosim_numbers" ON public.anosim_numbers FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete anosim_numbers" ON public.anosim_numbers FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_anosim_numbers_updated_at BEFORE UPDATE ON public.anosim_numbers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();