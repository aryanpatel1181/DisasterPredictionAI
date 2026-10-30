import React from 'react';
import Link from 'next/link';
import { Globe2, ArrowUpRight } from 'lucide-react';
import ChatBot from '@/components/Chat/ChatBot';
import './globals.css';
import './portfolio.css';

export const metadata = {
  title: 'TerraGuard — A clearer view of a changing planet',
  description: 'Explore global hazard observations, inspect source evidence, and ask TerraGuard about disaster preparedness.',
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en" className="dark"><body>
    <a className="skip-link" href="#main-content">Skip to content</a>
    <header className="tg-nav"><Link href="/" className="tg-brand"><Globe2 size={25}/> TerraGuard<span>AI</span></Link>
      <nav aria-label="Main navigation"><Link href="/#monitor">Observatory</Link><Link href="/weather">Weather Atlas</Link><Link href="/sources">Data sources</Link><Link href="/about">The project <ArrowUpRight size={13}/></Link></nav>
      <span className="tg-version">EARTH INTELLIGENCE / 01</span>
    </header>
    <main id="main-content">{children}</main>
    <footer className="tg-footer"><span>TerraGuard AI · Built to make complex signals understandable.</span><span>Experimental decision support. Follow official local guidance.</span></footer>
    <ChatBot/>
  </body></html>;
}

