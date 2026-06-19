-- Consolidate morphological analysis types with the analysis flashcard.back type.
-- flashcard.back.source_phrase has to be renamed to flashcard.back.text
-- Additionally, flashcard.back.language is introduced and should be equal to the language of the deck the flashcard belongs to.

UPDATE flashcard f
SET back = jsonb_set(
        jsonb_set(
                back - 'source_phrase',
                '{text}',
                back -> 'source_phrase'
        ),
        '{language}',
        to_jsonb(d.language)
           )
FROM deck d
WHERE f.deck_id = d.id
  AND f.back ->> 'type' = 'analysis';
