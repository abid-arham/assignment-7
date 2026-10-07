import { NextResponse, type NextRequest } from "next/server";
import { ROLE_HOME, roleForPath, safeRedirect } from "@/lib/auth/roles";
import {
  ACCESS_COOKIE,
  REFRESH_COOKIE,
  clearAuthCookies,
  refreshTokens,
  secondsLeft,
  verifyAccessToken,
  writeAuthCookies,
} from "@/lib/auth/session";

/** Refresh a little before expiry so the token can't lapse halfway through a render. */
const REFRESH_WINDOW_SECONDS = 30;

const isPrefetch = (request: NextRequest) =>
  request.headers.get("next-router-prefetch") === "1" ||
  request.headers.get("purpose") === "prefetch" ||
  request.headers.get("sec-purpose")?.includes("prefetch") === true;

/**
 * Route protection and silent session renewal.
 *
 *  - /dashboard → STUDENT, /instructor → INSTRUCTOR, /admin → ADMIN, /payment → any signed-in user
 *  - Signed-out visitors are sent to /login?next=…; a wrong role is sent to its own home.
 *  - /login and /register bounce signed-in users to their dashboard.
 *  - An expired access token is renewed with the refresh token before the page renders, and the new
 *    cookies are forwarded on the request so Server Components already see them.
 */
export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const isAuthPage = pathname === "/login" || pathname === "/register";

  let session = await verifyAccessToken(request.cookies.get(ACCESS_COOKIE)?.value);
  const refreshToken = request.cookies.get(REFRESH_COOKIE)?.value;

  // Prefetches never rotate tokens: several can fire at once, and the API revokes a refresh token on use,
  // so racing them would sign the user out.
  let tokens = null;
  let refreshFailed = false;
  if ((!session || secondsLeft(session) < REFRESH_WINDOW_SECONDS) && refreshToken && !isPrefetch(request)) {
    tokens = await refreshTokens(refreshToken);
    if (tokens) {
      session = await verifyAccessToken(tokens.accessToken);
      request.cookies.set(ACCESS_COOKIE, tokens.accessToken);
      request.cookies.set(REFRESH_COOKIE, tokens.refreshToken);
    } else {
      refreshFailed = !session;
    }
  }

  let response: NextResponse;
  if (isAuthPage) {
    response = session
      ? NextResponse.redirect(new URL(safeRedirect(request.nextUrl.searchParams.get("next"), session.role), request.url))
      : NextResponse.next({ request });
  } else if (!session) {
    const login = new URL("/login", request.url);
    login.searchParams.set("next", `${pathname}${search}`);
    response = NextResponse.redirect(login);
  } else {
    const owner = roleForPath(pathname);
    response =
      owner && owner !== session.role
        ? NextResponse.redirect(new URL(ROLE_HOME[session.role], request.url))
        : NextResponse.next({ request });
  }

  if (tokens) writeAuthCookies(response.cookies, tokens);
  else if (refreshFailed) clearAuthCookies(response.cookies);

  return response;
}

export const config = {
  matcher: ["/dashboard/:path*", "/instructor/:path*", "/admin/:path*", "/payment/:path*", "/login", "/register"],
};
