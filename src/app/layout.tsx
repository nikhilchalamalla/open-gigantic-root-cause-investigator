import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import { Terminal, History, Code2 } from "lucide-react";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Root-Cause Investigator | Open Gigantic",
  description: "AI-powered incident diagnostics, code parsing, and similar historical bug search.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} min-h-screen flex flex-col`}>
        {/* Glowing top border */}
        <div className="h-[2px] w-full bg-gradient-to-right bg-gradient-to-r from-violet-600 via-indigo-500 to-emerald-400" />
        
        {/* Navigation Navbar */}
        <header className="sticky top-0 z-50 w-full border-b border-white/5 bg-zinc-950/70 backdrop-blur-md">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-3 group">
              <div className="p-2 rounded-lg bg-violet-600/10 border border-violet-500/20 group-hover:border-violet-500/40 transition-colors">
                <Terminal className="h-5 w-5 text-violet-400" />
              </div>
              <div>
                <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
                  Root-Cause
                </span>
                <span className="ml-1 font-semibold text-sm px-2 py-0.5 rounded-full bg-violet-600/20 text-violet-300 border border-violet-500/20 uppercase tracking-widest text-[10px]">
                  Investigator
                </span>
              </div>
            </Link>

            {/* Nav links */}
            <nav className="flex items-center space-x-1 sm:space-x-2">
              <Link
                href="/"
                className="flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium text-zinc-300 hover:text-white hover:bg-white/5 transition-all"
              >
                <Code2 className="h-4 w-4" />
                <span>Analyzer</span>
              </Link>
              <Link
                href="/history"
                className="flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium text-zinc-300 hover:text-white hover:bg-white/5 transition-all"
              >
                <History className="h-4 w-4" />
                <span>History</span>
              </Link>
            </nav>
          </div>
        </header>

        {/* Core content body */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>

        {/* Footer */}
        <footer className="border-t border-white/5 bg-zinc-950/50 py-6 text-center text-xs text-zinc-500">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between space-y-2 sm:space-y-0">
            <p>© {new Date().getFullYear()} Open Gigantic Founding AI Engineer Assignment.</p>
            <p className="flex items-center space-x-1">
              <span>Built with</span>
              <span className="text-violet-400 font-semibold">Superbrain IDE</span>
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
