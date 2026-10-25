# PDF-Upload bei Postident-Aufträgen

## Ziel
Bei Postident-Aufträgen im Mitarbeiter-Panel gibt es am Ende neben dem Feld „Postident-Link" einen PDF-Upload. Beides ist danach im Admin unter /admin/vics im Detailfenster sichtbar, das PDF mit Download-Button.

## Mitarbeiter-Panel (/mitarbeiter/auftraege)
- Überall, wo heute das Feld „Postident-Link" erscheint, kommt darunter „PDF hochladen".
- Nur PDF-Dateien, maximal 20 MB, genau ein PDF pro Auftrag. Ein neues PDF ersetzt das alte.
- Nach dem Hochladen sieht man den Dateinamen, kann das PDF ansehen oder entfernen und neu hochladen.
- Der Upload wird sofort gespeichert. Den Link speichert man wie bisher mit „Erfolgreich"/„Fehlgeschlagen".
- Der Upload ist freiwillig und blockiert den Abschluss nicht.
- In der Zusammenfassung am Ende steht „PDF hochgeladen" neben dem Postident-Link.

## Admin (/admin/vics, Detailfenster)
- Beim Auftrag stehen der Postident-Link (wie bisher) und neu ein Button „PDF herunterladen".
- Auch Admins können dort ein PDF hochladen oder ersetzen.

## Berechtigungen
- Mitarbeiter dürfen PDFs nur für Aufträge von Datensätzen hochladen, ansehen und ersetzen, die sie selbst beansprucht haben.
- Admins dürfen alle PDFs sehen, herunterladen, hochladen und löschen.
- Die Dateien liegen privat, nicht öffentlich abrufbar.

## Hinweis
Ob ein Auftrag als Postident gilt, richtet sich nach der Auftragsvorlage (wie heute beim Postident-Link). Santander ist zum Beispiel als Videoident angelegt und zeigt deshalb das Webid-Feld. Wenn du dort Postident willst, stell die Vorlage unter Aufträge auf Postident um.

## Technische Details
- Migration: Spalten `postident_pdf_path text` und `postident_pdf_name text` in `vic_auftraege`.
- Privater Bucket `postident-pdfs` (20 MB) per Storage-Tool. Pfad `<vic_id>/<vic_auftrag_id>.pdf`.
- Storage-Policies auf `storage.objects` für diesen Bucket: Admin alles (`has_role`); Mitarbeiter INSERT/UPDATE/SELECT/DELETE, wenn der erste Ordner eine `vics.id` mit `claimed_by = auth.uid()` und `completed_at IS NULL` ist (SELECT auch nach Abschluss).
- Upload im Browser über den Supabase-Client (wie bei den Bankkonten-Dokumenten). Danach speichert die neue Server-Funktion `setPostidentPdf` (Mitarbeiter: nur eigener, beanspruchter Vic; Admin: alle) Pfad und Dateiname in `vic_auftraege`.
- Anzeige und Download über eine signierte URL, die im Browser erzeugt wird.
- `mitarbeiter.functions.ts`, `vics.functions.ts` und `vic-auftraege.types.ts` um die neuen Spalten erweitern. UI in `mitarbeiter.auftraege.$vicId.tsx` und `admin.vics.tsx`.
