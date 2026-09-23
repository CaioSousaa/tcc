export const DEFAULT_AUTHENTICATED_PATH = "/boards";

const PUBLIC_PATHS = ["/login", "/register"];
const INTERNAL_ORIGIN = "http://internal.invalid";

function hasControlCharacters(value: string): boolean {
  for (let index = 0; index < value.length; index += 1) {
    if (value.charCodeAt(index) < 32) return true;
  }
  return false;
}

export function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

/**
 * Accepts only internal paths as post-login destinations (A20, C19).
 * Anything that could leave the origin falls back to the default area.
 */
export function safeRedirect(value: unknown): string {
  if (typeof value !== "string" || !value.startsWith("/")) return DEFAULT_AUTHENTICATED_PATH;
  if (value.startsWith("//") || value.includes("\\") || hasControlCharacters(value)) {
    return DEFAULT_AUTHENTICATED_PATH;
  }

  let url: URL;
  try {
    url = new URL(value, INTERNAL_ORIGIN);
  } catch {
    return DEFAULT_AUTHENTICATED_PATH;
  }
  if (url.origin !== INTERNAL_ORIGIN || isPublicPath(url.pathname)) return DEFAULT_AUTHENTICATED_PATH;

  return `${url.pathname}${url.search}${url.hash}`;
}

export function loginUrl(options: { redirect?: string; expired?: boolean } = {}): string {
  const params = new URLSearchParams();
  if (options.redirect && safeRedirect(options.redirect) === options.redirect) {
    params.set("redirect", options.redirect);
  }
  if (options.expired) params.set("expired", "1");
  const query = params.toString();
  return query ? `/login?${query}` : "/login";
}
