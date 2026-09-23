import { describe, expect, it } from "vitest";
import { BCRYPT_COST, PasswordService } from "../services/PasswordService";

describe("PasswordService", () => {
  const service = new PasswordService();

  it("uses bcrypt with cost 10 (N1, C04)", async () => {
    const hash = await service.hash("senha12345");
    expect(BCRYPT_COST).toBe(10);
    expect(hash).toMatch(/^\$2[aby]\$10\$/);
  });

  it("refuses a cost lower than 10 (N1)", () => {
    expect(() => new PasswordService(9)).toThrow();
  });

  it("never stores the password in readable form (RN07)", async () => {
    const hash = await service.hash("senha12345");
    expect(hash).not.toContain("senha12345");
  });

  it("verifies the correct password", async () => {
    const hash = await service.hash("senha12345");
    await expect(service.verify("senha12345", hash)).resolves.toBe(true);
  });

  it("is case-sensitive (CA13)", async () => {
    const hash = await service.hash("senha12345");
    await expect(service.verify("SENHA12345", hash)).resolves.toBe(false);
  });

  it("treats spaces as part of the password (CB07)", async () => {
    const hash = await service.hash(" senha 12345 ");
    await expect(service.verify(" senha 12345 ", hash)).resolves.toBe(true);
    await expect(service.verify("senha 12345", hash)).resolves.toBe(false);
  });

  it("distinguishes 100-char passwords that differ only after byte 72 (RN05)", async () => {
    const base = "a".repeat(90);
    const hash = await service.hash(`${base}1234567890`);
    await expect(service.verify(`${base}0987654321`, hash)).resolves.toBe(false);
  });

  it("dummy verification always resolves to false (RN08)", async () => {
    await expect(service.verifyAgainstDummy("senha12345")).resolves.toBe(false);
  });
});
