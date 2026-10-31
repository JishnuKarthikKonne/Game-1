/**
 * PARADOX - Level Selection Modal
 */

import React from 'react';
import { X, Lock, Star, Play } from 'lucide-react';
import { CAMPAIGN_LEVELS } from '../game/levels';
import { UserProgress } from '../game/types';
import { audioManager } from '../game/audio';

interface LevelSelectModalProps {
  progress: UserProgress;
  currentLevelId: number;
  onSelectLevel: (levelId: number) => void;
  onClose: () => void;
}

export const LevelSelectModal: React.FC<LevelSelectModalProps> = ({
  progress,
  currentLevelId,
  onSelectLevel,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 select-none">
      <div className="w-full max-w-2xl bg-slate-950 border border-slate-800 p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-6">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 bg-cyan-400" />
            <h2 className="font-display font-bold text-lg text-white uppercase tracking-wider">
              PROTOCOL ARCHIVES // FACILITY MATRIX
            </h2>
          </div>
          <button
            onClick={() => {
              audioManager.playInteract();
              onClose();
            }}
            className="text-slate-400 hover:text-white p-1 cursor-pointer"
            aria-label="Close Protocol Archives"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6 max-h-[60vh] overflow-y-auto pr-1">
          {CAMPAIGN_LEVELS.map((lvl) => {
            const isUnlocked = lvl.id <= progress.unlockedLevel;
            const completion = progress.completedLevels[lvl.id];
            const isCurrent = lvl.id === currentLevelId;

            return (
              <div
                key={lvl.id}
                onClick={() => {
                  if (isUnlocked) {
                    audioManager.playInteract();
                    onSelectLevel(lvl.id);
                  }
                }}
                className={`border p-4 transition-all relative ${
                  !isUnlocked
                    ? 'bg-slate-950/60 border-slate-900 opacity-50 cursor-not-allowed'
                    : isCurrent
                    ? 'bg-cyan-950/40 border-cyan-500 cursor-pointer shadow-md'
                    : 'bg-slate-900/80 hover:bg-slate-850 border-slate-800 hover:border-slate-700 cursor-pointer'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <span className="font-mono-code text-[10px] font-bold text-cyan-400 uppercase tracking-widest block">
                      PROTOCOL 0{lvl.id}
                    </span>
                    <h3 className="font-display font-bold text-base text-white tracking-wide">
                      {lvl.title}
                    </h3>
                  </div>

                  {!isUnlocked ? (
                    <Lock className="w-4 h-4 text-slate-600" />
                  ) : completion ? (
                    <div className="flex gap-0.5">
                      {[1, 2, 3].map((s) => (
                        <Star
                          key={s}
                          className={`w-3.5 h-3.5 ${
                            s <= completion.stars
                              ? 'text-amber-400 fill-amber-400'
                              : 'text-slate-700'
                          }`}
                        />
                      ))}
                    </div>
                  ) : (
                    <span className="text-[10px] font-mono-code text-cyan-500 bg-cyan-950 px-1.5 py-0.5 border border-cyan-800">
                      NEW
                    </span>
                  )}
                </div>

                <p className="font-mono-code text-xs text-slate-400 line-clamp-2 mb-3">
                  {lvl.subtitle} — {lvl.briefing}
                </p>

                <div className="flex items-center justify-between text-[11px] font-mono-code text-slate-500 border-t border-slate-800/80 pt-2">
                  <span>PAR: {lvl.parTurns} TURNS</span>
                  {completion && (
                    <span className="text-cyan-400">
                      BEST: {completion.bestTurns} TURNS
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex justify-between items-center text-xs font-mono-code text-slate-500 pt-3 border-t border-slate-900">
          <span>PROGRESS: {Object.keys(progress.completedLevels).length} / 5 PROTOCOLS CLEARED</span>
          <button
            onClick={() => {
              audioManager.playInteract();
              onClose();
            }}
            className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300 font-bold uppercase cursor-pointer"
          >
            <span>DISMISS</span>
          </button>
        </div>
      </div>
    </div>
  );
};
