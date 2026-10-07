import { cookies } from "next/headers";
import { decodeJwt } from "jose";
import { REFRESH_COOKIE, clearAuthCookies, refreshTokens, writeAuthCookies } from "@/lib/auth/session";

/** Rotates the token pair for the browser (called single-flight by lib/api/client.ts and SessionKeeper). */
export async function POST() {
  const store = await cookies();
  const tokens = await refreshTokens(store.get(REFRESH_COOKIE)?.value);

  if (!tokens) {
    clearAuthCookies(store);
    return Response.json({ success: false, message: "Session expired" }, { status: 401 });
  }

  writeAuthCookies(store, tokens);
  return Response.json({ success: true, exp: decodeJwt(tokens.accessToken).exp });
}
