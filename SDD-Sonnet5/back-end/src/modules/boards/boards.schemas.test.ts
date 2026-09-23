import { createBoardSchema, formatZodError, updateBoardSchema } from "./boards.schemas";

describe("createBoardSchema (RN-02, RN-03, critérios 2, 3, 4)", () => {
  it("accepts a valid payload with name and description", () => {
    const result = createBoardSchema.safeParse({ name: "Projeto TCC", description: "Quadro do TCC" });
    expect(result.success).toBe(true);
  });

  it("accepts a valid payload with only name (critério 4)", () => {
    const result = createBoardSchema.safeParse({ name: "Projeto TCC" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.description).toBeUndefined();
    }
  });

  it("rejects a missing name (critério 2)", () => {
    const result = createBoardSchema.safeParse({});
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(formatZodError(result.error).name).toBeDefined();
    }
  });

  it("rejects an empty/whitespace-only name (critério 2)", () => {
    const result = createBoardSchema.safeParse({ name: "   " });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(formatZodError(result.error).name).toBeDefined();
    }
  });

  it("rejects a name longer than 100 characters (RN-02, critério 3)", () => {
    const result = createBoardSchema.safeParse({ name: "a".repeat(101) });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(formatZodError(result.error).name).toMatch(/100/);
    }
  });

  it("rejects a description longer than 500 characters (RN-03)", () => {
    const result = createBoardSchema.safeParse({ name: "Projeto TCC", description: "a".repeat(501) });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(formatZodError(result.error).description).toMatch(/500/);
    }
  });
});

describe("updateBoardSchema (RN-09, critério 13)", () => {
  it("accepts an empty payload (no-op edit is not an error)", () => {
    const result = updateBoardSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("accepts updating only the name", () => {
    const result = updateBoardSchema.safeParse({ name: "Novo nome" });
    expect(result.success).toBe(true);
  });

  it("accepts updating only the description", () => {
    const result = updateBoardSchema.safeParse({ description: "Nova descrição" });
    expect(result.success).toBe(true);
  });

  it("accepts explicitly clearing the description with null", () => {
    const result = updateBoardSchema.safeParse({ description: null });
    expect(result.success).toBe(true);
  });

  it("rejects an empty name when name is provided (critério 13)", () => {
    const result = updateBoardSchema.safeParse({ name: "" });
    expect(result.success).toBe(false);
  });

  it("rejects a name longer than 100 characters when provided", () => {
    const result = updateBoardSchema.safeParse({ name: "a".repeat(101) });
    expect(result.success).toBe(false);
  });
});
