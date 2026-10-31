/**
 * PARADOX - Settings Modal
 */

import React from 'react';
import { X, Volume2, VolumeX, RotateCcw } from 'lucide-react';
import { UserProgress } from '../game/types';
import { audioManager } from '../game/audio';

interface SettingsModalProps {
  progress: UserProgress;
  onUpdateAudio: (sfxVolume: number, musicVolume: number, muted: boolean) => void;
  onResetProgress: () => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  progress,
  onUpdateAudio,
  onResetProgress,
  onClose,
}) => {
  const { sfxVolume, musicVolume, muted } = progress.audioSettings;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 select-none">
      <div className="w-full max-w-md bg-slate-950 border border-slate-800 p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-6">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 bg-cyan-400" />
            <h2 className="font-display font-bold text-base text-white uppercase tracking-wider">
              FACILITY PREFERENCES // CONFIG
            </h2>
          </div>
          <button
            onClick={() => {
              audioManager.playInteract();
              onClose();
            }}
            className="text-slate-400 hover:text-white p-1 cursor-pointer"
            aria-label="Close Settings"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-6 mb-8 font-mono-code text-xs">
          {/* Mute master switch */}
          <div className="flex items-center justify-between p-3 bg-slate-900 border border-slate-800">
            <div>
              <span className="text-white font-bold block">MASTER AUDIO</span>
              <span className="text-[10px] text-slate-400">Toggle all procedural sound synthesis</span>
            </div>
            <button
              onClick={() => onUpdateAudio(sfxVolume, musicVolume, !muted)}
              className={`p-2 border transition-colors cursor-pointer ${
                muted
                  ? 'bg-red-950/60 border-red-800 text-red-400'
                  : 'bg-cyan-950/60 border-cyan-800 text-cyan-400'
              }`}
            >
              {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
          </div>

          {/* SFX Volume */}
          <div>
            <div className="flex justify-between mb-1.5 text-slate-300">
              <span>SFX VOLUME</span>
              <span className="text-cyan-400 tabular-nums">{Math.round(sfxVolume * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={sfxVolume}
              onChange={(e) => onUpdateAudio(parseFloat(e.target.value), musicVolume, muted)}
              className="w-full accent-cyan-400 cursor-pointer"
            />
          </div>

          {/* Music Drone Volume */}
          <div>
            <div className="flex justify-between mb-1.5 text-slate-300">
              <span>AMBIENT DRONE VOLUME</span>
              <span className="text-cyan-400 tabular-nums">{Math.round(musicVolume * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={musicVolume}
              onChange={(e) => onUpdateAudio(sfxVolume, parseFloat(e.target.value), muted)}
              className="w-full accent-cyan-400 cursor-pointer"
            />
          </div>

          {/* Danger zone: reset progress */}
          <div className="pt-4 border-t border-slate-900">
            <span className="text-slate-500 block mb-2 uppercase text-[10px]">
              DATA STORAGE
            </span>
            <button
              onClick={() => {
                if (window.confirm('Reset all campaign protocol progress and records?')) {
                  onResetProgress();
                }
              }}
              className="flex items-center gap-2 px-3 py-2 bg-red-950/30 hover:bg-red-950/60 text-red-400 border border-red-900 text-xs font-bold uppercase cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>RESET SAVED PROTOCOL PROGRESS</span>
            </button>
          </div>
        </div>

        <button
          onClick={() => {
            audioManager.playInteract();
            onClose();
          }}
          className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-display font-bold text-xs uppercase tracking-wider cursor-pointer"
        >
          CONFIRM & CLOSE
        </button>
      </div>
    </div>
  );
};
