ALTER TABLE public.auftraege
  ADD COLUMN IF NOT EXISTS ident_type text CHECK (ident_type IN ('videoident','postident')),
  ADD COLUMN IF NOT EXISTS besonderheiten text,
  ADD COLUMN IF NOT EXISTS images jsonb NOT NULL DEFAULT '[]'::jsonb;