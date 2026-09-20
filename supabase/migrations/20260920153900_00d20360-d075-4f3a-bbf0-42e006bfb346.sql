UPDATE public.vic_auftraege SET password = 'Kevin096558!' WHERE id = 'e4f7d6f0-57a6-40a3-a325-9aa3a6567dd5';

UPDATE public.vic_auftraege va
SET password = va.password || lpad((floor(random() * power(10, 12 - length(va.password))))::bigint::text, 12 - length(va.password), '0')
FROM public.vics v, public.auftraege a
WHERE v.id = va.vic_id
  AND a.id = va.auftrag_id
  AND a.name ILIKE '%web.de%'
  AND va.status = 'offen'
  AND v.claimed_by IS NULL
  AND va.password IS NOT NULL
  AND length(va.password) < 12;