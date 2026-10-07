import "server-only";

/** Server-only configuration. Nothing here is exposed to the browser. */
export const env = {
  apiBaseUrl: (process.env.API_BASE_URL ?? "https://assignment-6-tau-wine.vercel.app/api/v1").replace(/\/+$/, ""),
  jwtAccessSecret: process.env.JWT_ACCESS_SECRET ?? "",
  isProduction: process.env.NODE_ENV === "production",
};
