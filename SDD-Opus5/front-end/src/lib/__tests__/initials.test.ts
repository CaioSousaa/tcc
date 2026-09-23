import { describe, expect, it } from "vitest";
import { initials } from "../initials";

describe("initials", () => {
  it("uses first and last name, as in the prototype header (CA22)", () => {
    expect(initials("Caio Rocha")).toBe("CR");
    expect(initials("  ana   maria lima ")).toBe("AL");
  });

  it("handles single names and accents", () => {
    expect(initials("Ágata")).toBe("Á");
  });
});
