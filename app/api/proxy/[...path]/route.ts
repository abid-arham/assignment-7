import { cookies } from "next/headers";
import type { NextRequest } from "next/server";
import { env } from "@/lib/env";
import { ACCESS_COOKIE } from "@/lib/auth/session";

/**
 * Backend-for-frontend: the browser calls /api/proxy/<api path> on our own origin and this handler
 * forwards it to the UMS API with the access token from the httpOnly cookie. Tokens never reach
 * client JavaScript and the API needs no CORS setup for the browser.
 */
async function forward(request: NextRequest, ctx: RouteContext<"/api/proxy/[...path]">) {
  const { path } = await ctx.params;

  // Token endpoints are handled by server actions / /api/auth/*; never expose raw tokens to the browser.
  if (path[0] === "auth") {
    return Response.json({ success: false, message: "Not found", errors: [] }, { status: 404 });
  }

  const target = `${env.apiBaseUrl}/${path.map(encodeURIComponent).join("/")}${request.nextUrl.search}`;
  const token = (await cookies()).get(ACCESS_COOKIE)?.value;

  const headers = new Headers({ accept: "application/json" });
  const contentType = request.headers.get("content-type");
  if (contentType) headers.set("content-type", contentType);
  if (token) headers.set("authorization", `Bearer ${token}`);

  const hasBody = request.method !== "GET" && request.method !== "HEAD";
  try {
    const upstream = await fetch(target, {
      method: request.method,
      headers,
      // Stream the body through untouched (JSON or multipart avatar uploads).
      body: hasBody ? request.body : undefined,
      // Required by Node's fetch when the body is a stream.
      ...(hasBody ? { duplex: "half" } : {}),
      cache: "no-store",
    } as RequestInit);

    return new Response(upstream.body, {
      status: upstream.status,
      headers: {
        "content-type": upstream.headers.get("content-type") ?? "application/json",
        "cache-control": "no-store",
      },
    });
  } catch {
    return Response.json(
      { success: false, message: "The university API is unreachable right now. Please try again shortly.", errors: [] },
      { status: 502 },
    );
  }
}

export { forward as GET, forward as POST, forward as PATCH, forward as DELETE };
