import { readFile } from "node:fs/promises";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { env } from "@/env";
import type { Tx } from "@/db";
import { media } from "@/db/schema";
import { MAX_DOCUMENT_BYTES } from "@/lib/media";
import { MediaError, type MediaErrorCode } from "@/server/media/errors";
import { deleteStoredFiles, listImages } from "@/server/media/service";
import { withRollback as withRollbackBase } from "@/test/db";
import {
  deleteDocument,
  getDocumentByStorageKey,
  listDocuments,
  saveUploadedDocument,
  updateDocument,
} from "./service";

// Тесты сравнивают списки, поэтому начинают с пустой медиатеки.
const withRollback = (fn: (tx: Tx) => Promise<void>) => withRollbackBase(fn, { clear: [media] });

// Записи в БД откатываются, а файлы удаляем после теста сами.
const storedKeys: string[] = [];
afterEach(async () => {
  await deleteStoredFiles(storedKeys.splice(0));
});

const pdf = (name = "Прайс.pdf") => new File(["%PDF-1.7\n%тест"], name);

async function save(tx: Tx, file: File, title = "Документ") {
  const row = await saveUploadedDocument(tx, file, { title }, null);
  storedKeys.push(row.storageKey);
  return row;
}

async function expectMediaError(promise: Promise<unknown>, code: MediaErrorCode) {
  await expect(promise).rejects.toSatisfy(
    (error) => error instanceof MediaError && error.code === code && error.field === "file",
  );
}

describe("documents service", () => {
  it("сохраняет файл как есть под случайным именем с расширением из белого списка", () =>
    withRollback(async (tx) => {
      const row = await save(tx, pdf("../../Прайс.PDF"), "  Прайс-лист ");
      expect(row).toMatchObject({
        kind: "document",
        title: "Прайс-лист",
        originalName: "Прайс.PDF",
        mimeType: "application/pdf",
      });
      expect(row.storageKey).toMatch(/^documents\/\d{4}\/\d{2}\/[0-9a-f-]{36}\.pdf$/);
      const stored = await readFile(path.join(env().STORAGE_DIR, row.storageKey), "utf8");
      expect(stored).toBe("%PDF-1.7\n%тест");
      expect(await getDocumentByStorageKey(tx, row.storageKey)).toEqual({
        originalName: "Прайс.PDF",
        mimeType: "application/pdf",
      });
      // В медиатеке изображений документа нет.
      expect((await listImages(tx, { page: 1, search: "", unused: false })).total).toBe(0);
    }));

  it("отклоняет опасные расширения и подделанное содержимое", () =>
    withRollback(async (tx) => {
      await expectMediaError(save(tx, new File(["<?php ?>"], "shell.php")), "unsupported_document");
      await expectMediaError(
        save(tx, new File(["<?php ?>"], "shell.php.pdf")),
        "unsupported_document",
      );
      await expectMediaError(save(tx, new File(["<svg/>"], "x.svg")), "unsupported_document");
      await expectMediaError(save(tx, new File([], "empty.pdf")), "invalid_file");
      await expectMediaError(
        save(tx, new File([new Uint8Array(MAX_DOCUMENT_BYTES + 1)], "big.txt")),
        "invalid_file",
      );
      await expect(save(tx, pdf(), " ")).rejects.toThrow();
      expect((await listDocuments(tx, { page: 1, search: "" })).total).toBe(0);
    }));

  it("ищет по названию и имени файла, правит и удаляет вместе с файлом", () =>
    withRollback(async (tx) => {
      const price = await save(tx, pdf("price-2026.pdf"), "Прайс-лист");
      await save(tx, new File(["a;b\n1;2"], "report.csv"), "Отчёт 100%");

      const titles = async (search: string) =>
        (await listDocuments(tx, { page: 1, search })).items.map((item) => item.title);
      expect(await titles("прайс")).toEqual(["Прайс-лист"]);
      expect(await titles("report")).toEqual(["Отчёт 100%"]);
      expect(await titles("%")).toEqual(["Отчёт 100%"]);

      expect(await updateDocument(tx, price.id, { title: "Цены" })).toMatchObject({
        title: "Цены",
      });
      await deleteDocument(tx, price.id);
      await expect(readFile(path.join(env().STORAGE_DIR, price.storageKey))).rejects.toThrow();
      await expect(deleteDocument(tx, price.id)).rejects.toBeInstanceOf(MediaError);
      await expect(updateDocument(tx, price.id, { title: "x" })).rejects.toBeInstanceOf(MediaError);
    }));
});
