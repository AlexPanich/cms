import { EditableSettings, EditableText } from "@/components/site/editable";
import type { ContentContext } from "@/components/site/rich-text";
import type { SiteInfo } from "@/components/site/theme";
import type { SiteMenuItem } from "@/server/site/service";
import { CONTACT_SETTINGS, Contacts } from "./contacts";
import { SiteNav } from "./site-nav";

export function SiteFooter({
  site,
  menu,
  context,
}: {
  site: SiteInfo;
  menu: SiteMenuItem[];
  context: ContentContext;
}) {
  return (
    <div className="text-muted-foreground mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-8 text-sm sm:flex-row sm:justify-between">
      <div className="flex flex-col gap-4">
        {/* Текст простой: переводы строк сохраняются, HTML экранируется. */}
        <EditableText textKey="footer" value={site.footer} multiline>
          <p className="whitespace-pre-line">{site.footer || site.name}</p>
        </EditableText>
        <EditableSettings fields={CONTACT_SETTINGS} label="контакты">
          <Contacts settings={context.settings} />
        </EditableSettings>
      </div>
      <SiteNav
        items={menu}
        label="Меню в подвале"
        className="flex flex-wrap gap-x-6 gap-y-2"
        linkClassName="hover:text-foreground transition-colors"
      />
    </div>
  );
}
