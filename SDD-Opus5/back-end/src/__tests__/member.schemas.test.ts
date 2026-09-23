import { describe, expect, it } from "vitest";
import { parseInviteInput, parseRoleInput } from "../schemas/member.schemas";

describe("parseInviteInput (RF07 A57)", () => {
  it("normalizes the e-mail and keeps the role (CB01, CA05)", () => {
    expect(parseInviteInput({ email: " Pedro@Empresa.com ", role: "admin" })).toEqual({
      success: true,
      data: { email: "pedro@empresa.com", role: "admin" },
    });
  });

  it("defaults to member without role (CB04)", () => {
    expect(parseInviteInput({ email: "ana@empresa.com" })).toEqual({
      success: true,
      data: { email: "ana@empresa.com", role: "member" },
    });
  });

  it("requires the e-mail (CB02)", () => {
    expect(parseInviteInput({ email: "   " })).toEqual({ success: false, fields: { email: "Campo obrigatório." } });
    expect(parseInviteInput(null)).toEqual({ success: false, fields: { email: "Campo obrigatório." } });
  });

  it("rejects an invalid e-mail (CA06)", () => {
    expect(parseInviteInput({ email: "pedro@" })).toEqual({ success: false, fields: { email: "Informe um e-mail válido." } });
  });

  it("rejects an unknown role (CB03)", () => {
    expect(parseInviteInput({ email: "ana@empresa.com", role: "owner" })).toEqual({
      success: false,
      fields: { role: "Valor inválido." },
    });
  });

  it("drops unknown fields such as boardId or invitedBy", () => {
    const result = parseInviteInput({ email: "ana@empresa.com", invitedBy: "x", boardId: "y" });
    expect(result.success && Object.keys(result.data).sort()).toEqual(["email", "role"]);
  });
});

describe("parseRoleInput (RF07 A57)", () => {
  it("accepts admin and member", () => {
    expect(parseRoleInput({ role: "admin" })).toEqual({ success: true, data: { role: "admin" } });
    expect(parseRoleInput({ role: "member" })).toEqual({ success: true, data: { role: "member" } });
  });

  it("requires a valid role (CB03)", () => {
    expect(parseRoleInput({})).toEqual({ success: false, fields: { role: "Valor inválido." } });
    expect(parseRoleInput({ role: "ADMIN" })).toEqual({ success: false, fields: { role: "Valor inválido." } });
  });
});
