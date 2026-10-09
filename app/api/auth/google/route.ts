import { decodeJwt } from "jose";
import { NextResponse, type NextRequest } from "next/server";
import { env } from "@/lib/env";
import { parseResponse } from "@/lib/api/core";
import type { AuthTokens, Role } from "@/lib/api/types";
import { ROLE_HOME } from "@/lib/auth/roles";
import { writeAuthCookies } from "@/lib/auth/session";

const STATE_COOKIE = "ums_oauth_state";

/**
 * Google sign-in. Without `code`: asks the API for Google's consent URL and adds a CSRF `state`.
 * With `code` (Google redirects back here — the API's GOOGLE_REDIRECT_URI points at this route):
 * checks `state`, lets the API exchange the code, and stores the returned tokens like a normal login.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get("code");
  const fail = () => NextResponse.redirect(new URL("/login?error=google", request.url));

  if (!code) {
    if (searchParams.has("error")) return fail(); // the user cancelled on Google's screen
    const res = await fetch(`${env.apiBaseUrl}/auth/google`, { redirect: "manual", cache: "no-store" });
    const location = res.headers.get("location");
    if (!location) return fail(); // Google login isn't configured on the API

    const state = crypto.randomUUID();
    const consent = new URL(location);
    consent.searchParams.set("state", state);
    const response = NextResponse.redirect(consent);
    response.cookies.set(STATE_COOKIE, state, {
      httpOnly: true,
      secure: env.isProduction,
      sameSite: "lax",
      path: "/",
      maxAge: 600,
    });
    return response;
  }

  const expected = request.cookies.get(STATE_COOKIE)?.value;
  if (!expected || searchParams.get("state") !== expected) return fail();

  let tokens: AuthTokens;
  try {
    tokens = await parseResponse<AuthTokens>(
      await fetch(`${env.apiBaseUrl}/auth/google/callback?code=${encodeURIComponent(code)}`, { cache: "no-store" }),
    );
  } catch {
    return fail();
  }

  const role = decodeJwt(tokens.accessToken).role as Role;
  const response = NextResponse.redirect(new URL(ROLE_HOME[role], request.url));
  writeAuthCookies(response.cookies, tokens);
  response.cookies.delete(STATE_COOKIE);
  return response;
}
