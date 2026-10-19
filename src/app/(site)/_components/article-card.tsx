import Image from "next/image";
import Link from "next/link";

export const articleDate = new Intl.DateTimeFormat("ru-RU", { dateStyle: "long" });

export function ArticleCard({
  article,
}: {
  article: {
    slug: string;
    title: string;
    excerpt: string | null;
    publishedAt: Date | null;
    previewUrl: string | null;
    previewAlt: string | null;
  };
}) {
  return (
    <article className="group relative flex flex-col gap-4 sm:flex-row">
      {article.previewUrl && (
        <div className="bg-muted relative aspect-[4/3] w-full shrink-0 overflow-hidden rounded-lg sm:w-56">
          <Image
            src={article.previewUrl}
            alt={article.previewAlt ?? ""}
            fill
            sizes="(min-width: 640px) 14rem, 100vw"
            className="object-cover"
          />
        </div>
      )}
      <div className="flex flex-col gap-2">
        {article.publishedAt && (
          <time
            dateTime={article.publishedAt.toISOString()}
            className="text-muted-foreground text-sm"
          >
            {articleDate.format(article.publishedAt)}
          </time>
        )}
        <h2 className="text-xl font-semibold tracking-tight">
          {/* Ссылка растянута на всю карточку. */}
          <Link href={`/articles/${article.slug}`} className="after:absolute after:inset-0">
            <span className="group-hover:underline">{article.title}</span>
          </Link>
        </h2>
        {article.excerpt && <p className="text-muted-foreground">{article.excerpt}</p>}
      </div>
    </article>
  );
}
