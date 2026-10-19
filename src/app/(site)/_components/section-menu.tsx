import Link from "next/link";
import { isActiveHref } from "@/lib/site";
import { cn } from "@/lib/utils";
import type { Crumb } from "./breadcrumbs";

// Меню раздела: корневая страница ветки и её подстраницы.
export function SectionMenu({
  root,
  items,
  currentHref,
}: {
  root: Crumb;
  items: Crumb[];
  currentHref: string;
}) {
  const link = (item: Crumb, active: boolean) => (
    <Link
      href={item.href}
      aria-current={item.href === currentHref ? "page" : undefined}
      className={cn(
        "hover:text-foreground block rounded-md px-3 py-1.5 transition-colors",
        active ? "bg-muted text-foreground font-medium" : "text-muted-foreground",
      )}
    >
      {item.title}
    </Link>
  );

  return (
    <nav aria-label="Раздел" className="text-sm">
      <div className="mb-1">{link(root, root.href === currentHref)}</div>
      <ul className="flex flex-col gap-0.5 border-l pl-2">
        {items.map((item) => (
          <li key={item.href}>{link(item, isActiveHref(currentHref, item.href))}</li>
        ))}
      </ul>
    </nav>
  );
}
