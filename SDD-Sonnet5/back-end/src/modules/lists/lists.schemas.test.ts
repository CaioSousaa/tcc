import { createListSchema, formatZodError, updateListSchema } from "./lists.schemas";

describe("createListSchema (RN-02, critérios 2, 3)", () => {
  it("accepts a valid name", () => {
    const result = createListSchema.safeParse({ name: "A Fazer" });
    expect(result.success).toBe(true);
  });

  it("rejects a missing name (critério 2)", () => {
    const result = createListSchema.safeParse({});
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(formatZodError(result.error).name).toBeDefined();
    }
  });

  it("rejects an empty/whitespace-only name (critério 2)", () => {
    const result = createListSchema.safeParse({ name: "   " });
    expect(result.success).toBe(false);
  });

  it("rejects a name longer than 100 characters (critério 3)", () => {
    const result = createListSchema.safeParse({ name: "a".repeat(101) });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(formatZodError(result.error).name).toMatch(/100/);
    }
  });
});

describe("updateListSchema (RN-09, critérios 10, 11, 13)", () => {
  it("accepts an empty payload", () => {
    expect(updateListSchema.safeParse({}).success).toBe(true);
  });

  it("accepts updating only the name (critério 10)", () => {
    expect(updateListSchema.safeParse({ name: "Novo nome" }).success).toBe(true);
  });

  it("accepts updating only the position (critério 13)", () => {
    expect(updateListSchema.safeParse({ position: 2 }).success).toBe(true);
  });

  it("rejects an empty name when provided (critério 11)", () => {
    expect(updateListSchema.safeParse({ name: "" }).success).toBe(false);
  });

  it("rejects a negative position at the structural level", () => {
    expect(updateListSchema.safeParse({ position: -1 }).success).toBe(false);
  });

  it("rejects a non-integer position", () => {
    expect(updateListSchema.safeParse({ position: 1.5 }).success).toBe(false);
  });
});
