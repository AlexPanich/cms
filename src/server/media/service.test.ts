import { readFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { describe, expect, it } from "vitest";
import { env } from "@/env";
import { MAX_IMAGE_BYTES } from "@/lib/media";
import { withRollback } from "@/test/db";
import { MediaError } from "./errors";
import { saveUploadedImage } from "./service";
import { deleteStoredFile } from "./storage";

const png = () =>
  sharp({ create: { width: 20, height: 10, channels: 3, background: "#ff0000" } })
    .png()
    .toBuffer();

async function expectInvalidFile(upload: unknown) {
  await expect(
    withRollback((tx) => saveUploadedImage(tx, upload, null).then(() => undefined)),
  ).rejects.toSatisfy((error) => error instanceof MediaError && error.code === "invalid_file");
}

describe("saveUploadedImage", () => {
  it("сохраняет WebP в хранилище и запись в media", () =>
    withRollback(async (tx) => {
      const upload = new File([new Uint8Array(await png())], "../../photo\u0000.png");
      const row = await saveUploadedImage(tx, upload, null);
      try {
        expect(row).toMatchObject({
          kind: "image",
          mimeType: "image/webp",
          originalName: "photo.png",
          width: 20,
          height: 10,
        });
        expect(row.storageKey).toMatch(/^images\/\d{4}\/\d{2}\/[0-9a-f-]{36}\.webp$/);
        const stored = await readFile(path.join(env().STORAGE_DIR, row.storageKey));
        expect(stored.length).toBe(row.size);
      } finally {
        // Запись в БД откатится, а файл нужно удалить самим.
        await deleteStoredFile(row.storageKey);
      }
    }));

  it("отклоняет пустой, слишком большой файл и не-файл", async () => {
    await expectInvalidFile(null);
    await expectInvalidFile("строка");
    await expectInvalidFile(new File([], "empty.png"));
    await expectInvalidFile(new File([new Uint8Array(MAX_IMAGE_BYTES + 1)], "big.png"));
  });
});
