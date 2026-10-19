import { connection } from "next/server";
import { db } from "@/db";
import { contentDisposition } from "@/server/documents/detect";
import { getDocumentByStorageKey } from "@/server/documents/service";
import { isStorageKey, openStoredFile } from "@/server/media/storage";

const notFound = () => new Response("Not found", { status: 404 });

// Отдаём только то, что сервер сам сохранил: ключ проверяется по шаблону до обращения
// к диску. Картинки — всегда WebP. Документы — с MIME из записи и только как вложение:
// браузер не откроет их на нашем домене, даже если внутри окажется HTML.
export async function GET(_request: Request, { params }: RouteContext<"/media/[...key]">) {
  await connection();
  const key = (await params).key.join("/");
  if (!isStorageKey(key)) return notFound();

  let headers: Record<string, string>;
  if (key.startsWith("images/")) {
    if (!key.endsWith(".webp")) return notFound();
    headers = { "Content-Type": "image/webp" };
  } else {
    const document = await getDocumentByStorageKey(db(), key);
    if (!document) return notFound();
    headers = {
      "Content-Type": document.mimeType,
      "Content-Disposition": contentDisposition(document.originalName),
    };
  }

  const file = await openStoredFile(key);
  if (!file) return notFound();

  return new Response(file.stream, {
    headers: {
      ...headers,
      "Content-Length": String(file.size),
      // Имя файла — случайный uuid, содержимое по этому адресу никогда не меняется.
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'; sandbox",
    },
  });
}
