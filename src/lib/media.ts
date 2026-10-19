// Общие для клиента и сервера ограничения загрузки и адреса файлов.
export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
export const IMAGE_ACCEPT = "image/jpeg,image/png,image/webp,image/gif,image/avif";

// Белый список документов. Расширение берётся из имени файла, а содержимое потом
// проверяется по сигнатуре формата (src/server/documents/detect.ts).
export const DOCUMENT_EXTENSIONS = [
  "pdf",
  "doc",
  "docx",
  "xls",
  "xlsx",
  "ppt",
  "pptx",
  "odt",
  "ods",
  "odp",
  "rtf",
  "txt",
  "csv",
  "zip",
] as const;
export type DocumentExtension = (typeof DOCUMENT_EXTENSIONS)[number];
export const MAX_DOCUMENT_BYTES = 20 * 1024 * 1024;
export const DOCUMENT_ACCEPT = DOCUMENT_EXTENSIONS.map((extension) => `.${extension}`).join(",");

export function documentExtension(name: string): DocumentExtension | null {
  const dot = name.lastIndexOf(".");
  if (dot === -1) return null;
  const extension = name.slice(dot + 1).toLowerCase();
  return (DOCUMENT_EXTENSIONS as readonly string[]).includes(extension)
    ? (extension as DocumentExtension)
    : null;
}

export function mediaUrl(storageKey: string): string {
  return `/media/${storageKey}`;
}
