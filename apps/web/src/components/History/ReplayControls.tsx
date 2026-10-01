'use client';

import React, { useState } from 'react';
import { Play, Pause, RotateCcw, Clock, ShieldCheck } from 'lucide-react';

interface ReplayControlsProps {
  onTimestampChange?: (ts: string) => void;
}

export default function ReplayControls({ onTimestampChange }: ReplayControlsProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [sliderValue, setSliderValue] = useState(100);
  const [speed, setSpeed] = useState('1x');

  const togglePlay = () => setIsPlaying(!isPlaying);

  return (
    <div className="w-full glass-panel border border-dark-border rounded-md p-3 flex flex-col md:flex-row items-center justify-between gap-3 shadow-raised">
      <div className="flex items-center space-x-3 w-full md:w-auto">
        <button
          onClick={togglePlay}
          className="p-2 rounded bg-accent/20 text-accent-bright border border-accent/50 hover:bg-accent/30 transition shadow-card"
        >
          {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
        </button>

        <button
          onClick={() => setSliderValue(100)}
          className="p-2 rounded bg-ink-bg text-content-secondary border border-ink-border hover:text-content-primary transition"
          title="Reset to Present"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        <div className="flex items-center space-x-1.5 text-xs font-mono text-content-primary">
          <Clock className="w-4 h-4 text-accent" />
          <span>HISTORICAL REPLAY</span>
        </div>
      </div>

      {/* Time Slider */}
      <div className="flex-1 w-full max-w-xl mx-2 flex items-center space-x-3">
        <span className="text-[10px] font-mono text-content-secondary uppercase">T-72H</span>
        <input
          type="range"
          min="0"
          max="100"
          value={sliderValue}
          onChange={e => setSliderValue(Number(e.target.value))}
          className="w-full h-1.5 bg-ink-raised rounded appearance-none cursor-pointer accent-accent-bright"
        />
        <span className="text-[10px] font-mono text-accent-bright font-bold uppercase">PRESENT</span>
      </div>

      {/* Zero Leakage Indicator */}
      <div className="flex items-center space-x-2 text-[11px] font-mono text-status-ok bg-status-ok/10 border border-status-ok/40 px-2.5 py-1 rounded">
        <ShieldCheck className="w-3.5 h-3.5" />
        <span>ZERO TEMPORAL LEAKAGE</span>
      </div>
    </div>
  );
}
