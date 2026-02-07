CREATE TABLE public.deck
(
    id          integer                     NOT NULL DEFAULT nextval('deck_id_seq'::regclass),
    name        character varying           NOT NULL,
    user_id     uuid,
    description text,
    is_default  boolean                              DEFAULT false,
    created_at  timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    visibility  text                        NOT NULL DEFAULT 'private'::text CHECK (visibility = ANY (ARRAY ['private'::text, 'public'::text])),
    language    character varying           NOT NULL,
    CONSTRAINT deck_pkey PRIMARY KEY (id),
    CONSTRAINT deck_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users (id)
);
