import { revalidateTag } from "next/cache";
import { connection } from "next/server";
import { SITE_CACHE_TAGS } from "@/lib/site-cache";
import { AuthError, requirePermission } from "@/server/auth/session";

// Полный сброс кеша публичного сайта — после правок в обход админки (прямо в БД, в E2E-тестах).
// Правки через админку сбрасывают кеш сами (runAction).
export async function POST() {
  await connection();
  try {
    await requirePermission("view_admin");
  } catch (error) {
    if (error instanceof AuthError) {
      return Response.json(
        { error: error.message },
        { status: error.code === "unauthenticated" ? 401 : 403 },
      );
    }
    throw error;
  }
  for (const tag of Object.values(SITE_CACHE_TAGS)) revalidateTag(tag, { expire: 0 });
  return Response.json({ status: "ok" });
}
