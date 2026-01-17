"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Volume2, Loader2 } from "lucide-react";
import { useProfile } from "@/components/dashboard/profile-provider";
import toast from "react-hot-toast";

interface TTSButtonProps {
  text: string;
  variant?: "default" | "ghost" | "outline";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
}

export function TTSButton({
  text,
  variant = "outline",
  size = "icon",
  className,
}: TTSButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const profile = useProfile();
  const language = profile.target_language;

  const handlePlay = async () => {
    if (isLoading || !language) return;

    // If already playing, stop the current audio
    if (isPlaying && audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/v1/tts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text, language }),
      });

      if (!response.ok) {
        toast.error("Failed to play audio");
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);

      // Clean up previous audio if exists
      if (audioRef.current) {
        URL.revokeObjectURL(audioRef.current.src);
      }

      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      audio.onended = () => {
        setIsPlaying(false);
        URL.revokeObjectURL(audioUrl);
      };

      audio.onerror = () => {
        setIsPlaying(false);
        console.error("Audio playback error");
        toast.error("An error occurred during audio playback");
      };

      setIsPlaying(true);
      await audio.play();
    } catch (error) {
      console.error("TTS error:", error);
      toast.error("An error occurred while trying to play audio");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handlePlay}
      disabled={isLoading || !language}
      className={className}
      title={`Listen to "${text}"`}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Volume2 className={`h-4 w-4 ${isPlaying ? "text-primary" : ""}`} />
      )}
    </Button>
  );
}
