'use client';

import React from 'react';
import { X, ShieldAlert, Cpu, Database, MapPin, Clock, ExternalLink, BarChart3, AlertTriangle } from 'lucide-react';

interface FeatureDriver {
  feature: string;
  value: any;
  unit: string;
  contribution: number;
}

interface HazardEventDetail {
  event_id: string;
  hazard_type: string;
  status: string;
  latitude: number;
  longitude: number;
  country?: string;
  nearest_populated_location?: string;
  severity: string;
  risk_probability: number;
  confidence: number;
  model_version: string;
  data_quality?: number;
  data_freshness_seconds?: number;
  explanation?: {
    risk_probability: number;
    primary_drivers: FeatureDriver[];
    human_summary: string;
  };
  official_warnings?: any[];
  sources?: any[];
  population_exposure?: number;
}

interface EventDetailModalProps {
  event: HazardEventDetail | null;
  onClose: () => void;
}

export default function EventDetailModal({ event, onClose }: EventDetailModalProps) {
  if (!event) return null;

  const probPct = Math.round(event.risk_probability * 100);
  const confPct = Math.round(event.confidence * 100);
  const drivers = event.explanation?.primary_drivers || [];

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-xl h-full glass-panel border-l border-dark-border p-6 overflow-y-auto flex flex-col justify-between shadow-2xl">
        <div>
          {/* Header */}
          <div className="flex items-start justify-between pb-4 border-b border-dark-border mb-4">
            <div>
              <div className="flex items-center space-x-2 mb-1">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-violet-400">
                  {event.hazard_type.replace('_', ' ')}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-300 border border-slate-700">
                  ID: {event.event_id}
                </span>
              </div>
              <h2 className="text-xl font-bold text-white">
                {event.country || event.nearest_populated_location}
              </h2>
              <div className="text-xs text-slate-400 flex items-center space-x-1 mt-1">
                <MapPin className="w-3.5 h-3.5 text-slate-500" />
                <span>Coordinates: ({event.latitude.toFixed(4)}, {event.longitude.toFixed(4)})</span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-dark-bg text-slate-400 hover:text-white hover:bg-dark-border transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Risk Metrics Cards */}
          <div className="grid grid-cols-2 gap-3 mb-5">
            <div className="bg-dark-bg/80 border border-dark-border p-3.5 rounded-xl">
              <div className="text-xs font-mono text-slate-400 mb-1">RISK PROBABILITY</div>
              <div className="text-3xl font-extrabold text-violet-400 font-mono">{probPct}%</div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                <div className="bg-violet-400 h-full rounded-full" style={{ width: `${probPct}%` }} />
              </div>
            </div>

            <div className="bg-dark-bg/80 border border-dark-border p-3.5 rounded-xl">
              <div className="text-xs font-mono text-slate-400 mb-1">MODEL CONFIDENCE</div>
              <div className="text-3xl font-extrabold text-purple-400 font-mono">{confPct}%</div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                <div className="bg-purple-400 h-full rounded-full" style={{ width: `${confPct}%` }} />
              </div>
            </div>
          </div>

          {/* Official Emergency Alert Box */}
          {event.official_warnings && event.official_warnings.length > 0 && (
            <div className="mb-5 p-4 rounded-xl border border-red-500/50 bg-red-500/10 shadow-lg shadow-red-500/10">
              <div className="flex items-center space-x-2 text-red-400 font-bold text-sm mb-1.5">
                <ShieldAlert className="w-5 h-5 animate-pulse" />
                <span>OFFICIAL EMERGENCY WARNING</span>
              </div>
              {event.official_warnings.map((w, idx) => (
                <div key={idx} className="text-xs text-red-200">
                  <div className="font-semibold">{w.headline}</div>
                  <div className="text-[11px] text-red-300/80 mt-0.5">
                    Authority: {w.issuing_authority} • Issued: {new Date(w.sent_at).toLocaleTimeString()}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Model Explanation Section */}
          <div className="mb-5 bg-dark-bg/60 border border-dark-border p-4 rounded-xl">
            <h3 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center space-x-1.5">
              <Cpu className="w-4 h-4 text-violet-400" />
              <span>DETERMINISTIC MODEL EXPLANATION</span>
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed font-sans mb-3">
              {event.explanation?.human_summary || "Multi-variate predictive hazard evaluation calculated from near-real-time environmental telemetry."}
            </p>

            {/* SHAP Drivers */}
            {drivers.length > 0 && (
              <div className="space-y-2 mt-3 pt-3 border-t border-slate-800">
                <div className="text-[11px] font-mono text-slate-400 flex items-center justify-between">
                  <span>KEY FEATURE DRIVERS (SHAP)</span>
                  <span>CONTRIBUTION</span>
                </div>
                {drivers.map((d, i) => (
                  <div key={i} className="flex items-center justify-between text-xs font-mono bg-dark-bg p-2 rounded border border-slate-800">
                    <span className="text-slate-200">{d.feature} ({d.value} {d.unit})</span>
                    <span className="text-violet-400 font-bold">+{Math.round(d.contribution * 100)}%</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Metadata Grid */}
          <div className="bg-dark-bg/60 border border-dark-border p-4 rounded-xl space-y-2.5 text-xs font-mono">
            <div className="flex justify-between border-b border-slate-800/80 pb-1.5">
              <span className="text-slate-400">SEVERITY LEVEL</span>
              <span className="text-amber-400 font-bold uppercase">{event.severity}</span>
            </div>
            <div className="flex justify-between border-b border-slate-800/80 pb-1.5">
              <span className="text-slate-400">MODEL VERSION</span>
              <span className="text-slate-200">{event.model_version}</span>
            </div>
            <div className="flex justify-between border-b border-slate-800/80 pb-1.5">
              <span className="text-slate-400">POPULATION EXPOSURE</span>
              <span className="text-violet-400 font-bold">{(event.population_exposure || 0).toLocaleString()} people</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">DATA FRESHNESS</span>
              <span className="text-slate-300">{Math.round(event.data_freshness_seconds || 0)}s ago</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-dark-border text-center text-[10px] text-slate-500">
          TerraGuard AI Decision-Support Platform • Experimental Model Output
        </div>
      </div>
    </div>
  );
}
