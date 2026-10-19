import type { MetadataRoute } from "next";
import { connection } from "next/server";
import { siteUrl } from "@/server/site/url";

export default async function robots(): Promise<MetadataRoute.Robots> {
  await connection();
  const base = siteUrl();
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/login", "/api"] },
    sitemap: `${base}/sitemap.xml`,
  };
}
