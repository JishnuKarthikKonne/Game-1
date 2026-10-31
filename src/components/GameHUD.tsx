/**
 * PARADOX - Gameplay HUD Overlay
 * Low-occlusion perimeter HUD (>85% unobstructed viewport).
 * Features tabular readouts, visual Echo timeline dock, touch controls, and Observer transmissions.
 */

import React, { useState } from 'react';
import {
  RotateCcw,
  Undo2,
  HelpCircle,
  Pause as PauseIcon,
  ChevronUp,
  ChevronDown,
  RotateCw,
  Compass,
  Zap,
  Users,
} from 'lucide-react';
import { ActionType, LevelDefinition, SimulationState } from '../game/types';
import { audioManager } from '../game/audio';

interface GameHUDProps {
  level: LevelDefinition;
  state: SimulationState;
  onAction: (action: ActionType) => void;
  onUndo: () => void;
  onRestartAndRecordEcho: () => void;
  onResetRoom: () => void;
  onOpenHints: () => void;
  onOpenPause: () => void;
  onRotateCamLeft: () => void;
  onRotateCamRight: () => void;
  onResetCam: () => void;
  observerMessage: string | null;
}

export const GameHUD: React.FC<GameHUDProps> = ({
  level,
  state,
  onAction,
  onUndo,
  onRestartAndRecordEcho,
  onOpenHints,
  onOpenPause,
  onRotateCamLeft,
  onRotateCamRight,
  onResetCam,
  observerMessage,
}) => {
  const [isTimelineExpanded, setIsTimelineExpanded] = useState(true);

  return (
    <div className="fixed inset-0 z-30 pointer-events-none flex flex-col justify-between p-4 md:p-6 select-none">
      {/* Top Bar: Level Info & Action Utilities */}
      <div className="flex items-start justify-between gap-4">
        {/* Left cluster: Protocol Header & Par readouts */}
        <div className="pointer-events-auto bg-slate-950/90 border border-slate-800 p-3.5 max-w-sm shadow-xl">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono-code text-[11px] font-bold text-cyan-400 uppercase tracking-widest px-1.5 py-0.5 bg-cyan-950/80 border border-cyan-800/80">
              PROTOCOL 0{level.id}
            </span>
            <span className="font-display text-sm font-bold text-white tracking-wide">
              {level.title}
            </span>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono-code pt-1 text-slate-400">
            <div>
              <span className="text-slate-500 mr-1.5 uppercase text-[10px]">TURNS:</span>
              <span className="font-bold text-cyan-400 tabular-nums text-sm">
                {state.turn}
              </span>
              <span className="text-slate-600"> / {level.maxTurns}</span>
            </div>

            <div className="flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-slate-500 mr-1 uppercase text-[10px]">ECHOES:</span>
              <span className="font-bold text-amber-400 tabular-nums text-sm">
                {state.echoes.length}
              </span>
              <span className="text-slate-600"> / {level.maxEchoes}</span>
            </div>
          </div>
        </div>

        {/* Center: The Observer Transmission Feed */}
        {observerMessage && (
          <div className="pointer-events-auto max-w-md hidden md:block bg-red-950/80 border border-red-800/80 p-3 shadow-lg animate-fade-in">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 bg-red-500 animate-ping" />
              <span className="font-mono-code text-[10px] font-bold tracking-widest text-red-400 uppercase">
                THE OBSERVER // INTERCEPT
              </span>
            </div>
            <p className="font-mono-code text-xs text-red-200 leading-snug">
              {observerMessage}
            </p>
          </div>
        )}

        {/* Right cluster: Controls & Utilities */}
        <div className="pointer-events-auto flex items-center gap-2">
          {/* Create Echo [R] */}
          <button
            onClick={() => {
              audioManager.playEchoCreate();
              onRestartAndRecordEcho();
            }}
            title="Commit attempt as Echo and restart (R)"
            className="flex items-center gap-1.5 px-3 py-2 bg-cyan-600 hover:bg-cyan-500 text-black font-display font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer shadow-md active:translate-y-0.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">CREATE ECHO [R]</span>
            <span className="sm:hidden">ECHO</span>
          </button>

          {/* Undo Step [U] */}
          <button
            onClick={() => {
              audioManager.playInteract();
              onUndo();
            }}
            disabled={state.turn === 0}
            title="Undo last step (U)"
            className="p-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-slate-300 border border-slate-800 transition-colors cursor-pointer"
            aria-label="Undo Step"
          >
            <Undo2 className="w-4 h-4" />
          </button>

          {/* Hint [H] */}
          <button
            onClick={() => {
              audioManager.playInteract();
              onOpenHints();
            }}
            title="Inspect tactical clues (H)"
            className="p-2 bg-slate-900 hover:bg-slate-800 text-cyan-400 border border-slate-800 transition-colors cursor-pointer"
            aria-label="Clues and Hints"
          >
            <HelpCircle className="w-4 h-4" />
          </button>

          {/* Camera Controls */}
          <button
            onClick={onRotateCamLeft}
            title="Rotate Camera Left"
            className="p-2 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-colors cursor-pointer hidden sm:block"
            aria-label="Rotate Camera Left"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={onRotateCamRight}
            title="Rotate Camera Right"
            className="p-2 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-colors cursor-pointer hidden sm:block"
            aria-label="Rotate Camera Right"
          >
            <RotateCw className="w-4 h-4" />
          </button>
          <button
            onClick={onResetCam}
            title="Reset Camera View"
            className="p-2 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-colors cursor-pointer hidden sm:block"
            aria-label="Reset Camera View"
          >
            <Compass className="w-4 h-4" />
          </button>

          {/* Pause [Esc] */}
          <button
            onClick={() => {
              audioManager.playInteract();
              onOpenPause();
            }}
            title="Pause Simulation (Esc)"
            className="p-2 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-colors cursor-pointer"
            aria-label="Pause Menu"
          >
            <PauseIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Touch Screen Virtual Controls (Bottom-Left on Mobile) */}
      <div className="pointer-events-auto flex items-end justify-between w-full">
        {/* On-screen D-Pad for Mobile / Mouse click */}
        <div className="grid grid-cols-3 gap-1.5 p-2 bg-slate-950/85 border border-slate-800 w-36 sm:w-40">
          <div />
          <button
            onClick={() => onAction('MOVE_NORTH')}
            aria-label="Move North"
            className="p-3 bg-slate-900 hover:bg-slate-800 active:bg-cyan-700 text-slate-200 border border-slate-700 font-mono-code font-bold text-xs flex justify-center items-center cursor-pointer"
          >
            ▲
          </button>
          <div />

          <button
            onClick={() => onAction('MOVE_WEST')}
            aria-label="Move West"
            className="p-3 bg-slate-900 hover:bg-slate-800 active:bg-cyan-700 text-slate-200 border border-slate-700 font-mono-code font-bold text-xs flex justify-center items-center cursor-pointer"
          >
            ◀
          </button>
          <button
            onClick={() => onAction('INTERACT')}
            aria-label="Wait or Interact"
            className="p-3 bg-cyan-950 hover:bg-cyan-900 active:bg-cyan-600 text-cyan-300 border border-cyan-800 font-mono-code font-bold text-[10px] flex flex-col justify-center items-center cursor-pointer"
          >
            <Zap className="w-3.5 h-3.5 mb-0.5" />
            ACT
          </button>
          <button
            onClick={() => onAction('MOVE_EAST')}
            aria-label="Move East"
            className="p-3 bg-slate-900 hover:bg-slate-800 active:bg-cyan-700 text-slate-200 border border-slate-700 font-mono-code font-bold text-xs flex justify-center items-center cursor-pointer"
          >
            ▶
          </button>

          <div />
          <button
            onClick={() => onAction('MOVE_SOUTH')}
            aria-label="Move South"
            className="p-3 bg-slate-900 hover:bg-slate-800 active:bg-cyan-700 text-slate-200 border border-slate-700 font-mono-code font-bold text-xs flex justify-center items-center cursor-pointer"
          >
            ▼
          </button>
          <div />
        </div>

        {/* Unified Bottom Center Dock: Visual Echo Timeline Scrubber */}
        <div className="pointer-events-auto max-w-xl w-full mx-auto hidden md:block">
          <div className="bg-slate-950/95 border border-slate-800 p-3 shadow-2xl">
            {/* Header / Collapse Toggle */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-800/80 mb-2">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-cyan-400" />
                <span className="font-mono-code text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                  TEMPORAL REPLAY TIMELINE
                </span>
                <span className="font-mono-code text-[10px] text-slate-500">
                  // TURN {state.turn} OF {level.maxTurns}
                </span>
              </div>
              <button
                onClick={() => setIsTimelineExpanded(!isTimelineExpanded)}
                className="text-slate-400 hover:text-white p-1 cursor-pointer"
                aria-label="Toggle Timeline View"
              >
                {isTimelineExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
              </button>
            </div>

            {/* Timeline Tracks */}
            {isTimelineExpanded && (
              <div className="space-y-1.5 font-mono-code text-[10px]">
                {/* Active Player Track */}
                <div className="flex items-center gap-2">
                  <span className="w-16 font-bold text-cyan-400 uppercase truncate">
                    YOU:
                  </span>
                  <div className="flex-1 flex gap-1 overflow-x-auto py-1">
                    {Array.from({ length: Math.max(state.turn + 1, 8) }).map((_, idx) => {
                      const action = state.recordedPlayerActions[idx];
                      const isCurrent = idx === state.turn;
                      return (
                        <div
                          key={idx}
                          className={`w-7 h-6 flex items-center justify-center font-bold text-[9px] border ${
                            isCurrent
                              ? 'bg-cyan-500 text-black border-cyan-400'
                              : action
                              ? 'bg-slate-900 text-cyan-300 border-slate-700'
                              : 'bg-slate-950 text-slate-700 border-slate-900'
                          }`}
                        >
                          {action ? formatActionShort(action.type) : idx}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Echo Tracks */}
                {state.pastEchoes.map((echo, echoIdx) => (
                  <div key={echo.id} className="flex items-center gap-2">
                    <span className="w-16 font-bold uppercase truncate" style={{ color: echo.color }}>
                      {echo.label}:
                    </span>
                    <div className="flex-1 flex gap-1 overflow-x-auto py-1">
                      {Array.from({ length: Math.max(state.turn + 1, 8) }).map((_, idx) => {
                        const action = echo.actions[idx];
                        const isCurrent = idx === state.turn;
                        return (
                          <div
                            key={idx}
                            className={`w-7 h-6 flex items-center justify-center font-bold text-[9px] border ${
                              isCurrent
                                ? 'bg-amber-400 text-black border-amber-300'
                                : action
                                ? 'bg-slate-900 text-slate-300 border-slate-700'
                                : 'bg-slate-950 text-slate-800 border-slate-900'
                            }`}
                          >
                            {action ? formatActionShort(action.type) : '—'}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick action: Wait / Pass Turn */}
        <div className="pointer-events-auto">
          <button
            onClick={() => onAction('WAIT')}
            className="px-4 py-3 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-mono-code font-bold text-xs uppercase tracking-wider cursor-pointer"
          >
            WAIT [SPACE]
          </button>
        </div>
      </div>
    </div>
  );
};

function formatActionShort(act: ActionType): string {
  switch (act) {
    case 'MOVE_NORTH': return '↑';
    case 'MOVE_SOUTH': return '↓';
    case 'MOVE_EAST': return '→';
    case 'MOVE_WEST': return '←';
    case 'INTERACT': return 'USE';
    case 'WAIT': return '•';
    case 'PUSH': return 'P';
    default: return '?';
  }
}
