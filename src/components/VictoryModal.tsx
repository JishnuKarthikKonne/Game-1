/**
 * PARADOX - Level Victory Modal
 * Displays mastery metrics (turns taken vs par, echoes used, elapsed time, stars).
 */

import React from 'react';
import { ArrowRight, RotateCcw, Grid, Star } from 'lucide-react';
import { LevelDefinition, SimulationState } from '../game/types';
import { audioManager } from '../game/audio';

interface VictoryModalProps {
  level: LevelDefinition;
  state: SimulationState;
  elapsedMs: number;
  onNextLevel: () => void;
  onReplayLevel: () => void;
  onOpenLevelSelect: () => void;
  isLastLevel: boolean;
}

export const VictoryModal: React.FC<VictoryModalProps> = ({
  level,
  state,
  elapsedMs,
  onNextLevel,
  onReplayLevel,
  onOpenLevelSelect,
  isLastLevel,
}) => {
  const turns = state.turn;
  const par = level.parTurns;
  let stars = 1;
  if (turns <= par) stars = 3;
  else if (turns <= par + 3) stars = 2;

  const seconds = (elapsedMs / 1000).toFixed(1);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 select-none">
      <div className="w-full max-w-md bg-slate-950 border border-cyan-800/80 p-6 shadow-2xl relative overflow-hidden">
        {/* Top Glowing Trim */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 via-emerald-400 to-cyan-500" />

        {/* Header */}
        <div className="text-center mb-6">
          <span className="font-mono-code text-[11px] font-bold text-emerald-400 uppercase tracking-widest px-2 py-0.5 bg-emerald-950/80 border border-emerald-800/80">
            EXTRACTION COMPLETE
          </span>
          <h2 className="font-display font-black text-2xl text-white tracking-wide mt-2">
            PROTOCOL 0{level.id}: {level.title}
          </h2>
          <p className="font-mono-code text-xs text-slate-400 mt-1">
            Temporal loop successfully resolved.
          </p>
        </div>

        {/* Star Rating Display */}
        <div className="flex justify-center items-center gap-2 mb-6">
          {[1, 2, 3].map((starIdx) => (
            <div
              key={starIdx}
              className={`p-2 border ${
                starIdx <= stars
                  ? 'bg-amber-950/40 border-amber-500 text-amber-400'
                  : 'bg-slate-900 border-slate-800 text-slate-700'
              }`}
            >
              <Star className="w-6 h-6 fill-current" />
            </div>
          ))}
        </div>

        {/* Mastery Metric Tiles */}
        <div className="grid grid-cols-3 gap-2.5 mb-6 text-center font-mono-code">
          <div className="bg-slate-900/80 border border-slate-800 p-2.5">
            <span className="text-[10px] text-slate-500 uppercase block mb-0.5">TURNS</span>
            <span className="text-xl font-bold text-cyan-400 tabular-nums">
              {turns}
            </span>
            <span className="text-[10px] text-slate-600 block">PAR: {par}</span>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 p-2.5">
            <span className="text-[10px] text-slate-500 uppercase block mb-0.5">ECHOES</span>
            <span className="text-xl font-bold text-amber-400 tabular-nums">
              {state.echoes.length}
            </span>
            <span className="text-[10px] text-slate-600 block">MAX: {level.maxEchoes}</span>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 p-2.5">
            <span className="text-[10px] text-slate-500 uppercase block mb-0.5">TIME</span>
            <span className="text-xl font-bold text-emerald-400 tabular-nums">
              {seconds}s
            </span>
            <span className="text-[10px] text-slate-600 block">ELAPSED</span>
          </div>
        </div>

        {/* Observer Reaction */}
        <div className="bg-slate-900/40 border border-slate-800 p-3 mb-6 font-mono-code text-xs text-cyan-300/90 leading-relaxed">
          <span className="text-slate-500 text-[10px] block mb-1 uppercase tracking-wider font-bold">
            OBSERVER LOG ENTRY:
          </span>
          &ldquo;{level.observerWin}&rdquo;
        </div>

        {/* Navigation CTAs */}
        <div className="space-y-2">
          {!isLastLevel ? (
            <button
              data-start="true"
              onClick={() => {
                audioManager.playInteract();
                onNextLevel();
              }}
              className="w-full flex items-center justify-center gap-2 py-3 bg-cyan-500 hover:bg-cyan-400 text-black font-display font-bold text-sm uppercase tracking-wider transition-colors cursor-pointer shadow-lg shadow-cyan-500/20"
            >
              <span>NEXT PROTOCOL</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <div className="text-center py-2 bg-emerald-950/60 border border-emerald-700 text-emerald-300 font-display font-bold text-sm uppercase tracking-widest mb-2">
              ALL CAMPAIGN PROTOCOLS SOLVED!
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={() => {
                audioManager.playInteract();
                onReplayLevel();
              }}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 font-display font-semibold text-xs uppercase cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-cyan-400" />
              REPLAY PROTOCOL
            </button>

            <button
              onClick={() => {
                audioManager.playInteract();
                onOpenLevelSelect();
              }}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 font-display font-semibold text-xs uppercase cursor-pointer"
            >
              <Grid className="w-3.5 h-3.5 text-slate-400" />
              PROTOCOLS
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
