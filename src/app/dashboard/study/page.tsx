import { redirect } from "next/navigation";

/**
 * Studying moved to `/dashboard`, the first tab. Kept as a redirect so
 * bookmarks, the PWA shortcut and any link still pointing here keep working.
 */
export default function StudyPage() {
  redirect("/dashboard");
}
