/**
 * Public origin of this site, used for metadata, Open Graph and the sitemap. Accepts the value with or
 * without a protocol or trailing slash, and falls back to Vercel's production domain, then localhost.
 */
function resolveSiteUrl(): string {
  const raw =
    process.env.FRONT_END_URL?.trim() || process.env.VERCEL_PROJECT_PRODUCTION_URL || "http://localhost:3000";
  const withProtocol = /^https?:\/\//.test(raw) ? raw : `https://${raw}`;
  return withProtocol.replace(/\/+$/, "");
}

export const siteConfig = {
  name: "Quad",
  fullName: "Quad University Management System",
  tagline: "Registration, grading and tuition in one place",
  description:
    "Quad runs a university's academic year end to end: course registration with prerequisite checks, instructor grading, GPA transcripts and online tuition payments.",
  url: resolveSiteUrl(),
  contactEmail: process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "registrar@ums.demo",
} as const;
