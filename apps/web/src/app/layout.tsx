import React from 'react';
import ChatBot from '@/components/Chat/ChatBot';
import './globals.css';
import Link from 'next/link';
import { Manrope, IBM_Plex_Mono } from 'next/font/google';
import { ShieldAlert, Globe2, Activity, Database, Search, BarChart3 } from 'lucide-react';

/* --- Google Font Optimization via next/font -----------------------------
   Loaded at build time, self-hosted, no CLS flash.
   Manrope: refined display/headings (weights 400-800)
   IBM Plex Mono: technical data/mono (weights 400,500,600)
   ---------------------------------------------------------------------- */
const manrope = Manrope({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-display',
  weight: ['400', '500', '600', '700', '800'],
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-mono',
  weight: ['400', '500', '600'],
});

export const metadata = {
  title: 'TerraGuard AI | Global Disaster Intelligence Command Center',
  description: 'Autonomous global AI natural disaster forecasting, risk assessment, and early-warning decision support platform.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`dark ${manrope.variable} ${ibmPlexMono.variable}`}
    >
      <body className="bg-ink-bg text-content-primary min-h-screen flex flex-col antialiased font-sans">
        {/* Navigation Command Header */}
        <header className="sticky top-0 z-50 mx-3 mt-3 flex h-16 items-center justify-between rounded-lg border border-ink-border bg-ink-surface/75 px-4 shadow-raised backdrop-blur-xl md:mx-6 md:px-5">
          <div className="flex items-center space-x-3">
            <Link href="/" className="flex items-center space-x-2 group">
              <div className="flex h-9 w-9 items-center justify-center rounded-md bg-gradient-to-tr from-accent-bright to-accent-deep shadow-card transition-transform group-hover:scale-105">
                <Globe2 className="h-5 w-5 text-ink-bg" />
              </div>
              <span className="text-lg font-semibold tracking-[-0.045em] text-content-primary">
                TERRAGUARD<span className="ml-1 font-mono text-sm text-accent-bright">AI</span>
              </span>
            </Link>
            <span className="hidden rounded border-accent/20 bg-accent/10 px-2.5 py-1 font-mono text-[10px] text-accent-bright md:inline-block">
              GLOBAL INTEL
            </span>
          </div>

          <nav className="flex items-center space-x-1 text-sm font-medium md:space-x-2">
            <Link
              href="/"
              className="hidden rounded px-3 py-2 text-content-secondary transition hover:bg-ink-raised hover:text-content-primary sm:flex sm:items-center sm:space-x-1.5"
            >
              <Activity className="w-4 h-4 text-accent-bright" />
              <span>Command Center</span>
            </Link>
            <Link
              href="/location"
              className="rounded px-3 py-2 text-content-secondary transition hover:bg-ink-raised hover:text-content-primary flex items-center space-x-1.5"
            >
              <Search className="w-4 h-4 text-accent" />
              <span>Location Risk</span>
            </Link>
            <Link
              href="/sources"
              className="hidden rounded px-3 py-2 text-content-secondary transition hover:bg-ink-raised hover:text-content-primary md:flex md:items-center md:space-x-1.5"
            >
              <Database className="w-4 h-4 text-status-ok" />
              <span>Sources & Health</span>
            </Link>
            <Link
              href="/analytics"
              className="hidden rounded px-3 py-2 text-content-secondary transition hover:bg-ink-raised hover:text-content-primary lg:flex lg:items-center lg:space-x-1.5"
            >
              <BarChart3 className="w-4 h-4 text-status-info" />
              <span>Analytics</span>
            </Link>
          </nav>

          <div className="hidden lg:flex items-center space-x-2">
            <div className="relative flex h-2.5 w-2.5"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-status-ok opacity-70" /><span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-status-ok" /></div>
            <span className="font-mono text-[10px] text-status-ok">LIVE</span>
          </div>
        </header>

        <main className="flex-1 flex flex-col">{children}</main>
        <ChatBot />
      </body>
    </html>
  );
}
