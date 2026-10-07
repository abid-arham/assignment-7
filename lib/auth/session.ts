import "server-only";

import { decodeJwt, errors as joseErrors, jwtVerify } from "jose";
import { env } from "@/lib/env";
import { ROLES, type AuthTokens, type Role } from "@/lib/api/types";

export const ACCESS_COOKIE = "ums_at";
export const REFRESH_COOKIE = "ums_rt";

const REFRESH_MAX_AGE = 7 * 24 * 60 * 60; // matches the API's 7-day refresh token

export interface SessionClaims {
  userId: string;
  role: Role;
  /** Access-token expiry, seconds since epoch. */
  exp: number;
}

let warnedMissingSecret = false;
const secretKey = () => new TextEncoder().encode(env.jwtAccessSecret);

/**
 * Verifies the API's HS256 access token with the shared secret. Returns null for missing, forged or
 * expired tokens — the API re-checks every request anyway, this decides routing and UI.
 */
export async function verifyAccessToken(token: string | undefined): Promise<SessionClaims | null> {
  if (!token) return null;
  if (!env.jwtAccessSecret) {
    if (!warnedMissingSecret) {
      console.error("JWT_ACCESS_SECRET is not set — every session will be treated as signed out.");
      warnedMissingSecret = true;
    }
    return null;
  }
  try {
    const { payload } = await jwtVerify(token, secretKey(), { algorithms: ["HS256"] });
    const role = payload.role;
    if (typeof payload.id !== "string" || !ROLES.includes(role as Role) || typeof payload.exp !== "number") {
      return null;
    }
    return { userId: payload.id, role: role as Role, exp: payload.exp };
  } catch (error) {
    if (!(error instanceof joseErrors.JOSEError)) throw error;
    return null;
  }
}

/** Seconds until the access token expires (negative once expired). */
export const secondsLeft = (claims: SessionClaims) => claims.exp - Math.floor(Date.now() / 1000);

interface CookieWriter {
  set(name: string, value: string, options: Record<string, unknown>): unknown;
  delete(name: string): unknown;
}

const baseCookie = () => ({
  httpOnly: true,
  secure: env.isProduction,
  sameSite: "lax" as const,
  path: "/",
});

/** Stores both tokens as httpOnly cookies; the access cookie disappears exactly when the JWT expires. */
export function writeAuthCookies(cookies: CookieWriter, tokens: AuthTokens) {
  const { exp } = decodeJwt(tokens.accessToken);
  const accessMaxAge = typeof exp === "number" ? Math.max(exp - Math.floor(Date.now() / 1000), 0) : 15 * 60;
  cookies.set(ACCESS_COOKIE, tokens.accessToken, { ...baseCookie(), maxAge: accessMaxAge });
  cookies.set(REFRESH_COOKIE, tokens.refreshToken, { ...baseCookie(), maxAge: REFRESH_MAX_AGE });
}

export function clearAuthCookies(cookies: CookieWriter) {
  cookies.delete(ACCESS_COOKIE);
  cookies.delete(REFRESH_COOKIE);
}

/** Exchanges a refresh token for a new pair. The API rotates (revokes) the old refresh token. */
export async function refreshTokens(refreshToken: string | undefined): Promise<AuthTokens | null> {
  if (!refreshToken) return null;
  try {
    const res = await fetch(`${env.apiBaseUrl}/auth/refresh-token`, {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify({ refreshToken }),
      cache: "no-store",
    });
    if (!res.ok) return null;
    const body = (await res.json()) as { data?: AuthTokens };
    return body.data?.accessToken && body.data.refreshToken ? body.data : null;
  } catch {
    return null;
  }
}
