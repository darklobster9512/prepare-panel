# Ergebnisse nach Abschluss an das externe Panel zurücksenden

## Ziel
Ein Mitarbeiter schließt einen Datensatz ab, der eine `request_id` hat. Danach werden die Ergebnisse automatisch an `https://pcfmaslrlferrnoopgqn.supabase.co/functions/v1/prepare-results` geschickt.

## Was gesendet wird
```text
{ "request_id": "...", "results": [ { "auftrag": "Bank-identart", "success": true|false, ... } ] }
```
- Ein Eintrag pro Bankauftrag, im selben Format wie beim Empfang (z. B. „Commerzbank-videoident“). Web.de und 21bitcoin werden nicht gesendet.
- `success`: true bei „Erfolgreich“, false bei „Fehlgeschlagen“. Bei false werden keine weiteren Daten mitgeschickt.
- Bei Erfolg je nach Bank:
  - DKB, Deutsche Bank, Commerzbank, Targobank (Videoident): `email`, `identlink`, `anosim_link`
  - BBVA: `username`, `password`, `email`, `anosim_link`
  - Santander, Consorsbank (Postident): `pdf_base64`, `pdf_name`
- `email` ist die Web.de-Adresse des Vics. Für `username` und `password` gilt: die verwendeten Daten haben Vorrang, sonst die generierten. Gibt es noch keinen AnoSIM-Link, wird er wie beim Export erzeugt.
- Die Ident-Art im Namen kommt aus dem Namen, mit dem der Auftrag ursprünglich übertragen wurde. Ist der nicht bekannt, wird die Ident-Art der Vorlage verwendet.

## Ablauf und Fehler
- Gesendet wird direkt nach dem Abschluss. Der Mitarbeiter muss nicht darauf warten, und sein Abschluss gelingt auch dann, wenn das Senden scheitert.
- Pro Vic wird gespeichert, ob gesendet wurde und wann, oder welcher Fehler kam. Im Vic-Detailfenster im Admin siehst du den Stand. Dort gibt es auch den Knopf „Erneut senden“.
- Wird ein Datensatz wieder geöffnet und erneut abgeschlossen, wird erneut gesendet.

## Offene Frage
Die Ziel-Funktion bekommt keinen Schlüssel mitgeschickt. Erwartet sie einen, kann ich ihn sicher hinterlegen.

## Technische Details
- Migration: `vic_auftraege.source_name text` speichert den übertragenen Namen, z. B. „Santander-postident“. Neu in `vics` sind `results_sent_at timestamptz` und `results_error text`.
- `src/routes/api/public/vics.ts` speichert beim Zuweisen `source_name`.
- `src/lib/prepare-results.server.ts`: baut die Daten zusammen (mit `supabaseAdmin`), lädt die PDF aus `postident-pdfs` als Base64, holt fehlende Share-Links über den AnoSIM-Helfer und schickt einen POST mit `fetch`.
- `finishVic` in `mitarbeiter.functions.ts` ruft den Helfer nach dem Abschluss auf, wenn `request_id` gesetzt ist. Fehler werden abgefangen und in `results_error` gespeichert.
- Neue Admin-Serverfunktion `resendVicResults` und ein Knopf in `admin.vics.tsx`.
