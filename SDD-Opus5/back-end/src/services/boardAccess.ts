import type { BoardScope } from "../repositories/BoardRepository";

/**
 * Single authorization point for boards and everything inside them (RF02 F10,
 * RF03 F20/C45). Since RF07 a user reaches the boards they participate in, with
 * any role (F77); what they may do is decided by `domain/permissions.ts`.
 */
export function boardScopeFor(userId: string): BoardScope {
  return { userId };
}
