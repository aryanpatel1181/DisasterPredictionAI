'use client';

import { useEffect, useState } from 'react';
import { Users, Activity, Globe } from 'lucide-react';

const API_URL = '';

interface SummaryStats {
  total_page_views: number;
  unique_sessions: number;
  avg_events_per_session: number;
  daily_views: Array<{ date: string; views: number }>;
}

interface Referrer {
  referrer: string;
  count: number;
  category: string;
}

function getCategoryColor(category: string): string {
  switch (category) {
    case 'search': return 'text-status-ok bg-status-ok/10 border-status-ok/20';
    case 'social': return 'text-status-critical bg-status-critical/10 border-status-critical/20';
    case 'code': return 'text-accent-bright bg-accent/10 border-accent/20';
    case 'referral': return 'text-status-warning bg-status-warning/10 border-status-warning/20';
    default: return 'text-content-secondary bg-content-secondary/10 border-content-secondary/20';
  }
}

function getCategoryLabel(category: string): string {
  return category.charAt(0).toUpperCase() + category.slice(1);
}

function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
}

function Sparkline({ data }: { data: Array<{ date: string; views: number }> }) {
  if (!data.length) return null;
  const maxViews = Math.max(...data.map(d => d.views), 1);
  const width = 280;
  const height = 60;
  const stepX = width / (data.length - 1 || 1);

  const pathData = data.map((d, i) => (i === 0 ? 'M' : 'L') + (i * stepX) + ' ' + (height - (d.views / maxViews) * (height - 4))).join(' ');

  return (
    <svg width={width} height={height} className='w-full' aria-hidden='true'>
      <defs>
        <linearGradient id='sparkline-gradient' x1='0' y1='0' x2='0' y2='1'>
          <stop offset='0%' stopColor='#9D3715' stopOpacity='0.4' />
          <stop offset='100%' stopColor='#9D3715' stopOpacity='0' />
        </linearGradient>
      </defs>
      <path
        d={pathData}
        stroke='#9D3715'
        strokeWidth='2'
        fill='none'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
      <path
        d={pathData + ' L' + width + ' ' + height + ' L0 ' + height + ' Z'}
        fill='url(#sparkline-gradient)'
      />
      {data.map((d, i) => (
        <circle
          key={i}
          cx={i * stepX}
          cy={height - (d.views / maxViews) * (height - 4)}
          r={3}
          fill='#9D3715'
          opacity={0.8}
        />
      ))}
    </svg>
  );
}

export default function FootfallWidget() {
  const [summary, setSummary] = useState<SummaryStats | null>(null);
  const [referrers, setReferrers] = useState<Referrer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchData = async () => {
    try {
      const [summaryRes, referrersRes] = await Promise.all([
        fetch(API_URL + '/api/v1/analytics/stats/summary?days=7'),
        fetch(API_URL + '/api/v1/analytics/referrers?limit=8'),
      ]);

      if (!summaryRes.ok || !referrersRes.ok) throw new Error('Failed to fetch');

      const summaryData = await summaryRes.json();
      const referrersData = await referrersRes.json();

      setSummary(summaryData);
      setReferrers(referrersData.referrers || []);
      setError(false);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  if (error && !summary) {
    return (
      <div className='w-[360px] glass-panel-elevated rounded-md border border-ink-border p-5'>
        <div className='flex items-center gap-2 text-content-tertiary'>
          <Activity className='h-4 w-4 text-accent-bright' />
          <span className='text-sm font-mono text-content-secondary'>Awaiting analytics data...</span>
        </div>
      </div>
    );
  }

  const skeleton = (
    <div className='w-[360px] glass-panel-elevated rounded-md border border-ink-border p-5 space-y-4 animate-pulse'>
      <div className='flex items-center justify-between'>
        <div className='h-4 w-32 bg-ink-raised rounded' />
        <div className='h-2 w-16 bg-ink-raised rounded-full' />
      </div>
      <div className='grid grid-cols-2 gap-4'>
        <div className='space-y-2'>
          <div className='h-10 w-full bg-ink-raised rounded-lg' />
          <div className='h-3 w-20 bg-ink-raised rounded' />
        </div>
        <div className='space-y-2'>
          <div className='h-10 w-full bg-ink-raised rounded-lg' />
          <div className='h-3 w-24 bg-ink-raised rounded' />
        </div>
      </div>
      <div className='h-20 w-full bg-ink-raised rounded-lg' />
      <div className='space-y-2'>
        <div className='h-3 w-24 bg-ink-raised rounded' />
        <div className='space-y-2'>
          {[1, 2, 3, 4].map(i => (
            <div key={i} className='h-6 w-full bg-ink-raised rounded' />
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className='w-[360px] glass-panel-elevated rounded-md border border-ink-border p-5'>
      <div className='flex items-center justify-between mb-4'>
        <div className='flex items-center gap-2'>
          <div className='relative flex h-2.5 w-2.5'>
            <span className='absolute inline-flex h-full w-full animate-ping rounded-full bg-status-ok opacity-75' />
            <span className='relative inline-flex h-2.5 w-2.5 rounded-full bg-status-ok' />
          </div>
          <span className='text-xs font-semibold uppercase tracking-[0.1em] text-status-ok'>LIVE</span>
        </div>
        <span className='text-[10px] font-mono text-content-tertiary'>Updates every 30s</span>
      </div>

      {loading && !summary ? skeleton : (
        <>
          <div className='grid grid-cols-2 gap-4 mb-4'>
            <div className='bg-ink-surface border border-ink-border rounded p-3'>
              <div className='flex items-center gap-2 text-content-secondary mb-1'>
                <Activity className='h-3.5 w-3.5 text-accent-bright' />
                <span className='text-[11px] font-semibold uppercase tracking-[0.1em]'>Page Views</span>
              </div>
              <div className='font-mono text-2xl font-bold text-content-primary'>{formatNumber(summary?.total_page_views || 0)}</div>
            </div>
            <div className='bg-ink-surface border border-ink-border rounded p-3'>
              <div className='flex items-center gap-2 text-content-secondary mb-1'>
                <Users className='h-3.5 w-3.5 text-accent-bright' />
                <span className='text-[11px] font-semibold uppercase tracking-[0.1em]'>Sessions</span>
              </div>
              <div className='font-mono text-2xl font-bold text-content-primary'>{formatNumber(summary?.unique_sessions || 0)}</div>
            </div>
          </div>

          <div className='mb-4'>
            <div className='flex items-center justify-between text-content-secondary mb-2'>
              <span className='text-[11px] font-semibold uppercase tracking-[0.1em]'>7-Day Trend</span>
              <span className='font-mono text-sm text-accent-bright'>
                {summary?.avg_events_per_session ? summary.avg_events_per_session.toFixed(1) + ' avg/session' : '�'}
              </span>
            </div>
            <Sparkline data={summary?.daily_views || []} />
          </div>

          <div className='border-t border-ink-border pt-4'>
            <div className='flex items-center justify-between text-content-secondary mb-3'>
              <span className='text-[11px] font-semibold uppercase tracking-[0.1em]'>Top Referrers</span>
              <Globe className='h-3.5 w-3.5 text-accent-bright' />
            </div>
            <div className='space-y-2 max-h-48 overflow-y-auto pr-1'>
              {(referrers.length === 0 ? [
                { referrer: 'Direct / Unknown', count: 0, category: 'direct' }
              ] : referrers).map((r, i) => (
                <div key={i} className='flex items-center justify-between gap-2 px-2 py-1.5 rounded-lg hover:bg-ink-raised/60 transition'>
                  <div className='flex-1 min-w-0 flex items-center gap-2'>
                    <span className='font-mono text-[11px] text-content-tertiary w-5 text-right'>{i + 1}.</span>
                    <div className='truncate'>
                      <p className='text-sm font-medium text-content-primary truncate'>{r.referrer || 'Direct'}</p>
                      <p className='text-[10px] text-content-tertiary'>{formatNumber(r.count)} visits</p>
                    </div>
                  </div>
                  <span className={getCategoryColor(r.category) + ' px-2 py-0.5 rounded text-[10px] font-semibold font-mono border whitespace-nowrap'}>
                    {getCategoryLabel(r.category)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
