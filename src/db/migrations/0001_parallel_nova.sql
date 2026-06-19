DROP INDEX "idx_flashcard_study_deck_id";--> statement-breakpoint
DROP INDEX "idx_flashcard_study_due";--> statement-breakpoint
DROP INDEX "idx_flashcard_study_user_state";--> statement-breakpoint
CREATE INDEX "idx_flashcard_study_deck_id" ON "flashcard_study" USING btree ("deck_id");--> statement-breakpoint
CREATE INDEX "idx_flashcard_study_due" ON "flashcard_study" USING btree ("user_id","due") WHERE (state <> 'New'::card_state);--> statement-breakpoint
CREATE INDEX "idx_flashcard_study_user_state" ON "flashcard_study" USING btree ("user_id","state");--> statement-breakpoint
ALTER POLICY "owned entity access" ON "profiles" TO public USING ((( SELECT auth.uid() AS uid) = id));