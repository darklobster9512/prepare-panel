ALTER TABLE public.anosim_numbers
  ADD COLUMN IF NOT EXISTS vic_id uuid REFERENCES public.vics(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS end_date timestamptz;

CREATE UNIQUE INDEX IF NOT EXISTS anosim_numbers_vic_id_key
  ON public.anosim_numbers (vic_id) WHERE vic_id IS NOT NULL;