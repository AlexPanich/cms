DROP INDEX "pages_search_idx";--> statement-breakpoint
ALTER TABLE "pages" drop column "search_vector";--> statement-breakpoint
ALTER TABLE "pages" ADD COLUMN "search_vector" "tsvector" GENERATED ALWAYS AS (setweight(to_tsvector('russian', "pages"."title"), 'A')
    || setweight(to_tsvector('russian', coalesce("pages"."meta_description", '')), 'B')
    || setweight(to_tsvector('russian', "pages"."search_text"), 'C')) STORED;--> statement-breakpoint
ALTER TABLE "pages" DROP COLUMN "content";