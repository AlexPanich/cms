import { describe, expect, it } from "vitest";
import { isSafeLinkUrl } from "./url";

describe("isSafeLinkUrl", () => {
  it.each([
    "/",
    "/about/team",
    "/#contacts",
    "/search?q=1",
    "https://example.com",
    "http://example.com/path",
    "mailto:info@example.com",
    "tel:+70000000000",
  ])("принимает %s", (url) => {
    expect(isSafeLinkUrl(url)).toBe(true);
  });

  it.each([
    "",
    " /about",
    "about",
    "//evil.example",
    "/\\evil.example",
    "/a b",
    "javascript:alert(1)",
    "JavaScript:alert(1)",
    "data:text/html,<script>",
    "vbscript:x",
    "ftp://example.com",
  ])("отклоняет %j", (url) => {
    expect(isSafeLinkUrl(url)).toBe(false);
  });
});
