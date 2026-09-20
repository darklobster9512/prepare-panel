ALTER TABLE public.vic_auftraege ADD COLUMN IF NOT EXISTS internal_mark text;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'vic_auftraege_internal_mark_check'
  ) THEN
    ALTER TABLE public.vic_auftraege
      ADD CONSTRAINT vic_auftraege_internal_mark_check
      CHECK (internal_mark IS NULL OR internal_mark IN ('gestartet','erledigt','abgesprungen'));
  END IF;
END $$;