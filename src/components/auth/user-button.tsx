"use client";

import { UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import React from "react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
} from "@/components/ui/dropdown-menu";

export function UserButton() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button aria-label="User Menu">
          <UserIcon />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {/*<DropdownMenuItem onClick={() => router.push("/dashboard/account")}>*/}
        {/*  <CogIcon />*/}
        {/*  Your Account*/}
        {/*</DropdownMenuItem>*/}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
