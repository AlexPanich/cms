import { describe, expect, it } from "vitest";
import { documentExtension } from "@/lib/media";
import { contentDisposition, DOCUMENT_TYPES } from "./detect";

const bytes = (text: string) => new TextEncoder().encode(text);

describe("documentExtension", () => {
  it.each([
    ["Отчёт.PDF", "pdf"],
    ["archive.tar.zip", "zip"],
    ["data.csv", "csv"],
  ])("%s → %s", (name, extension) => {
    expect(documentExtension(name)).toBe(extension);
  });

  it.each(["shell.php", "doc.pdf.php", "page.html", "image.svg", "noext", "pdf", ".htaccess"])(
    "отклоняет %s",
    (name) => {
      expect(documentExtension(name)).toBeNull();
    },
  );
});

describe("проверка содержимого", () => {
  it("узнаёт форматы по сигнатуре", () => {
    expect(DOCUMENT_TYPES.pdf.matches(bytes("%PDF-1.7\n..."))).toBe(true);
    expect(DOCUMENT_TYPES.docx.matches(new Uint8Array([0x50, 0x4b, 0x03, 0x04, 0x14]))).toBe(true);
    expect(
      DOCUMENT_TYPES.xls.matches(new Uint8Array([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1])),
    ).toBe(true);
    expect(DOCUMENT_TYPES.rtf.matches(bytes("{\\rtf1\\ansi ..."))).toBe(true);
    expect(DOCUMENT_TYPES.csv.matches(bytes("имя;телефон\nИван;+7"))).toBe(true);
  });

  it("отклоняет файл, содержимое которого не совпадает с расширением", () => {
    expect(DOCUMENT_TYPES.pdf.matches(bytes("<?php system($_GET['c']); ?>"))).toBe(false);
    expect(DOCUMENT_TYPES.docx.matches(bytes("%PDF-1.7"))).toBe(false);
    expect(DOCUMENT_TYPES.doc.matches(bytes("PK"))).toBe(false);
    expect(DOCUMENT_TYPES.txt.matches(new Uint8Array([0x4d, 0x5a, 0x00, 0x90]))).toBe(false);
  });
});

describe("contentDisposition", () => {
  it("кодирует имя в UTF-8 и даёт безопасный запасной вариант", () => {
    expect(contentDisposition('Прайс "2026" (v1).pdf')).toBe(
      `attachment; filename="_____ _2026_ (v1).pdf"; filename*=UTF-8''%D0%9F%D1%80%D0%B0%D0%B9%D1%81%20%222026%22%20%28v1%29.pdf`,
    );
    expect(contentDisposition("a\r\nSet-Cookie: x.pdf")).not.toMatch(/[\r\n]/);
  });
});
