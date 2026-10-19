import "server-only";
import { env } from "@/env";

// Публичный адрес сайта без слэша в конце — для canonical, sitemap и JSON-LD.
export function siteUrl(): string {
  return env().BETTER_AUTH_URL.replace(/\/$/, "");
}

export function absoluteUrl(path: string): string {
  return `${siteUrl()}${path}`;
}
