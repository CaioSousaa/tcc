import { assignMemberSchema } from "./cards-assignments.schemas";

describe("assignMemberSchema", () => {
  it("accepts a valid userId", () => {
    expect(assignMemberSchema.safeParse({ userId: "user-1" }).success).toBe(true);
  });

  it("rejects a missing userId", () => {
    expect(assignMemberSchema.safeParse({}).success).toBe(false);
  });

  it("rejects an empty userId", () => {
    expect(assignMemberSchema.safeParse({ userId: "" }).success).toBe(false);
  });
});
