import "server-only";
import { forbidden, redirect } from "next/navigation";
import { headers } from "next/headers";
import { cache } from "react";
import { db } from "@/db";
import { can, type Permission } from "@/lib/permissions";
import { getAuth } from "./auth";
import { getUserPermissions } from "./permissions";

export type CurrentUser = {
  id: string;
  name: string;
  email: string;
  permissions: ReadonlySet<Permission>;
};

// Права читаются из БД на каждый запрос (не из cookie), поэтому изменение ролей действует сразу.
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const session = await getAuth().api.getSession({ headers: await headers() });
  if (!session) return null;

  const { id, name, email } = session.user;
  return { id, name, email, permissions: await getUserPermissions(db(), id) };
});

export class AuthError extends Error {
  constructor(readonly code: "unauthenticated" | "forbidden") {
    super(code === "unauthenticated" ? "Требуется вход" : "Недостаточно прав");
    this.name = "AuthError";
  }
}

// Для server actions и route handlers: бросает AuthError.
export async function requirePermission(permission: Permission): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) throw new AuthError("unauthenticated");
  if (!can(user, permission)) throw new AuthError("forbidden");
  return user;
}

// Для страниц: гостя отправляет на вход, пользователю без права показывает 403.
export async function requirePagePermission(
  permission: Permission,
  returnTo = "/admin",
): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(returnTo)}`);
  if (!can(user, permission)) forbidden();
  return user;
}
