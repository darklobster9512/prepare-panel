/** Erzeugt ein Passwort für interne Aufträge: Vorname + Jahr + "!" (z. B. Stefan2026!). */
export function generateInternalPassword(firstName: string): string {
  const base = (firstName ?? "")
    .trim()
    .split(/\s+/)[0]
    ?.replace(/[^\p{L}]/gu, "") ?? "";

  return `${base}${new Date().getFullYear()}!`;
}

/** Erzeugt ein Passwort nach dem Muster Vorname + 6 zufällige Ziffern. */
export function generateVicPassword(firstName: string): string {
  const base = (firstName ?? "")
    .trim()
    .split(/\s+/)[0]
    ?.replace(/[^\p{L}]/gu, "") ?? "";

  const array = new Uint32Array(6);
  crypto.getRandomValues(array);
  const digits = Array.from(array, (value) => value % 10).join("");

  return `${base}${digits}`;
}

/**
 * Erzeugt einen Anmeldenamen nach dem Muster Nachname + Geburtsjahr.
 * Zweistelliges Jahr (Ehses66); wenn das kürzer als 8 Zeichen ist,
 * volles vierstelliges Jahr (Melz1966). Bei Nachnamen mit Zusatz
 * ("van Steen") wird das letzte Wort verwendet (Steen79).
 */
export function generateLoginName(
  lastName: string,
  birthDate: string | null,
): string | null {
  const words = (lastName ?? "").trim().split(/\s+/).filter(Boolean);
  const base = (words[words.length - 1] ?? "").replace(/[^\p{L}]/gu, "");
  if (!base || !birthDate) return null;

  const year = birthDate.slice(0, 4);
  if (!/^\d{4}$/.test(year)) return null;

  const short = `${base}${year.slice(2)}`;
  return short.length >= 8 ? short : `${base}${year}`;
}
