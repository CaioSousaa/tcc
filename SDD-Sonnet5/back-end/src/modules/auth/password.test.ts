import { hashPassword, verifyPassword } from "./password";

describe("password hashing (RN-07)", () => {
  it("never stores the plain password inside the generated hash", async () => {
    const plain = "correct-horse-battery-staple";
    const hash = await hashPassword(plain);
    expect(hash).not.toBe(plain);
    expect(hash).not.toContain(plain);
  });

  it("accepts the correct password against its own hash", async () => {
    const plain = "correct-horse-battery-staple";
    const hash = await hashPassword(plain);
    await expect(verifyPassword(plain, hash)).resolves.toBe(true);
  });

  it("rejects an incorrect password against an existing hash", async () => {
    const hash = await hashPassword("correct-horse-battery-staple");
    await expect(verifyPassword("wrong-password", hash)).resolves.toBe(false);
  });

  it("produces different hashes for the same password (random salt)", async () => {
    const plain = "correct-horse-battery-staple";
    const [hashA, hashB] = await Promise.all([hashPassword(plain), hashPassword(plain)]);
    expect(hashA).not.toBe(hashB);
  });
});
