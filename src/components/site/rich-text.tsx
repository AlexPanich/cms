import { type ComponentType, Fragment, type ReactNode } from "react";
import { galleryKeyOf, type RichTextDoc, type RichTextNode } from "@/lib/rich-text";
import type { SiteSettings } from "@/lib/site-settings";
import { isSafeLinkUrl } from "@/lib/url";
import type {
  PageLink,
  PublicDocument,
  PublicGallery,
  PublicImage,
  PublishedArticleCard,
} from "@/server/site/service";

// Данные виджетов, ссылок на страницы и полей блоков, загруженные заранее
// (src/server/site/content.ts).
export type ContentContext = {
  galleries: ReadonlyMap<string, PublicGallery>;
  links: ReadonlyMap<number, PageLink>;
  images: ReadonlyMap<number, PublicImage>;
  documents: ReadonlyMap<number, PublicDocument>;
  // Свежие статьи для блока «Последние статьи», сколько попросил самый длинный такой блок.
  articles: readonly PublishedArticleCard[];
  // Настройки сайта (src/lib/site-settings.ts); картинки и ссылки из них — в images и links.
  settings: SiteSettings;
};

// Как выглядят виджеты, решает тема.
export type RichTextWidgets = { gallery: ComponentType<{ gallery: PublicGallery }> };

type RenderContext = ContentContext & { widgets: RichTextWidgets };

type Render = (node: RichTextNode, children: ReactNode, context: RenderContext) => ReactNode;

const num = (value: unknown, fallback: number) =>
  typeof value === "number" && Number.isInteger(value) ? value : fallback;

// Явный реестр узлов: документ — это данные, и вывести можно только то, что здесь перечислено.
// Неизвестный узел пропускается вместе с содержимым. HTML из документа не выводится никогда.
const NODES: Record<string, Render> = {
  paragraph: (_, children) => <p>{children}</p>,
  heading: (node, children) => {
    // h1 — заголовок страницы, поэтому уровни в тексте начинаются со второго.
    const level = Math.min(Math.max(num(node.attrs?.level, 2), 2), 4);
    const Tag = `h${level}` as "h2" | "h3" | "h4";
    return <Tag>{children}</Tag>;
  },
  bulletList: (_, children) => <ul>{children}</ul>,
  orderedList: (node, children) => <ol start={num(node.attrs?.start, 1)}>{children}</ol>,
  listItem: (_, children) => <li>{children}</li>,
  blockquote: (_, children) => <blockquote>{children}</blockquote>,
  codeBlock: (_, children) => (
    <pre>
      <code>{children}</code>
    </pre>
  ),
  horizontalRule: () => <hr />,
  hardBreak: () => <br />,
  text: (node) => renderMarks(node.text ?? "", node.marks ?? []),
  // Виджеты.
  gallery: (node, _, context) => {
    const key = galleryKeyOf(node);
    const gallery = key ? context.galleries.get(key) : undefined;
    return gallery ? <context.widgets.gallery gallery={gallery} /> : null;
  },
};

function renderMarks(text: string, marks: NonNullable<RichTextNode["marks"]>): ReactNode {
  return marks.reduce<ReactNode>((content, mark) => {
    switch (mark.type) {
      case "bold":
        return <strong>{content}</strong>;
      case "italic":
        return <em>{content}</em>;
      case "strike":
        return <s>{content}</s>;
      case "underline":
        return <u>{content}</u>;
      case "code":
        return <code>{content}</code>;
      case "link": {
        // Редактор проверяет адрес при вводе, но документ мог прийти и в обход редактора.
        const href = mark.attrs?.href;
        return typeof href === "string" && isSafeLinkUrl(href) ? (
          <a href={href}>{content}</a>
        ) : (
          content
        );
      }
      default:
        return content;
    }
  }, text);
}

function renderNodes(nodes: RichTextNode[] | undefined, context: RenderContext): ReactNode {
  return nodes?.map((node, index) => {
    const render = NODES[node.type];
    if (!render) return null;
    return (
      <Fragment key={index}>{render(node, renderNodes(node.content, context), context)}</Fragment>
    );
  });
}

// Оформление текста (className) и виджетов задаёт тема, разметку узлов — ядро.
export function RichText({
  doc,
  context,
  widgets,
  className,
}: {
  doc: RichTextDoc | null;
  context: ContentContext;
  widgets: RichTextWidgets;
  className?: string;
}) {
  if (!doc?.content?.length) return null;
  return <div className={className}>{renderNodes(doc.content, { ...context, widgets })}</div>;
}
