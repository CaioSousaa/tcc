import { describe, expect, it } from "vitest";
import { can, type BoardAction, type BoardRole } from "../permissions";

// Same table as back-end/src/__tests__/permissions.test.ts: RF07 RN05, line by line (N156).
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

describe("can (RF07 RN05, F88)", () => {
  for (const [action, expected] of MATRIX) {
    for (const role of ["admin", "member"] as BoardRole[]) {
      it(`${role} ${expected[role] ? "may" : "may not"} ${action}`, () => {
        expect(can(role, action)).toBe(expected[role]);
      });
    }
  }
});
