ALTER TABLE public.auftraege ADD COLUMN IF NOT EXISTS admin_only boolean NOT NULL DEFAULT false;
UPDATE public.auftraege SET admin_only = true WHERE name ILIKE '%21bitcoin%';