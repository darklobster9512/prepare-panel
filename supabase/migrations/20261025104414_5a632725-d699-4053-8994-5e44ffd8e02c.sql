ALTER TABLE public.vic_auftraege ADD COLUMN postident_pdf_path text, ADD COLUMN postident_pdf_name text;

CREATE POLICY "Admins manage postident pdfs" ON storage.objects FOR ALL TO authenticated
USING (bucket_id = 'postident-pdfs' AND public.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (bucket_id = 'postident-pdfs' AND public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Mitarbeiter read own postident pdfs" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'postident-pdfs' AND EXISTS (SELECT 1 FROM public.vics v WHERE v.id::text = (storage.foldername(name))[1] AND v.claimed_by = auth.uid()));

CREATE POLICY "Mitarbeiter upload own postident pdfs" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'postident-pdfs' AND EXISTS (SELECT 1 FROM public.vics v WHERE v.id::text = (storage.foldername(name))[1] AND v.claimed_by = auth.uid() AND v.completed_at IS NULL));

CREATE POLICY "Mitarbeiter update own postident pdfs" ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'postident-pdfs' AND EXISTS (SELECT 1 FROM public.vics v WHERE v.id::text = (storage.foldername(name))[1] AND v.claimed_by = auth.uid() AND v.completed_at IS NULL))
WITH CHECK (bucket_id = 'postident-pdfs' AND EXISTS (SELECT 1 FROM public.vics v WHERE v.id::text = (storage.foldername(name))[1] AND v.claimed_by = auth.uid() AND v.completed_at IS NULL));

CREATE POLICY "Mitarbeiter delete own postident pdfs" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'postident-pdfs' AND EXISTS (SELECT 1 FROM public.vics v WHERE v.id::text = (storage.foldername(name))[1] AND v.claimed_by = auth.uid() AND v.completed_at IS NULL));