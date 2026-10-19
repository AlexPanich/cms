import {
  FileTextIcon,
  ImageIcon,
  ImagesIcon,
  LayoutDashboardIcon,
  type LucideIcon,
  MenuIcon,
  NewspaperIcon,
  ShieldCheckIcon,
  TextQuoteIcon,
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
    href: "/admin/texts",
    label: "Тексты",
    description: "Блоки текста для шаблонов: телефон, адрес, слоган",
    icon: TextQuoteIcon,
    permission: "edit_texts",
  },
  {
    href: "/admin/articles",
    label: "Статьи",
    description: "Новости и публикации с превью",
    icon: NewspaperIcon,
    permission: "edit_articles",
  },
  {
    href: "/admin/galleries",
    label: "Галереи",
    description: "Наборы изображений для вставки в текст страниц",
    icon: ImagesIcon,
    permission: "edit_media",
  },
  {
    href: "/admin/media",
    label: "Изображения",
    description: "Все загруженные картинки, удаление неиспользуемых",
    icon: ImageIcon,
    permission: "edit_media",
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
