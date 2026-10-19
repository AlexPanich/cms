import "server-only";
import { getSessionCookie } from "better-auth/cookies";
import { headers } from "next/headers";
import { cache } from "react";
import { can } from "@/lib/permissions";
import { getCurrentUser } from "@/server/auth/session";

// Пользователь с правом правки на сайте или null. Только для него рендерятся клиентские
// компоненты правки — остальным посетителям их код не отправляется. Гость без cookie
// сессии — без запроса в БД.
export const getFrontEditor = cache(async () => {
  if (!getSessionCookie(await headers())) return null;
  const user = await getCurrentUser();
  if (!can(user, "edit_from_front")) return null;
  return { canOpenAdmin: can(user, "view_admin") };
});
