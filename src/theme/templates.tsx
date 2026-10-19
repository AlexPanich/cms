import { Blocks } from "@/components/site/blocks";
import { EditablePageTitle } from "@/components/site/editable";
import type { PageTemplateProps, ThemeModule } from "@/components/site/theme";
import { blockViews } from "./blocks/views";
import { Breadcrumbs } from "./breadcrumbs";
import { SectionMenu } from "./section-menu";

function PageBody({ page, crumbs, context }: PageTemplateProps) {
  // Страница, которая начинается с «Первого экрана», открывается его заголовком. h1 остаётся
  // для скринридеров и поисковиков, но не виден — иначе два крупных заголовка подряд.
  const heroFirst = page.blocks[0]?.type === "hero";
  return (
    <article className="min-w-0">
      {!page.isHome && <Breadcrumbs items={crumbs} current={page.title} />}
      {heroFirst ? (
        <h1 className="sr-only">{page.title}</h1>
      ) : (
        <EditablePageTitle pageId={page.id} value={page.title}>
          <h1 className="mb-6 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
            {page.title}
          </h1>
        </EditablePageTitle>
      )}
      <div className="space-y-12">
        <Blocks blocks={page.blocks} pageId={page.id} context={context} views={blockViews} />
      </div>
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
