import { describe, expect, it } from "vitest";
import { parseEnv } from "./env";

describe("parseEnv", () => {
  it("применяет значения по умолчанию", () => {
    const env = parseEnv({ DATABASE_URL: "postgres://cms:cms@localhost:5432/cms" });
    expect(env.NODE_ENV).toBe("development");
    expect(env.STORAGE_DIR).toBe("./storage");
  });

  it("отклоняет не-postgres URL", () => {
    expect(() => parseEnv({ DATABASE_URL: "mysql://localhost/cms" })).toThrow(/DATABASE_URL/);
  });

  it("требует DATABASE_URL", () => {
    expect(() => parseEnv({})).toThrow(/DATABASE_URL/);
  });
});
