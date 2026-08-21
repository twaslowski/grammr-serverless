import { createBrowserClient } from "@supabase/ssr";

function create() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );
}

let instance: ReturnType<typeof create> | undefined;

/**
 * Returns the shared Supabase browser client.
 *
 * The client is memoised because callers commonly hold on to it across
 * renders (e.g. in effect dependency arrays); handing out a fresh instance
 * each time causes subscriptions to be torn down and re-established.
 */
export function createClient() {
  instance ??= create();

  return instance;
}
