import { describe, expect, it } from "vitest";
import { matchAuftraege } from "./auftrag-match";

const t = [
  { id: "w", name: "Web.de", ident_type: "email", admin_only: false },
  { id: "db", name: "Deutsche Bank", ident_type: "videoident", admin_only: false },
  { id: "sa", name: "Santander", ident_type: "videoident", admin_only: false },
  { id: "tb", name: "Targobank — Video-Ident", ident_type: "videoident", admin_only: false },
  { id: "bt", name: "21bitcoin", ident_type: null, admin_only: true },
];

describe("matchAuftraege", () => {
  it("weist Web.de immer zu, auch ohne Angabe", () => {
    expect(matchAuftraege(undefined, t)).toEqual({ ids: ["w"], errors: [], sources: {} });
  });
  it("löst DeutscheBank, Targobank und Santander-postident auf", () => {
    const r = matchAuftraege(["DeutscheBank-videoident", "Targobank-videoident", "Santander-postident"], t);
    expect(r.ids).toEqual(["w", "db", "tb", "sa"]);
    expect(r.errors).toEqual([]);
    expect(r.sources["sa"]).toBe("Santander-postident");
  });
  it("lehnt falsches Format, unbekannte Bank und 21bitcoin ab", () => {
    const r = matchAuftraege(["DKB", "Foo-videoident", "21bitcoin-videoident"], t);
    expect(r.errors).toHaveLength(3);
  });
});
