CREATE TYPE "public"."card_state" AS ENUM('New', 'Learning', 'Review', 'Relearning');--> statement-breakpoint
CREATE TYPE "public"."rating" AS ENUM('Again', 'Hard', 'Good', 'Easy');--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "deck" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"user_id" uuid,
	"description" text,
	"is_default" boolean DEFAULT false,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"visibility" text DEFAULT 'private' NOT NULL,
	"language" varchar(3) NOT NULL,
	CONSTRAINT "deck_visibility_check" CHECK (visibility = ANY (ARRAY['private'::text, 'public'::text]))
);
--> statement-breakpoint
ALTER TABLE "deck" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "deck_study" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"deck_id" integer,
	"user_id" uuid,
	"last_studied_at" timestamp,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT "deck_study_deck_id_user_id_key" UNIQUE("deck_id","user_id")
);
--> statement-breakpoint
ALTER TABLE "deck_study" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "flashcard" (
	"id" serial PRIMARY KEY NOT NULL,
	"deck_id" integer,
	"front" text NOT NULL,
	"back" jsonb NOT NULL,
	"notes" text,
	"version" integer DEFAULT 1,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
ALTER TABLE "flashcard" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "flashcard_study" (
	"id" serial PRIMARY KEY NOT NULL,
	"flashcard_id" integer NOT NULL,
	"user_id" uuid NOT NULL,
	"due" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"stability" double precision DEFAULT 0 NOT NULL,
	"difficulty" double precision DEFAULT 0 NOT NULL,
	"elapsed_days" integer DEFAULT 0 NOT NULL,
	"scheduled_days" integer DEFAULT 0 NOT NULL,
	"learning_steps" integer DEFAULT 0 NOT NULL,
	"reps" integer DEFAULT 0 NOT NULL,
	"lapses" integer DEFAULT 0 NOT NULL,
	"state" "card_state" DEFAULT 'New' NOT NULL,
	"last_review" timestamp,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"deck_id" integer NOT NULL,
	CONSTRAINT "card_flashcard_id_user_id_key" UNIQUE("flashcard_id","user_id")
);
--> statement-breakpoint
ALTER TABLE "flashcard_study" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "profiles" (
	"id" uuid PRIMARY KEY NOT NULL,
	"source_language" varchar(3) NOT NULL,
	"target_language" varchar(3) NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "profiles" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "review_log" (
	"id" serial PRIMARY KEY NOT NULL,
	"flashcard_study_id" integer NOT NULL,
	"rating" "rating" NOT NULL,
	"state" "card_state" NOT NULL,
	"due" timestamp NOT NULL,
	"stability" double precision NOT NULL,
	"difficulty" double precision NOT NULL,
	"elapsed_days" integer NOT NULL,
	"last_elapsed_days" integer NOT NULL,
	"scheduled_days" integer NOT NULL,
	"learning_steps" integer NOT NULL,
	"review" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
ALTER TABLE "review_log" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "deck" ADD CONSTRAINT "deck_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deck_study" ADD CONSTRAINT "deck_study_deck_id_fkey" FOREIGN KEY ("deck_id") REFERENCES "public"."deck"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deck_study" ADD CONSTRAINT "deck_study_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "flashcard" ADD CONSTRAINT "flashcard_deck_id_fkey" FOREIGN KEY ("deck_id") REFERENCES "public"."deck"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "flashcard_study" ADD CONSTRAINT "card_flashcard_id_fkey" FOREIGN KEY ("flashcard_id") REFERENCES "public"."flashcard"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "flashcard_study" ADD CONSTRAINT "card_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "flashcard_study" ADD CONSTRAINT "fk_card_deck_id" FOREIGN KEY ("deck_id") REFERENCES "public"."deck"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_log" ADD CONSTRAINT "review_log_card_id_fkey" FOREIGN KEY ("flashcard_study_id") REFERENCES "public"."flashcard_study"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "idx_only_one_default_deck" ON "deck" USING btree ("user_id" uuid_ops) WHERE (is_default = true);--> statement-breakpoint
CREATE UNIQUE INDEX "idx_unique_deck_name_per_user" ON "deck" USING btree (user_id,lower((name)::text));--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_flashcard_study_deck_id" ON "flashcard_study" USING btree ("deck_id" int4_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_flashcard_study_due" ON "flashcard_study" USING btree ("user_id" timestamp_ops,"due" uuid_ops) WHERE (state <> 'New'::card_state);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_flashcard_study_user_state" ON "flashcard_study" USING btree ("user_id" enum_ops,"state" enum_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_review_log_flashcard_study_id" ON "review_log" USING btree ("flashcard_study_id" int4_ops);--> statement-breakpoint
CREATE POLICY "owned entity access" ON "deck" AS PERMISSIVE FOR ALL TO public USING ((( SELECT auth.uid() AS uid) = user_id));--> statement-breakpoint
CREATE POLICY "public entity read access" ON "deck" AS PERMISSIVE FOR SELECT TO public;--> statement-breakpoint
CREATE POLICY "owned entity access" ON "deck_study" AS PERMISSIVE FOR ALL TO public USING ((( SELECT auth.uid() AS uid) = user_id));--> statement-breakpoint
CREATE POLICY "owned entity access" ON "flashcard" AS PERMISSIVE FOR ALL TO public USING ((EXISTS ( SELECT 1
   FROM deck
  WHERE ((deck.id = flashcard.deck_id) AND (( SELECT auth.uid() AS uid) = deck.user_id)))));--> statement-breakpoint
CREATE POLICY "public entity read access" ON "flashcard" AS PERMISSIVE FOR SELECT TO public;--> statement-breakpoint
CREATE POLICY "owned entity access" ON "flashcard_study" AS PERMISSIVE FOR ALL TO public USING ((( SELECT auth.uid() AS uid) = user_id));--> statement-breakpoint
CREATE POLICY "owned entity access" ON "profiles" AS PERMISSIVE FOR ALL TO public USING ( (select auth.uid()) = "profiles"."id");--> statement-breakpoint
CREATE POLICY "owned entity access" ON "review_log" AS PERMISSIVE FOR ALL TO public USING ((EXISTS ( SELECT 1
   FROM flashcard_study
  WHERE ((flashcard_study.id = review_log.flashcard_study_id) AND (flashcard_study.user_id = ( SELECT auth.uid() AS uid))))));