import type { MetadataRoute } from "next";
import { connection } from "next/server";
import { siteUrl } from "@/server/site/url";
import { db } from "@/db";
import { getSitemapEntries } from "@/server/site/service";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  await connection();
  const base = siteUrl();
  const entries = await getSitemapEntries(db());
  return [
    ...entries.map((entry) => ({ url: `${base}${entry.path}`, lastModified: entry.updatedAt })),
    { url: `${base}/articles` },
  ];
}
