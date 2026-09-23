import { associateLabelSchema } from "./cards-labels.schemas";

describe("associateLabelSchema", () => {
  it("accepts a valid labelId", () => {
    expect(associateLabelSchema.safeParse({ labelId: "label-1" }).success).toBe(true);
  });

  it("rejects a missing labelId", () => {
    expect(associateLabelSchema.safeParse({}).success).toBe(false);
  });

  it("rejects an empty labelId", () => {
    expect(associateLabelSchema.safeParse({ labelId: "" }).success).toBe(false);
  });
});
