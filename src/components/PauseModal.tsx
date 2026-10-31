/**
 * PARADOX - Pause Modal
 */

import React from 'react';
import { Play, RotateCcw, Trash2, Grid, Home, Volume2, VolumeX } from 'lucide-react';
import { audioManager } from '../game/audio';

interface PauseModalProps {
  onResume: () => void;
  onRestartAttempt: () => void;
  onClearEchoes: () => void;
  onOpenLevelSelect: () => void;
  onReturnTitle: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  sfxVolume: number;
  musicVolume: number;
  onSetVolumes: (sfx: number, music: number) => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  onResume,
  onRestartAttempt,
  onClearEchoes,
  onOpenLevelSelect,
  onReturnTitle,
  isMuted,
  onToggleMute,
  sfxVolume,
  musicVolume,
  onSetVolumes,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 select-none">
      <div className="w-full max-w-md bg-slate-950 border border-slate-800 p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-6">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-amber-400" />
            <h2 className="font-display font-bold text-lg text-white uppercase tracking-wider">
              SIMULATION SUSPENDED
            </h2>
          </div>
          <span className="font-mono-code text-[10px] text-slate-500 uppercase">
            // PAUSE
          </span>
        </div>

        {/* Primary Navigation CTAs */}
        <div className="space-y-2.5 mb-6">
          <button
            onClick={() => {
              audioManager.playInteract();
              onResume();
            }}
            className="w-full flex items-center justify-center gap-2 py-3 bg-cyan-500 hover:bg-cyan-400 text-black font-display font-bold text-sm uppercase tracking-wider transition-colors cursor-pointer"
          >
            <Play className="w-4 h-4 fill-black" />
            RESUME [ESC]
          </button>

          <button
            onClick={() => {
              audioManager.playInteract();
              onRestartAttempt();
            }}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 font-display font-semibold text-xs uppercase tracking-wider transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 text-cyan-400" />
            RESTART CURRENT ATTEMPT [R]
          </button>

          <button
            onClick={() => {
              audioManager.playInteract();
              onClearEchoes();
            }}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-slate-900 hover:bg-slate-800 text-red-300 border border-red-950 font-display font-semibold text-xs uppercase tracking-wider transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5 text-red-400" />
            PURGE ALL ECHOES (FRESH RUN)
          </button>
        </div>

        {/* Audio Volume Controls */}
        <div className="bg-slate-900/60 border border-slate-800/80 p-3.5 mb-6 space-y-3 font-mono-code text-xs">
          <div className="flex items-center justify-between">
            <span className="text-slate-400">MASTER AUDIO</span>
            <button
              onClick={onToggleMute}
              className="flex items-center gap-1.5 px-2 py-1 bg-slate-800 text-slate-300 hover:text-white cursor-pointer"
            >
              {isMuted ? <VolumeX className="w-3.5 h-3.5 text-red-400" /> : <Volume2 className="w-3.5 h-3.5 text-cyan-400" />}
              <span>{isMuted ? 'MUTED' : 'ACTIVE'}</span>
            </button>
          </div>

          <div>
            <div className="flex justify-between text-[10px] text-slate-500 mb-1">
              <span>SFX VOLUME</span>
              <span>{Math.round(sfxVolume * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={sfxVolume}
              onChange={(e) => onSetVolumes(parseFloat(e.target.value), musicVolume)}
              className="w-full accent-cyan-400 cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between text-[10px] text-slate-500 mb-1">
              <span>AMBIENT DRONE</span>
              <span>{Math.round(musicVolume * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={musicVolume}
              onChange={(e) => onSetVolumes(sfxVolume, parseFloat(e.target.value))}
              className="w-full accent-cyan-400 cursor-pointer"
            />
          </div>
        </div>

        {/* Footer Navigation */}
        <div className="flex items-center gap-3 pt-3 border-t border-slate-800">
          <button
            onClick={() => {
              audioManager.playInteract();
              onOpenLevelSelect();
            }}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 font-mono-code text-xs uppercase cursor-pointer"
          >
            <Grid className="w-3.5 h-3.5 text-cyan-400" />
            PROTOCOLS
          </button>

          <button
            onClick={() => {
              audioManager.playInteract();
              onReturnTitle();
            }}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 font-mono-code text-xs uppercase cursor-pointer"
          >
            <Home className="w-3.5 h-3.5 text-slate-400" />
            TITLE MENU
          </button>
        </div>
      </div>
    </div>
  );
};
