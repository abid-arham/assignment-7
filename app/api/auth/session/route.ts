import { cookies } from "next/headers";
import { ACCESS_COOKIE, REFRESH_COOKIE, refreshTokens, verifyAccessToken, writeAuthCookies } from "@/lib/auth/session";

/**
 * Who is signed in, for the public navbar. Public pages stay statically rendered and ask this
 * endpoint from the browser instead of reading cookies on the server.
 */
export async function GET() {
  const store = await cookies();
  let claims = await verifyAccessToken(store.get(ACCESS_COOKIE)?.value);

  if (!claims && store.has(REFRESH_COOKIE)) {
    const tokens = await refreshTokens(store.get(REFRESH_COOKIE)?.value);
    if (tokens) {
      writeAuthCookies(store, tokens);
      claims = await verifyAccessToken(tokens.accessToken);
    }
  }

  return Response.json(
    { session: claims ? { role: claims.role, exp: claims.exp } : null },
    { headers: { "cache-control": "no-store" } },
  );
}
