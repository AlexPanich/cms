import { describe, expect, it } from "vitest";
import { isStorageKey, newStorageKey } from "./storage";

describe("ключи хранилища", () => {
  it("генерирует ключ по папке и дате", () => {
    const key = newStorageKey("images", "webp", new Date("2026-03-05T10:00:00Z"));
    expect(key).toMatch(/^images\/2026\/03\/[0-9a-f-]{36}\.webp$/);
    expect(isStorageKey(key)).toBe(true);
  });

  it.each([
    "../etc/passwd",
    "images/2026/03/../../../etc/passwd",
    "images/2026/03/not-a-uuid.webp",
    "/images/2026/03/0e9c1d1e-7c55-4d55-9a8f-1b2b3c4d5e6f.webp",
    "public/2026/03/0e9c1d1e-7c55-4d55-9a8f-1b2b3c4d5e6f.webp",
    "images/2026/03/0e9c1d1e-7c55-4d55-9a8f-1b2b3c4d5e6f.webp/x",
  ])("отклоняет %s", (key) => {
    expect(isStorageKey(key)).toBe(false);
  });
});
