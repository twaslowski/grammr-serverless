CREATE TABLE public.flashcard
(
    id         integer                     NOT NULL DEFAULT nextval('flashcard_id_seq'::regclass),
    deck_id    integer,
    front      text                        NOT NULL,
    back       jsonb                       NOT NULL,
    notes      text,
    version    integer                              DEFAULT 1,
    created_at timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT flashcard_pkey PRIMARY KEY (id),
    CONSTRAINT flashcard_deck_id_fkey FOREIGN KEY (deck_id) REFERENCES public.deck (id)
);