/**
 * PARADOX - Title Screen
 * Bespoke SVG title emblem, atmospheric typography, primary Start CTA (Enter/Space), and single control hint line.
 */

import React, { useEffect } from 'react';
import { Play, Grid, Settings as SettingsIcon, Volume2, VolumeX } from 'lucide-react';
import { audioManager } from '../game/audio';

interface TitleScreenProps {
  onStartGame: () => void;
  onOpenLevelSelect: () => void;
  onOpenSettings: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  onStartGame,
  onOpenLevelSelect,
  onOpenSettings,
  isMuted,
  onToggleMute,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        audioManager.playInteract();
        onStartGame();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onStartGame]);

  return (
    <div className="fixed inset-0 z-40 flex flex-col justify-between p-6 md:p-12 pointer-events-auto bg-black/80 select-none">
      {/* Top Bar with facility classification & mute */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 bg-cyan-400" />
          <span className="font-mono-code text-xs tracking-widest text-cyan-400 uppercase">
            FACILITY CHRONOS // TEMPORAL TEST LAB 09
          </span>
        </div>
        <button
          onClick={onToggleMute}
          aria-label={isMuted ? 'Unmute Audio' : 'Mute Audio'}
          className="p-2.5 text-slate-400 hover:text-white bg-slate-900 border border-slate-800 transition-colors cursor-pointer"
        >
          {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
        </button>
      </div>

      {/* Main Title Centerpiece Lockup */}
      <div className="max-w-2xl my-auto">
        <div className="mb-3 flex items-center gap-2">
          <span className="font-mono-code text-xs text-red-500 uppercase tracking-widest px-2 py-0.5 bg-red-950/60 border border-red-800/60">
            CHRONO-TACTICAL EXPERIMENT
          </span>
        </div>

        {/* Bespoke Inline SVG Title Lockup */}
        <div className="w-full max-w-lg mb-4">
          <svg viewBox="0 0 480 90" className="w-full h-auto overflow-visible" fill="none">
            <defs>
              <linearGradient id="titleGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="60%" stopColor="#e2e8f0" />
                <stop offset="100%" stopColor="#38bdf8" />
              </linearGradient>
              <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="glow" />
                <feMerge>
                  <feMergeNode in="glow" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            <text
              x="0"
              y="70"
              className="font-display font-black tracking-tighter"
              fontSize="78"
              fill="url(#titleGrad)"
              letterSpacing="0.05em"
              filter="url(#glow)"
            >
              PARADOX
            </text>
            <path d="M 370 20 L 470 20 L 450 72 L 370 72 Z" fill="#00e5ff18" stroke="#00e5ff" strokeWidth="1.5" />
            <text x="382" y="52" className="font-mono-code font-bold" fontSize="18" fill="#00e5ff">
              // α-ECHO
            </text>
          </svg>
        </div>

        <p className="font-display text-lg md:text-xl text-slate-300 font-semibold tracking-wide mb-2">
          Every move becomes part of your next problem.
        </p>

        <p className="font-mono-code text-xs md:text-sm text-slate-400 max-w-lg leading-relaxed mb-8">
          The facility records every action you take. When you reset the room, your past self returns as an Echo. Synchronize timelines to override containment locks.
        </p>

        {/* Actions Cluster */}
        <div className="flex flex-wrap items-center gap-4">
          <button
            data-start="true"
            onClick={() => {
              audioManager.playInteract();
              onStartGame();
            }}
            className="group flex items-center gap-3 px-8 py-3.5 bg-cyan-500 hover:bg-cyan-400 text-black font-display font-bold text-sm tracking-wider uppercase transition-all duration-150 cursor-pointer shadow-lg shadow-cyan-500/20 active:translate-y-0.5"
          >
            <Play className="w-4 h-4 fill-black" />
            <span>ENTER SIMULATION</span>
          </button>

          <button
            onClick={() => {
              audioManager.playInteract();
              onOpenLevelSelect();
            }}
            className="flex items-center gap-2 px-5 py-3.5 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 font-display font-semibold text-xs tracking-wider uppercase transition-colors cursor-pointer"
          >
            <Grid className="w-4 h-4 text-cyan-400" />
            <span>SELECT PROTOCOL</span>
          </button>

          <button
            onClick={() => {
              audioManager.playInteract();
              onOpenSettings();
            }}
            className="flex items-center gap-2 p-3.5 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 transition-colors cursor-pointer"
            aria-label="Settings"
          >
            <SettingsIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Flat borderless control hint line in bottom safe margin */}
      <div className="flex flex-wrap items-center justify-between text-xs font-mono-code text-slate-500 pt-6 border-t border-slate-900">
        <div>
          WASD / Arrows Move · Space Wait / Interact · R Record & Create Echo · U Undo · Esc Pause
        </div>
        <div className="text-slate-600">
          PROTOTYPE BUILD // 5 PROTOCOLS VERIFIED
        </div>
      </div>
    </div>
  );
};
