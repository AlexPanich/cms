import { describe, expect, it } from "vitest";
import { likePattern, pageCount, parsePage, parseSearch } from "./pagination";

describe("parsePage", () => {
  it.each([
    ["3", 3],
    [undefined, 1],
    ["0", 1],
    ["-2", 1],
    ["1.5", 1],
    ["abc", 1],
    [["2", "3"], 1],
  ])("%s → %s", (value, expected) => {
    expect(parsePage(value)).toBe(expected);
  });
});

describe("parseSearch", () => {
  it("обрезает пробелы и длину", () => {
    expect(parseSearch("  анна ")).toBe("анна");
    expect(parseSearch("x".repeat(500))).toHaveLength(100);
    expect(parseSearch(["a"])).toBe("");
  });
});

describe("pageCount", () => {
  it.each([
    [0, 1],
    [20, 1],
    [21, 2],
  ])("%s записей → %s страниц", (total, expected) => {
    expect(pageCount(total)).toBe(expected);
  });
});

describe("likePattern", () => {
  it("экранирует спецсимволы LIKE", () => {
    expect(likePattern("50%_off\\")).toBe("%50\\%\\_off\\\\%");
  });
});
