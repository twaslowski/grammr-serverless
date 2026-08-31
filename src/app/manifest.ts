import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/dashboard",
    name: "grammr – Learn Russian",
    short_name: "grammr",
    description:
      "Look up any Russian word, translate with a grammatical breakdown, and review it all with spaced repetition.",
    // Opens on the Study tab. Installed users are here to review, not to read
    // the landing page they already converted from.
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#000000",
    icons: [
      {
        src: "/favicon/android-chrome-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/favicon/android-chrome-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
    shortcuts: [
      { name: "Study", url: "/dashboard" },
      { name: "Cards", url: "/dashboard/flashcards" },
      { name: "Dictionary", url: "/dashboard/dictionary" },
      { name: "Translate", url: "/dashboard/translate" },
    ],
  };
}
