import { describe, expect, it } from "vitest";
import { isActiveHref } from "./site";

describe("isActiveHref", () => {
  it.each([
    ["/", "/", true],
    ["/about", "/", false],
    ["/about", "/about", true],
    ["/about/team", "/about", true],
    ["/about-us", "/about", false],
    ["/about", "/about#team", true],
    ["/about", "https://example.com/about", false],
  ])("%s, пункт %s → %s", (pathname, href, expected) => {
    expect(isActiveHref(pathname, href)).toBe(expected);
  });
});
