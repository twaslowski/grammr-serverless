"use client";

import React from "react";
import { GithubIcon, Mail } from "lucide-react";

const footerColumns = [
  {
    header: "Get in touch",
    entries: [
      <a
        key="mail"
        href="mailto:contact@grammr.app"
        className="p-2 rounded-full bg-primary-500/20 text-primary-400 hover:bg-primary-500/40 hover:text-primary-300 transition-colors"
      >
        <Mail className="w-5 h-5" />
      </a>,
      <a
        key="github"
        href="https://github.com/twaslowski/grammr-serverless"
        className="p-2 rounded-full bg-primary-500/20 text-primary-400 hover:bg-primary-500/40 hover:text-primary-300 transition-colors"
      >
        <GithubIcon className="w-5 h-5" />
      </a>,
    ],
  },
  {
    header: "Legal",
    entries: [
      <a key="privacy" href="/legal">
        Privacy Policy
      </a>,
    ],
  },
];

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full border-t border-primary-700/50">
      <div className="flex flex-row justify-between mx-4 mt-4">
        {footerColumns.map((column, index) => (
          <div key={`${column.header}-${index}`}>
            <h4 className="font-semibold mb-4">{column.header}</h4>
            <div className="flex gap-4">{column.entries}</div>
          </div>
        ))}
      </div>

      {/* Bottom bar */}
      <div className="pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-primary-400">
        <p>&copy; {currentYear} grammr. All rights reserved.</p>
        <p>Made with care to help you learn languages systematically.</p>
      </div>
    </footer>
  );
}
