import { createLabelSchema, updateLabelSchema } from "./labels.schemas";

describe("createLabelSchema", () => {
  it("accepts a valid name and color", () => {
    expect(createLabelSchema.safeParse({ name: "Urgente", color: "vermelho" }).success).toBe(true);
  });

  it("rejects a missing name", () => {
    expect(createLabelSchema.safeParse({ color: "verde" }).success).toBe(false);
  });

  it("rejects an empty name", () => {
    expect(createLabelSchema.safeParse({ name: "  ", color: "verde" }).success).toBe(false);
  });

  it("rejects a name above 50 characters", () => {
    expect(
      createLabelSchema.safeParse({ name: "a".repeat(51), color: "verde" }).success,
    ).toBe(false);
  });

  it("accepts a name at exactly 50 characters", () => {
    expect(
      createLabelSchema.safeParse({ name: "a".repeat(50), color: "verde" }).success,
    ).toBe(true);
  });

  it("rejects a missing color", () => {
    expect(createLabelSchema.safeParse({ name: "Urgente" }).success).toBe(false);
  });

  it("rejects a color outside the supported set", () => {
    expect(createLabelSchema.safeParse({ name: "Urgente", color: "rosa" }).success).toBe(false);
  });

  it("accepts every color in the supported set", () => {
    for (const color of ["verde", "amarelo", "laranja", "vermelho", "roxo", "azul", "ciano", "cinza"]) {
      expect(createLabelSchema.safeParse({ name: "X", color }).success).toBe(true);
    }
  });
});

describe("updateLabelSchema", () => {
  it("accepts only name", () => {
    expect(updateLabelSchema.safeParse({ name: "Novo nome" }).success).toBe(true);
  });

  it("accepts only color", () => {
    expect(updateLabelSchema.safeParse({ color: "azul" }).success).toBe(true);
  });

  it("accepts both", () => {
    expect(updateLabelSchema.safeParse({ name: "Novo nome", color: "azul" }).success).toBe(true);
  });

  it("rejects an empty payload", () => {
    expect(updateLabelSchema.safeParse({}).success).toBe(false);
  });

  it("rejects a color outside the supported set", () => {
    expect(updateLabelSchema.safeParse({ color: "rosa" }).success).toBe(false);
  });
});
