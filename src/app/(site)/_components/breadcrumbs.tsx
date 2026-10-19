import Link from "next/link";

export type Crumb = { href: string; title: string };

export function Breadcrumbs({ items, current }: { items: Crumb[]; current: string }) {
  return (
    <nav aria-label="Хлебные крошки" className="text-muted-foreground mb-4 text-sm">
      <ol className="flex flex-wrap items-center gap-1.5">
        {[{ href: "/", title: "Главная" }, ...items].map((item) => (
          <li key={item.href} className="flex items-center gap-1.5">
            <Link href={item.href} className="hover:text-foreground transition-colors">
              {item.title}
            </Link>
            <span aria-hidden>/</span>
          </li>
        ))}
        <li aria-current="page" className="text-foreground">
          {current}
        </li>
      </ol>
    </nav>
  );
}
