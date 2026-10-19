// Структурированные данные для поисковиков (schema.org). Данные сериализуются в JSON,
// а «<» экранируется, чтобы текст из базы не мог закрыть тег <script>.
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  const json = JSON.stringify({ "@context": "https://schema.org", ...data }).replace(
    /</g,
    "\\u003c",
  );
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}
