import {
  createChecklistSchema,
  createItemSchema,
  formatZodError,
  updateItemSchema,
} from "./checklists.schemas";

describe("createChecklistSchema (RN-02, critérios 2, 3)", () => {
  it("accepts a valid name", () => {
    expect(createChecklistSchema.safeParse({ name: "A Fazer" }).success).toBe(true);
  });

  it("rejects a missing name (critério 2)", () => {
    const result = createChecklistSchema.safeParse({});
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(formatZodError(result.error).name).toBeDefined();
    }
  });

  it("rejects an empty/whitespace-only name (critério 2)", () => {
    expect(createChecklistSchema.safeParse({ name: "   " }).success).toBe(false);
  });

  it("rejects a name longer than 100 characters (critério 3)", () => {
    const result = createChecklistSchema.safeParse({ name: "a".repeat(101) });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(formatZodError(result.error).name).toMatch(/100/);
    }
  });
});

describe("createItemSchema (RN-04, critérios 8, 9)", () => {
  it("accepts a valid text", () => {
    expect(createItemSchema.safeParse({ text: "Comprar leite" }).success).toBe(true);
  });

  it("rejects a missing text (critério 8)", () => {
    const result = createItemSchema.safeParse({});
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(formatZodError(result.error).text).toBeDefined();
    }
  });

  it("rejects an empty/whitespace-only text (critério 8)", () => {
    expect(createItemSchema.safeParse({ text: "   " }).success).toBe(false);
  });

  it("rejects a text longer than 500 characters (critério 9)", () => {
    const result = createItemSchema.safeParse({ text: "a".repeat(501) });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(formatZodError(result.error).text).toMatch(/500/);
    }
  });
});

describe("updateItemSchema", () => {
  it("accepts completed: true", () => {
    expect(updateItemSchema.safeParse({ completed: true }).success).toBe(true);
  });

  it("accepts completed: false", () => {
    expect(updateItemSchema.safeParse({ completed: false }).success).toBe(true);
  });

  it("rejects a missing completed field", () => {
    expect(updateItemSchema.safeParse({}).success).toBe(false);
  });

  it("rejects a non-boolean completed field", () => {
    expect(updateItemSchema.safeParse({ completed: "yes" }).success).toBe(false);
  });
});
