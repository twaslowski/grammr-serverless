"use client";

import React from "react";
import { Github, Mail } from "lucide-react";

const footerColumns = [
  {
    header: "Get in touch",
    entries: [
      <a
        key="mail"
        href="mailto:contact@grammr.app"
        className="p-3 rounded-lg bg-primary-500/10 text-primary-400 hover:bg-primary-500/20 hover:text-primary-300 transition-all duration-200 hover:scale-110"
        aria-label="Email us"
      >
        <Mail className="w-5 h-5" />
      </a>,
      <a
        key="github"
        href="https://github.com/twaslowski/grammr-serverless"
        className="p-3 rounded-lg bg-primary-500/10 text-primary-400 hover:bg-primary-500/20 hover:text-primary-300 transition-all duration-200 hover:scale-110"
        aria-label="View on GitHub"
      >
        <Github className="w-5 h-5" />
      </a>,
    ],
  },
  {
    header: "Legal",
    entries: [
      <a
        key="privacy"
        href="/legal"
        className="text-primary-400 hover:text-primary-200 transition-colors duration-200 text-sm"
      >
        Privacy Policy
      </a>,
    ],
  },
];

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full border-t border-primary-700/30 bg-gradient-to-b from-transparent to-primary-900/20">
      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Main footer content */}
        <div className="flex flex-col md:flex-row justify-between items-start gap-8 mb-8">
          {footerColumns.map((column, index) => (
            <div key={`${column.header}-${index}`} className="flex-shrink-0">
              <h4 className="font-semibold text-sm uppercase tracking-wider text-primary-300 mb-4">
                {column.header}
              </h4>
              <div className="flex gap-3 items-center">{column.entries}</div>
            </div>
          ))}

          {/* Tagline section */}
          <div className="flex-1 md:text-right">
            <p className="text-primary-400 text-sm italic leading-relaxed">
              Made with care to help you learn languages{" "}
              <span className="text-primary-300 font-medium">
                systematically
              </span>
              .
            </p>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-6 border-t border-primary-700/30 flex flex-col md:flex-row justify-between items-center gap-3">
          <p className="text-xs text-primary-500">
            &copy; {currentYear} grammr. All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-xs text-primary-500">
            <span>Version 0.1.0</span>
            <span className="hidden md:inline">•</span>
            <span className="hidden md:inline">Built with Next.js</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
