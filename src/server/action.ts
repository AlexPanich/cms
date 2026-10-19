import "server-only";
import { z } from "@/lib/zod";
import type { ActionResult } from "@/lib/action-result";
import type { Permission } from "@/lib/permissions";
import { AuthError, type CurrentUser, requirePermission } from "./auth/session";
import { DomainError } from "./errors";

// Обёртка для всех server actions админки: проверяет право и превращает ожидаемые ошибки
// (нет прав, невалидный ввод, DomainError) в ActionResult. Остальные ошибки, включая
// redirect() и notFound(), пробрасываются дальше — их обрабатывает Next.
export async function runAction<T>(
  permission: Permission,
  fn: (user: CurrentUser) => Promise<T>,
): Promise<ActionResult<T>> {
  try {
    const user = await requirePermission(permission);
    return { ok: true, data: await fn(user) };
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
