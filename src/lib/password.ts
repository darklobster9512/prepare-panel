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
