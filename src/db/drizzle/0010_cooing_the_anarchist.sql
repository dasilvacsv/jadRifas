
--> statement-breakpoint
ALTER TABLE "raffles" ADD COLUMN "slug" varchar(256) NOT NULL;--> statement-breakpoint
ALTER TABLE "raffles" ADD CONSTRAINT "raffles_slug_unique" UNIQUE("slug");