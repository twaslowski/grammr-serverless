import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  // Check if user is authenticated
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/auth/login");
  }

  // Check if user has language preferences set
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("source_language, target_language")
    .eq("id", user.id)
    .single();

  if (error) {
    throw new Error(`Failed to create metric: ${error.message}`);
  }

  // If languages are not set, redirect to language selection
  if (!profile?.source_language || !profile?.target_language) {
    redirect("/auth/sign-up/select-language");
  }

  return (
    <main className="min-h-screen flex flex-col items-center p-6">
      {children}
    </main>
  );
}
