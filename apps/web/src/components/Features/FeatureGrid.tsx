'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  Waves,
  Mountain,
  CloudLightning,
  Wind,
  Radar,
  BrainCircuit,
} from 'lucide-react';

/* ---------------------------------------------------------------------------
   FeatureGrid — Bento-style capabilities showcase
   ---------------------------------------------------------------------------
   • 2×3 grid on desktop (first card spans 2 cols), stacks on mobile
   • Each card: glassmorphic bg, animated gradient border on hover,
      icon, heading, description, ambient glow
   • Scroll-triggered stagger reveal via IntersectionObserver
   --------------------------------------------------------------------------- */

const features = [
  {
    title: 'Earthquake Monitoring',
    description:
      'Real-time seismic feed processing from USGS and GDACS with aftershock probability estimation, population exposure mapping, and ground-shaking models.',
    Icon: Mountain,
    accent: '#C4501F',
    span: true, // hero card — spans 2 columns and 2 rows
  },
  {
    title: 'Flood Forecasting',
    description:
      'Multi-horizon probabilistic inundation risk powered by GloFAS river discharge, NASA GPM precipitation, and XGBoost ensemble models.',
    Icon: Waves,
    accent: '#9D3715',
  },
  {
    title: 'Cyclone Tracking',
    description:
      'Track forecasts with maximum sustained winds, central pressure evolution, and storm surge threat analysis across oceanic basins.',
    Icon: Wind,
    accent: '#9D3715',
  },
  {
    title: 'Severe Weather Intel',
    description:
      'CAPE, CIN, helicity, and wind-shear analysis to detect supercell thunderstorm and tornado-favorable atmospheric conditions.',
    Icon: CloudLightning,
    accent: '#9D3715',
  },
  {
    title: 'Tsunami Risk Evaluation',
    description:
      'Seismic and tectonic trigger detection combined with bathymetric context for calibrated coastal tsunami risk assessment.',
    Icon: Radar,
    accent: '#9D3715',
  },
  {
    title: 'Explainable AI',
    description:
      'Transparent SHAP-based explanations for every risk score — see exactly which features drive each prediction and why.',
    Icon: BrainCircuit,
    accent: '#9D3715',
  },
];

export default function FeatureGrid() {
  const sectionRef = useRef<HTMLElement>(null);
  const [revealed, setRevealed] = useState(false);

  /* -- Scroll-triggered reveal --------------------------------------- */
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
      { threshold: 0.08 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      aria-label="Platform capabilities"
      className={`section-reveal ${revealed ? 'revealed' : ''}`}
    >
      <div className="mb-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-accent-bright">
          Capabilities
        </p>
        <h2
          className="mt-1 font-display font-semibold tracking-[-0.04em] text-content-primary"
          style={{ fontSize: 'var(--heading-section)' }}
        >
          Six layers of intelligence
        </h2>
        <p className="mt-2 max-w-lg text-sm leading-6 text-content-secondary">
          TerraGuard fuses satellite, seismic, atmospheric, and hydrological data
          into a unified risk picture — with full explainability.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {features.map(({ title, description, Icon, accent, span }, i) => (
          <article
            key={title}
            className={`feature-card stagger-child flex flex-col ${revealed ? 'revealed' : ''}${span ? ' lg:col-span-2 lg:row-span-2' : ''}`}
            style={
              {
                '--card-accent': accent,
                '--stagger-i': i,
              } as React.CSSProperties
            }
          >
            <div className="relative z-10 flex h-full flex-col">
              {/* Icon */}
              <div
                className="feature-card-icon"
                style={{
                  color: accent,
                  background: accent + '15',
                  borderColor: accent + '40',
                }}
              >
                <Icon className={span ? 'h-7 w-7' : 'h-5 w-5'} />
              </div>

              {/* Content */}
              <h3
                className={
                  span
                    ? 'mt-6 font-display text-2xl font-semibold tracking-[-0.03em] text-content-primary'
                    : 'mt-5 text-lg font-semibold tracking-[-0.02em] text-content-primary'
                }
              >
                {title}
              </h3>
              <p
                className={
                  span
                    ? 'mt-3 max-w-md text-sm leading-6 text-content-secondary'
                    : 'mt-2 text-sm leading-6 text-content-secondary'
                }
              >
                {description}
              </p>
              {span && (
                <div className="mt-auto flex flex-wrap gap-2 pt-6">
                  {['USGS', 'GDACS', 'Aftershock ML', 'ShakeMap'].map((src) => (
                    <span
                      key={src}
                      className="rounded border border-ink-border bg-ink-raised/40 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.12em] text-content-tertiary"
                    >
                      {src}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}