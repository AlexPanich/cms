import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { getPageForPath, getSiteInfo, pathFromSegments } from "../_lib/data";
import { PageTemplateView } from "../_templates/templates";

type Props = PageProps<"/[[...slug]]">;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  await connection();
  const path = pathFromSegments((await params).slug);
  const [site, page] = await Promise.all([
    getSiteInfo(),
    path === null ? null : getPageForPath(path),
  ]);
  if (!page) return { title: site.name };
  return {
    title: page.isHome ? site.name : `${page.title} — ${site.name}`,
    description: page.metaDescription ?? (site.description || undefined),
  };
}

// Страница отрисовывается в потоке, поэтому для отсутствующей страницы статус ответа — 200,
// но Next добавляет в разметку <meta name="robots" content="noindex">.
export default function SitePage({ params }: Props) {
  return (
    <Suspense fallback={<PageFallback />}>
      <PageView params={params} />
    </Suspense>
  );
}

async function PageView({ params }: Pick<Props, "params">) {
  await connection();
  const path = pathFromSegments((await params).slug);
  if (path === null) notFound();
  const page = await getPageForPath(path);

  if (!page) {
    if (path === "") return <EmptySite />;
    notFound();
  }
  // У главной один адрес — «/».
  if (page.isHome && path !== "") permanentRedirect("/");

  return <PageTemplateView page={page} />;
}

function PageFallback() {
  return <div className="bg-muted h-10 w-2/3 animate-pulse rounded-md" />;
}

// Свежая установка: главная страница ещё не назначена.
function EmptySite() {
  return (
    <div className="flex flex-col gap-3 py-16 text-center">
      <h1 className="text-2xl font-semibold">Сайт ещё не наполнен</h1>
      <p className="text-muted-foreground">
        Создайте страницу и отметьте её главной в{" "}
        <Link href="/admin/pages" className="underline underline-offset-4">
          админке
        </Link>
        .
      </p>
    </div>
  );
}
