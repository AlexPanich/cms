CREATE TABLE "page_media" (
	"page_id" integer NOT NULL,
	"media_id" integer NOT NULL,
	CONSTRAINT "page_media_page_id_media_id_pk" PRIMARY KEY("page_id","media_id")
);
--> statement-breakpoint
ALTER TABLE "pages" ADD COLUMN "blocks" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "pages" ADD COLUMN "search_text" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "page_media" ADD CONSTRAINT "page_media_page_id_pages_id_fk" FOREIGN KEY ("page_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "page_media" ADD CONSTRAINT "page_media_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "page_media_media_idx" ON "page_media" USING btree ("media_id");