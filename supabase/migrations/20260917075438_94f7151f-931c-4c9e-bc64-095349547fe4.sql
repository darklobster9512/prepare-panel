ALTER TABLE public.auftraege ADD COLUMN IF NOT EXISTS generate_password boolean NOT NULL DEFAULT false;
UPDATE public.auftraege SET generate_password = true WHERE name IN ('Web.de','DKB','BBVA');