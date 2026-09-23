import { describe, expect, it } from "vitest";
import { assertCan, can, type BoardAction, type BoardRole } from "../domain/permissions";
import { AppError } from "../errors/AppError";

// Same table as front-end/src/lib/__tests__/permissions.test.ts: RF07 RN05, line by line (N156).
const MATRIX: Array<[BoardAction, { admin: boolean; member: boolean }]> = [
  ["board.update", { admin: true, member: false }],
  ["board.delete", { admin: true, member: false }],
  ["list.manage", { admin: true, member: false }],
  ["card.write", { admin: true, member: true }],
  ["checklist.write", { admin: true, member: true }],
  ["assignee.write", { admin: true, member: true }],
  ["members.manage", { admin: true, member: false }],
  ["members.leave", { admin: true, member: true }],
  ["labels.manage", { admin: true, member: false }],
  ["labels.apply", { admin: true, member: true }],
  ["comments.write", { admin: true, member: true }],
  ["comments.moderate", { admin: true, member: false }],
  ["dueDate.write", { admin: true, member: true }],
];

describe("permissions (RF07 RN05)", () => {
  for (const [action, expected] of MATRIX) {
    for (const role of ["admin", "member"] as BoardRole[]) {
      it(`${role} ${expected[role] ? "may" : "may not"} ${action}`, () => {
        expect(can(role, action)).toBe(expected[role]);
      });
    }
  }

  it("assertCan throws FORBIDDEN with the spec message (RN06)", () => {
    const error = (() => {
      try {
        assertCan("member", "list.manage");
        return undefined;
      } catch (reason) {
        return reason;
      }
    })();
    expect(error).toBeInstanceOf(AppError);
    expect((error as AppError).code).toBe("FORBIDDEN");
    expect((error as AppError).message).toBe("Você não tem permissão para esta ação.");
  });

  it("assertCan passes silently when allowed", () => {
    expect(() => assertCan("member", "card.write")).not.toThrow();
    expect(() => assertCan("admin", "members.manage")).not.toThrow();
  });
});
