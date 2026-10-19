import Link from "next/link";
import { Blocks } from "@/components/site/blocks";
import { EditablePageTitle } from "@/components/site/editable";
import type { PageTemplateProps, ThemeModule } from "@/components/site/theme";
import { blockViews } from "./blocks/views";
import { Crumbs } from "./pages";

function PageBlocks({ page, context }: PageTemplateProps) {
  return (
    <div className="flex flex-col gap-16">
      <Blocks blocks={page.blocks} pageId={page.id} context={context} views={blockViews} />
    </div>
  );
}

function Title({ page }: PageTemplateProps) {
  return (
    <EditablePageTitle pageId={page.id} value={page.title}>
      <h1 className="mb-10 text-5xl font-bold">{page.title}</h1>
    </EditablePageTitle>
  );
}

// Меню раздела — не сбоку, а строкой под контентом.
function DefaultTemplate(props: PageTemplateProps) {
  const { page, crumbs, section } = props;
  return (
    <article>
      {!page.isHome && <Crumbs items={crumbs} current={page.title} />}
      <Title {...props} />
      <PageBlocks {...props} />
      {section && (
        <nav aria-label="Раздел" className="border-border mt-16 border-t pt-6">
          <ul className="flex flex-wrap gap-4">
            {[section.root, ...section.items].map((item) => (
              <li key={item.href}>
                <Link href={item.href} aria-current={item.href === props.href ? "page" : undefined}>
                  {item.title}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </article>
  );
}

function LandingTemplate(props: PageTemplateProps) {
  return (
    <article>
      <Title {...props} />
      <PageBlocks {...props} />
    </article>
  );
}

export const templates: ThemeModule["templates"] = {
  default: DefaultTemplate,
  landing: LandingTemplate,
};
