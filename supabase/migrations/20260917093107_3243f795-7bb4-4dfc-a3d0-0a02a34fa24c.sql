CREATE POLICY "Authenticated can read auftrag logos"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'auftrag-logos');