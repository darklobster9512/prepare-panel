# Leads-CSV als TXT exportieren (ohne bereits exportierte Leads)

Aus der neuen Datei `bkd_Leads_2026-10-06_2026-10-07.csv` (UTF-16, Tab-getrennt) wird eine Textdatei erzeugt. Leads, die bereits in `bkd_leads_2026-10-06.txt` stehen, werden ausgeschlossen (Abgleich über die Telefonnummer).

## Format

Eine Zeile pro Lead, drei Werte durch Komma getrennt:

```text
+491754224896, Franz Weber, Regen
```

- **Nummer**: `p:`-Präfix entfernen, Nummer im `+49…`-Format
- **Name**: vollständiger Name aus `full_name`
- **Stadt**: aus `city`

## Ablauf

1. CSV parsen (UTF-16, Tab-Trenner), Spalten `full_name`, `phone_number`, `city` lesen.
2. Nummern aus `bkd_leads_2026-10-06.txt` laden und alle CSV-Leads mit diesen Nummern ausschließen.
3. Nur Zeilen mit Name + deutscher Nummer (`+49`) übernehmen; nicht-deutsche Nummern werden gemeldet.
4. Speichern als `bkd_leads_2026-10-07.txt` in Files (eine Zeile pro Lead).
