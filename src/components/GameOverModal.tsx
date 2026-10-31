/**
 * PARADOX - Level Defeat / Temporal Collapse Modal
 */

import React from 'react';
import { RotateCcw, Undo2, HelpCircle, AlertOctagon } from 'lucide-react';
import { LevelDefinition, SimulationState } from '../game/types';
import { audioManager } from '../game/audio';

interface GameOverModalProps {
  level: LevelDefinition;
  state: SimulationState;
  onRetry: () => void;
  onUndo: () => void;
  onOpenHints: () => void;
  onOpenLevelSelect: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  level,
  state,
  onRetry,
  onUndo,
  onOpenHints,
  onOpenLevelSelect,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 select-none">
      <div className="w-full max-w-md bg-slate-950 border border-red-800 p-6 shadow-2xl relative overflow-hidden">
        {/* Red accent line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-red-600" />

        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-red-950/80 border border-red-800 text-red-500">
            <AlertOctagon className="w-6 h-6" />
          </div>
          <div>
            <span className="font-mono-code text-[10px] font-bold text-red-400 uppercase tracking-widest">
              FAILURE PROTOCOL ENGAGED
            </span>
            <h2 className="font-display font-black text-xl text-white tracking-wide">
              TEMPORAL COLLAPSE
            </h2>
          </div>
        </div>

        {/* Failure reason explanation */}
        <div className="bg-red-950/40 border border-red-900/60 p-3 mb-6 font-mono-code text-xs text-red-300 leading-relaxed">
          <span className="text-red-500 font-bold block mb-1 uppercase text-[10px]">
            INCIDENT REPORT:
          </span>
          {state.failureReason || 'Current physical timeline destabilized. Extraction parameters breached.'}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-2 mb-6 font-mono-code text-center">
          <div className="bg-slate-900 border border-slate-800 p-2">
            <span className="text-[10px] text-slate-500 block uppercase">TURNS REACHED</span>
            <span className="text-lg font-bold text-slate-300 tabular-nums">
              {state.turn} / {level.maxTurns}
            </span>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-2">
            <span className="text-[10px] text-slate-500 block uppercase">ECHOES ACTIVE</span>
            <span className="text-lg font-bold text-amber-400 tabular-nums">
              {state.echoes.length}
            </span>
          </div>
        </div>

        {/* Action CTAs */}
        <div className="space-y-2">
          <button
            data-start="true"
            onClick={() => {
              audioManager.playInteract();
              onRetry();
            }}
            className="w-full flex items-center justify-center gap-2 py-3 bg-red-600 hover:bg-red-500 text-white font-display font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            RETRY TIMELINE [R]
          </button>

          <div className="flex gap-2">
            <button
              onClick={() => {
                audioManager.playInteract();
                onUndo();
              }}
              disabled={state.stepHistory.length <= 1}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-slate-200 border border-slate-800 font-display font-semibold text-xs uppercase cursor-pointer"
            >
              <Undo2 className="w-3.5 h-3.5 text-cyan-400" />
              UNDO STEP [U]
            </button>

            <button
              onClick={() => {
                audioManager.playInteract();
                onOpenHints();
              }}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-slate-800 font-display font-semibold text-xs uppercase cursor-pointer"
            >
              <HelpCircle className="w-3.5 h-3.5 text-cyan-400" />
              TACTICAL HINTS [H]
            </button>
          </div>

          <button
            onClick={() => {
              audioManager.playInteract();
              onOpenLevelSelect();
            }}
            className="w-full py-2 text-slate-400 hover:text-slate-200 font-mono-code text-xs uppercase cursor-pointer"
          >
            RETURN TO PROTOCOL LIST
          </button>
        </div>
      </div>
    </div>
  );
};
