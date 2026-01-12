import { createClient } from "jsr:@supabase/supabase-js@2";

export interface AuthResult {
  success: boolean;
  userId?: string;
  error?: string;
}

/**
 * Validates the JWT token from the request and returns the authenticated user.
 * Returns an error if the token is missing, invalid, or the user is not found.
 */
export async function validateAuth(req: Request): Promise<AuthResult> {
  const authHeader = req.headers.get("Authorization");

  if (!authHeader) {
    return { success: false, error: "Missing authorization header" };
  }

  const token = authHeader.replace("Bearer ", "");

  if (!token) {
    return { success: false, error: "Missing token" };
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !supabaseServiceKey) {
    return { success: false, error: "Server configuration error" };
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);

  if (error || !user) {
    return { success: false, error: error?.message || "Invalid token" };
  }

  return { success: true, userId: user.id };
}
