ALTER TABLE "articles" ADD COLUMN "source_author" varchar(200);--> statement-breakpoint
ALTER TABLE "articles" ADD COLUMN "full_text" boolean DEFAULT false NOT NULL;