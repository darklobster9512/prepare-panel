ALTER TABLE public.auftraege ADD COLUMN IF NOT EXISTS sort_order integer NOT NULL DEFAULT 100;

UPDATE public.auftraege SET sort_order = 10 WHERE ident_type = 'email';
UPDATE public.auftraege SET sort_order = 20 WHERE name ILIKE '%DKB%';
UPDATE public.auftraege SET sort_order = 30 WHERE name ILIKE '%Deutsche Bank%';
UPDATE public.auftraege SET sort_order = 40 WHERE name ILIKE '%BBVA%';
UPDATE public.auftraege SET sort_order = 50 WHERE name ILIKE '%Consorsbank%';
UPDATE public.auftraege SET sort_order = 60 WHERE name ILIKE '%Commerzbank%';
UPDATE public.auftraege SET sort_order = 70 WHERE name ILIKE '%Targobank%';
UPDATE public.auftraege SET sort_order = 80 WHERE name ILIKE '%Santander%';

ALTER TABLE public.vics
  ADD COLUMN IF NOT EXISTS claimed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS claimed_at timestamptz,
  ADD COLUMN IF NOT EXISTS email_street text,
  ADD COLUMN IF NOT EXISTS email_postal_code text,
  ADD COLUMN IF NOT EXISTS email_city text,
  ADD COLUMN IF NOT EXISTS email_birth_date date,
  ADD COLUMN IF NOT EXISTS email_address text;

ALTER TABLE public.vic_auftraege
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'offen',
  ADD COLUMN IF NOT EXISTS used_login_name text,
  ADD COLUMN IF NOT EXISTS used_password text,
  ADD COLUMN IF NOT EXISTS webid_link text,
  ADD COLUMN IF NOT EXISTS postident_link text,
  ADD COLUMN IF NOT EXISTS completed_at timestamptz,
  ADD COLUMN IF NOT EXISTS completed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'vic_auftraege_status_check'
  ) THEN
    ALTER TABLE public.vic_auftraege
      ADD CONSTRAINT vic_auftraege_status_check
      CHECK (status IN ('offen','erfolgreich','fehlgeschlagen'));
  END IF;
END $$;

CREATE POLICY "Authenticated can view auftraege"
  ON public.auftraege FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated can view vics"
  ON public.vics FOR SELECT TO authenticated USING (true);

CREATE POLICY "Mitarbeiter can claim and update own vics"
  ON public.vics FOR UPDATE TO authenticated
  USING (claimed_by IS NULL OR claimed_by = auth.uid())
  WITH CHECK (claimed_by = auth.uid());

CREATE POLICY "Authenticated can view vic_auftraege"
  ON public.vic_auftraege FOR SELECT TO authenticated USING (true);

CREATE POLICY "Mitarbeiter can update claimed vic_auftraege"
  ON public.vic_auftraege FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.vics v WHERE v.id = vic_id AND v.claimed_by = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.vics v WHERE v.id = vic_id AND v.claimed_by = auth.uid()));

CREATE POLICY "Authenticated can view anosim_numbers"
  ON public.anosim_numbers FOR SELECT TO authenticated USING (true);