import type { MetadataRoute } from "next";
import { publicApi } from "@/lib/api/server";
import { siteConfig } from "@/lib/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const pages = ["", "/courses", "/tuition", "/about", "/contact", "/login", "/register"].map((path) => ({
    url: `${siteConfig.url}${path}`,
    changeFrequency: "weekly" as const,
  }));
  // Course pages come from the live catalogue; skip them if the API is unreachable at build time.
  const courses = await publicApi.courses({ limit: 100 }).catch(() => null);
  return [
    ...pages,
    ...(courses?.items ?? []).map((c) => ({ url: `${siteConfig.url}/courses/${c.id}`, lastModified: c.updatedAt })),
  ];
}
