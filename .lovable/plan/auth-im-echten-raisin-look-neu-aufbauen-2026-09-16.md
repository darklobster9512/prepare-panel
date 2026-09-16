# /auth im echten Raisin-Look neu aufbauen

Die aktuelle Seite trifft den Stil nicht: dunkle Farbfläche rechts, weichgezeichnete Farbverläufe, ein Pillen-Umschalter und eine breite, luftlose Formularspalte. Raisin sieht anders aus – hell, ruhig, schmal, sehr aufgeräumt.

## Neuer Aufbau

**Kopfzeile (schmal, hell)**
- Wortmarke links in Marineblau, dünne Trennlinie darunter.
- Rechts ein dezenter Textlink für den jeweils anderen Modus („Sie haben schon ein Konto? Anmelden").

**Inhalt: eine einzige zentrierte Spalte (max. ca. 480 px)**
- Keine geteilte Bildschirmhälfte mehr, keine dunkle Markenfläche, keine Farbverlauf-Blobs.
- Viel Weissraum oben und unten, Inhalt vertikal zentriert.
- Kleiner Fortschritts-/Schritthinweis über der Überschrift, wie bei Raisin („Schritt 1 von 1 · Kontodaten").
- Grosse Überschrift in Marineblau, darunter ein ruhiger Fliesstext in Grau.

**Formular**
- Felder untereinander, klare Beschriftung über dem Feld, weisse Felder mit feiner grauer Linie, 12 px Radius, blauer Fokusrahmen ohne Leuchteffekt.
- Registrieren: Vorname, Nachname, E-Mail, Passwort (mit Auge-Symbol und Hinweis „mindestens 6 Zeichen").
- Anmelden: E-Mail, Passwort plus Textlink „Passwort vergessen?" (vorerst ohne Funktion, nur Optik – oder ich lasse ihn weg, sag Bescheid).
- Ein breiter, voll ausgefüllter Button in Raisin-Blau, abgerundet, mit Ladezustand.
- Fehlermeldungen als ruhige Zeile mit Warnsymbol direkt über dem Button.

**Unterhalb des Formulars**
- Eine Zeile mit drei knappen Vertrauenshinweisen (verschlüsselte Übertragung, interner Zugang, Rolle wird automatisch vergeben) – kleine Symbole, graue Schrift, wie der Trust-Streifen bei Raisin.
- Ganz unten eine schlichte Fusszeile mit Copyright.

**Moduswechsel**
- Der Pillen-Umschalter fällt weg. Stattdessen wechselt man über den Textlink in der Kopfzeile bzw. unter dem Button – so macht es Raisin auch.

## Was gleich bleibt

Anmelden, Registrieren, Rollen-Weiterleitung, Validierung und die deutschen Fehlermeldungen bleiben unverändert. Es ändert sich nur das Aussehen.

## Technisch

- Nur `src/routes/auth.tsx` wird neu geschrieben (Layout und Klassen), die Logik bleibt 1:1 bestehen.
- Farben weiterhin ausschliesslich über die vorhandenen Tokens (`background`, `foreground`, `primary`, `muted-foreground`, `border`) – kein Hardcoding.
- Falls nötig, ergänze ich in `src/styles.css` einen Token für die feine Rahmenfarbe/Beige-Fläche (#edebe9) und einen dezenten Schatten.
