# Leads-CSV als TXT exportieren

Aus der hochgeladenen Datei `bkd_Leads_2026-10-06_2026-10-06.csv` (39 Leads, Tab-getrennt, UTF-16) wird eine Textdatei erzeugt.

## Format

Eine Zeile pro Lead, drei Werte durch Komma getrennt:

```text
+491754224896, Franz Weber, Regen
```

- **Nummer**: `p:`-Präfix entfernen, Nummer bleibt im `+49…`-Format
- **Name**: vollständiger Name aus `full_name` (Anführungszeichen entfernt)
- **Stadt**: aus `city`

## Ablauf

1. CSV parsen (UTF-16, Tab-Trenner), Spalten `full_name`, `phone_number`, `city` lesen.
2. Nur Zeilen mit Name + gültiger Nummer übernehmen; nicht ausfüllbare Zeilen werden gemeldet.
3. Speichern nach `bkd_leads_2026-10-06.txt` in Files (39 Zeilen, keine doppelten Nummern vorhanden).
