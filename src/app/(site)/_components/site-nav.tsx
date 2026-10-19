"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { isActiveHref } from "@/lib/site";
import { cn } from "@/lib/utils";
import type { SiteMenuItem } from "@/server/site/service";

export function SiteNav({
  items,
  label,
  className,
  linkClassName,
}: {
  items: SiteMenuItem[];
  label: string;
  className?: string;
  linkClassName?: string;
}) {
  const pathname = usePathname();
  if (items.length === 0) return null;

  return (
    <nav aria-label={label}>
      <ul className={className}>
        {items.map((item) => {
          const active = isActiveHref(pathname, item.href);
          return (
            <li key={item.id}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(linkClassName, active && "text-foreground font-medium")}
              >
                {item.title}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
