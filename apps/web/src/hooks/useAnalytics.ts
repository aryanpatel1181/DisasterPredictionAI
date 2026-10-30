'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

const SESSION_ID_KEY = 'tg_session_id';
const API_URL = '';

function getOrCreateSessionId(): string {
  if (typeof window === 'undefined') return '';
  let sessionId = sessionStorage.getItem(SESSION_ID_KEY);
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    sessionStorage.setItem(SESSION_ID_KEY, sessionId);
  }
  return sessionId;
}

function getReferrerCategory(referrer: string): string {
  if (!referrer) return 'direct';
  try {
    const url = new URL(referrer);
    const hostname = url.hostname.replace('www.', '');
    if (hostname.includes('google') || hostname.includes('bing') || hostname.includes('duckduckgo') || hostname.includes('yahoo')) {
      return 'search';
    }
    if (hostname.includes('facebook') || hostname.includes('twitter') || hostname.includes('linkedin') || hostname.includes('instagram') || hostname.includes('tiktok')) {
      return 'social';
    }
    if (hostname.includes('github') || hostname.includes('gitlab') || hostname.includes('bitbucket')) {
      return 'code';
    }
    return 'referral';
  } catch {
    return 'direct';
  }
}

function getCountryFromTimezone(): string {
  if (typeof window === 'undefined') return '';
  try {
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (!timeZone) return '';
    const tzToCountry: Record<string, string> = {
      'America/New_York': 'US',
      'America/Los_Angeles': 'US',
      'America/Chicago': 'US',
      'America/Denver': 'US',
      'America/Toronto': 'CA',
      'America/Vancouver': 'CA',
      'Europe/London': 'GB',
      'Europe/Paris': 'FR',
      'Europe/Berlin': 'DE',
      'Europe/Rome': 'IT',
      'Europe/Madrid': 'ES',
      'Europe/Amsterdam': 'NL',
      'Asia/Tokyo': 'JP',
      'Asia/Shanghai': 'CN',
      'Asia/Seoul': 'KR',
      'Asia/Singapore': 'SG',
      'Asia/Dubai': 'AE',
      'Australia/Sydney': 'AU',
      'Australia/Melbourne': 'AU',
      'Pacific/Auckland': 'NZ',
    };
    return tzToCountry[timeZone] || '';
  } catch {
    return '';
  }
}

async function sendAnalyticsEvent(path: string) {
  if (typeof window === 'undefined') return;

  try {
    const sessionId = getOrCreateSessionId();
    const referrer = document.referrer || '';
    const userAgent = navigator.userAgent || '';
    const country = getCountryFromTimezone();
    const referrerCategory = getReferrerCategory(referrer);

    await fetch(API_URL + '/api/v1/analytics/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        path,
        referrer,
        session_id: sessionId,
        user_agent: userAgent,
        country,
        referrer_category: referrerCategory,
      }),
      keepalive: true,
    });
  } catch {
    // Silently swallow errors - analytics must never break the app
  }
}

export function usePageView(path?: string) {
  const pathname = usePathname();
  const previousPathRef = useRef<string | null>(null);
  const targetPath = path || pathname;

  useEffect(() => {
    if (!targetPath) return;
    if (previousPathRef.current === targetPath) return;
    previousPathRef.current = targetPath;
    sendAnalyticsEvent(targetPath);
  }, [targetPath]);
}

export function trackEvent(path: string) {
  if (typeof window === 'undefined') return;
  sendAnalyticsEvent(path);
}
