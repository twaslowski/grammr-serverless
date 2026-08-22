import "./globals.css";

import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import Script from "next/script";
import { ThemeProvider } from "next-themes";
import { Toaster } from "react-hot-toast";

import { Header } from "@/components/header";
import { ServiceWorkerRegistration } from "@/components/pwa/service-worker-registration";
import { ConfirmationProvider } from "@/components/ui/confirmation-provider";

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(defaultUrl),
  title: "grammr - Language Learning Toolkit",
  icons: {
    icon: "/favicon/favicon.ico",
    shortcut: "/favicon/android-chrome-192x192.png",
    apple: "/favicon/apple-touch-icon.png",
  },
  manifest: "/manifest.webmanifest",
  description:
    "Understand grammar with context. Analyze sentences, build flashcard decks, and learn languages systematically.",
};

export const viewport: Viewport = {
  themeColor: "#000000",
};

const geistSans = Geist({
  variable: "--font-geist-sans",
  display: "swap",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.className} antialiased`}>
        <Script
          defer
          src="https://tracking.twaslowski.com/script.js"
          data-website-id="2ec9d61e-79f4-4a59-a12c-075bd04c54ae"
          strategy="afterInteractive"
        />
        <ServiceWorkerRegistration />
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <ConfirmationProvider>
            <div className="flex flex-col h-screen">
              <div className="border-b border-b-muted-foreground/10 shrink-0">
                <Header />
              </div>
              <Toaster />
              <main className="flex flex-col flex-1 p-6 overflow-auto">
                {children}
              </main>
            </div>
          </ConfirmationProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
