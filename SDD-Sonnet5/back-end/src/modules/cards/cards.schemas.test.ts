import { createCardSchema, formatZodError, updateCardSchema } from "./cards.schemas";

describe("createCardSchema (RN-02, RN-03, critérios 2, 3, 5)", () => {
  it("accepts a valid title and description", () => {
    expect(createCardSchema.safeParse({ title: "Comprar leite", description: "2 litros" }).success).toBe(
      true,
    );
  });

  it("accepts a valid title without description (critério 5)", () => {
    const result = createCardSchema.safeParse({ title: "Comprar leite" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.description).toBeUndefined();
    }
  });

  it("rejects a missing title (critério 2)", () => {
    const result = createCardSchema.safeParse({});
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(formatZodError(result.error).title).toBeDefined();
    }
  });

  it("rejects an empty/whitespace-only title (critério 2)", () => {
    expect(createCardSchema.safeParse({ title: "   " }).success).toBe(false);
  });

  it("rejects a title longer than 200 characters (critério 3)", () => {
    const result = createCardSchema.safeParse({ title: "a".repeat(201) });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(formatZodError(result.error).title).toMatch(/200/);
    }
  });

  it("rejects a description longer than 2000 characters", () => {
    const result = createCardSchema.safeParse({ title: "Comprar leite", description: "a".repeat(2001) });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(formatZodError(result.error).description).toMatch(/2000/);
    }
  });

  it("accepts a valid dueDate (RF10, critério 1)", () => {
    expect(
      createCardSchema.safeParse({ title: "Comprar leite", dueDate: "2026-03-15" }).success,
    ).toBe(true);
  });

  it("accepts a past dueDate without rejecting it (RF10, RN-03, critério 2)", () => {
    expect(
      createCardSchema.safeParse({ title: "Comprar leite", dueDate: "2020-01-01" }).success,
    ).toBe(true);
  });

  it("rejects a malformed dueDate (RF10, RN-01, critério 3)", () => {
    expect(
      createCardSchema.safeParse({ title: "Comprar leite", dueDate: "15/03/2026" }).success,
    ).toBe(false);
  });

  it("rejects a dueDate that is not a real calendar date (RF10, critério 3)", () => {
    expect(
      createCardSchema.safeParse({ title: "Comprar leite", dueDate: "2026-02-30" }).success,
    ).toBe(false);
  });

  it("accepts a card without dueDate", () => {
    const result = createCardSchema.safeParse({ title: "Comprar leite" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.dueDate).toBeUndefined();
    }
  });
});

describe("updateCardSchema (RN-16, critérios 11, 12, 13, movimentação)", () => {
  it("accepts an empty payload", () => {
    expect(updateCardSchema.safeParse({}).success).toBe(true);
  });

  it("accepts updating only the title (critério 11)", () => {
    expect(updateCardSchema.safeParse({ title: "Novo título" }).success).toBe(true);
  });

  it("accepts updating only the description (critério 12)", () => {
    expect(updateCardSchema.safeParse({ description: "Nova descrição" }).success).toBe(true);
  });

  it("accepts explicitly clearing the description with null", () => {
    expect(updateCardSchema.safeParse({ description: null }).success).toBe(true);
  });

  it("accepts only a targetListId (move without editing fields)", () => {
    expect(updateCardSchema.safeParse({ targetListId: "list-2" }).success).toBe(true);
  });

  it("accepts title/description together with targetListId", () => {
    expect(
      updateCardSchema.safeParse({ title: "X", description: "Y", targetListId: "list-2" }).success,
    ).toBe(true);
  });

  it("rejects an empty title when provided (critério 13)", () => {
    expect(updateCardSchema.safeParse({ title: "" }).success).toBe(false);
  });

  it("rejects a title longer than 200 characters when provided", () => {
    expect(updateCardSchema.safeParse({ title: "a".repeat(201) }).success).toBe(false);
  });

  it("accepts setting a new dueDate (RF10, critério 7)", () => {
    expect(updateCardSchema.safeParse({ dueDate: "2026-03-15" }).success).toBe(true);
  });

  it("accepts clearing the dueDate with null (RF10, critério 8, 9)", () => {
    expect(updateCardSchema.safeParse({ dueDate: null }).success).toBe(true);
  });

  it("rejects a malformed dueDate (RF10, critério 3)", () => {
    expect(updateCardSchema.safeParse({ dueDate: "not-a-date" }).success).toBe(false);
  });

  it("leaves dueDate untouched when the field is absent", () => {
    const result = updateCardSchema.safeParse({ title: "X" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.dueDate).toBeUndefined();
    }
  });
});
