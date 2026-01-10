import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";
import { AuthButton } from "@/components/auth/auth-button";
import { ThemeSwitcher } from "@/components/theme-switcher";

export const Header = () => {
  return (
    <div className="flex items-center justify-between p-2">
      <Link href="/">
        <Button size="icon" variant="ghost" aria-label="Home">
          <Home className="w-6 h-6" />
        </Button>
      </Link>

      <div className="flex items-center gap-4">
        <AuthButton />
        <ThemeSwitcher />
      </div>
    </div>
  );
};
