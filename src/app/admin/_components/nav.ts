import {
  FileTextIcon,
  LayoutDashboardIcon,
  type LucideIcon,
  MenuIcon,
  ShieldCheckIcon,
  UsersIcon,
} from "lucide-react";
import type { Permission } from "@/lib/permissions";

export type AdminNavItem = {
  href: string;
  label: string;
  description: string;
  icon: LucideIcon;
  permission: Permission;
};

// Пункт показывается, только если у пользователя есть право. Это удобство интерфейса,
// а не защита: каждая страница раздела проверяет право сама.
export const ADMIN_NAV: AdminNavItem[] = [
  {
    href: "/admin",
    label: "Обзор",
    description: "Разделы админки",
    icon: LayoutDashboardIcon,
    permission: "view_admin",
  },
  {
    href: "/admin/pages",
    label: "Страницы",
    description: "Дерево страниц сайта и их содержимое",
    icon: FileTextIcon,
    permission: "edit_pages",
  },
  {
    href: "/admin/menus",
    label: "Меню",
    description: "Пункты меню сайта и их порядок",
    icon: MenuIcon,
    permission: "edit_menus",
  },
  {
    href: "/admin/users",
    label: "Пользователи",
    description: "Учётные записи, пароли и роли",
    icon: UsersIcon,
    permission: "edit_users",
  },
  {
    href: "/admin/roles",
    label: "Роли",
    description: "Наборы прав для пользователей",
    icon: ShieldCheckIcon,
    permission: "edit_roles",
  },
];

export function isNavItemActive(pathname: string, href: string): boolean {
  return href === "/admin"
    ? pathname === href
    : pathname === href || pathname.startsWith(`${href}/`);
}
