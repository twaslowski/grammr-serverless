import { BookOpen, Languages, Layers, LucideIcon, Zap } from "lucide-react";

export interface Tab {
  label: string;
  href: string;
  icon: LucideIcon;
}

/**
 * The whole app, in four entries.
 *
 * There is deliberately no per-language filtering here. Its predecessor,
 * `DashboardNav`, took an `availableForLanguages` list and a `learnedLanguage`
 * prop — and was rendered without the prop, so it never filtered anything. With
 * one target language the mechanism has nothing to do, and reintroducing it
 * would reintroduce that failure mode.
 */
export const TABS: Tab[] = [
  { label: "Study", href: "/dashboard", icon: Zap },
  { label: "Cards", href: "/dashboard/flashcards", icon: Layers },
  { label: "Dictionary", href: "/dashboard/dictionary", icon: BookOpen },
  { label: "Translate", href: "/dashboard/translate", icon: Languages },
];

/**
 * Whether `href` is the tab the given path belongs to.
 *
 * `/dashboard` matches exactly — a prefix match would light up Study on every
 * page in the app. Everything else matches on prefix so that nested routes keep
 * their tab active.
 */
export function isTabActive(href: string, pathname: string): boolean {
  if (href === "/dashboard") {
    return pathname === "/dashboard";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}
