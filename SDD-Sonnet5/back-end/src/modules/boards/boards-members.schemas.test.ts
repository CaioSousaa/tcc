import { inviteMemberSchema, updateMemberRoleSchema } from "./boards-members.schemas";

describe("inviteMemberSchema", () => {
  it("accepts a valid email with role administrador", () => {
    const result = inviteMemberSchema.safeParse({ email: "user@example.com", role: "administrador" });
    expect(result.success).toBe(true);
  });

  it("accepts a valid email with role membro", () => {
    const result = inviteMemberSchema.safeParse({ email: "user@example.com", role: "membro" });
    expect(result.success).toBe(true);
  });

  it("rejects a missing email", () => {
    const result = inviteMemberSchema.safeParse({ role: "membro" });
    expect(result.success).toBe(false);
  });

  it("rejects a malformed email", () => {
    const result = inviteMemberSchema.safeParse({ email: "not-an-email", role: "membro" });
    expect(result.success).toBe(false);
  });

  it("rejects a role outside the enum", () => {
    const result = inviteMemberSchema.safeParse({ email: "user@example.com", role: "convidado" });
    expect(result.success).toBe(false);
  });

  it("rejects a missing role", () => {
    const result = inviteMemberSchema.safeParse({ email: "user@example.com" });
    expect(result.success).toBe(false);
  });
});

describe("updateMemberRoleSchema", () => {
  it("accepts a valid role", () => {
    expect(updateMemberRoleSchema.safeParse({ role: "administrador" }).success).toBe(true);
  });

  it("rejects a missing role", () => {
    expect(updateMemberRoleSchema.safeParse({}).success).toBe(false);
  });

  it("rejects a role outside the enum", () => {
    expect(updateMemberRoleSchema.safeParse({ role: "dono" }).success).toBe(false);
  });
});
