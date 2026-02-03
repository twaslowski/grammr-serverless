"use client";

import { useCallback, useState } from "react";
import CyrillicToTranslit from "cyrillic-to-translit-js";
import { ArrowLeftRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CopyButton } from "@/components/ui/copy-button";
import { Textarea } from "@/components/ui/textarea";

type TransliterationDirection = "toCyrillic" | "toLatin";

export function CyrillicTransliterator() {
  const [input, setInput] = useState("");
  const [direction, setDirection] =
    useState<TransliterationDirection>("toCyrillic");

  const cyrillicToTranslit = CyrillicToTranslit({ preset: "ru" });

  const getOutput = useCallback(() => {
    if (!input.trim()) return "";

    if (direction === "toCyrillic") {
      return cyrillicToTranslit.reverse(input);
    } else {
      return cyrillicToTranslit.transform(input);
    }
  }, [input, direction, cyrillicToTranslit]);

  const output = getOutput();

  const toggleDirection = () => {
    setDirection((prev) => (prev === "toCyrillic" ? "toLatin" : "toCyrillic"));
    setInput(output);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Cyrillic Transliterator
        </CardTitle>
        <CardDescription>
          Convert between Latin and Cyrillic script for Russian text
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
          <span
            className={
              direction === "toLatin" ? "font-medium text-foreground" : ""
            }
          >
            Cyrillic
          </span>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleDirection}
            className="h-8 w-8"
            title="Switch direction"
          >
            <ArrowLeftRight className="h-4 w-4" />
          </Button>
          <span
            className={
              direction === "toCyrillic" ? "font-medium text-foreground" : ""
            }
          >
            Latin
          </span>
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">
            {direction === "toCyrillic" ? "Latin input" : "Cyrillic input"}
          </label>
          <Textarea
            placeholder={
              direction === "toCyrillic"
                ? "Type in Latin script (e.g., 'privet')"
                : "Введите текст на русском"
            }
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="min-h-24"
          />
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">
            {direction === "toCyrillic" ? "Cyrillic output" : "Latin output"}
          </label>
          <div className="relative">
            <Textarea
              readOnly
              value={output}
              placeholder={
                direction === "toCyrillic"
                  ? "Результат появится здесь"
                  : "Result will appear here"
              }
              className="min-h-24 bg-muted/50"
            />
            {output && (
              <CopyButton
                text={output}
                className="absolute top-2 right-2 h-8 w-8"
              />
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
