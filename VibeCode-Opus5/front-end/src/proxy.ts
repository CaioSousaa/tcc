import { NextResponse, type NextRequest } from "next/server";

const SESSION_FLAG_COOKIE = "kanbo_session";
const PROTECTED_ROUTES = ["/quadros"];
const AUTH_ROUTES = ["/login", "/criar-conta"];

/**
 * Optimistic guard only: it reads the non-httpOnly session flag to avoid flashing
 * the wrong screen. The real check stays on the API (`GET /auth/me`).
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSession = request.cookies.has(SESSION_FLAG_COOKIE);

  if (!hasSession && PROTECTED_ROUTES.some((route) => pathname.startsWith(route))) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (hasSession && AUTH_ROUTES.some((route) => pathname.startsWith(route))) {
    return NextResponse.redirect(new URL("/quadros", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/quadros/:path*", "/login", "/criar-conta"],
};
