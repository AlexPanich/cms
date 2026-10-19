import type { Metadata } from "next";
import Link from "next/link";
import { permanentRedirect } from "next/navigation";
import { connection } from "next/server";
import { richTextExcerpt } from "@/lib/rich-text";
import { pageHref } from "@/server/site/service";
import { NotFoundView } from "../_components/not-found-view";
import { getPageForPath, pathFromSegments } from "../_lib/data";
import { siteMetadata } from "../_lib/metadata";
import { PageTemplateView } from "../_templates/templates";

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

  if (!page) return path === "" ? <EmptySite /> : <NotFoundView />;
  // У главной один адрес — «/».
  if (page.isHome && path !== "") permanentRedirect("/");

  return <PageTemplateView page={page} />;
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
