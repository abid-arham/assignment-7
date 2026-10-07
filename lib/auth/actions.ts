"use server";

import { decodeJwt } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { env } from "@/lib/env";
import { buildInit, parseResponse } from "@/lib/api/core";
import { getErrorMessage, getFieldErrors } from "@/lib/api/errors";
import { ROLES, type AuthTokens, type Role } from "@/lib/api/types";
import { DEMO_ACCOUNTS } from "@/lib/auth/demo-accounts";
import { safeRedirect } from "@/lib/auth/roles";
import { REFRESH_COOKIE, clearAuthCookies, writeAuthCookies } from "@/lib/auth/session";
import { loginSchema, registerSchema, type LoginInput, type RegisterInput } from "@/lib/validations/auth";

/** Returned only on failure — success ends in a redirect. */
export interface AuthActionError {
  message: string;
  fieldErrors?: Record<string, string>;
}

async function requestTokens(path: "/auth/login" | "/auth/register", body: unknown) {
  const res = await fetch(`${env.apiBaseUrl}${path}`, buildInit({ method: "POST", body, cache: "no-store" }));
  return parseResponse<AuthTokens>(res);
}

/** Stores the session and returns where this role should land. */
async function startSession(tokens: AuthTokens, next?: string | null) {
  writeAuthCookies(await cookies(), tokens);
  const role = decodeJwt(tokens.accessToken).role as Role;
  return safeRedirect(next, role);
}

function toActionError(error: unknown): AuthActionError {
  return { message: getErrorMessage(error), fieldErrors: getFieldErrors(error) };
}

export async function loginAction(input: LoginInput, next?: string | null): Promise<AuthActionError> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) return { message: "Check the highlighted fields and try again." };

  let destination: string;
  try {
    destination = await startSession(await requestTokens("/auth/login", parsed.data), next);
  } catch (error) {
    return toActionError(error);
  }
  redirect(destination);
}

export async function demoLoginAction(role: Role): Promise<AuthActionError> {
  if (!ROLES.includes(role)) return { message: "Unknown demo role." };

  let destination: string;
  try {
    destination = await startSession(await requestTokens("/auth/login", DEMO_ACCOUNTS[role]));
  } catch (error) {
    return toActionError(error);
  }
  redirect(destination);
}

export async function registerAction(input: RegisterInput): Promise<AuthActionError> {
  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) return { message: "Check the highlighted fields and try again." };

  const { name, email, password } = parsed.data;
  let destination: string;
  try {
    destination = await startSession(await requestTokens("/auth/register", { name, email, password }));
  } catch (error) {
    return toActionError(error);
  }
  redirect(destination);
}

export async function logoutAction() {
  const store = await cookies();
  const refreshToken = store.get(REFRESH_COOKIE)?.value;
  if (refreshToken) {
    // Revoke server-side so the refresh token can't be replayed; sign out locally even if this fails.
    await fetch(`${env.apiBaseUrl}/auth/logout`, buildInit({ method: "POST", body: { refreshToken }, cache: "no-store" })).catch(
      () => undefined,
    );
  }
  clearAuthCookies(store);
  redirect("/login");
}
