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
    <div className="w-full glass-panel border border-dark-border rounded-xl p-3 flex flex-col md:flex-row items-center justify-between gap-3 shadow-xl">
      <div className="flex items-center space-x-3 w-full md:w-auto">
        <button
          onClick={togglePlay}
          className="p-2 rounded-lg bg-violet-500/20 text-violet-400 border border-violet-500/50 hover:bg-violet-500/30 transition shadow-lg shadow-violet-500/10"
        >
          {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
        </button>

        <button
          onClick={() => setSliderValue(100)}
          className="p-2 rounded-lg bg-dark-bg text-slate-400 border border-slate-800 hover:text-white transition"
          title="Reset to Present"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        <div className="flex items-center space-x-1.5 text-xs font-mono text-slate-300">
          <Clock className="w-4 h-4 text-purple-400" />
          <span>HISTORICAL REPLAY</span>
        </div>
      </div>

      {/* Time Slider */}
      <div className="flex-1 w-full max-w-xl mx-2 flex items-center space-x-3">
        <span className="text-[10px] font-mono text-slate-400 uppercase">T-72H</span>
        <input
          type="range"
          min="0"
          max="100"
          value={sliderValue}
          onChange={e => setSliderValue(Number(e.target.value))}
          className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-violet-400"
        />
        <span className="text-[10px] font-mono text-violet-400 font-bold uppercase">PRESENT</span>
      </div>

      {/* Zero Leakage Indicator */}
      <div className="flex items-center space-x-2 text-[11px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800/80 px-2.5 py-1 rounded-md">
        <ShieldCheck className="w-3.5 h-3.5" />
        <span>ZERO TEMPORAL LEAKAGE</span>
      </div>
    </div>
  );
}
