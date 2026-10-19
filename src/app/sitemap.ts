import type { MetadataRoute } from "next";
import { connection } from "next/server";
import { siteUrl } from "@/server/site/url";
import { cachedSitemapEntries } from "@/server/site/cached";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  await connection();
  const base = siteUrl();
  const entries = await cachedSitemapEntries();
  return [
    ...entries.map((entry) => ({ url: `${base}${entry.path}`, lastModified: entry.updatedAt })),
    { url: `${base}/articles` },
  ];
}
