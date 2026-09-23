import { describe, expect, it } from "vitest";
import { MESSAGES } from "@/lib/messages";
import { validateInviteEmail } from "../member";

describe("validateInviteEmail (RF07 A57)", () => {
  it("normalizes like RF01 (CB01, CA05)", () => {
    expect(validateInviteEmail(" Pedro@Empresa.com ")).toEqual({ success: true, data: { email: "pedro@empresa.com" } });
  });

  it.each(["", "   "])("requires the e-mail: %j (CB02)", (value) => {
    expect(validateInviteEmail(value)).toEqual({ success: false, fields: { email: MESSAGES.required } });
  });

  it.each(["pedro@", "pedro", "pedro@empresa", "a b@empresa.com"])("rejects %j (CA06)", (value) => {
    expect(validateInviteEmail(value)).toEqual({ success: false, fields: { email: MESSAGES.invalidEmail } });
  });
});
