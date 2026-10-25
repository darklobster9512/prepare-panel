import { describe, expect, it } from "vitest";
import { isSameVic } from "./auftrag-match";

describe("isSameVic", () => {
  const a = { first_name: "Stefan  Christian", last_name: "Ehses", birth_date: "1966-07-24" };
  it("erkennt gleichen Vic trotz Schreibweise", () => {
    expect(isSameVic(a, { first_name: "stefan christian", last_name: "EHSES ", birth_date: "1966-07-24" })).toBe(true);
  });
  it("anderes Geburtsdatum ist anderer Vic", () => {
    expect(isSameVic(a, { ...a, birth_date: "1966-07-25" })).toBe(false);
  });
});
