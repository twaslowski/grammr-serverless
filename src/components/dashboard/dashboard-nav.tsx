"use client";

import Link from "next/link";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Languages,
  Table2,
  Layers,
  Settings,
  LucideIcon,
  ArrowRight,
  HammerIcon,
  BookOpen,
} from "lucide-react";
import { LanguageCode } from "@/types/languages";

export interface DashboardNavItem {
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
  disabled?: boolean;
  /** Languages for which this feature is available. If undefined, available for all languages. */
  availableForLanguages?: LanguageCode[];
}

const defaultNavItems: DashboardNavItem[] = [
  {
    title: "Translations",
    description: "Analyze and translate sentences with word-by-word breakdowns",
    href: "/dashboard/translate",
    icon: Languages,
    // Available for all languages
  },
  {
    title: "Inflection Tables",
    description: "Look up conjugation and declension tables for words",
    href: "/dashboard/inflect",
    icon: Table2,
    availableForLanguages: ["ru"],
  },
  {
    title: "Flashcards",
    description: "Create and manage flashcard decks for vocabulary practice",
    href: "/dashboard/flashcards",
    icon: Layers,
  },
  {
    title: "Study",
    description: "Review your flashcards with spaced repetition",
    href: "/dashboard/study",
    icon: BookOpen,
  },
  {
    title: "Tools",
    description: "Access various useful little language learning tools",
    href: "/dashboard/tools",
    icon: HammerIcon,
  },
  {
    title: "Profile Settings",
    description: "Manage your profile, languages, and preferences",
    href: "/dashboard/profile",
    icon: Settings,
  },
];

/**
 * Filters navigation items based on the user's learned language.
 * Items without availableForLanguages are shown to all users.
 */
export function getNavItemsForLanguage(
  learnedLanguage: LanguageCode,
  items: DashboardNavItem[] = defaultNavItems,
): DashboardNavItem[] {
  return items.filter(
    (item) =>
      !item.availableForLanguages ||
      item.availableForLanguages.includes(learnedLanguage),
  );
}

interface DashboardNavProps {
  items?: DashboardNavItem[];
  learnedLanguage?: LanguageCode;
}

export function DashboardNav({
  items = defaultNavItems,
  learnedLanguage,
}: DashboardNavProps) {
  const filteredItems = learnedLanguage
    ? getNavItemsForLanguage(learnedLanguage, items)
    : items;

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {filteredItems.map((item) => (
        <DashboardNavCard key={item.href} item={item} />
      ))}
    </div>
  );
}

interface DashboardNavCardProps {
  item: DashboardNavItem;
}

function DashboardNavCard({ item }: DashboardNavCardProps) {
  const Icon = item.icon;

  if (item.disabled) {
    return (
      <Card className="opacity-50 cursor-not-allowed">
        <CardHeader className="flex flex-row items-start gap-4">
          <div className="p-2 bg-muted rounded-lg">
            <Icon className="h-6 w-6 text-muted-foreground" />
          </div>
          <div className="flex-1 space-y-1">
            <CardTitle className="text-lg flex items-center gap-2">
              {item.title}
              <span className="text-xs font-normal text-muted-foreground">
                Coming soon
              </span>
            </CardTitle>
            <CardDescription>{item.description}</CardDescription>
          </div>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Link href={item.href} className="group">
      <Card className="h-full transition-colors hover:bg-accent/50 hover:border-accent-foreground/20">
        <CardHeader className="flex flex-row items-start gap-4">
          <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
            <Icon className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1 space-y-1">
            <CardTitle className="text-lg flex items-center gap-2">
              {item.title}
              <ArrowRight className="h-4 w-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
            </CardTitle>
            <CardDescription>{item.description}</CardDescription>
          </div>
        </CardHeader>
      </Card>
    </Link>
  );
}
