CREATE TABLE IF NOT EXISTS public.telegram_recipients (
  id uuid primary key default gen_random_uuid(),
  chat_id text not null unique,
  label text,
  active boolean not null default true,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.telegram_recipients TO authenticated;
GRANT ALL ON public.telegram_recipients TO service_role;

ALTER TABLE public.telegram_recipients ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage telegram recipients" ON public.telegram_recipients;
CREATE POLICY "Admins manage telegram recipients"
ON public.telegram_recipients
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));