-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.profiles
(
    id              uuid                                      NOT NULL PRIMARY KEY REFERENCES auth.users (id),
    source_language character varying                         NOT NULL,
    target_language character varying                         NOT NULL,
    created_at      timestamp without time zone DEFAULT now() NOT NULL,
    updated_at      timestamp without time zone DEFAULT now() NOT NULL
);
