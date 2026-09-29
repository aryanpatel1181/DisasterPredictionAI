'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight, Crosshair, Globe2, Radio, Sparkles } from 'lucide-react';

/* ═══════════════════════════════════════════════════════════════════════════
   CommandHero — Premium 3D Hero Section
   ───────────────────────────────────────────────────────────────────────────
   Features:
   • CSS 3D globe with mouse-reactive parallax (instant, zero-dep fallback)
   • Optional Spline viewer overlay via NEXT_PUBLIC_SPLINE_SCENE_URL
   • Canvas-based particle constellation that follows mouse gently
   • Animated count-up metrics on mount
   • Skeleton loader while 3D scene initializes
   • Scroll-triggered fade-out for parallax depth
   • Shimmer-animated hero badge
   ═══════════════════════════════════════════════════════════════════════════ */

const splineSceneUrl = process.env.NEXT_PUBLIC_SPLINE_SCENE_URL;

interface CommandHeroProps {
  activeHazards: number;
  highRiskEvents: number;
}

export default function CommandHero({ activeHazards, highRiskEvents }: CommandHeroProps) {
  const sceneRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const heroRef = useRef<HTMLElement>(null);
  const mouseRef = useRef({ x: 0.5, y: 0.5 });
  const [splineReady, setSplineReady] = useState(false);
  const [heroOpacity, setHeroOpacity] = useState(1);

  /* ── Spline Viewer (optional) ────────────────────────────────────────── */
  useEffect(() => {
    if (!splineSceneUrl) return;

    const existing = document.querySelector('script[data-spline-viewer]');
    if (!existing) {
      const script = document.createElement('script');
      script.type = 'module';
      script.src = 'https://unpkg.com/@splinetool/viewer@1.10.13/build/spline-viewer.js';
      script.dataset.splineViewer = 'true';
      document.head.appendChild(script);
    }

    const viewer = viewerRef.current;
    const revealScene = () => setSplineReady(true);
    viewer?.addEventListener('load', revealScene);
    return () => viewer?.removeEventListener('load', revealScene);
  }, []);

  /* ── Particle Constellation Canvas ───────────────────────────────────── */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    const PARTICLE_COUNT = 35;
    const CONNECTION_DIST = 100;
    const particles: Array<{
      x: number; y: number; vx: number; vy: number;
      size: number; alpha: number;
    }> = [];

    const resize = () => {
      const rect = canvas.parentElement?.getBoundingClientRect();
      if (!rect) return;
      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };
    resize();

    // Initialize particles
    const w = () => canvas.width / window.devicePixelRatio;
    const h = () => canvas.height / window.devicePixelRatio;

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particles.push({
        x: Math.random() * w(),
        y: Math.random() * h(),
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        size: Math.random() * 1.5 + 0.5,
        alpha: Math.random() * 0.4 + 0.15,
      });
    }

    const draw = () => {
      ctx.clearRect(0, 0, w(), h());
      const mx = mouseRef.current.x * w();
      const my = mouseRef.current.y * h();

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // Gentle mouse attraction
        const dx = mx - p.x;
        const dy = my - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 200) {
          p.vx += dx * 0.00005;
          p.vy += dy * 0.00005;
        }

        p.x += p.vx;
        p.y += p.vy;

        // Bounce at edges
        if (p.x < 0 || p.x > w()) p.vx *= -1;
        if (p.y < 0 || p.y > h()) p.vy *= -1;

        // Damping
        p.vx *= 0.998;
        p.vy *= 0.998;

        // Draw particle
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(142, 233, 255, ${p.alpha})`;
        ctx.fill();

        // Draw connections
        for (let j = i + 1; j < particles.length; j++) {
          const q = particles[j];
          const cdx = p.x - q.x;
          const cdy = p.y - q.y;
          const cdist = Math.sqrt(cdx * cdx + cdy * cdy);
          if (cdist < CONNECTION_DIST) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(q.x, q.y);
            ctx.strokeStyle = `rgba(142, 233, 255, ${0.08 * (1 - cdist / CONNECTION_DIST)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

      animId = requestAnimationFrame(draw);
    };

    draw();

    const ro = new ResizeObserver(resize);
    ro.observe(canvas.parentElement!);

    return () => {
      cancelAnimationFrame(animId);
      ro.disconnect();
    };
  }, []);

  /* ── Scroll-triggered fade ───────────────────────────────────────────── */
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const fadeStart = 100;
      const fadeEnd = 400;
      if (scrollY <= fadeStart) {
        setHeroOpacity(1);
      } else if (scrollY >= fadeEnd) {
        setHeroOpacity(0.6);
      } else {
        setHeroOpacity(1 - ((scrollY - fadeStart) / (fadeEnd - fadeStart)) * 0.4);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  /* ── Mouse parallax ──────────────────────────────────────────────────── */
  const updateParallax = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - bounds.left) / bounds.width - 0.5) * 2;
    const y = ((event.clientY - bounds.top) / bounds.height - 0.5) * 2;
    mouseRef.current = {
      x: (event.clientX - bounds.left) / bounds.width,
      y: (event.clientY - bounds.top) / bounds.height,
    };
    sceneRef.current?.style.setProperty('--pointer-x', x.toFixed(3));
    sceneRef.current?.style.setProperty('--pointer-y', y.toFixed(3));
  }, []);

  const resetParallax = useCallback(() => {
    sceneRef.current?.style.setProperty('--pointer-x', '0');
    sceneRef.current?.style.setProperty('--pointer-y', '0');
    mouseRef.current = { x: 0.5, y: 0.5 };
  }, []);

  return (
    <section
      ref={heroRef}
      className="hero-surface relative isolate overflow-hidden rounded-[2rem] border border-white/[0.10] px-6 py-8 sm:px-9 md:py-11 lg:min-h-[510px] lg:px-12"
      style={{ opacity: heroOpacity, transition: 'opacity 0.3s ease' }}
    >
      {/* Background effects */}
      <div className="hero-grid" aria-hidden="true" />
      <div className="hero-scan-line" aria-hidden="true" />
      <div className="hero-aurora hero-aurora-one" aria-hidden="true" />
      <div className="hero-aurora hero-aurora-two" aria-hidden="true" />

      <div className="relative z-10 grid items-center gap-10 lg:grid-cols-[minmax(0,0.95fr)_minmax(420px,0.8fr)]">
        {/* ── Left: Headline & CTA ──────────────────────────────────────── */}
        <div className="max-w-2xl">
          {/* Shimmer badge */}
          <div className="badge-shimmer inline-flex items-center gap-2 rounded-full border border-cyan-300/15 bg-cyan-300/[0.07] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-100/90">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-300 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-cyan-200" />
            </span>
            Global intelligence network
          </div>

          <h1
            className="mt-6 max-w-xl text-balance font-display font-semibold leading-[0.94] tracking-[-0.065em] text-white"
            style={{ fontSize: 'var(--heading-hero)' }}
          >
            See the signal{' '}
            <span className="bg-gradient-to-r from-cyan-200 via-sky-300 to-blue-400 bg-clip-text text-transparent">
              before
            </span>{' '}
            it becomes a disaster.
          </h1>

          <p className="mt-6 max-w-lg text-pretty text-base leading-7 text-slate-300 sm:text-lg">
            TerraGuard turns live Earth observations into a clear, explainable picture of emerging
            risk—so teams can move before conditions escalate.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <a href="#live-intelligence" className="premium-button premium-button-primary">
              Explore live intelligence <ArrowUpRight className="h-4 w-4" />
            </a>
            <Link href="/location" className="premium-button premium-button-secondary">
              Assess a location <Crosshair className="h-4 w-4" />
            </Link>
          </div>

          {/* Animated metrics */}
          <div className="mt-10 flex flex-wrap gap-x-8 gap-y-4 border-t border-white/[0.10] pt-6">
            <HeroMetric label="Active signals" value={activeHazards} />
            <HeroMetric label="Elevated risk" value={highRiskEvents} accent="text-amber-200" />
            <HeroMetric label="Signal latency" value="< 2 min" accent="text-emerald-200" isText />
          </div>
        </div>

        {/* ── Right: 3D Viewport ────────────────────────────────────────── */}
        <div
          ref={sceneRef}
          className="hero-visual relative mx-auto h-[350px] w-full max-w-[560px] sm:h-[410px] lg:h-[445px]"
          onMouseMove={updateParallax}
          onMouseLeave={resetParallax}
        >
          {/* Particle constellation canvas */}
          <canvas ref={canvasRef} className="hero-particles" aria-hidden="true" />

          {/* Floating HUD — "Live Watch" */}
          <div className="absolute left-[7%] top-[13%] z-20 rounded-2xl border border-white/10 bg-slate-950/55 px-4 py-3 shadow-2xl backdrop-blur-xl">
            <div className="flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.16em] text-slate-400">
              <Radio className="h-3.5 w-3.5 text-cyan-300" /> Live watch
            </div>
            <p className="mt-1.5 text-sm font-medium text-white">Oceanic pressure</p>
            <p className="mt-1 text-xs text-cyan-200">Streaming normally</p>
          </div>

          {/* CSS 3D Globe */}
          <div className="hero-orbit hero-orbit-large" aria-hidden="true" />
          <div className="hero-orbit hero-orbit-small" aria-hidden="true" />
          <div className="hero-globe" aria-label="Rotating global risk model visualization" role="img">
            <div className="hero-globe-grid" />
            <div className="hero-continent hero-continent-one" />
            <div className="hero-continent hero-continent-two" />
            <span className="hero-hotspot hero-hotspot-one" />
            <span className="hero-hotspot hero-hotspot-two" />
            <span className="hero-hotspot hero-hotspot-three" />
          </div>

          {/* Skeleton loader (visible while Spline loads) */}
          {splineSceneUrl && (
            <div className={`hero-skeleton ${splineReady ? 'hero-skeleton-hidden' : ''}`}>
              <div className="hero-skeleton-circle" />
              <span className="hero-skeleton-label">Initializing 3D scene…</span>
            </div>
          )}

          {/* Spline viewer overlay */}
          {splineSceneUrl && React.createElement('spline-viewer', {
            ref: viewerRef,
            url: splineSceneUrl,
            className: `hero-spline ${splineReady ? 'hero-spline-ready' : ''}`,
            'aria-label': 'Interactive three-dimensional global risk model',
          })}

          {/* Floating HUD — "Model Confidence" */}
          <div className="absolute bottom-[7%] right-[2%] z-20 rounded-2xl border border-white/10 bg-white/[0.08] px-4 py-3 shadow-2xl backdrop-blur-xl">
            <div className="flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.16em] text-slate-400">
              <Sparkles className="h-3.5 w-3.5 text-violet-300" /> Model confidence
            </div>
            <p className="mt-1.5 text-2xl font-semibold tracking-[-0.04em] text-white">94.8%</p>
          </div>

          {/* Scene label */}
          <div className="absolute bottom-[4%] left-[9%] z-20 flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.16em] text-slate-500">
            <Globe2 className="h-3.5 w-3.5" />{' '}
            {splineSceneUrl ? '3D scene loading safely' : 'Interactive CSS 3D model'}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   HeroMetric — Animated count-up number display
   ═══════════════════════════════════════════════════════════════════════════ */
function HeroMetric({
  label,
  value,
  accent = 'text-cyan-100',
  isText = false,
}: {
  label: string;
  value: string | number;
  accent?: string;
  isText?: boolean;
}) {
  const [display, setDisplay] = useState<string | number>(isText ? value : 0);

  useEffect(() => {
    if (isText || typeof value !== 'number') {
      setDisplay(value);
      return;
    }

    const target = value;
    const duration = 1200; // ms
    const startTime = performance.now();

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(eased * target));
      if (progress < 1) requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);
  }, [value, isText]);

  return (
    <div>
      <p className={`text-xl font-semibold tracking-[-0.045em] ${accent}`}>{display}</p>
      <p className="mt-1 text-[11px] font-medium uppercase tracking-[0.16em] text-slate-500">{label}</p>
    </div>
  );
}
