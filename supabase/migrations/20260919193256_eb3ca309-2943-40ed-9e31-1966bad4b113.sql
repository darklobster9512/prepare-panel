UPDATE public.vic_auftraege va
SET password = split_part(btrim(v.first_name), ' ', 1) || '2026'
FROM public.vics v, public.auftraege a
WHERE v.id = va.vic_id
  AND a.id = va.auftrag_id
  AND a.name = 'BBVA'
  AND va.status = 'offen'
  AND va.completed_at IS NULL;