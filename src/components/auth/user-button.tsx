"use client";

import { UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import React from "react";
import Link from "next/link";

export function UserButton() {
  return (
    <Button aria-label="user-menu">
      <Link href={"/dashboard/profile"}>
        <UserIcon />
      </Link>
    </Button>
  );
}
