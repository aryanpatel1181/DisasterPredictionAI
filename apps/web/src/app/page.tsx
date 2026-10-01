'use client';

import React, { useEffect, useRef, useState } from 'react';
import ThreeGlobe from '@/components/Globe/ThreeGlobe';
import EventFeed from '@/components/Events/EventFeed';
import EventDetailModal from '@/components/Events/EventDetailModal';
import ReplayControls from '@/components/History/ReplayControls';
import CommandHero from '@/components/Hero/CommandHero';
import IntelligenceCards from '@/components/Dashboard/IntelligenceCards';
import FeatureGrid from '@/components/Features/FeatureGrid';
import { usePageView, trackEvent } from '@/hooks/useAnalytics';

export default function CommandCenterPage() {
  usePageView();

  const [events, setEvents] = useState<any[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const intelRef = useRef<HTMLElement>(null);
  const [intelRevealed, setIntelRevealed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCity, setSelectedCity] = useState<any | null>(null);

  useEffect(() => {
    async function fetchEvents() {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
        const res = await fetch(`${apiUrl}/api/v1/events?limit=100`);
        if (!res.ok) throw new Error('API server unavailable');
        const data = await res.json();
        setEvents(data.events || []);
      } catch (err: any) {
        console.warn('API connection offline, utilizing dev client fallback stream:', err);
        // Dev Fallback Mock Events
        setEvents(getInitialDevEvents());
      } finally {
        setLoading(false);
      }
    }
    fetchEvents();
  }, []);

  /* ── Scroll reveal for live intelligence section ──────────────────── */
  useEffect(() => {
    const el = intelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIntelRevealed(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const highRiskCount = events.filter(e => e.risk_probability >= 0.70).length;
  const officialWarningCount = events.filter(e => e.status === 'OFFICIAL_WARNING' || (e.official_warnings && e.official_warnings.length > 0)).length;

  return (
    <div className="premium-page flex-1 px-4 py-6 md:px-8 md:py-10">
      <div className="mx-auto flex w-full max-w-[1540px] flex-col gap-24 md:gap-32">
      {/* Chapter 1: Hero + live telemetry row (tight rhythm) */}
      <div className="flex flex-col gap-6">
        <CommandHero activeHazards={events.length} highRiskEvents={highRiskCount} />
        <IntelligenceCards activeHazards={events.length} highRiskEvents={highRiskCount} officialWarnings={officialWarningCount} />
      </div>

      {/* Chapter 2: Capabilities Bento Grid */}
      <FeatureGrid />

      {/* Chapter 3: Live intelligence, its own chapter behind a top hairline */}
      <section
        id="live-intelligence"
        ref={intelRef}
        className={`scroll-mt-24 border-t border-ink-border pt-16 section-reveal ${intelRevealed ? 'revealed' : ''}`}
      >
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-violet-300">Decision workspace</p>
            <h2
              className="mt-1 font-display font-semibold tracking-[-0.04em] text-white"
              style={{ fontSize: 'var(--heading-section)' }}
            >
              Live intelligence
            </h2>
          </div>
          <p className="text-sm text-slate-500">Continuously synthesized from official global sources.</p>
        </div>
      <div className="grid min-h-[600px] grid-cols-1 gap-4 lg:grid-cols-12">
        {/* Left Column: Interactive Map & Replay Controls (8 cols) */}
        <div className="lg:col-span-8 flex flex-col space-y-4">
          <div className="flex-1 min-h-[500px]">
            <ThreeGlobe
              onSelectCity={city => {
                setSelectedCity(city);
                trackEvent('/globe/city/' + encodeURIComponent(city.name));
              }}
              selectedCityName={selectedCity?.name ?? null}
            />
          </div>
          <ReplayControls />
        </div>

        {/* Right Column: Live Event Telemetry Feed (4 cols) */}
        <div className="lg:col-span-4 min-h-[500px]">
          <EventFeed
            events={events}
            selectedEventId={selectedEvent?.event_id}
            onSelectEvent={evt => setSelectedEvent(evt)}
          />
        </div>
      </div>

      {/* City Selection Panel */}
      {selectedCity && (
        <div className="fixed bottom-6 left-6 z-40 glass-panel-elevated rounded-xl px-4 py-3 border border-white/[0.10] shadow-xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-violet-300 mb-1">Selected City</p>
          <p className="text-base font-semibold text-white font-display">{selectedCity.name}</p>
          {selectedCity.risk != null && (
            <p className="text-sm font-mono text-violet-300 mt-1">Risk Factor: {(selectedCity.risk * 100).toFixed(0)}%</p>
          )}
        </div>
      )}
      </section>
      </div>
    </div>
  );
}

function getInitialDevEvents() {
  const now = new Date().toISOString();
  return [
    {
      event_id: 'usgs_mock_1',
      hazard_type: 'earthquake',
      status: 'OBSERVED',
      latitude: 37.35,
      longitude: 137.02,
      country: 'Noto, Japan',
      nearest_populated_location: 'Kanazawa Region (45 km)',
      severity: 'HIGH',
      risk_probability: 0.84,
      confidence: 0.98,
      model_version: 'usgs_seismic_v1.0',
      detected_timestamp: now,
      data_freshness_seconds: 120,
      population_exposure: 350000,
      explanation: {
        risk_probability: 0.84,
        primary_drivers: [
          { feature: 'magnitude_mw', value: 6.4, unit: 'Mw', contribution: 0.45 },
          { feature: 'focal_depth_km', value: 12.4, unit: 'km', contribution: 0.2 },
        ],
        human_summary: 'M 6.4 seismic activity recorded at 12.4 km depth in Noto Peninsula. Ground shaking and affershock evaluation active.',
      },
    },
    {
      event_id: 'gdacs_mock_fl1',
      hazard_type: 'flood',
      status: 'OFFICIAL_WARNING',
      latitude: 24.86,
      longitude: 67.01,
      country: 'Pakistan',
      nearest_populated_location: 'Karachi Region (15 km)',
      severity: 'CRITICAL',
      risk_probability: 0.88,
      confidence: 0.92,
      model_version: 'flood_xgboost_v1',
      detected_timestamp: now,
      data_freshness_seconds: 300,
      population_exposure: 450000,
      official_warnings: [
        {
          alert_id: 'warn_fl1',
          headline: 'Red Flood Alert - Indus River Inundation',
          severity: 'CRITICAL',
          issuing_authority: 'GDACS',
          sent_at: now,
        },
      ],
      explanation: {
        risk_probability: 0.88,
        primary_drivers: [
          { feature: 'precip_24h', value: 185.0, unit: 'mm', contribution: 0.42 },
          { feature: 'river_discharge_percentile', value: 98.0, unit: '%', contribution: 0.31 },
        ],
        human_summary: 'Severe flood inundation risk in the Indus River Delta driven by 185mm 24-hour rainfall and river discharge in 98th percentile.',
      },
    },
    {
      event_id: 'wmo_mock_sw1',
      hazard_type: 'severe_weather',
      status: 'OFFICIAL_WARNING',
      latitude: 32.77,
      longitude: -96.79,
      country: 'United States',
      nearest_populated_location: 'Dallas, Texas',
      severity: 'HIGH',
      risk_probability: 0.78,
      confidence: 0.89,
      model_version: 'convective_v1.0',
      detected_timestamp: now,
      data_freshness_seconds: 450,
      population_exposure: 1200000,
      official_warnings: [
        {
          alert_id: 'warn_sw1',
          headline: 'Tornado Watch & Severe Convective Warning',
          severity: 'HIGH',
          issuing_authority: 'NOAA / NWS',
          sent_at: now,
        },
      ],
      explanation: {
        risk_probability: 0.78,
        primary_drivers: [
          { feature: 'cape_value', value: 3400.0, unit: 'J/kg', contribution: 0.52 },
        ],
        human_summary: 'Extreme atmospheric instability (CAPE > 3400 J/kg) supporting severe supercell thunderstorm and tornado-favorable conditions.',
      },
    },
    {
      event_id: 'gdacs_mock_cy1',
      hazard_type: 'cyclone',
      status: 'OFFICIAL_WARNING',
      latitude: 16.5,
      longitude: 88.2,
      country: 'Bay of Bengal',
      nearest_populated_location: 'Kolkata / Dhaka',
      severity: 'CRITICAL',
      risk_probability: 0.91,
      confidence: 0.95,
      model_version: 'cyclone_v1.0',
      detected_timestamp: now,
      data_freshness_seconds: 600,
      population_exposure: 2100000,
      official_warnings: [
        {
          alert_id: 'warn_cy1',
          headline: 'Red Cyclone Alert: Category 4 Tropical Cyclone',
          severity: 'CRITICAL',
          issuing_authority: 'GDACS / RSMC',
          sent_at: now,
        },
      ],
      explanation: {
        risk_probability: 0.91,
        primary_drivers: [
          { feature: 'max_wind_speed', value: 115.0, unit: 'kt', contribution: 0.55 },
        ],
        human_summary: 'Category 4 Tropical Cyclone producing 115kt sustained winds and severe storm surge threat along coastal regions.',
      },
    },
  ];
}