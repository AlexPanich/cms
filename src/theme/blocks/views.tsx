import {
  AwardIcon,
  CheckIcon,
  ClockIcon,
  FileTextIcon,
  HeartIcon,
  type LucideIcon,
  MailIcon,
  MapPinIcon,
  PhoneIcon,
  ShieldIcon,
  StarIcon,
  TruckIcon,
  UsersIcon,
  ZapIcon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import {
  type BlockProps,
  type BlockViews,
  resolveDocument,
  resolveImage,
  resolveLink,
} from "@/components/site/blocks";
import { EditableBlock, EditableSettings } from "@/components/site/editable";
import { RichText } from "@/components/site/rich-text";
import type { FeatureIcon } from "@/lib/blocks/catalog";
import type { LinkValue } from "@/lib/blocks/define";
import { formatFileSize } from "@/lib/format";
import { cn } from "@/lib/utils";
import { articleDate } from "../article-card";
import { CONTACT_SETTINGS, Contacts, hasContacts } from "../contacts";
import { Gallery } from "../gallery";
import { PROSE, WIDGETS } from "../rich-text";

// Вид каждого блока из реестра (каталог ядра и THEME_BLOCKS). Блок оборачивает правку
// на сайте сам: только он знает, где в его разметке какое поле. Необязательное поле
// без значения не выводится вместе с обёрткой.

type ContextProps = Pick<BlockProps, "context">;

function SectionTitle({ children }: { children: ReactNode }) {
  return <h2 className="mb-6 text-2xl font-semibold tracking-tight text-balance">{children}</h2>;
}

function BlockButton({
  link,
  context,
  variant = "primary",
}: ContextProps & { link: LinkValue | null; variant?: "primary" | "inverted" }) {
  const resolved = resolveLink(link, context);
  if (!resolved) return null;
  return (
    <Link
      href={resolved.href}
      className={cn(
        "inline-flex h-11 items-center justify-center rounded-md px-6 font-medium transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none",
        variant === "primary"
          ? "bg-primary text-primary-foreground"
          : "bg-primary-foreground text-primary",
      )}
    >
      {resolved.label}
    </Link>
  );
}

function TextBlock({ block, pageId, context }: BlockProps<"text">) {
  return (
    <EditableBlock pageId={pageId} block={block}>
      <RichText doc={block.data.content} context={context} widgets={WIDGETS} className={PROSE} />
    </EditableBlock>
  );
}

function HeroBlock({ block, pageId, context }: BlockProps<"hero">) {
  const { title, subtitle, button } = block.data;
  const image = resolveImage(block.data.image, context);
  return (
    <EditableBlock pageId={pageId} block={block}>
      <section className="grid items-center gap-8 md:grid-cols-2">
        <div className={cn("flex flex-col items-start gap-5", !image && "md:col-span-2")}>
          <h2 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
            {title}
          </h2>
          {subtitle && (
            <p className="text-muted-foreground text-lg whitespace-pre-line">{subtitle}</p>
          )}
          <BlockButton link={button} context={context} />
        </div>
        {image && (
          <div className="bg-muted relative aspect-video overflow-hidden rounded-xl">
            <Image
              src={image.url}
              alt={image.alt}
              fill
              priority
              sizes="(min-width: 768px) 32rem, 100vw"
              className="object-cover"
            />
          </div>
        )}
      </section>
    </EditableBlock>
  );
}

const ICONS: Record<Exclude<FeatureIcon, "none">, LucideIcon> = {
  check: CheckIcon,
  star: StarIcon,
  heart: HeartIcon,
  shield: ShieldIcon,
  clock: ClockIcon,
  truck: TruckIcon,
  phone: PhoneIcon,
  mail: MailIcon,
  "map-pin": MapPinIcon,
  users: UsersIcon,
  award: AwardIcon,
  zap: ZapIcon,
};

function FeaturesBlock({ block, pageId, context }: BlockProps<"features">) {
  const { title, intro, items } = block.data;
  return (
    <EditableBlock pageId={pageId} block={block}>
      <section>
        {title && <SectionTitle>{title}</SectionTitle>}
        {intro && (
          <p className="text-muted-foreground -mt-3 mb-6 max-w-2xl whitespace-pre-line">{intro}</p>
        )}
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item, index) => {
            const image = resolveImage(item.image, context);
            const Icon = item.icon === "none" ? null : ICONS[item.icon];
            const link = resolveLink(item.link, context);
            return (
              <li key={index} className="bg-card flex flex-col gap-3 rounded-xl border p-5">
                {image ? (
                  <div className="bg-muted relative -mx-5 -mt-5 mb-2 aspect-[4/3] overflow-hidden rounded-t-xl">
                    <Image
                      src={image.url}
                      alt={image.alt}
                      fill
                      sizes="(min-width: 1024px) 20rem, (min-width: 640px) 50vw, 100vw"
                      className="object-cover"
                    />
                  </div>
                ) : (
                  Icon && (
                    <span className="bg-secondary text-secondary-foreground flex size-10 items-center justify-center rounded-lg">
                      <Icon className="size-5" aria-hidden />
                    </span>
                  )
                )}
                <h3 className="text-lg font-semibold">{item.title}</h3>
                {item.text && (
                  <p className="text-muted-foreground whitespace-pre-line">{item.text}</p>
                )}
                {link && (
                  <Link
                    href={link.href}
                    className="mt-auto font-medium underline underline-offset-4"
                  >
                    {link.label}
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      </section>
    </EditableBlock>
  );
}

function MediaTextBlock({ block, pageId, context }: BlockProps<"media-text">) {
  const { title, content, button } = block.data;
  const image = resolveImage(block.data.image, context);
  return (
    <EditableBlock pageId={pageId} block={block}>
      <section className="grid items-center gap-8 md:grid-cols-2">
        {image && (
          <div
            className={cn(
              "bg-muted relative aspect-[4/3] overflow-hidden rounded-xl",
              block.variant === "image-right" && "md:order-last",
            )}
          >
            <Image
              src={image.url}
              alt={image.alt}
              fill
              sizes="(min-width: 768px) 32rem, 100vw"
              className="object-cover"
            />
          </div>
        )}
        <div className={cn("flex flex-col items-start gap-5", !image && "md:col-span-2")}>
          {title && <h2 className="text-2xl font-semibold tracking-tight text-balance">{title}</h2>}
          <RichText doc={content} context={context} widgets={WIDGETS} className={PROSE} />
          <BlockButton link={button} context={context} />
        </div>
      </section>
    </EditableBlock>
  );
}

function GalleryBlock({ block, pageId, context }: BlockProps<"gallery">) {
  const gallery = block.data.gallery ? context.galleries.get(block.data.gallery) : undefined;
  if (!gallery) return null;
  return (
    <EditableBlock pageId={pageId} block={block}>
      <section>
        {block.data.title && <SectionTitle>{block.data.title}</SectionTitle>}
        <Gallery gallery={gallery} />
      </section>
    </EditableBlock>
  );
}

function CtaBlock({ block, pageId, context }: BlockProps<"cta">) {
  const { title, text, button } = block.data;
  const light = block.variant === "light";
  return (
    <EditableBlock pageId={pageId} block={block}>
      <section
        className={cn(
          "flex flex-col items-start gap-5 rounded-xl p-8 sm:p-10",
          light ? "bg-muted" : "bg-primary text-primary-foreground",
        )}
      >
        <h2 className="text-2xl font-semibold tracking-tight text-balance sm:text-3xl">{title}</h2>
        {text && (
          <p
            className={cn(
              "max-w-2xl whitespace-pre-line",
              light ? "text-muted-foreground" : "opacity-80",
            )}
          >
            {text}
          </p>
        )}
        <BlockButton link={button} context={context} variant={light ? "primary" : "inverted"} />
      </section>
    </EditableBlock>
  );
}

function FaqBlock({ block, pageId, context }: BlockProps<"faq">) {
  const { title, items } = block.data;
  return (
    <EditableBlock pageId={pageId} block={block}>
      <section>
        {title && <SectionTitle>{title}</SectionTitle>}
        <div className="divide-y rounded-xl border">
          {items.map((item, index) => (
            <details key={index} className="group px-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 font-medium [&::-webkit-details-marker]:hidden">
                {item.question}
                <span
                  className="text-muted-foreground text-xl leading-none transition-transform group-open:rotate-45"
                  aria-hidden
                >
                  +
                </span>
              </summary>
              <div className="pb-5">
                <RichText doc={item.answer} context={context} widgets={WIDGETS} className={PROSE} />
              </div>
            </details>
          ))}
        </div>
      </section>
    </EditableBlock>
  );
}

function ArticlesBlock({ block, pageId, context }: BlockProps<"articles">) {
  const articles = context.articles.slice(0, Number(block.data.count));
  if (articles.length === 0) return null;
  return (
    <EditableBlock pageId={pageId} block={block}>
      <section>
        <div className="mb-6 flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-2xl font-semibold tracking-tight">{block.data.title || "Статьи"}</h2>
          {block.data.showAll && (
            <Link href="/articles" className="font-medium underline underline-offset-4">
              Все статьи
            </Link>
          )}
        </div>
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {articles.map((article) => (
            <li key={article.slug}>
              <article className="group relative flex flex-col gap-3">
                <div className="bg-muted relative aspect-[4/3] overflow-hidden rounded-lg">
                  {article.previewUrl && (
                    <Image
                      src={article.previewUrl}
                      alt={article.previewAlt ?? ""}
                      fill
                      sizes="(min-width: 1024px) 20rem, (min-width: 640px) 50vw, 100vw"
                      className="object-cover"
                    />
                  )}
                </div>
                {article.publishedAt && (
                  <time
                    dateTime={article.publishedAt.toISOString()}
                    className="text-muted-foreground text-sm"
                  >
                    {articleDate.format(article.publishedAt)}
                  </time>
                )}
                <h3 className="font-semibold">
                  <Link href={`/articles/${article.slug}`} className="after:absolute after:inset-0">
                    <span className="group-hover:underline">{article.title}</span>
                  </Link>
                </h3>
              </article>
            </li>
          ))}
        </ul>
      </section>
    </EditableBlock>
  );
}

function DocumentsBlock({ block, pageId, context }: BlockProps<"documents">) {
  const documents = block.data.items.flatMap((item) => {
    const document = resolveDocument(item.document, item.title, context);
    return document ? [document] : [];
  });
  if (documents.length === 0) return null;
  return (
    <EditableBlock pageId={pageId} block={block}>
      <section>
        {block.data.title && <SectionTitle>{block.data.title}</SectionTitle>}
        <ul className="divide-y rounded-xl border">
          {documents.map((document) => (
            <li key={document.url}>
              <a
                href={document.url}
                className="hover:bg-muted/50 flex items-center gap-3 px-5 py-4 focus-visible:ring-2 focus-visible:outline-none"
              >
                <FileTextIcon className="text-muted-foreground size-5 shrink-0" aria-hidden />
                <span className="flex-1 font-medium">{document.title}</span>
                <span className="text-muted-foreground text-sm whitespace-nowrap">
                  {[document.extension?.toUpperCase(), formatFileSize(document.size)]
                    .filter(Boolean)
                    .join(", ")}
                </span>
              </a>
            </li>
          ))}
        </ul>
      </section>
    </EditableBlock>
  );
}

// Сами контакты — из настроек сайта: их правят здесь же, отдельной кнопкой.
function ContactsBlock({ block, pageId, context }: BlockProps<"contacts">) {
  const { title, intro, showSocials } = block.data;
  if (!hasContacts(context.settings, showSocials)) return null;
  return (
    <EditableBlock pageId={pageId} block={block}>
      <section>
        <SectionTitle>{title || "Контакты"}</SectionTitle>
        {intro && (
          <p className="text-muted-foreground -mt-3 mb-6 max-w-2xl whitespace-pre-line">{intro}</p>
        )}
        <EditableSettings fields={CONTACT_SETTINGS} label="контакты">
          <Contacts settings={context.settings} socials={showSocials} className="text-lg" />
        </EditableSettings>
      </section>
    </EditableBlock>
  );
}

export const blockViews: BlockViews = {
  text: TextBlock,
  hero: HeroBlock,
  features: FeaturesBlock,
  "media-text": MediaTextBlock,
  gallery: GalleryBlock,
  cta: CtaBlock,
  faq: FaqBlock,
  articles: ArticlesBlock,
  documents: DocumentsBlock,
  contacts: ContactsBlock,
};
