import { connection } from "next/server";
import { isStorageKey, openStoredFile } from "@/server/media/storage";

// Отдаём только то, что сервер сам сохранил: ключ проверяется по шаблону, тип — по расширению
// из белого списка. Документы (с именем файла в Content-Disposition) появятся отдельно.
const CONTENT_TYPES: Record<string, string> = { webp: "image/webp" };

export async function GET(_request: Request, { params }: RouteContext<"/media/[...key]">) {
  await connection();
  const key = (await params).key.join("/");
  const contentType = CONTENT_TYPES[key.slice(key.lastIndexOf(".") + 1)];
  if (!contentType || !key.startsWith("images/") || !isStorageKey(key)) {
    return new Response("Not found", { status: 404 });
  }

  const file = await openStoredFile(key);
  if (!file) return new Response("Not found", { status: 404 });

  return new Response(file.stream, {
    headers: {
      "Content-Type": contentType,
      "Content-Length": String(file.size),
      // Имя файла — случайный uuid, содержимое по этому адресу никогда не меняется.
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'; sandbox",
    },
  });
}
