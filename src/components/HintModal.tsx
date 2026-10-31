/**
 * PARADOX - Progressive Tactical Hints Modal
 * Reveals increasingly specific clues to reward player reasoning without spoiling solutions immediately.
 */

import React, { useState } from 'react';
import { X, HelpCircle, ChevronRight, Lock } from 'lucide-react';
import { LevelDefinition } from '../game/types';
import { audioManager } from '../game/audio';

interface HintModalProps {
  level: LevelDefinition;
  onClose: () => void;
}

export const HintModal: React.FC<HintModalProps> = ({ level, onClose }) => {
  const [unlockedTier, setUnlockedTier] = useState<number>(0);

  const tiers = [
    { title: 'OBSERVATION', desc: level.hints[0] || 'Analyze physical plate mechanisms and door connections.' },
    { title: 'SEQUENCE ADVICE', desc: level.hints[1] || 'Consider recording an Echo that stays stationed at a mechanism.' },
    { title: 'STRATEGIC SOLUTION', desc: level.hints[2] || 'Coordinate present movement with recorded Echoes within turn limits.' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 select-none">
      <div className="w-full max-w-lg bg-slate-950 border border-slate-800 p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-6">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-cyan-400" />
            <h2 className="font-display font-bold text-base text-white uppercase tracking-wider">
              TACTICAL INTEL // PROTOCOL 0{level.id}
            </h2>
          </div>
          <button
            onClick={() => {
              audioManager.playInteract();
              onClose();
            }}
            className="text-slate-400 hover:text-white p-1 cursor-pointer"
            aria-label="Close Hints"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="font-mono-code text-xs text-slate-400 mb-4">
          Hints are progressive. Reveal additional layers if your current timeline becomes stalled:
        </p>

        {/* Clue Tiers */}
        <div className="space-y-3 mb-6">
          {tiers.map((tier, idx) => {
            const isUnlocked = idx <= unlockedTier;

            return (
              <div
                key={idx}
                className={`border p-4 transition-all ${
                  isUnlocked
                    ? 'bg-slate-900/90 border-slate-700'
                    : 'bg-slate-950 border-slate-900 opacity-60'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2 font-mono-code text-xs font-bold">
                    <span className="text-cyan-400">TIER {idx + 1}:</span>
                    <span className="text-white uppercase">{tier.title}</span>
                  </div>

                  {!isUnlocked && (
                    <button
                      onClick={() => {
                        audioManager.playInteract();
                        setUnlockedTier(idx);
                      }}
                      className="flex items-center gap-1 px-2.5 py-1 bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-800 text-[10px] font-mono-code uppercase cursor-pointer"
                    >
                      <Lock className="w-3 h-3" />
                      <span>REVEAL</span>
                    </button>
                  )}
                </div>

                {isUnlocked ? (
                  <p className="font-mono-code text-xs text-slate-300 leading-relaxed pl-1">
                    {tier.desc}
                  </p>
                ) : (
                  <div className="font-mono-code text-xs text-slate-600 italic">
                    [CLASSIFIED INTEL // CLICK REVEAL TO UNLOCK]
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <button
          onClick={() => {
            audioManager.playInteract();
            onClose();
          }}
          className="w-full flex items-center justify-center gap-2 py-3 bg-cyan-600 hover:bg-cyan-500 text-black font-display font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
        >
          <span>RETURN TO SIMULATION</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
