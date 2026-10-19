import { EditablePageContent, EditablePageTitle } from "@/components/site/editable";
import { RichText } from "@/components/site/rich-text";
import type { PageTemplateProps, ThemeModule } from "@/components/site/theme";
import { Breadcrumbs } from "./breadcrumbs";
import { PROSE, WIDGETS } from "./rich-text";
import { SectionMenu } from "./section-menu";

function PageBody({ page, crumbs, context }: PageTemplateProps) {
  return (
    <article className="min-w-0">
      {!page.isHome && <Breadcrumbs items={crumbs} current={page.title} />}
      <EditablePageTitle pageId={page.id} value={page.title}>
        <h1 className="mb-6 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
          {page.title}
        </h1>
      </EditablePageTitle>
      <EditablePageContent pageId={page.id} value={page.content}>
        <RichText doc={page.content} context={context} widgets={WIDGETS} className={PROSE} />
      </EditablePageContent>
    </article>
  );
}

// Текст и меню раздела сбоку (если у ветки есть подстраницы).
function DefaultTemplate(props: PageTemplateProps) {
  const { section, href } = props;
  if (!section) return <PageBody {...props} />;
  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_14rem]">
      <PageBody {...props} />
      <aside className="lg:pt-12">
        <SectionMenu root={section.root} items={section.items} currentHref={href} />
      </aside>
    </div>
  );
}

function WideTemplate(props: PageTemplateProps) {
  return <PageBody {...props} />;
}

export const templates: ThemeModule["templates"] = {
  default: DefaultTemplate,
  wide: WideTemplate,
};
