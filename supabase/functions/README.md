# Edge Functions

The edge functions in this directory perform translation tasks.
The `_shared` directory contains shared code used by multiple functions for authentication,
CORS responses and logging.

## Authentication

The Supabase JWT verification is disabled currently, because it was causing issues.
Authentication is performed in the `auth.ts` file in the `_shared` directory.
This way, more fine-grained authentication can be implemented if needed, or rate-limiting.
