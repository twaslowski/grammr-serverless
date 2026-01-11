import Link from "next/link";
import { GithubIcon, Mail } from "lucide-react";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full border-t border-primary-700/50 py-12 mt-16">
      <div className="max-w-4xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* Product */}
          <div>
            <h4 className="font-semibold mb-4">Product</h4>
            <ul className="space-y-2 text-sm text-primary-300">
              <li>
                <Link href="/dashboard" className="hover:transition-colors">
                  Get Started
                </Link>
              </li>
              <li>
                <Link href="/#features" className="hover:transition-colors">
                  Features
                </Link>
              </li>
              <li>
                <a
                  href="https://github.com/twaslowski/grammr"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:transition-colors"
                >
                  GitHub
                </a>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-semibold mb-4">Company</h4>
            <ul className="space-y-2 text-sm text-primary-300">
              <li className="text-primary-400">Coming soon</li>
            </ul>
          </div>

          {/* Social */}
          <div>
            <h4 className="font-semibold mb-4">Connect</h4>
            <div className="flex gap-4">
              <a
                href="mailto:hello@grammr.io"
                className="p-2 rounded-full bg-primary-500/20 text-primary-400 hover:bg-primary-500/40 hover:text-primary-300 transition-colors"
              >
                <Mail className="w-5 h-5" />
              </a>
              <a
                href="https://github.com/twaslowski/grammr"
                className="p-2 rounded-full bg-primary-500/20 text-primary-400 hover:bg-primary-500/40 hover:text-primary-300 transition-colors"
              >
                <GithubIcon className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-primary-400">
          <p>&copy; {currentYear} grammr. All rights reserved.</p>
          <p>Made with care to help you learn languages systematically.</p>
        </div>
      </div>
    </footer>
  );
}
