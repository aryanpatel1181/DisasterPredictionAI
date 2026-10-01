'use client';

import React, { useState } from 'react';
import { Search, Filter, AlertOctagon, ShieldAlert, CloudRain, Zap, Waves, Flame, Wind } from 'lucide-react';

interface HazardEvent {
  event_id: string;
  hazard_type: string;
  status: string;
  latitude: number;
  longitude: number;
  country?: string;
  nearest_populated_location?: string;
  severity: string;
  risk_probability: number;
  detected_timestamp: string;
}

interface EventFeedProps {
  events: HazardEvent[];
  selectedEventId?: string | null;
  onSelectEvent: (event: HazardEvent) => void;
}

export default function EventFeed({ events, selectedEventId, onSelectEvent }: EventFeedProps) {
  const [filterType, setFilterType] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const filtered = events.filter(e => {
    const matchesType = filterType === 'all' || e.hazard_type === filterType;
    const matchesSearch =
      (e.country || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (e.nearest_populated_location || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.hazard_type.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesType && matchesSearch;
  });

  return (
    <div className="w-full h-full glass-panel rounded-md border border-dark-border p-4 flex flex-col shadow-raised">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-mono font-bold tracking-wider text-content-primary uppercase flex items-center space-x-2">
          <AlertOctagon className="w-4 h-4 text-accent-bright" />
          <span>LIVE HAZARD TELEMETRY</span>
        </h2>
        <span className="px-2 py-0.5 rounded text-xs font-mono bg-accent/15 text-accent-bright border border-accent-deep">
          {filtered.length} ACTIVE
        </span>
      </div>

      {/* Search Bar */}
      <div className="relative mb-3">
        <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 transform -translate-y-1/2 text-content-secondary" />
        <input
          type="text"
          placeholder="Filter location, city or hazard..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="w-full bg-ink-bg border border-dark-border rounded-lg pl-9 pr-3 py-1.5 text-xs text-content-primary placeholder-content-tertiary focus:outline-none focus:border-accent"
        />
      </div>

      {/* Hazard Category Filter Chips */}
      <div className="flex items-center space-x-1.5 overflow-x-auto pb-2 mb-2 no-scrollbar">
        {['all', 'flood', 'earthquake', 'tsunami', 'severe_weather', 'cyclone'].map(cat => (
          <button
            key={cat}
            onClick={() => setFilterType(cat)}
            className={`px-2.5 py-1 rounded-md text-xs font-mono capitalize transition shrink-0 ${
              filterType === cat
                ? 'bg-accent/20 text-accent-bright border border-accent/50'
                : 'bg-ink-bg/60 text-content-secondary border border-ink-border hover:text-content-primary'
            }`}
          >
            {cat.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Event Cards List */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-1">
        {filtered.length === 0 ? (
          <div className="text-center py-8 text-xs text-content-tertiary">No active hazard events matching criteria.</div>
        ) : (
          filtered.map(evt => {
            const isSelected = selectedEventId === evt.event_id;
            const probPct = Math.round(evt.risk_probability * 100);

            let statusBadge = 'badge-observed';
            if (evt.status === 'OFFICIAL_WARNING') statusBadge = 'badge-official-warning';
            else if (evt.status === 'FORECAST') statusBadge = 'badge-forecast';
            else if (evt.status === 'AI_RISK_ESTIMATE') statusBadge = 'badge-ai-estimate';

            return (
              <div
                key={evt.event_id}
                onClick={() => onSelectEvent(evt)}
                className={`p-3 rounded-lg border transition cursor-pointer ${
                  isSelected
                    ? 'bg-ink-raised/80 border-accent/60 shadow-raised'
                    : 'bg-ink-bg/50 border-ink-border hover:border-ink-border-strong hover:bg-ink-bg'
                }`}
              >
                <div className="flex items-start justify-between mb-1.5">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-xs text-content-primary capitalize flex items-center space-x-1">
                      {getHazardIcon(evt.hazard_type)}
                      <span>{evt.hazard_type.replace('_', ' ')}</span>
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold ${statusBadge}`}>
                      {evt.status}
                    </span>
                  </div>

                  <span className={`text-xs font-mono font-bold ${getRiskColor(evt.risk_probability)}`}>
                    {probPct}% RISK
                  </span>
                </div>

                <div className="text-xs text-content-secondary font-medium truncate mb-1">
                  {evt.country || evt.nearest_populated_location}
                </div>

                <div className="flex items-center justify-between text-[10px] text-content-secondary font-mono">
                  <span>{evt.nearest_populated_location}</span>
                  <span className={`uppercase font-semibold ${getSeverityColor(evt.severity)}`}>{evt.severity}</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function getHazardIcon(type: string) {
  switch (type) {
    case 'earthquake':
      return <Zap className="w-3.5 h-3.5 text-status-warning" />;
    case 'flood':
      return <CloudRain className="w-3.5 h-3.5 text-accent-bright" />;
    case 'tsunami':
      return <Waves className="w-3.5 h-3.5 text-status-info" />;
    case 'severe_weather':
      return <Wind className="w-3.5 h-3.5 text-accent" />;
    case 'cyclone':
      return <Flame className="w-3.5 h-3.5 text-status-critical" />;
    default:
      return <AlertOctagon className="w-3.5 h-3.5 text-content-secondary" />;
  }
}

function getSeverityColor(severity: string) {
  switch (severity) {
    case 'CRITICAL': return 'text-status-critical';
    case 'HIGH': return 'text-status-warning';
    case 'MODERATE': return 'text-status-watch';
    default: return 'text-status-info';
  }
}

function getRiskColor(prob: number) {
  if (prob >= 0.75) return 'text-status-critical';
  if (prob >= 0.50) return 'text-status-warning';
  if (prob >= 0.25) return 'text-accent-bright';
  return 'text-content-secondary';
}
