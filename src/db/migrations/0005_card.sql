CREATE TABLE public.card
(
    id             integer                     NOT NULL DEFAULT nextval('card_id_seq'::regclass),
    flashcard_id   integer                     NOT NULL,
    user_id        uuid                        NOT NULL,
    due            timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    stability      double precision            NOT NULL DEFAULT 0,
    difficulty     double precision            NOT NULL DEFAULT 0,
    elapsed_days   integer                     NOT NULL DEFAULT 0,
    scheduled_days integer                     NOT NULL DEFAULT 0,
    learning_steps integer                     NOT NULL DEFAULT 0,
    reps           integer                     NOT NULL DEFAULT 0,
    lapses         integer                     NOT NULL DEFAULT 0,
    state USER -DEFINED NOT NULL DEFAULT 'New'::card_state,
    last_review    timestamp without time zone,
    created_at     timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at     timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deck_id        integer                     NOT NULL,
    CONSTRAINT card_pkey PRIMARY KEY (id),
    CONSTRAINT card_flashcard_id_fkey FOREIGN KEY (flashcard_id) REFERENCES public.flashcard (id),
    CONSTRAINT card_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users (id),
    CONSTRAINT fk_card_deck_id FOREIGN KEY (deck_id) REFERENCES public.deck (id)
);

