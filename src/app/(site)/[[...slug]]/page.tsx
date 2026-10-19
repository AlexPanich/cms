import type { Metadata } from "next";
import { permanentRedirect } from "next/navigation";
import { connection } from "next/server";
import { BreadcrumbsJsonLd } from "@/components/site/breadcrumbs-json-ld";
import { JsonLd } from "@/components/site/json-ld";
import { resolvePageTemplate } from "@/lib/templates";
import { richTextExcerpt } from "@/lib/rich-text";
import { cachedAncestors, cachedSectionMenu } from "@/server/site/cached";
import { loadContentContext } from "@/server/site/content";
import { pageHref, type PublishedPage } from "@/server/site/service";
import { absoluteUrl } from "@/server/site/url";
import { theme } from "@/theme";
import { getPageForPath, getSiteInfo, pathFromSegments } from "../_lib/data";
import { siteMetadata } from "../_lib/metadata";

type Props = PageProps<"/[[...slug]]">;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  await connection();
  const path = pathFromSegments((await params).slug);
  const page = path === null ? null : await getPageForPath(path);
  if (path === "" && !page) return siteMetadata({ path: "/" });
  if (!page) return siteMetadata({ title: "Страница не найдена", noindex: true });
  return siteMetadata({
    title: page.isHome ? undefined : page.title,
    description: page.metaDescription ?? richTextExcerpt(page.content),
    path: pageHref(page),
  });
}

export const instant = false;

// Статус ответа ставит proxy (404 или 308) до рендера. Страница «не найдена» рисуется здесь же,
// а не через notFound(): так остаются её метаданные (заголовок и noindex). Сюда же попадает
// навигация на клиенте, которую proxy не проверяет.
export default async function SitePage({ params }: Props) {
  await connection();
  const path = pathFromSegments((await params).slug);
  const page = path === null ? null : await getPageForPath(path);

  if (!page) return path === "" ? <theme.EmptySite /> : <theme.NotFound />;
  // У главной один адрес — «/».
  if (page.isHome && path !== "") permanentRedirect("/");

  return <PageView page={page} />;
}

async function PageView({ page }: { page: PublishedPage }) {
  const href = pageHref(page);
  const [crumbs, section, context, site] = await Promise.all([
    page.isHome ? [] : cachedAncestors(page.path),
    page.isHome ? null : cachedSectionMenu(page.path),
    loadContentContext(page.content),
    getSiteInfo(),
  ]);
  const Template = theme.templates[resolvePageTemplate(page.template)];

  return (
    <>
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
        <BreadcrumbsJsonLd items={crumbs} current={{ href, title: page.title }} />
      )}
      <Template page={page} href={href} crumbs={crumbs} section={section} context={context} />
    </>
  );
}
