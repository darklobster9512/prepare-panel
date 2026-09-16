export type ParsedVic = {
  first_name: string;
  last_name: string;
  birth_name: string;
  birth_date: string;
  birth_place: string;
  street: string;
  postal_code: string;
  city: string;
  marital_status: string;
  tax_id: string;
  bank: string;
  notes: string;
};

const empty = (): ParsedVic => ({
  first_name: "",
  last_name: "",
  birth_name: "",
  birth_date: "",
  birth_place: "",
  street: "",
  postal_code: "",
  city: "",
  marital_status: "",
  tax_id: "",
  bank: "",
  notes: "",
});

const LABELS: { keys: string[]; field: keyof ParsedVic }[] = [
  { keys: ["vorname", "vornamen", "vorname(n)"], field: "first_name" },
  { keys: ["nachname", "familienname"], field: "last_name" },
  { keys: ["geburtsname", "geburtname"], field: "birth_name" },
  { keys: ["geburtsdatum", "geb", "geb."], field: "birth_date" },
  { keys: ["geburtsort"], field: "birth_place" },
  { keys: ["familienstand"], field: "marital_status" },
  { keys: ["steuer-id", "steuerid", "steuer id", "steueridentifikationsnummer"], field: "tax_id" },
  { keys: ["aktuelle bank", "bank", "bankverbindung"], field: "bank" },
  { keys: ["strasse", "straße", "strasse und hausnummer", "straße und hausnummer", "adresse", "anschrift"], field: "street" },
  { keys: ["plz", "postleitzahl"], field: "postal_code" },
  { keys: ["ort", "wohnort", "stadt"], field: "city" },
  { keys: ["notiz", "notizen", "bemerkung", "bemerkungen"], field: "notes" },
];

const NAME_PARTICLES = new Set([
  "van",
  "von",
  "vom",
  "de",
  "der",
  "den",
  "di",
  "da",
  "del",
  "dos",
  "du",
  "la",
  "le",
  "zu",
  "zur",
]);

const DATE_RE = /\b(\d{1,2})\.(\d{1,2})\.(\d{4})\b/;
const POSTAL_RE = /^(\d{4,5})\s+(.+)$/;
const STREET_RE = /^(.*[A-Za-zÄÖÜäöüß.].*?)\s+(\d+\s*[a-zA-Z]?)$/;
const SEPARATOR_RE = /^\s*(=|-|_|\*){2,}.*$/;

function toIsoDate(value: string): string {
  const match = value.match(DATE_RE);
  if (match) {
    const [, d, m, y] = match;
    return `${y}-${m!.padStart(2, "0")}-${d!.padStart(2, "0")}`;
  }
  const iso = value.match(/\b(\d{4})-(\d{2})-(\d{2})\b/);
  return iso ? iso[0] : "";
}

function splitName(line: string, target: ParsedVic) {
  const parts = line.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return;
  if (parts.length === 1) {
    target.last_name = parts[0]!;
    return;
  }
  let splitIndex = parts.length - 1;
  while (splitIndex > 1 && NAME_PARTICLES.has(parts[splitIndex - 1]!.toLowerCase())) {
    splitIndex -= 1;
  }
  target.first_name = parts.slice(0, splitIndex).join(" ");
  target.last_name = parts.slice(splitIndex).join(" ");
}

function addNote(target: ParsedVic, line: string) {
  target.notes = target.notes ? `${target.notes}\n${line}` : line;
}

function isEmptyRecord(record: ParsedVic) {
  return Object.values(record).every((value) => value === "");
}

function matchLabel(line: string): { field: keyof ParsedVic; value: string } | null {
  const index = line.indexOf(":");
  if (index <= 0) return null;
  const rawLabel = line.slice(0, index).trim().toLowerCase().replace(/\s+/g, " ");
  const value = line.slice(index + 1).trim();
  const entry = LABELS.find((item) => item.keys.includes(rawLabel));
  if (!entry) return null;
  return { field: entry.field, value };
}

export function parseVics(input: string): ParsedVic[] {
  const records: ParsedVic[] = [];
  let current = empty();

  const push = () => {
    if (!isEmptyRecord(current)) records.push(current);
    current = empty();
  };

  const lines = input.replace(/\r\n/g, "\n").split("\n");

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (!line) continue;

    if (SEPARATOR_RE.test(line)) {
      push();
      continue;
    }

    const labelled = matchLabel(line);
    if (labelled) {
      const { field, value } = labelled;
      if (current[field]) push();
      if (!value) continue;
      if (field === "birth_date") {
        current.birth_date = toIsoDate(value) || "";
        if (!current.birth_date) addNote(current, line);
      } else if (field === "notes") {
        addNote(current, value);
      } else {
        current[field] = value;
      }
      continue;
    }

    // "24.07.1966 in Trier" or plain date
    if (DATE_RE.test(line) && !/[a-zA-ZÄÖÜäöüß]{3,}\s+\d+$/.test(line)) {
      const iso = toIsoDate(line);
      const place = line.split(/\bin\b/i)[1]?.trim();
      if (current.birth_date) push();
      current.birth_date = iso;
      if (place) current.birth_place = place;
      continue;
    }

    const postal = line.match(POSTAL_RE);
    if (postal) {
      if (current.postal_code) push();
      current.postal_code = postal[1]!;
      current.city = postal[2]!.trim();
      continue;
    }

    if (STREET_RE.test(line) && !/^\d/.test(line)) {
      if (current.street) push();
      current.street = line;
      continue;
    }

    // plain name line: only letters, dots, hyphens, apostrophes
    if (
      /^[A-Za-zÄÖÜäöüß'’.\-]+(\s+[A-Za-zÄÖÜäöüß'’.\-]+)+$/.test(line) &&
      !/\d/.test(line)
    ) {
      if (current.first_name || current.last_name) push();
      splitName(line, current);
      continue;
    }

    addNote(current, line);
  }

  push();
  return records;
}
