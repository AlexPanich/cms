import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { JsonLd } from "./json-ld";

describe("JsonLd", () => {
  it("не даёт тексту закрыть тег script", () => {
    const html = renderToStaticMarkup(
      <JsonLd data={{ "@type": "Article", headline: "</script><script>alert(1)</script>" }} />,
    );
    expect(html.match(/<\/script>/g)).toHaveLength(1);
    const json = html.replace(/^<script[^>]*>|<\/script>$/g, "");
    expect(JSON.parse(json)).toEqual({
      "@context": "https://schema.org",
      "@type": "Article",
      headline: "</script><script>alert(1)</script>",
    });
  });
});
