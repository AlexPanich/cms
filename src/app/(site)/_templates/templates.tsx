import type { ComponentType } from "react";
import { RichText } from "@/components/site/rich-text";
import type { PageTemplate } from "@/lib/templates";
import { isPageTemplate } from "@/lib/templates";
import { loadContentContext } from "@/server/site/content";
import { cachedAncestors, cachedSectionMenu } from "@/server/site/cached";
import { pageHref, type PublishedPage } from "@/server/site/service";
import { JsonLd } from "@/components/site/json-ld";
import { absoluteUrl } from "@/server/site/url";
import { Breadcrumbs, BreadcrumbsJsonLd } from "../_components/breadcrumbs";
import { EditablePageContent, EditablePageTitle } from "../_components/editable";
import { getSiteInfo } from "../_lib/data";
import { SectionMenu } from "../_components/section-menu";

type TemplateProps = { page: PublishedPage };

async function PageBody({ page }: TemplateProps) {
  const [ancestors, context, site] = await Promise.all([
    page.isHome ? [] : cachedAncestors(page.path),
    loadContentContext(page.content),
    getSiteInfo(),
  ]);
  return (
    <article className="min-w-0">
      {page.isHome ? (
        // Сайт целиком: название и поиск по сайту прямо из выдачи.
        <JsonLd
          data={{
            "@type": "WebSite",
            name: site.name,
            url: absoluteUrl("/"),
            potentialAction: {
              "@type": "SearchAction",
              target: `${absoluteUrl("/search")}?q={search_term_string}`,
              "query-input": "required name=search_term_string",
            },
          }}
        />
      ) : (
        <>
          <BreadcrumbsJsonLd
            items={ancestors}
            current={{ href: pageHref(page), title: page.title }}
          />
          <Breadcrumbs items={ancestors} current={page.title} />
        </>
      )}
      <EditablePageTitle pageId={page.id} value={page.title}>
        <h1 className="mb-6 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
          {page.title}
        </h1>
      </EditablePageTitle>
      <EditablePageContent pageId={page.id} value={page.content}>
        <RichText doc={page.content} context={context} />
      </EditablePageContent>
    </article>
  );
}

// Текст и меню раздела сбоку (если у ветки есть подстраницы).
async function DefaultTemplate({ page }: TemplateProps) {
  const section = page.isHome ? null : await cachedSectionMenu(page.path);
  if (!section) return <WideTemplate page={page} />;
  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_14rem]">
      <PageBody page={page} />
      <aside className="lg:pt-12">
        <SectionMenu root={section.root} items={section.items} currentHref={pageHref(page)} />
      </aside>
    </div>
  );
}

function WideTemplate({ page }: TemplateProps) {
  return <PageBody page={page} />;
}

// Реестр лейаутов: ключи — из src/lib/templates.ts, TypeScript требует лейаут для каждого.
const TEMPLATES: Record<PageTemplate, ComponentType<TemplateProps>> = {
  default: DefaultTemplate,
  wide: WideTemplate,
};

// Шаблон из БД мог пропасть из реестра — тогда стандартный.
export function PageTemplateView({ page }: TemplateProps) {
  const Template = TEMPLATES[isPageTemplate(page.template) ? page.template : "default"];
  return <Template page={page} />;
}
