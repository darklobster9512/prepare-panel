ALTER TABLE public.vics
  ADD COLUMN IF NOT EXISTS completed_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS completed_by uuid REFERENCES auth.users(id);

DROP POLICY IF EXISTS "Mitarbeiter can update claimed vic_auftraege" ON public.vic_auftraege;
CREATE POLICY "Mitarbeiter can update claimed vic_auftraege"
ON public.vic_auftraege
FOR UPDATE
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.vics v
  WHERE v.id = vic_auftraege.vic_id
    AND v.claimed_by = auth.uid()
    AND v.completed_at IS NULL
))
WITH CHECK (EXISTS (
  SELECT 1 FROM public.vics v
  WHERE v.id = vic_auftraege.vic_id
    AND v.claimed_by = auth.uid()
    AND v.completed_at IS NULL
));