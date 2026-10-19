import { connection } from "next/server";
import { db } from "@/db";
import { getSiteMenu } from "@/server/site/service";
import { getSiteInfo } from "../_lib/data";
import { SiteNav } from "./site-nav";

export async function SiteFooter() {
  await connection();
  const [site, menu] = await Promise.all([getSiteInfo(), getSiteMenu(db(), "footer")]);

  return (
    <div className="text-muted-foreground mx-auto flex w-full max-w-5xl flex-col gap-4 px-4 py-8 text-sm sm:flex-row sm:justify-between">
      {/* Текст простой: переводы строк сохраняются, HTML экранируется. */}
      <p className="whitespace-pre-line">{site.footer || site.name}</p>
      <SiteNav
        items={menu}
        label="Меню в подвале"
        className="flex flex-wrap gap-x-6 gap-y-2"
        linkClassName="hover:text-foreground transition-colors"
      />
    </div>
  );
}
