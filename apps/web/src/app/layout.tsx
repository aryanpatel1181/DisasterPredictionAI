import React from 'react';
import ChatBot from '@/components/Chat/ChatBot';
import './globals.css';
import Link from 'next/link';
import { Manrope, IBM_Plex_Mono } from 'next/font/google';
import { ShieldAlert, Globe2, Activity, Database, Search } from 'lucide-react';

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
      <body className="bg-dark-bg text-slate-100 min-h-screen flex flex-col antialiased font-sans">
        {/* Navigation Command Header */}
        <header className="sticky top-0 z-50 mx-3 mt-3 flex h-16 items-center justify-between rounded-2xl border border-white/[0.09] bg-[#0c121e]/75 px-4 shadow-2xl shadow-black/20 backdrop-blur-xl md:mx-6 md:px-5">
          <div className="flex items-center space-x-3">
            <Link href="/" className="flex items-center space-x-2 group">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-violet-400 to-indigo-600 shadow-lg shadow-violet-500/20 transition-transform group-hover:scale-105">
                <Globe2 className="h-5 w-5 text-slate-950" />
              </div>
              <span className="text-lg font-semibold tracking-[-0.045em] text-white">
                TERRAGUARD<span className="ml-1 font-mono text-sm text-violet-300">AI</span>
              </span>
            </Link>
            <span className="hidden rounded-full border border-violet-500/20 bg-violet-500/10 px-2.5 py-1 font-mono text-[10px] text-violet-200 md:inline-block">
              GLOBAL INTEL
            </span>
          </div>

          <nav className="flex items-center space-x-1 text-sm font-medium md:space-x-2">
            <Link
              href="/"
              className="hidden rounded-lg px-3 py-2 text-slate-300 transition hover:bg-white/[0.07] hover:text-white sm:flex sm:items-center sm:space-x-1.5"
            >
              <Activity className="w-4 h-4 text-violet-400" />
              <span>Command Center</span>
            </Link>
            <Link
              href="/location"
              className="rounded-lg px-3 py-2 text-slate-300 transition hover:bg-white/[0.07] hover:text-white flex items-center space-x-1.5"
            >
              <Search className="w-4 h-4 text-purple-400" />
              <span>Location Risk</span>
            </Link>
            <Link
              href="/sources"
              className="hidden rounded-lg px-3 py-2 text-slate-300 transition hover:bg-white/[0.07] hover:text-white md:flex md:items-center md:space-x-1.5"
            >
              <Database className="w-4 h-4 text-emerald-400" />
              <span>Sources & Health</span>
            </Link>
          </nav>

          <div className="hidden lg:flex items-center space-x-2">
            <div className="relative flex h-2.5 w-2.5"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-70" /><span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-300" /></div>
            <span className="font-mono text-[10px] text-emerald-300">LIVE</span>
          </div>
        </header>

        <main className="flex-1 flex flex-col">{children}</main>
        <ChatBot />
      </body>
    </html>
  );
}
