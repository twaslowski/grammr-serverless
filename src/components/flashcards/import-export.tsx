"use client";

import React, { useRef, useState } from "react";
import { Download, FileJson, Loader2, Upload } from "lucide-react";
import toast from "react-hot-toast";

import { FlashcardExportSchema } from "@/app/api/v1/flashcards/schema";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useConfirm } from "@/components/ui/confirmation-provider";
import { exportFlashcards, importFlashcards } from "@/lib/flashcards";

/**
 * Backup and restore, the only deck-shaped operation left in the UI.
 *
 * There is no deck picker: a user has one deck, so the import goes there. The
 * API still accepts an explicit `deckId` for anything scripted against it.
 */
export function FlashcardImportExport() {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const confirm = useConfirm();

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const blob = await exportFlashcards();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `flashcards-export-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Flashcards exported successfully!");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to export flashcards";
      toast.error(message);
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      let raw: unknown;
      try {
        raw = JSON.parse(text);
      } catch {
        toast.error("Failed to import flashcards");
        return;
      }

      // The file we are reading is what `GET /flashcards/export` wrote, so
      // validate it against that schema rather than spot-checking two fields.
      const parsed = FlashcardExportSchema.safeParse(raw);
      if (!parsed.success) {
        toast.error("Failed to import flashcards");
        return;
      }

      const { version, flashcards } = parsed.data;
      const count = flashcards.length;

      confirm({
        title: "Import flashcards",
        description: `Add ${count} flashcard${count === 1 ? "" : "s"} to your deck?`,
        confirmText: "Import",
        onConfirm: async () => {
          setIsImporting(true);
          try {
            const result = await importFlashcards({ version, flashcards });
            toast.success(
              `Successfully imported ${result.imported_count} flashcards!`,
            );
          } catch (error) {
            const message =
              error instanceof Error
                ? error.message
                : "Failed to import flashcards";
            toast.error(message);
          } finally {
            setIsImporting(false);
          }
        },
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to read file";
      toast.error(message);
    } finally {
      // Reset the file input so re-picking the same file fires a change event.
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileJson className="h-5 w-5" />
          Export &amp; import
        </CardTitle>
        <CardDescription>
          Back your flashcards up to a JSON file, or restore them from one.
          Learning progress is not included.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 sm:flex-row">
        <Button
          onClick={handleExport}
          disabled={isExporting}
          variant="outline"
          className="flex min-h-11 items-center gap-2"
        >
          {isExporting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          {isExporting ? "Exporting..." : "Export flashcards"}
        </Button>

        <Button
          onClick={handleImportClick}
          disabled={isImporting}
          variant="outline"
          className="flex min-h-11 items-center gap-2"
        >
          {isImporting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Upload className="h-4 w-4" />
          )}
          {isImporting ? "Importing..." : "Import flashcards"}
        </Button>

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".json,application/json"
          className="hidden"
        />
      </CardContent>
    </Card>
  );
}
