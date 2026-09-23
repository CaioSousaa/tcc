import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE_NAME, decideRoute } from "@/lib/routeGuard";

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const hasSessionCookie = Boolean(request.cookies.get(SESSION_COOKIE_NAME)?.value);
  const decision = decideRoute(pathname, search, hasSessionCookie);

  if (decision.type === "redirect") {
    return NextResponse.redirect(new URL(decision.to, request.url));
  }

  const response = NextResponse.next();
  if (decision.noStore) response.headers.set("Cache-Control", "no-store, max-age=0");
  return response;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
