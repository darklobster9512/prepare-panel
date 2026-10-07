UPDATE public.auftraege SET generate_loginname = true, generate_password = true WHERE name ILIKE 'Commerzbank%';

WITH src AS (
  SELECT va.id,
    regexp_replace(split_part(trim(v.first_name), ' ', 1), '[^[:alpha:]]', '', 'g') AS fn,
    regexp_replace((regexp_split_to_array(trim(v.last_name), '\s+'))[array_length(regexp_split_to_array(trim(v.last_name), '\s+'),1)], '[^[:alpha:]]', '', 'g') AS ln,
    to_char(v.birth_date, 'YYYY') AS yr
  FROM public.vic_auftraege va
  JOIN public.auftraege a ON a.id = va.auftrag_id
  JOIN public.vics v ON v.id = va.vic_id
  WHERE a.name ILIKE 'Commerzbank%' AND va.status = 'offen'
)
UPDATE public.vic_auftraege va SET
  login_name = CASE WHEN src.ln = '' OR src.yr IS NULL THEN va.login_name
    WHEN length(src.ln || right(src.yr, 2)) >= 8 THEN left(src.ln, 48) || right(src.yr, 2)
    ELSE src.ln || src.yr END,
  password = src.fn || (SELECT string_agg(floor(random()*10)::int::text, '') FROM generate_series(1, greatest(6, 12 - length(src.fn))))
FROM src WHERE va.id = src.id;