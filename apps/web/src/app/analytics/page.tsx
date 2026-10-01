'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  BarChart3,
  ArrowLeft,
  Clock,
  AlertTriangle,
  Loader2,
  TrendingUp,
} from 'lucide-react';
import FootfallWidget from '@/components/Analytics/FootfallWidget';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface HourBucket {
  hour: number;
  views: number;
}

interface TimeseriesResponse {
  hours: HourBucket[];
}

function formatCount(n: number): string {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
  return n.toString();
}

function formatHourLabel(hour: number): string {
  if (hour === 0) return '12a';
  if (hour === 12) return '12p';
  return hour < 12 ? hour + 'a' : hour - 12 + 'p';
}

function HourlyTrafficChart({ hours }: { hours: HourBucket[] }) {
  const maxViews = Math.max(...hours.map(h => h.views), 1);
  const total = hours.reduce((sum, h) => sum + h.views, 0);
  const peak = hours.reduce(
    (best, h) => (h.views > best.views ? h : best),
    hours[0] ?? { hour: 0, views: 0 }
  );

  return (
    <div className='glass-panel p-5 rounded-md border border-dark-border shadow-raised flex flex-col min-w-0'>
      <div className='flex items-center justify-between mb-1'>
        <div className='flex items-center space-x-2'>
          <Clock className='w-4 h-4 text-status-info' />
          <span className='text-[11px] font-semibold uppercase tracking-[0.1em] text-content-primary'>
            Views by Hour of Day
          </span>
        </div>
        <span className='text-[10px] font-mono text-content-tertiary'>UTC | 7 day window</span>
      </div>

      <div className='flex items-baseline gap-4 mb-4 flex-wrap'>
        <span className='font-mono text-2xl font-bold text-content-primary'>{formatCount(total)}</span>
        <span className='text-[10px] font-mono text-content-tertiary'>TOTAL VIEWS</span>
        {peak && peak.views > 0 && (
          <span className='text-[10px] font-mono text-status-info flex items-center space-x-1'>
            <TrendingUp className='w-3 h-3' />
            <span>
              PEAK {formatHourLabel(peak.hour)} | {formatCount(peak.views)}
            </span>
          </span>
        )}
      </div>

      <div className='flex items-end gap-[2px] h-32 w-full'>
        {hours.map(h => {
          const pct = Math.round((h.views / maxViews) * 100);
          const isPeak = h.views === maxViews && h.views > 0;
          return (
            <div
              key={h.hour}
              className='group relative flex-1 flex flex-col items-center justify-end h-full'
              title={formatHourLabel(h.hour) + ' - ' + h.views + ' views'}
            >
              <div
                className={
                  'w-full rounded-t-sm transition-all duration-300 ' +
                  (h.views === 0
                    ? 'bg-ink-raised h-[2px]'
                    : isPeak
                      ? 'bg-gradient-to-t from-accent-deep to-accent-bright group-hover:from-accent group-hover:to-accent-bright'
                      : 'bg-accent/40 group-hover:bg-accent/70')
                }
                style={h.views === 0 ? undefined : { height: Math.max(pct, 4) + '%' }}
              />
            </div>
          );
        })}
      </div>

      <div className='flex justify-between mt-2 text-[9px] font-mono text-content-tertiary'>
        {hours.map(h => (
          <span key={h.hour} className='flex-1 text-center'>
            {h.hour % 6 === 0 ? formatHourLabel(h.hour) : ''}
          </span>
        ))}
      </div>
    </div>
  );
}

function ChartSkeleton() {
  return (
    <div className='glass-panel p-5 rounded-md border border-dark-border flex flex-col min-w-0 animate-pulse'>
      <div className='flex items-center space-x-2 mb-4'>
        <div className='h-3.5 w-3.5 rounded bg-ink-raised' />
        <div className='h-3 w-40 rounded bg-ink-raised' />
      </div>
      <div className='h-8 w-24 rounded bg-ink-raised mb-4' />
      <div className='flex items-end gap-[2px] h-32 w-full'>
        {[
          18, 34, 26, 52, 41, 63, 30, 47, 22, 58, 35, 70, 44, 29, 55, 38, 66, 24, 49, 33, 61, 27, 43, 31,
        ].map((h, i) => (
          <div
            key={i}
            className='flex-1 rounded-t-sm bg-ink-raised'
            style={{ height: h + '%' }}
          />
        ))}
      </div>
    </div>
  );
}

function ChartError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className='glass-panel p-5 rounded-md border border-status-warning/30 bg-status-warning/10 flex flex-col items-start justify-center gap-3 min-w-0'>
      <div className='flex items-center space-x-2 text-status-warning'>
        <AlertTriangle className='w-4 h-4' />
        <span className='text-[11px] font-semibold uppercase tracking-[0.1em]'>
          Hourly Timeseries Unavailable
        </span>
      </div>
      <p className='text-xs text-content-secondary font-mono'>
        The analytics service did not respond. Traffic distribution will resume once the API is
        reachable.
      </p>
      <button
        onClick={onRetry}
        className='px-3 py-1.5 rounded-lg bg-ink-bg text-content-secondary border border-ink-border-strong hover:text-content-primary hover:border-content-faint transition text-[10px] font-mono'
      >
        RETRY FETCH
      </button>
    </div>
  );
}

export default function AnalyticsDashboardPage() {
  const [hours, setHours] = useState<HourBucket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchTimeseries = async () => {
    setLoading(true);
    try {
      const res = await fetch(API_URL + '/api/v1/analytics/stats/timeseries?days=7');
      if (!res.ok) throw new Error('API failed');
      const data: TimeseriesResponse = await res.json();
      setHours(Array.isArray(data.hours) ? data.hours : []);
      setError(false);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTimeseries();
  }, []);

  return (
    <div className='flex-1 p-4 md:p-6 max-w-[1400px] w-full mx-auto flex flex-col space-y-6'>
      {/* Header */}
      <div className='flex items-start justify-between gap-4 flex-col md:flex-row md:items-center'>
        <div>
          <h1 className='text-2xl font-extrabold text-content-primary flex items-center space-x-2'>
            <BarChart3 className='w-6 h-6 text-accent-bright' />
            <span>Site Footfall Intelligence</span>
          </h1>
          <p className='text-xs text-content-secondary mt-1 max-w-2xl font-mono'>
            Traffic analytics aggregated from the TerraGuard web telemetry pipeline. Live page views,
            session distribution, referrer attribution, and diurnal usage patterns.
          </p>
        </div>

        <Link
          href='/'
          className='px-3.5 py-1.5 rounded-lg bg-ink-bg text-content-secondary border border-ink-border-strong hover:text-content-primary hover:border-content-faint transition flex items-center space-x-2 text-xs font-mono shrink-0'
        >
          <ArrowLeft className='w-3.5 h-3.5 text-accent-bright' />
          <span>BACK TO COMMAND CENTER</span>
        </Link>
      </div>

      {/* Widgets */}
      <div className='grid grid-cols-1 lg:grid-cols-[360px_minmax(0,1fr)] gap-4 items-start'>
        <div className='min-w-0'>
          <FootfallWidget />
        </div>

        <div className='min-w-0'>
          {loading && hours.length === 0 ? (
            <ChartSkeleton />
          ) : error && hours.length === 0 ? (
            <ChartError onRetry={fetchTimeseries} />
          ) : (
            <HourlyTrafficChart hours={hours} />
          )}
        </div>
      </div>

      <div className='flex items-center space-x-2 text-[10px] font-mono text-content-tertiary'>
        {loading ? (
          <Loader2 className='w-3 h-3 animate-spin text-accent-bright' />
        ) : (
          <span className='inline-block h-1.5 w-1.5 rounded-full bg-status-ok' />
        )}
        <span>
          {loading
            ? 'SYNCING TELEMETRY...'
            : error
              ? 'LAST SYNC FAILED'
              : 'TELEMETRY SYNCED'}
        </span>
      </div>
    </div>
  );
}