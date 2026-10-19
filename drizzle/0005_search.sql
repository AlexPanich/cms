ALTER TABLE "articles" ADD COLUMN "search_vector" "tsvector" GENERATED ALWAYS AS (setweight(to_tsvector('russian', "articles"."title"), 'A')
    || setweight(to_tsvector('russian', coalesce("articles"."excerpt", '')), 'B')
    || setweight(to_tsvector('russian', coalesce(jsonb_path_query_array("articles"."content", 'strict $.**.text'), '[]'::jsonb)), 'C')) STORED;--> statement-breakpoint
ALTER TABLE "pages" ADD COLUMN "search_vector" "tsvector" GENERATED ALWAYS AS (setweight(to_tsvector('russian', "pages"."title"), 'A')
    || setweight(to_tsvector('russian', coalesce("pages"."meta_description", '')), 'B')
    || setweight(to_tsvector('russian', coalesce(jsonb_path_query_array("pages"."content", 'strict $.**.text'), '[]'::jsonb)), 'C')) STORED;--> statement-breakpoint
CREATE INDEX "articles_search_idx" ON "articles" USING gin ("search_vector");--> statement-breakpoint
CREATE INDEX "pages_search_idx" ON "pages" USING gin ("search_vector");