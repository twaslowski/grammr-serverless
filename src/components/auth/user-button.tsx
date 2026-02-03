"use client";

import React from "react";
import { UserIcon } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

export function UserButton() {
  return (
    <Button aria-label="user-menu">
      <Link href={"/dashboard/profile"}>
        <UserIcon />
      </Link>
    </Button>
  );
}
