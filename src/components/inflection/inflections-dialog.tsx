"use client";

import React, { useState } from "react";
import { Table2 } from "lucide-react";

import { InflectionsTable } from "@/components/inflection/inflections-table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Paradigm } from "@/types/inflections";

interface InflectionsDialogProps {
  paradigm: Paradigm;
  trigger?: React.ReactNode;
  displayHeader?: boolean;
  displayAddToFlashcards?: boolean;
  compact?: boolean;
}

export function InflectionsDialog({
  paradigm,
  trigger,
  compact = false,
  displayHeader = true,
  displayAddToFlashcards = false,
}: InflectionsDialogProps) {
  const [open, setOpen] = useState(false);

  const defaultTrigger = compact ? (
    <Button variant="outline" size="sm" className="gap-1">
      <Table2 className="h-4 w-4" />
    </Button>
  ) : (
    <Button variant="outline" className="gap-2">
      <Table2 className="h-4 w-4" />
      View Inflections
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger || defaultTrigger}</DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Inflections: {paradigm.lemma}</DialogTitle>
          <DialogDescription>
            Complete inflection table for {paradigm.lemma}
          </DialogDescription>
        </DialogHeader>
        <InflectionsTable
          paradigm={paradigm}
          displayAddFlashcard={displayAddToFlashcards}
          displayHeader={displayHeader}
        />
      </DialogContent>
    </Dialog>
  );
}
