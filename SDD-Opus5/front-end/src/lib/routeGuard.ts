import { DEFAULT_AUTHENTICATED_PATH, isPublicPath, loginUrl } from "./redirect";

export const SESSION_COOKIE_NAME = "session_token";

export type RouteDecision = { type: "next"; noStore: boolean } | { type: "redirect"; to: string };

/**
 * Pure routing decision used by the proxy. It only knows whether a session
 * cookie is present; the API is the authority on its validity (C17).
 */
export function decideRoute(pathname: string, search: string, hasSessionCookie: boolean): RouteDecision {
  if (pathname === "/") {
    return { type: "redirect", to: hasSessionCookie ? DEFAULT_AUTHENTICATED_PATH : "/login" };
  }

  if (isPublicPath(pathname)) {
    // The expired-session notice must stay reachable even if a stale cookie is still present.
    const expiredNotice = new URLSearchParams(search).get("expired") === "1";
    if (hasSessionCookie && !expiredNotice) return { type: "redirect", to: DEFAULT_AUTHENTICATED_PATH };
    return { type: "next", noStore: false };
  }

  if (!hasSessionCookie) {
    return { type: "redirect", to: loginUrl({ redirect: `${pathname}${search}` }) };
  }

  // Protected pages must not be restored from the browser cache after logout (CA21, CB15).
  return { type: "next", noStore: true };
}
