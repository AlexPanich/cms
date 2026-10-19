import type { Metadata } from "next";
import { Blocks } from "@/components/site/blocks";
import { requirePagePermission } from "@/server/auth/session";
import { CATALOG_CONTEXT, catalogEntries } from "@/server/site/catalog";
import { theme } from "@/theme";

// Живой каталог для дизайнера и для проверки темы: каждый блок и вариант оформления на примере
// данных, в стилях темы. Описание полей и ограничений — docs/BLOCKS.md.
export const metadata: Metadata = {
  title: "Каталог блоков",
  robots: { index: false, follow: false },
};

export const instant = false;

export default async function BlockCatalogPage() {
  await requirePagePermission("view_admin", "/_blocks");
  const entries = catalogEntries();

  return (
    <div className="flex flex-col gap-20">
      <header className="flex flex-col gap-4">
        <h1 className="text-3xl font-semibold tracking-tight">Каталог блоков</h1>
        <p className="text-muted-foreground max-w-2xl">
          Каждый блок темы на примере данных: в оформлении по умолчанию, в каждом варианте и только
          с обязательными полями. Картинки, документы и статьи — заглушки. Поля и ограничения блоков
          — в docs/BLOCKS.md.
        </p>
        <nav aria-label="Блоки каталога">
          <ul className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
            {entries.map((entry) => (
              <li key={entry.type}>
                <a href={`#${entry.type}`} className="underline underline-offset-4">
                  {entry.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </header>

      {entries.map((entry) => (
        <section
          key={entry.type}
          id={entry.type}
          aria-labelledby={`${entry.type}-title`}
          className="flex scroll-mt-8 flex-col gap-10"
        >
          <div className="flex flex-col gap-1 border-b pb-4">
            <h2 id={`${entry.type}-title`} className="text-xl font-semibold">
              {entry.label} <code className="text-muted-foreground text-sm">{entry.type}</code>
            </h2>
            <p className="text-muted-foreground">{entry.description}</p>
          </div>
          {entry.examples.map((example) => (
            <div key={example.block.id} className="flex flex-col gap-4">
              <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                {example.label}
                {example.variant && <code className="ml-2 normal-case">{example.variant.key}</code>}
              </p>
              <Blocks
                blocks={[example.block]}
                pageId={0}
                context={CATALOG_CONTEXT}
                views={theme.blocks}
              />
            </div>
          ))}
        </section>
      ))}
    </div>
  );
}
