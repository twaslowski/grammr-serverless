CREATE TABLE public.review_log
(
    id                integer                     NOT NULL DEFAULT nextval('review_log_id_seq'::regclass),
    card_id           integer                     NOT NULL,
    rating USER -DEFINED NOT NULL,
    state USER -DEFINED NOT NULL,
    due               timestamp without time zone NOT NULL,
    stability         double precision            NOT NULL,
    difficulty        double precision            NOT NULL,
    elapsed_days      integer                     NOT NULL,
    last_elapsed_days integer                     NOT NULL,
    scheduled_days    integer                     NOT NULL,
    learning_steps    integer                     NOT NULL,
    review            timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at        timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT review_log_pkey PRIMARY KEY (id),
    CONSTRAINT review_log_card_id_fkey FOREIGN KEY (card_id) REFERENCES public.card (id)
);