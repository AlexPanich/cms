import "server-only";
import { updateTag } from "next/cache";
import { SITE_CACHE_TAGS_BY_PERMISSION } from "@/lib/site-cache";
import { z } from "@/lib/zod";
import type { ActionResult } from "@/lib/action-result";
import type { Permission } from "@/lib/permissions";
import { AuthError, type CurrentUser, requirePermission } from "./auth/session";
import { DomainError } from "./errors";

// Обёртка для всех server actions админки: проверяет право и превращает ожидаемые ошибки
// (нет прав, невалидный ввод, DomainError) в ActionResult. Остальные ошибки, включая
// redirect() и notFound(), пробрасываются дальше — их обрабатывает Next.
// После успешного действия сбрасывает кеш публичного сайта для данных, которые может менять
// это право (SITE_CACHE_TAGS_BY_PERMISSION): updateTag — следующий запрос получит свежие данные.
export async function runAction<T>(
  permission: Permission,
  fn: (user: CurrentUser) => Promise<T>,
): Promise<ActionResult<T>> {
  try {
    const user = await requirePermission(permission);
    const data = await fn(user);
    for (const tag of SITE_CACHE_TAGS_BY_PERMISSION[permission] ?? []) updateTag(tag);
    return { ok: true, data };
  } catch (error) {
    if (error instanceof AuthError) {
      return { ok: false, error: error.message };
    }
    if (error instanceof DomainError) {
      return {
        ok: false,
        error: error.message,
        fieldErrors: error.field ? { [error.field]: [error.message] } : undefined,
      };
    }
    if (error instanceof z.ZodError) {
      return {
        ok: false,
        error: "Проверьте правильность заполнения формы",
        fieldErrors: z.flattenError(error).fieldErrors as Record<string, string[]>,
      };
    }
    throw error;
  }
}
