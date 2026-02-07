CREATE TABLE public.deck_study
(
    id              uuid                        NOT NULL DEFAULT gen_random_uuid(),
    deck_id         integer,
    user_id         uuid,
    last_studied_at timestamp without time zone,
    is_active       boolean                              DEFAULT true,
    created_at      timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT deck_study_pkey PRIMARY KEY (id),
    CONSTRAINT deck_study_deck_id_fkey FOREIGN KEY (deck_id) REFERENCES public.deck (id),
    CONSTRAINT deck_study_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users (id)
);
