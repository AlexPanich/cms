import type { MetadataRoute } from "next";
import { connection } from "next/server";
import { env } from "@/env";

export default async function robots(): Promise<MetadataRoute.Robots> {
  await connection();
  const base = env().BETTER_AUTH_URL.replace(/\/$/, "");
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/login", "/api"] },
    sitemap: `${base}/sitemap.xml`,
  };
}
