import Link from "next/link";

import { AuthButton } from "@/components/auth/auth-button";

export const Header = () => {
  return (
    <div className="mx-auto flex w-full max-w-4xl items-center justify-between px-4 py-2 md:px-6">
      <Link href="/dashboard" className="text-lg font-bold tracking-tight">
        grammr
      </Link>

      <AuthButton />
    </div>
  );
};
