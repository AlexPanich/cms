import type { MetadataRoute } from "next";
import { connection } from "next/server";
import { BLOCK_CATALOG_PATH } from "@/lib/site-routes";
import { siteUrl } from "@/server/site/url";

export default async function robots(): Promise<MetadataRoute.Robots> {
  await connection();
  const base = siteUrl();
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/login", "/api", BLOCK_CATALOG_PATH],
    },
    sitemap: `${base}/sitemap.xml`,
  };
}
