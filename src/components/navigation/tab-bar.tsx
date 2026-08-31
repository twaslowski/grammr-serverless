"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { isTabActive, Tab, TABS } from "@/components/navigation/tabs";
import { cn } from "@/lib/utils";

/**
 * The same four tabs, rendered two ways.
 *
 * On a phone they belong at the bottom, within thumb reach and clear of the
 * home indicator; on a desktop a bottom-anchored bar looks like a mistake, so
 * the same list runs horizontally under the header. Both are always in the DOM
 * and swapped with a media query rather than a `useMediaQuery` hook, which
 * would flash the wrong one on hydration.
 */

export function TopTabs() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Main"
      className="hidden border-b border-b-muted-foreground/10 md:block"
    >
      <ul className="mx-auto flex max-w-4xl gap-1 px-6">
        {TABS.map((tab) => (
          <li key={tab.href}>
            <TopTab tab={tab} active={isTabActive(tab.href, pathname)} />
          </li>
        ))}
      </ul>
    </nav>
  );
}

function TopTab({ tab, active }: { tab: Tab; active: boolean }) {
  const Icon = tab.icon;

  return (
    <Link
      href={tab.href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex min-h-11 items-center gap-2 border-b-2 px-4 text-sm font-medium transition-colors",
        active
          ? "border-primary text-foreground"
          : "border-transparent text-muted-foreground hover:text-foreground",
      )}
    >
      <Icon className="h-4 w-4" />
      {tab.label}
    </Link>
  );
}

export function BottomTabBar() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-t-muted-foreground/10 bg-background pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      <ul className="flex">
        {TABS.map((tab) => (
          <li key={tab.href} className="flex-1">
            <BottomTab tab={tab} active={isTabActive(tab.href, pathname)} />
          </li>
        ))}
      </ul>
    </nav>
  );
}

function BottomTab({ tab, active }: { tab: Tab; active: boolean }) {
  const Icon = tab.icon;

  return (
    <Link
      href={tab.href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex min-h-14 flex-col items-center justify-center gap-1 text-xs transition-colors",
        active ? "text-primary" : "text-muted-foreground",
      )}
    >
      <Icon className={cn("h-5 w-5", active && "fill-primary/10")} />
      {tab.label}
    </Link>
  );
}
