CREATE TABLE "lexeme_cache" (
	"id" serial PRIMARY KEY,
	"language" varchar(3) NOT NULL,
	"lemma" text NOT NULL,
	"lemma_norm" text NOT NULL,
	"pos" text NOT NULL,
	"lemma_features" jsonb NOT NULL,
	"senses" jsonb NOT NULL,
	"inflections" jsonb,
	"source" text NOT NULL,
	"hits" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "idx_lexeme_cache_identity" ON "lexeme_cache" ("language","lemma_norm","pos");--> statement-breakpoint
CREATE INDEX "idx_lexeme_cache_lemma" ON "lexeme_cache" ("language","lemma_norm");--> statement-breakpoint
ALTER POLICY "owned entity access" ON "flashcard" TO public USING ((EXISTS ( SELECT 1
                           FROM deck
                           WHERE ((deck.id = flashcard.deck_id) AND (( SELECT auth.uid() AS uid) = deck.user_id)))));--> statement-breakpoint
ALTER POLICY "owned entity access" ON "flashcard_study" TO public USING (((SELECT auth.uid() AS uid) = user_id));