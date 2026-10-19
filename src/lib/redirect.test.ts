import { describe, expect, it } from "vitest";
import { safeRedirectPath } from "./redirect";

describe("safeRedirectPath", () => {
  it.each(["/admin", "/admin/pages?id=1", "/"])("пропускает внутренний путь %s", (path) => {
    expect(safeRedirectPath(path)).toBe(path);
  });

  it.each([
    null,
    undefined,
    "",
    "admin",
    "https://evil.com",
    "//evil.com",
    "/\\evil.com",
    "javascript:alert(1)",
  ])("заменяет %s на путь по умолчанию", (value) => {
    expect(safeRedirectPath(value)).toBe("/admin");
  });
});
