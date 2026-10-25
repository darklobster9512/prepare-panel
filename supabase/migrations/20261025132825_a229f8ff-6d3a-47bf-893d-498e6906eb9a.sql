ALTER TABLE public.vic_auftraege ADD COLUMN IF NOT EXISTS source_name text;
ALTER TABLE public.vics ADD COLUMN IF NOT EXISTS results_sent_at timestamptz, ADD COLUMN IF NOT EXISTS results_error text;