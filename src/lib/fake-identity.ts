/**
 * Liste echter deutscher Adressen (Straße/PLZ/Ort) für die Registrierung
 * von E-Mail-Konten. Es werden bewusst keine echten Vic-Daten verwendet.
 */
export const GERMAN_ADDRESSES: { street: string; postal_code: string; city: string }[] = [
  { street: "Hauptstraße 24", postal_code: "10827", city: "Berlin" },
  { street: "Lindenallee 8", postal_code: "45127", city: "Essen" },
  { street: "Gartenstraße 51", postal_code: "70794", city: "Filderstadt" },
  { street: "Bahnhofstraße 12", postal_code: "34117", city: "Kassel" },
  { street: "Am Stadtpark 7", postal_code: "26123", city: "Oldenburg" },
  { street: "Mühlenweg 33", postal_code: "24103", city: "Kiel" },
  { street: "Kirchgasse 5", postal_code: "65183", city: "Wiesbaden" },
  { street: "Rosenstraße 19", postal_code: "04109", city: "Leipzig" },
  { street: "Feldstraße 62", postal_code: "20357", city: "Hamburg" },
  { street: "Schulstraße 3", postal_code: "93047", city: "Regensburg" },
  { street: "Brückenstraße 41", postal_code: "09111", city: "Chemnitz" },
  { street: "Ringstraße 27", postal_code: "55116", city: "Mainz" },
  { street: "Waldweg 14", postal_code: "79098", city: "Freiburg im Breisgau" },
  { street: "Poststraße 9", postal_code: "48143", city: "Münster" },
  { street: "Marktplatz 6", postal_code: "38100", city: "Braunschweig" },
  { street: "Bergstraße 22", postal_code: "69117", city: "Heidelberg" },
  { street: "Weidenweg 17", postal_code: "39104", city: "Magdeburg" },
  { street: "Sonnenstraße 45", postal_code: "80331", city: "München" },
  { street: "Uferstraße 11", postal_code: "50667", city: "Köln" },
  { street: "Eichenweg 4", postal_code: "33602", city: "Bielefeld" },
];

function randomInt(maxExclusive: number): number {
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  return (array[0] ?? 0) % maxExclusive;
}

export type GeneratedEmailIdentity = {
  street: string;
  postal_code: string;
  city: string;
  birth_date: string;
};

/**
 * Erzeugt eine Fantasie-Identität: echte deutsche Adresse und zufälliges
 * Geburtsdatum. Nur das Geburtsjahr stammt vom Vic-Datensatz.
 */
export function generateEmailIdentity(vicBirthDate: string | null): GeneratedEmailIdentity {
  const address = GERMAN_ADDRESSES[randomInt(GERMAN_ADDRESSES.length)]!;

  const yearFromVic = (vicBirthDate ?? "").slice(0, 4);
  const year = /^\d{4}$/.test(yearFromVic) ? yearFromVic : String(1970 + randomInt(25));

  const month = randomInt(12) + 1;
  const daysInMonth = new Date(Number(year), month, 0).getDate();
  const day = randomInt(daysInMonth) + 1;

  return {
    street: address.street,
    postal_code: address.postal_code,
    city: address.city,
    birth_date: `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
  };
}
