'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Layers, AlertTriangle, CloudRain, Waves, Flame, Zap, Wind } from 'lucide-react';

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
  is_cluster?: boolean;
  cluster_count?: number;
  explanation?: { human_summary: string };
}

interface GlobalMapProps {
  events: HazardEvent[];
  selectedEventId?: string | null;
  onSelectEvent: (event: HazardEvent) => void;
}

export default function GlobalMap({ events, selectedEventId, onSelectEvent }: GlobalMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const [activeLayers, setActiveLayers] = useState<Record<string, boolean>>({
    earthquake: true,
    flood: true,
    tsunami: true,
    severe_weather: true,
    cyclone: true,
    official_warning: true,
  });

  const toggleLayer = (layer: string) => {
    setActiveLayers(prev => ({ ...prev, [layer]: !prev[layer] }));
  };

  const filteredEvents = events.filter(e => activeLayers[e.hazard_type] !== false);

  return (
    <div className="relative w-full h-full min-h-[500px] bg-dark-bg border border-dark-border rounded-xl overflow-hidden shadow-2xl flex flex-col">
      {/* Layer Control Bar */}
      <div className="absolute top-4 left-4 z-20 glass-panel p-2.5 rounded-lg flex flex-wrap items-center gap-2 border border-slate-700/60 shadow-xl">
        <span className="text-xs font-mono font-semibold text-slate-400 uppercase tracking-wider flex items-center space-x-1 mr-1">
          <Layers className="w-3.5 h-3.5 text-violet-400" />
          <span>LAYERS:</span>
        </span>

        <button
          onClick={() => toggleLayer('earthquake')}
          className={`px-2.5 py-1 rounded text-xs font-medium transition flex items-center space-x-1.5 ${
            activeLayers.earthquake
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50'
              : 'bg-dark-bg/60 text-slate-400 border border-slate-700'
          }`}
        >
          <Zap className="w-3 h-3 text-amber-400" />
          <span>Seismic</span>
        </button>

        <button
          onClick={() => toggleLayer('flood')}
          className={`px-2.5 py-1 rounded text-xs font-medium transition flex items-center space-x-1.5 ${
            activeLayers.flood
              ? 'bg-violet-500/20 text-violet-300 border border-violet-500/50'
              : 'bg-dark-bg/60 text-slate-400 border border-slate-700'
          }`}
        >
          <CloudRain className="w-3 h-3 text-violet-400" />
          <span>Flood</span>
        </button>

        <button
          onClick={() => toggleLayer('tsunami')}
          className={`px-2.5 py-1 rounded text-xs font-medium transition flex items-center space-x-1.5 ${
            activeLayers.tsunami
              ? 'bg-blue-500/20 text-blue-300 border border-blue-500/50'
              : 'bg-dark-bg/60 text-slate-400 border border-slate-700'
          }`}
        >
          <Waves className="w-3 h-3 text-blue-400" />
          <span>Tsunami</span>
        </button>

        <button
          onClick={() => toggleLayer('severe_weather')}
          className={`px-2.5 py-1 rounded text-xs font-medium transition flex items-center space-x-1.5 ${
            activeLayers.severe_weather
              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/50'
              : 'bg-dark-bg/60 text-slate-400 border border-slate-700'
          }`}
        >
          <Wind className="w-3 h-3 text-purple-400" />
          <span>Severe Weather</span>
        </button>

        <button
          onClick={() => toggleLayer('cyclone')}
          className={`px-2.5 py-1 rounded text-xs font-medium transition flex items-center space-x-1.5 ${
            activeLayers.cyclone
              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/50'
              : 'bg-dark-bg/60 text-slate-400 border border-slate-700'
          }`}
        >
          <Flame className="w-3 h-3 text-rose-400" />
          <span>Cyclone</span>
        </button>
      </div>

      {/* Legend & Attribution Overlay */}
      <div className="absolute bottom-4 left-4 z-20 glass-panel p-3 rounded-lg text-xs border border-slate-700/60 hidden sm:block">
        <div className="font-mono text-slate-400 font-semibold mb-1.5">DATA STATUS CLASSIFICATION</div>
        <div className="grid grid-cols-2 gap-2">
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-violet-400 inline-block shadow-sm shadow-violet-400" />
            <span className="text-slate-200">OBSERVED</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span
              className="w-2.5 h-2.5 rounded-full inline-block shadow-sm"
              style={{ backgroundColor: '#7c9bb5', boxShadow: '0 0 6px rgba(124,155,181,.55)' }}
            />
            <span className="text-slate-200">FORECAST</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block shadow-sm shadow-amber-400" />
            <span className="text-slate-200">AI RISK ESTIMATE</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block animate-ping shadow-sm shadow-red-500" />
            <span className="text-red-400 font-bold">OFFICIAL WARNING</span>
          </div>
        </div>
      </div>

      {/* Interactive Global Vector Canvas Map */}
      <div className="w-full flex-1 relative bg-[#06090F] flex items-center justify-center overflow-hidden">
        {/* SVG World Map Vector Backdrop */}
        <svg viewBox="0 0 1000 500" className="w-full h-full opacity-25 object-cover pointer-events-none">
          <path
            d="M150,150 Q200,100 250,150 T350,200 Q450,120 550,180 T750,200 Q850,150 900,250 T700,350 Q550,400 400,350 T200,300 Z"
            fill="#1E293B"
            stroke="#334155"
            strokeWidth="1"
          />
          {/* Grid lines */}
          <line x1="0" y1="250" x2="1000" y2="250" stroke="#1E293B" strokeWidth="0.5" strokeDasharray="4 4" />
          <line x1="500" y1="0" x2="500" y2="500" stroke="#1E293B" strokeWidth="0.5" strokeDasharray="4 4" />
        </svg>

        {/* Dynamic Hazard Pins */}
        <div className="absolute inset-0">
          {filteredEvents.map(evt => {
            // Map lat/lon to percentage coords
            const xPct = ((evt.longitude + 180) / 360) * 100;
            const yPct = ((90 - evt.latitude) / 180) * 100;
            const isSelected = selectedEventId === evt.event_id;

            let colorClass = 'bg-violet-400 border-violet-200';
            if (evt.status === 'OFFICIAL_WARNING' || evt.severity === 'CRITICAL') {
              colorClass = 'bg-red-500 border-red-300 shadow-red-500/50 animate-bounce';
            } else if (evt.hazard_type === 'earthquake') {
              colorClass = 'bg-amber-400 border-amber-200';
            } else if (evt.hazard_type === 'severe_weather') {
              colorClass = 'bg-purple-400 border-purple-200';
            } else if (evt.hazard_type === 'tsunami') {
              colorClass = 'bg-blue-500 border-blue-200';
            }

            return (
              <button
                key={evt.event_id}
                onClick={() => onSelectEvent(evt)}
                style={{ left: `${xPct}%`, top: `${yPct}%` }}
                className={`absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-300 group z-10 ${
                  isSelected ? 'scale-150 z-30' : 'hover:scale-125'
                }`}
              >
                <span
                  className={`block w-4 h-4 rounded-full border-2 shadow-lg ${colorClass}`}
                />
                
                {/* Hover Popover preview */}
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block w-48 glass-panel p-2 rounded text-left z-40 pointer-events-none shadow-2xl border border-slate-700">
                  <div className="font-bold text-xs text-white truncate">{evt.country || 'Global'}</div>
                  <div className="text-[10px] text-violet-400 font-mono capitalize">{evt.hazard_type} • Risk: {intPct(evt.risk_probability)}%</div>
                  <div className="text-[10px] text-slate-300 truncate">{evt.nearest_populated_location}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function intPct(val: number): number {
  return Math.round(val * 100);
}
