import type { MetadataRoute } from "next";
import { connection } from "next/server";
import { db } from "@/db";
import { env } from "@/env";
import { getSitemapEntries } from "@/server/site/service";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  await connection();
  const base = env().BETTER_AUTH_URL.replace(/\/$/, "");
  const entries = await getSitemapEntries(db());
  return [
    ...entries.map((entry) => ({ url: `${base}${entry.path}`, lastModified: entry.updatedAt })),
    { url: `${base}/articles` },
  ];
}
