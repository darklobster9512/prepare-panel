# Mitarbeiter-Panel für Mobilgeräte optimieren

## Ziel
Das Mitarbeiter-Panel wird auf Smartphones übersichtlich und vollständig bedienbar. Die Navigation öffnet sich über ein Hamburger-Menü. Benutzerinformationen und Abmelden werden aus dem Seitenkopf in die Seitenleiste verschoben.

## Umsetzung

### 1. Seitenleiste und mobiles Hamburger-Menü
- Die bestehende Seitenleiste bleibt auf großen Bildschirmen fest stehen.
- Unten in der Seitenleiste erscheinen dauerhaft:
  - Initialen
  - Name beziehungsweise E-Mail
  - Rolle „Mitarbeiter“
  - Abmelden-Schaltfläche
- Im Seitenkopf bleiben nur Seitentitel und Beschreibung; Benutzerinformationen und Abmelden werden dort entfernt.
- Auf Smartphones erscheint links im Seitenkopf ein Hamburger-Symbol.
- Ein Klick öffnet die Navigation als seitlich einfahrendes Menü über dem Inhalt.
- Das mobile Menü enthält dieselben Reiter wie die Desktop-Seitenleiste sowie unten Benutzerinformationen und Abmelden.
- Nach Auswahl eines Reiters oder nach dem Abmelden schließt sich das Menü.
- Fokus, Escape-Taste, Hintergrundabdunklung und Schließen-Schaltfläche werden über den vorhandenen Seitenmenü-Baustein barrierearm unterstützt.

### 2. Auftragsübersicht mobil anpassen
- Außenabstände und Kopfzeile werden auf kleinen Displays kompakter.
- Auftragskarten laufen einspaltig und nutzen die verfügbare Breite.
- Datums-, Orts- und Telefonnummernzeilen dürfen sauber umbrechen.
- Aktionen wie „Beanspruchen“, „Weiterarbeiten“ und „Ansehen“ erhalten auf schmalen Displays eine gut erreichbare Breite.

### 3. Auftrags-Wizard mobil anpassen
- Datensatz, Telefonnummer/SMS und der aktuelle Arbeitsschritt stehen auf Mobilgeräten untereinander.
- Die Schrittnavigation wird horizontal scrollbar, damit Logos und Namen nicht gequetscht werden.
- Werte, Kopier-Symbole, Statusanzeigen und Abschlussdaten brechen kontrolliert um, ohne abgeschnitten zu werden.
- Formularfelder und Abschluss-Schaltflächen nutzen auf Mobilgeräten die volle Breite.
- INFOS-Fenster und vergrößerte Screenshots bleiben innerhalb des sichtbaren Bereichs und gut schließbar.

### 4. Onboarding-Dokument mobil anpassen
- Die dokumentartige Einzelseite bleibt erhalten.
- Auf Smartphones werden Seitenrand, Briefkopf, Zugangsdaten und nummerierte Abschnitte kompakter dargestellt, ohne wieder einzelne Karten daraus zu machen.

## Geltungsbereich
Die Änderung betrifft die gemeinsame Panel-Hülle. Dadurch liegen Benutzerinformationen und Abmelden auch im Admin-Panel konsistent in der Seitenleiste; die detaillierte Mobiloptimierung wird auf die Mitarbeiterseiten konzentriert. Es werden keine Datenbank-, Rechte- oder Geschäftslogikänderungen vorgenommen.

## Prüfung
- Smartphone-Ansicht der Auftragsübersicht, Auftragsdetailseite und Onboarding-Seite prüfen.
- Hamburger-Menü öffnen, navigieren, per Escape und Schließen-Symbol schließen.
- Abmelden aus dem mobilen Menü und aus der Desktop-Seitenleiste prüfen.
- Desktop-Darstellung kontrollieren, damit die feste Seitenleiste und Inhalte unverändert zuverlässig funktionieren.
- Typprüfung und aktueller Build müssen fehlerfrei bleiben.
