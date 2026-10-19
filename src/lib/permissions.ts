export const PERMISSIONS = [
  "view_admin",
  "edit_users",
  "edit_roles",
  "edit_pages",
  "edit_menus",
  "edit_texts",
  "edit_articles",
  "edit_media",
  "edit_from_front",
] as const;

export type Permission = (typeof PERMISSIONS)[number];

export const PERMISSION_LABELS: Record<Permission, string> = {
  view_admin: "Доступ в админку",
  edit_users: "Пользователи",
  edit_roles: "Роли",
  edit_pages: "Страницы",
  edit_menus: "Меню",
  edit_texts: "Тексты",
  edit_articles: "Статьи",
  edit_media: "Медиа: изображения, галереи, документы",
  edit_from_front: "Редактирование на сайте",
};

export function can(
  user: { permissions: ReadonlySet<Permission> } | null | undefined,
  permission: Permission,
): boolean {
  return user?.permissions.has(permission) ?? false;
}

// Системная роль со всеми правами. Её права нельзя изменить, а последнего
// пользователя с этой ролью нельзя удалить или лишить роли.
export const ADMIN_ROLE = "admin";
