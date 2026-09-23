const ACCESS_TOKEN_KEY = "kanbo.accessToken";
const REFRESH_TOKEN_KEY = "kanbo.refreshToken";
const PERSISTENT_KEY = "kanbo.persistent";

export interface StoredTokens {
  accessToken: string;
  refreshToken: string;
}

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function storage(persistent: boolean): Storage {
  return persistent ? window.localStorage : window.sessionStorage;
}

function isPersistent(): boolean {
  if (!isBrowser()) {
    return true;
  }

  return window.localStorage.getItem(PERSISTENT_KEY) !== "false";
}

/**
 * Persistent sessions live in localStorage, so they survive closing the tab or
 * the browser. When the user opts out, tokens stay in sessionStorage instead.
 */
export function saveTokens(tokens: StoredTokens, persistent: boolean): void {
  if (!isBrowser()) {
    return;
  }

  clearTokens();

  window.localStorage.setItem(PERSISTENT_KEY, String(persistent));

  const target = storage(persistent);
  target.setItem(ACCESS_TOKEN_KEY, tokens.accessToken);
  target.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
}

export function updateAccessToken(accessToken: string): void {
  if (!isBrowser()) {
    return;
  }

  storage(isPersistent()).setItem(ACCESS_TOKEN_KEY, accessToken);
}

export function getAccessToken(): string | null {
  if (!isBrowser()) {
    return null;
  }

  return storage(isPersistent()).getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  if (!isBrowser()) {
    return null;
  }

  return storage(isPersistent()).getItem(REFRESH_TOKEN_KEY);
}

export function clearTokens(): void {
  if (!isBrowser()) {
    return;
  }

  window.localStorage.removeItem(ACCESS_TOKEN_KEY);
  window.localStorage.removeItem(REFRESH_TOKEN_KEY);
  window.sessionStorage.removeItem(ACCESS_TOKEN_KEY);
  window.sessionStorage.removeItem(REFRESH_TOKEN_KEY);
  window.localStorage.removeItem(PERSISTENT_KEY);
}

/** Rewrites both tokens keeping the persistence choice made at login. */
export function refreshStoredTokens(tokens: StoredTokens): void {
  saveTokens(tokens, isPersistent());
}
