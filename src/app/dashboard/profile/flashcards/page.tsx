"use client";

import React, { useRef, useState } from "react";
import { Download, FileJson, Loader2, Upload } from "lucide-react";
import toast from "react-hot-toast";

import { PageLayout } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { exportFlashcards, importFlashcards } from "@/lib/flashcards";

export default function FlashcardImportExportPage() {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  function handleError() {
    toast.error("Failed to import flashcards");
    setIsImporting(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      const text = await file.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        handleError();
        return;
      }

      if (!data.version || !Array.isArray(data.flashcards)) {
        handleError();
        return;
      }

      const result = await importFlashcards(data);
      toast.success(
        `Successfully imported ${result.imported_count} flashcards!`,
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to import flashcards";
      toast.error(message);
    } finally {
      setIsImporting(false);
      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <PageLayout
      header={{
        title: "Import & Export Flashcards",
        description:
          "Easily back up or transfer your flashcards by exporting them to a JSON file, or import flashcards from a previously exported file.",
        backHref: "/dashboard/profile",
        backLabel: "Back to settings",
      }}
    >
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Data Management</h2>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileJson className="h-5 w-5" />
              Export & Import Flashcards
            </CardTitle>
            <CardDescription>
              Export your flashcards to a JSON file or import flashcards from a
              previously exported file. Note: Learning progress is not included
              in exports.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col sm:flex-row gap-4">
            <Button
              onClick={handleExport}
              disabled={isExporting}
              variant="outline"
              className="flex items-center gap-2"
            >
              {isExporting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              {isExporting ? "Exporting..." : "Export Flashcards"}
            </Button>

            <Button
              onClick={handleImportClick}
              disabled={isImporting}
              variant="outline"
              className="flex items-center gap-2"
            >
              {isImporting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              {isImporting ? "Importing..." : "Import Flashcards"}
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
      </section>
    </PageLayout>
  );
}
