import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import {
  type BlockViews,
  resolveDocument,
  resolveImage,
  resolveLink,
} from "@/components/site/blocks";
import { EditableBlock, EditableSettings } from "@/components/site/editable";
import type { ContentContext } from "@/components/site/rich-text";
import { RichText } from "@/components/site/rich-text";
import type { ImageValue, LinkValue } from "@/lib/blocks/define";
import { formatFileSize } from "@/lib/format";
import { phoneHref, socialNetworkLabel } from "@/lib/site-settings";
import { PROSE, WIDGETS } from "../pages";

// Разметка нарочно не такая, как у темы по умолчанию: свои заголовки, без карточек и сеток
// там, где они у неё есть. Значение — проверить, что ядру всё равно, как рисует тема.

function Heading({ children }: { children: ReactNode }) {
  return <h2 className="text-primary mb-6 text-3xl font-bold">{children}</h2>;
}

function Button({ link, context }: { link: LinkValue | null; context: ContentContext }) {
  const resolved = resolveLink(link, context);
  if (!resolved) return null;
  return (
    <Link
      href={resolved.href}
      className="border-primary text-primary hover:bg-primary hover:text-primary-foreground inline-block border-2 px-6 py-3 font-bold uppercase"
    >
      {resolved.label}
    </Link>
  );
}

function Picture({
  image,
  context,
  className,
}: {
  image: ImageValue | null;
  context: ContentContext;
  className: string;
}) {
  const resolved = resolveImage(image, context);
  if (!resolved) return null;
  return (
    <div className={`relative overflow-hidden ${className}`}>
      <Image src={resolved.url} alt={resolved.alt} fill sizes="100vw" className="object-cover" />
    </div>
  );
}

export const blockViews: BlockViews = {
  text: ({ block, pageId, context }) => (
    <EditableBlock pageId={pageId} block={block}>
      <RichText doc={block.data.content} context={context} widgets={WIDGETS} className={PROSE} />
    </EditableBlock>
  ),

  hero: ({ block, pageId, context }) => (
    <EditableBlock pageId={pageId} block={block}>
      <section
        className={`flex flex-col gap-6 ${block.variant === "centered" ? "items-center text-center" : "items-start"}`}
      >
        <Picture image={block.data.image} context={context} className="aspect-video w-full" />
        <h2 className="text-6xl font-bold">{block.data.title}</h2>
        {block.data.subtitle && (
          <p className="text-muted-foreground text-xl whitespace-pre-line">{block.data.subtitle}</p>
        )}
        <Button link={block.data.button} context={context} />
      </section>
    </EditableBlock>
  ),

  features: ({ block, pageId, context }) => (
    <EditableBlock pageId={pageId} block={block}>
      <section>
        {block.data.title && <Heading>{block.data.title}</Heading>}
        {block.data.intro && <p className="mb-6">{block.data.intro}</p>}
        <ol className="flex flex-col gap-6">
          {block.data.items.map((item, index) => {
            const link = resolveLink(item.link, context);
            return (
              <li key={index} className="border-primary border-l-4 pl-5">
                <h3 className="text-xl font-bold">{item.title}</h3>
                {item.text && <p className="text-muted-foreground">{item.text}</p>}
                {link && (
                  <Link href={link.href} className="text-primary">
                    {link.label}
                  </Link>
                )}
              </li>
            );
          })}
        </ol>
      </section>
    </EditableBlock>
  ),

  "media-text": ({ block, pageId, context }) => (
    <EditableBlock pageId={pageId} block={block}>
      <section className="flex flex-col gap-6">
        {block.data.title && <Heading>{block.data.title}</Heading>}
        <Picture
          image={block.data.image}
          context={context}
          className="aspect-[4/3] w-full max-w-xl"
        />
        <RichText doc={block.data.content} context={context} widgets={WIDGETS} className={PROSE} />
        <Button link={block.data.button} context={context} />
      </section>
    </EditableBlock>
  ),

  gallery: ({ block, pageId, context }) => {
    const gallery = block.data.gallery ? context.galleries.get(block.data.gallery) : undefined;
    if (!gallery) return null;
    const Gallery = WIDGETS.gallery;
    return (
      <EditableBlock pageId={pageId} block={block}>
        <section>
          {block.data.title && <Heading>{block.data.title}</Heading>}
          <Gallery gallery={gallery} />
        </section>
      </EditableBlock>
    );
  },

  cta: ({ block, pageId, context }) => (
    <EditableBlock pageId={pageId} block={block}>
      <section className="border-primary border-y-2 py-10 text-center">
        <h2 className="mb-3 text-4xl font-bold">{block.data.title}</h2>
        {block.data.text && <p className="mb-6">{block.data.text}</p>}
        <Button link={block.data.button} context={context} />
      </section>
    </EditableBlock>
  ),

  faq: ({ block, pageId, context }) => (
    <EditableBlock pageId={pageId} block={block}>
      <section>
        {block.data.title && <Heading>{block.data.title}</Heading>}
        <dl className="flex flex-col gap-6">
          {block.data.items.map((item, index) => (
            <div key={index}>
              <dt className="text-lg font-bold">{item.question}</dt>
              <dd>
                <RichText doc={item.answer} context={context} widgets={WIDGETS} className={PROSE} />
              </dd>
            </div>
          ))}
        </dl>
      </section>
    </EditableBlock>
  ),

  articles: ({ block, pageId, context }) => {
    const articles = context.articles.slice(0, Number(block.data.count));
    if (articles.length === 0) return null;
    return (
      <EditableBlock pageId={pageId} block={block}>
        <section>
          <Heading>{block.data.title || "Статьи"}</Heading>
          <ul className="flex flex-col gap-2">
            {articles.map((article) => (
              <li key={article.slug}>
                <Link href={`/articles/${article.slug}`} className="hover:text-primary">
                  {article.title}
                </Link>
              </li>
            ))}
          </ul>
          {block.data.showAll && (
            <Link href="/articles" className="text-primary mt-4 inline-block">
              Все статьи →
            </Link>
          )}
        </section>
      </EditableBlock>
    );
  },

  documents: ({ block, pageId, context }) => {
    const documents = block.data.items.flatMap((item) => {
      const document = resolveDocument(item.document, item.title, context);
      return document ? [document] : [];
    });
    if (documents.length === 0) return null;
    return (
      <EditableBlock pageId={pageId} block={block}>
        <section>
          {block.data.title && <Heading>{block.data.title}</Heading>}
          <ul className="flex flex-col gap-2">
            {documents.map((document) => (
              <li key={document.url}>
                <a href={document.url} className="text-primary underline">
                  {document.title}
                </a>{" "}
                <span className="text-muted-foreground text-sm">
                  {formatFileSize(document.size)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      </EditableBlock>
    );
  },

  contacts: ({ block, pageId, context }) => {
    const { phone, email, address, hours, socials } = context.settings;
    if (!phone && !email && !address && !hours) return null;
    return (
      <EditableBlock pageId={pageId} block={block}>
        <section>
          <Heading>{block.data.title || "Контакты"}</Heading>
          {block.data.intro && <p className="mb-6">{block.data.intro}</p>}
          <EditableSettings
            fields={["phone", "email", "address", "hours", "socials"]}
            label="контакты"
          >
            <address className="flex flex-col gap-2 text-xl not-italic">
              {phone && <a href={phoneHref(phone)}>{phone}</a>}
              {email && <a href={`mailto:${email}`}>{email}</a>}
              {address && <span className="whitespace-pre-line">{address}</span>}
              {hours && <span className="text-muted-foreground whitespace-pre-line">{hours}</span>}
            </address>
            {block.data.showSocials && socials.length > 0 && (
              <p className="mt-4 flex gap-4">
                {socials.map((item, index) => (
                  <a key={index} href={item.url} className="text-primary">
                    {socialNetworkLabel(item.network)}
                  </a>
                ))}
              </p>
            )}
          </EditableSettings>
        </section>
      </EditableBlock>
    );
  },

  quote: ({ block, pageId, context }) => (
    <EditableBlock pageId={pageId} block={block}>
      <figure className="flex items-center gap-6">
        <Picture
          image={block.data.photo}
          context={context}
          className="size-24 shrink-0 rounded-full"
        />
        <div>
          <blockquote
            className={`whitespace-pre-line italic ${block.variant === "large" ? "text-4xl" : "text-2xl"}`}
          >
            «{block.data.text}»
          </blockquote>
          {block.data.author && (
            <figcaption className="text-muted-foreground mt-3">— {block.data.author}</figcaption>
          )}
        </div>
      </figure>
    </EditableBlock>
  ),
};
