"use client";

import {
  DownloadIcon,
  HelpCircleIcon,
  Laptop,
  LogOut,
  Moon,
  Settings,
  Sun,
  UserIcon,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useIsClient, useIsIOS, useIsStandalone } from "@/lib/client-only";
import { createClient } from "@/lib/supabase/client";

/**
 * Everything that is not one of the four tabs.
 *
 * Settings, help, theme, install and sign-out were five separate controls
 * competing with the app itself for header space. None of them is a daily
 * action, so they collapse into one menu.
 */
export function UserMenu() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const isClient = useIsClient();
  const isIOS = useIsIOS();
  const isStandalone = useIsStandalone();

  const logout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/auth/login");
  };

  // iOS has no `beforeinstallprompt`, so it gets the manual walkthrough; every
  // other platform gets the browser's own prompt, and an already-installed app
  // needs neither.
  const showInstall = isIOS && !isStandalone;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label="user-menu"
          className="min-h-11 min-w-11"
        >
          <UserIcon className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuItem asChild>
          <Link href="/dashboard/settings">
            <Settings className="h-4 w-4" />
            Settings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/help">
            <HelpCircleIcon className="h-4 w-4" />
            Help &amp; Support
          </Link>
        </DropdownMenuItem>
        {showInstall && (
          <DropdownMenuItem asChild>
            <Link href="/help/pwa">
              <DownloadIcon className="h-4 w-4" />
              Install app
            </Link>
          </DropdownMenuItem>
        )}

        {/* The resolved theme is only known on the client. */}
        {isClient && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              Theme
            </DropdownMenuLabel>
            <DropdownMenuRadioGroup value={theme} onValueChange={setTheme}>
              <DropdownMenuRadioItem value="light">
                <Sun className="h-4 w-4" />
                Light
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="dark">
                <Moon className="h-4 w-4" />
                Dark
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="system">
                <Laptop className="h-4 w-4" />
                System
              </DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </>
        )}

        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => void logout()}>
          <LogOut className="h-4 w-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
