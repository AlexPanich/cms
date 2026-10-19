import type { DocumentExtension } from "@/lib/media";

type DocumentType = { mimeType: string; matches: (data: Uint8Array) => boolean };

const startsWith =
  (...signature: number[]) =>
  (data: Uint8Array) =>
    data.length >= signature.length && signature.every((byte, index) => data[index] === byte);

const ascii = (text: string) => [...text].map((char) => char.charCodeAt(0));

const pdf = startsWith(...ascii("%PDF-"));
// docx, xlsx, pptx, odt, ods, odp — это zip-архивы.
const zip = startsWith(0x50, 0x4b, 0x03, 0x04);
// doc, xls, ppt — составной документ OLE.
const ole = startsWith(0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1);
const rtf = startsWith(...ascii("{\\rtf"));
// Текст в любой однобайтовой кодировке или UTF-8: нулевых байтов в нём нет.
const text = (data: Uint8Array) => !data.includes(0);

export const DOCUMENT_TYPES: Record<DocumentExtension, DocumentType> = {
  pdf: { mimeType: "application/pdf", matches: pdf },
  doc: { mimeType: "application/msword", matches: ole },
  docx: {
    mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    matches: zip,
  },
  xls: { mimeType: "application/vnd.ms-excel", matches: ole },
  xlsx: {
    mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    matches: zip,
  },
  ppt: { mimeType: "application/vnd.ms-powerpoint", matches: ole },
  pptx: {
    mimeType: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    matches: zip,
  },
  odt: { mimeType: "application/vnd.oasis.opendocument.text", matches: zip },
  ods: { mimeType: "application/vnd.oasis.opendocument.spreadsheet", matches: zip },
  odp: { mimeType: "application/vnd.oasis.opendocument.presentation", matches: zip },
  rtf: { mimeType: "application/rtf", matches: rtf },
  txt: { mimeType: "text/plain", matches: text },
  csv: { mimeType: "text/csv", matches: text },
  zip: { mimeType: "application/zip", matches: zip },
};

// Заголовок для скачивания под исходным именем. filename — запасной вариант в ASCII
// для старых клиентов, filename* — точное имя в UTF-8 (RFC 6266).
export function contentDisposition(name: string): string {
  const fallback = name.replace(/[^\x20-\x7e]|["\\%;]/g, "_");
  const encoded = encodeURIComponent(name).replace(
    /['()*]/g,
    (char) => `%${char.charCodeAt(0).toString(16).toUpperCase()}`,
  );
  return `attachment; filename="${fallback}"; filename*=UTF-8''${encoded}`;
}
