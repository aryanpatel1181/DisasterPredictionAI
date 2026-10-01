'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Activity, AlertTriangle, ArrowUpRight, CheckCircle2, Database, ShieldAlert } from 'lucide-react';

/* ═══════════════════════════════════════════════════════════════════════════
   IntelligenceCards — Premium stat cards with:
   • Animated rotating conic-gradient border (CSS @property --angle)
   • Scroll-triggered staggered reveal
   • Counter count-up animation on first view
   • Mouse-tracking radial spotlight on hover
   • Pulsing ambient glow halos
   ═══════════════════════════════════════════════════════════════════════════ */

interface IntelligenceCardsProps {
  activeHazards: number;
  highRiskEvents: number;
  officialWarnings: number;
}

const cards = [
  { key: 'activeHazards', label: 'Active signals', detail: 'Across 5 hazard categories', icon: Activity, color: 'violet' },
  { key: 'highRiskEvents', label: 'Elevated risk', detail: 'Above 70% calibrated probability', icon: AlertTriangle, color: 'amber' },
  { key: 'officialWarnings', label: 'Official warnings', detail: 'Verified agency advisories', icon: ShieldAlert, color: 'rose' },
] as const;

export default function IntelligenceCards({ activeHazards, highRiskEvents, officialWarnings }: IntelligenceCardsProps) {
  const values = { activeHazards, highRiskEvents, officialWarnings };
  const sectionRef = useRef<HTMLElement>(null);
  const [revealed, setRevealed] = useState(false);

  /* ── Scroll-triggered reveal via IntersectionObserver ─────────────── */
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setRevealed(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} aria-label="Network overview" className="grid gap-4 md:grid-cols-3">
      {cards.map(({ key, label, detail, icon: Icon, color }, i) => (
        <IntelCard
          key={key}
          value={values[key]}
          label={label}
          detail={detail}
          Icon={Icon}
          color={color}
          index={i}
          revealed={revealed}
        />
      ))}

      {/* Health status card */}
      <article
        className={`intelligence-card intelligence-card-health md:col-span-3 lg:col-auto stagger-child ${revealed ? 'revealed' : ''}`}
        style={{ '--stagger-i': 3 } as React.CSSProperties}
      >
        <div className="relative z-10 flex items-center gap-3">
          <div className="intelligence-card-icon intelligence-card-icon-emerald"><Database className="h-5 w-5" /></div>
          <div>
            <p className="text-sm font-medium text-content-primary">Network data health</p>
            <p className="mt-1 text-xs text-content-tertiary">USGS, GDACS and WMO sources operating normally</p>
          </div>
          <div className="ml-auto flex items-center gap-1.5 rounded border-status-ok/20 bg-status-ok/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-status-ok">
            <CheckCircle2 className="h-3.5 w-3.5" /> Nominal
          </div>
        </div>
      </article>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   IntelCard — Individual stat card with counter + spotlight
   ═══════════════════════════════════════════════════════════════════════════ */
function IntelCard({
  value,
  label,
  detail,
  Icon,
  color,
  index,
  revealed,
}: {
  value: number;
  label: string;
  detail: string;
  Icon: React.ElementType;
  color: string;
  index: number;
  revealed: boolean;
}) {
  const cardRef = useRef<HTMLElement>(null);
  const [count, setCount] = useState(0);
  const hasAnimated = useRef(false);

  /* ── Counter animation on reveal ─────────────────────────────────── */
  useEffect(() => {
    if (!revealed || hasAnimated.current) return;
    hasAnimated.current = true;

    const target = value;
    const duration = 1400;
    const startTime = performance.now();

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * target));
      if (progress < 1) requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);
  }, [revealed, value]);

  /* ── Mouse spotlight tracking ────────────────────────────────────── */
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLElement>) => {
    const el = cardRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    el.style.setProperty('--spot-x', `${x}%`);
    el.style.setProperty('--spot-y', `${y}%`);
  }, []);

  return (
    <article
      ref={cardRef}
      className={`intelligence-card intelligence-card-${color} group stagger-child ${revealed ? 'revealed' : ''}`}
      style={{ '--stagger-i': index } as React.CSSProperties}
      onMouseMove={handleMouseMove}
    >
      {/* Spotlight overlay */}
      <div className="intelligence-card-spotlight" />

      {/* Card content (z-10 to sit above spotlight & pseudo-elements) */}
      <div className="relative z-10">
        <div className="flex items-start justify-between">
          <div className={`intelligence-card-icon intelligence-card-icon-${color}`}>
            <Icon className="h-5 w-5" />
          </div>
          <ArrowUpRight className="h-4 w-4 text-content-tertiary transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-content-secondary" />
        </div>
        <p className="mt-8 text-4xl font-semibold tracking-[-0.055em] text-content-primary">{count}</p>
        <h2 className="mt-1 text-sm font-medium text-content-primary">{label}</h2>
        <p className="mt-2 text-xs leading-5 text-content-tertiary">{detail}</p>
      </div>
    </article>
  );
}
