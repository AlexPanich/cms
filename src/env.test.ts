import { describe, expect, it } from "vitest";
import { parseEnv } from "./env";

const valid = {
  DATABASE_URL: "postgres://cms:cms@localhost:5432/cms",
  BETTER_AUTH_SECRET: "x".repeat(32),
  BETTER_AUTH_URL: "http://localhost:3000",
};

describe("parseEnv", () => {
  it("применяет значения по умолчанию", () => {
    const env = parseEnv(valid);
    expect(env.NODE_ENV).toBe("development");
    expect(env.STORAGE_DIR).toBe("./storage");
  });

  it("отклоняет не-postgres URL", () => {
    expect(() => parseEnv({ ...valid, DATABASE_URL: "mysql://localhost/cms" })).toThrow(
      /DATABASE_URL/,
    );
  });

  it("требует DATABASE_URL", () => {
    expect(() => parseEnv({ ...valid, DATABASE_URL: undefined })).toThrow(/DATABASE_URL/);
  });

  it("требует секрет не короче 32 символов", () => {
    expect(() => parseEnv({ ...valid, BETTER_AUTH_SECRET: "short" })).toThrow(/BETTER_AUTH_SECRET/);
  });
});
