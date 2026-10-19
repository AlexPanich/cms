-- Текст страницы становится блоком «text» (src/lib/blocks/catalog.ts), а его текст —
-- поисковым текстом страницы. Пустые документы не переносятся.
UPDATE "pages"
SET
  "blocks" = jsonb_build_array(jsonb_build_object(
    'id', gen_random_uuid()::text,
    'type', 'text',
    'variant', null,
    'data', jsonb_build_object('content', "content")
  )),
  "search_text" = coalesce((
    SELECT string_agg(value #>> '{}', ' ')
    FROM jsonb_array_elements(jsonb_path_query_array("content", 'strict $.**.text'))
  ), '')
WHERE "content" IS NOT NULL AND jsonb_array_length(coalesce("content" -> 'content', '[]'::jsonb)) > 0;
