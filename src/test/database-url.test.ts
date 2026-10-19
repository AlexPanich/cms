import { describe, expect, it } from "vitest";
import { databaseName, testDatabaseUrl } from "./database-url";

describe("testDatabaseUrl", () => {
  it("берёт базу разработки с суффиксом _test на том же сервере", () => {
    const url = testDatabaseUrl({
      DATABASE_URL: "postgres://cms:secret@localhost:5433/cms?sslmode=disable",
    });
    expect(url.toString()).toBe("postgres://cms:secret@localhost:5433/cms_test?sslmode=disable");
    expect(databaseName(url)).toBe("cms_test");
  });

  it("предпочитает TEST_DATABASE_URL", () => {
    const url = testDatabaseUrl({
      DATABASE_URL: "postgres://cms:cms@localhost:5432/cms",
      TEST_DATABASE_URL: "postgres://ci:ci@db:5432/ci_test",
    });
    expect(url.toString()).toBe("postgres://ci:ci@db:5432/ci_test");
  });

  it("не даёт запустить тесты по базе без суффикса _test", () => {
    expect(() =>
      testDatabaseUrl({ TEST_DATABASE_URL: "postgres://cms:cms@localhost:5432/cms" }),
    ).toThrow("_test");
    expect(() => testDatabaseUrl({})).toThrow("DATABASE_URL");
  });
});
