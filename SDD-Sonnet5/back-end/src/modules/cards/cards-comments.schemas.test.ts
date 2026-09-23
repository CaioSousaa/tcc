import { createCommentSchema } from "./cards-comments.schemas";

describe("createCommentSchema", () => {
  it("accepts a valid text", () => {
    expect(createCommentSchema.safeParse({ text: "Ótimo trabalho" }).success).toBe(true);
  });

  it("rejects a missing text", () => {
    expect(createCommentSchema.safeParse({}).success).toBe(false);
  });

  it("rejects an empty text", () => {
    expect(createCommentSchema.safeParse({ text: "  " }).success).toBe(false);
  });

  it("rejects a text above 2000 characters", () => {
    expect(createCommentSchema.safeParse({ text: "a".repeat(2001) }).success).toBe(false);
  });

  it("accepts a text at exactly 2000 characters", () => {
    expect(createCommentSchema.safeParse({ text: "a".repeat(2000) }).success).toBe(true);
  });
});
