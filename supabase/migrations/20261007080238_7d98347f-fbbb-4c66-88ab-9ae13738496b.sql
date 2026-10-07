CREATE TABLE public.bank_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_holder text NOT NULL,
  bank text NOT NULL,
  iban text,
  project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL,
  letters_complete boolean,
  coupled boolean NOT NULL DEFAULT false,
  vmos_device text,
  credentials jsonb NOT NULL DEFAULT '[]'::jsonb,
  anosim_link text,
  notes text,
  documents jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bank_accounts TO authenticated;
GRANT ALL ON public.bank_accounts TO service_role;
ALTER TABLE public.bank_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage bank accounts" ON public.bank_accounts FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER update_bank_accounts_updated_at BEFORE UPDATE ON public.bank_accounts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE POLICY "Admins read bank documents" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'bank-documents' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins upload bank documents" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'bank-documents' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete bank documents" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'bank-documents' AND public.has_role(auth.uid(), 'admin'));