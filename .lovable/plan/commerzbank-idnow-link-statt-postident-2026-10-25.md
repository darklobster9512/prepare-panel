# Commerzbank: IDnow-Link statt Postident

## Ursache
Commerzbank war im Mitarbeiter-Panel fest auf „Postident-Link + PDF“ eingestellt, egal welche Ident-Art die Vorlage hat. Das stammt aus der ersten Version, als Commerzbank noch per Postident lief.

## Änderung
- Beim Commerzbank-Auftrag erscheinen am Ende: verwendeter Anmeldename, verwendetes Passwort und ein Feld **„IDnow-Link“**. Postident-Link und PDF-Upload fallen weg.
- Der IDnow-Link wird wie ein WebID-Link gespeichert. Er erscheint im Admin-Detailfenster als „IDnow-Link“, im Export und bei der Rückmeldung an das externe Panel als `identlink`.
- Beim Export wird die Adresse des IDnow-Links nicht auf die Branding-Domain umgeschrieben, weil die nur für WebID gilt.

## Technische Details
- `fieldsFor` in `mitarbeiter.auftraege.$vicId.tsx`: Commerzbank → `credentials: true, webid: true, postident: false`; Feldbeschriftung „IDnow-Link“, wenn der Name Commerzbank enthält. Die Zusammenfassung nutzt dieselbe Beschriftung.
- `admin.vics.tsx`: Beschriftung „IDnow-Link“ bei Commerzbank.
- `vic-export.ts`: `applyWebidDomain` bei Commerzbank überspringen.
- Daten bleiben in `webid_link`, es ist keine Datenbankänderung nötig.
