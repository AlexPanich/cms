import { EditableText } from "@/components/site/editable";
import type { SiteInfo } from "@/components/site/theme";
import type { SiteMenuItem } from "@/server/site/service";
import { SiteNav } from "./site-nav";

export function SiteFooter({ site, menu }: { site: SiteInfo; menu: SiteMenuItem[] }) {
  return (
    <div className="text-muted-foreground mx-auto flex w-full max-w-5xl flex-col gap-4 px-4 py-8 text-sm sm:flex-row sm:justify-between">
      {/* Текст простой: переводы строк сохраняются, HTML экранируется. */}
      <EditableText textKey="footer" value={site.footer} multiline>
        <p className="whitespace-pre-line">{site.footer || site.name}</p>
      </EditableText>
      <SiteNav
        items={menu}
        label="Меню в подвале"
        className="flex flex-wrap gap-x-6 gap-y-2"
        linkClassName="hover:text-foreground transition-colors"
      />
    </div>
  );
}
