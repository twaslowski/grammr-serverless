import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "grammr – Language Learning Toolkit",
    short_name: "grammr",
    description:
      "Understand grammar with context. Analyze sentences, build flashcard decks, and learn languages systematically.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#000000",
    icons: [
      {
        src: "/favicon/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/favicon/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
