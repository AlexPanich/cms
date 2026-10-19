import "server-only";
import { randomUUID } from "node:crypto";
import { createReadStream } from "node:fs";
import { mkdir, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";
import { env } from "@/env";

export type StorageFolder = "images" | "documents";

// Ключ генерирует сервер: папка/год/месяц/uuid.расширение. Всё, что не подходит
// под шаблон, отклоняется до обращения к диску — так «../» не выйдет за STORAGE_DIR.
const STORAGE_KEY_PATTERN =
  /^(images|documents)\/\d{4}\/\d{2}\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.[a-z0-9]{1,10}$/;

export function isStorageKey(value: string): boolean {
  return STORAGE_KEY_PATTERN.test(value);
}

export function newStorageKey(folder: StorageFolder, extension: string, now = new Date()): string {
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  return `${folder}/${now.getUTCFullYear()}/${month}/${randomUUID()}.${extension}`;
}

function resolveKey(key: string): string {
  if (!isStorageKey(key)) throw new Error(`Некорректный ключ файла: ${key}`);
  return path.join(path.resolve(env().STORAGE_DIR), key);
}

export async function writeStoredFile(key: string, data: Uint8Array): Promise<void> {
  const file = resolveKey(key);
  await mkdir(path.dirname(file), { recursive: true });
  // wx: не перезаписывать существующий файл.
  await writeFile(file, data, { flag: "wx" });
}

export async function deleteStoredFile(key: string): Promise<void> {
  await rm(resolveKey(key), { force: true });
}

export async function openStoredFile(
  key: string,
): Promise<{ stream: ReadableStream<Uint8Array>; size: number } | null> {
  const file = resolveKey(key);
  try {
    const { size } = await stat(file);
    const stream = Readable.toWeb(createReadStream(file)) as ReadableStream<Uint8Array>;
    return { stream, size };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw error;
  }
}
