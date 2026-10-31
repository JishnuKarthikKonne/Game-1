/**
 * PARADOX - Master Game Coordinator
 * 3D Tactical Puzzle Game: "Every move becomes part of your next problem."
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { CAMPAIGN_LEVELS } from './game/levels';
import {
  ActionType,
  EchoRecord,
  LevelDefinition,
  SimulationState,
  UserProgress,
} from './game/types';
import {
  createInitialState,
  stepTurn,
  undoTurn,
} from './game/simulation';
import {
  loadUserProgress,
  recordLevelCompletion,
  resetAllProgress,
  saveUserProgress,
} from './game/storage';
import { audioManager } from './game/audio';
import { initThreeScene, ThreeSceneManager } from './rendering/threeScene';
import { TitleScreen } from './components/TitleScreen';
import { GameHUD } from './components/GameHUD';
import { PauseModal } from './components/PauseModal';
import { VictoryModal } from './components/VictoryModal';
import { GameOverModal } from './components/GameOverModal';
import { HintModal } from './components/HintModal';
import { LevelSelectModal } from './components/LevelSelectModal';
import { SettingsModal } from './components/SettingsModal';
import { Capacitor } from '@capacitor/core';
import { App as CapApp } from '@capacitor/app';

type AppState = 'title' | 'playing' | 'paused' | 'gameover';

export default function App() {
  const canvasMountRef = useRef<HTMLDivElement>(null);
  const sceneMgrRef = useRef<ThreeSceneManager | null>(null);

  // Persistent user progress
  const [progress, setProgress] = useState<UserProgress>(loadUserProgress);

  // Game state
  const [appState, setAppState] = useState<AppState>(() => {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('autostart') === '1' ? 'playing' : 'title';
  });

  const [currentLevelId, setCurrentLevelId] = useState<number>(1);
  const currentLevel: LevelDefinition =
    CAMPAIGN_LEVELS.find((lvl) => lvl.id === currentLevelId) || CAMPAIGN_LEVELS[0];

  // Past Echoes for the current room
  const [pastEchoes, setPastEchoes] = useState<EchoRecord[]>([]);

  // Simulation state
  const [simState, setSimState] = useState<SimulationState>(() =>
    createInitialState(currentLevel, [])
  );

  // Observer transmission
  const [observerMsg, setObserverMsg] = useState<string | null>(currentLevel.observerIntro);
  const [attemptCount, setAttemptCount] = useState<number>(1);
  const [levelStartTime, setLevelStartTime] = useState<number>(Date.now());
  const [elapsedMs, setElapsedMs] = useState<number>(0);

  // Modals
  const [showHints, setShowHints] = useState(false);
  const [showLevelSelect, setShowLevelSelect] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Audio settings
  const [isMuted, setIsMuted] = useState(progress.audioSettings.muted);

  // Sync state to body dataset
  useEffect(() => {
    document.body.dataset.state = appState;
  }, [appState]);

  // Keep refs for 60fps render loop
  const simStateRef = useRef<SimulationState>(simState);
  useEffect(() => {
    simStateRef.current = simState;
  }, [simState]);

  const currentLevelRef = useRef<LevelDefinition>(currentLevel);
  useEffect(() => {
    currentLevelRef.current = currentLevel;
  }, [currentLevel]);

  // Initialize Three.js scene ONCE
  useEffect(() => {
    if (!canvasMountRef.current) return;

    const mgr = initThreeScene(canvasMountRef.current, currentLevelRef.current);
    sceneMgrRef.current = mgr;

    let animId = 0;
    let lastTime = performance.now();

    const loop = (time: number) => {
      const dt = Math.min((time - lastTime) / 1000, 0.05);
      lastTime = time;

      if (sceneMgrRef.current) {
        sceneMgrRef.current.updateScene(simStateRef.current, currentLevelRef.current, dt);
        sceneMgrRef.current.render();
      }
      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animId);
      if (sceneMgrRef.current) {
        sceneMgrRef.current.dispose();
        sceneMgrRef.current = null;
      }
    };
  }, []);

  // Seamlessly load new level geometry without destroying WebGL context
  useEffect(() => {
    if (sceneMgrRef.current) {
      sceneMgrRef.current.loadLevel(currentLevel);
    }
  }, [currentLevelId]);

  // Start audio ambience on first user interaction
  useEffect(() => {
    audioManager.setMuted(isMuted);
    audioManager.setVolumes(progress.audioSettings.sfxVolume, progress.audioSettings.musicVolume);
    if (appState === 'playing') {
      audioManager.startAmbience();
    }
  }, [appState, isMuted, progress.audioSettings]);

  // Handle Android native back button and app lifecycle
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const backListener = CapApp.addListener('backButton', () => {
      if (showHints) {
        setShowHints(false);
      } else if (showLevelSelect) {
        setShowLevelSelect(false);
      } else if (showSettings) {
        setShowSettings(false);
      } else if (appState === 'paused') {
        setAppState('playing');
      } else if (appState === 'playing') {
        setAppState('paused');
      } else if (appState === 'gameover') {
        setAppState('title');
      } else if (appState === 'title') {
        CapApp.exitApp();
      }
    });

    const stateListener = CapApp.addListener('appStateChange', ({ isActive }) => {
      if (!isActive) {
        // App went to background
        if (appState === 'playing') {
          setAppState('paused');
        }
        audioManager.stopAmbience();
      } else {
        // App returned to foreground
        if (!isMuted && (appState === 'playing' || appState === 'title')) {
          audioManager.startAmbience();
        }
      }
    });

    return () => {
      backListener.then((handle) => handle.remove());
      stateListener.then((handle) => handle.remove());
    };
  }, [showHints, showLevelSelect, showSettings, appState, isMuted]);

  // Tab visibility changes (desktop and browser)
  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden) {
        audioManager.stopAmbience();
      } else if (!isMuted && appState === 'playing') {
        audioManager.startAmbience();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [isMuted, appState]);

  // Handle Level Victory / Defeat Transitions
  useEffect(() => {
    if (simState.isWon) {
      const duration = Date.now() - levelStartTime;
      setElapsedMs(duration);
      audioManager.playVictory();
      setAppState('gameover');

      // Record to storage
      const updated = recordLevelCompletion(
        currentLevel.id,
        simState.turn,
        simState.echoes.length,
        duration,
        currentLevel.parTurns
      );
      setProgress(updated);
    } else if (simState.isFailed) {
      audioManager.playFailure();
      setAppState('gameover');
    }
  }, [simState.isWon, simState.isFailed, currentLevel, levelStartTime]);

  // Action Dispatcher
  const handleAction = useCallback(
    (actionType: ActionType) => {
      if (appState !== 'playing' || simState.isWon || simState.isFailed) return;

      const prevDoors = { ...simState.doors };
      const nextState = stepTurn(simState, currentLevel, actionType);

      // Procedural audio feedback
      if (actionType.startsWith('MOVE')) {
        audioManager.playStep();
      } else if (actionType === 'INTERACT') {
        audioManager.playInteract();
      }

      // Check if any doors opened/closed
      for (const d of currentLevel.doors) {
        if (prevDoors[d.id] !== nextState.doors[d.id]) {
          audioManager.playDoorMove();
          break;
        }
      }

      setSimState({ ...nextState });
    },
    [appState, simState, currentLevel]
  );

  // Undo turn
  const handleUndo = useCallback(() => {
    if (simState.turn === 0 || simState.stepHistory.length <= 1) return;
    const reverted = undoTurn(simState, currentLevel);
    audioManager.playInteract();
    setSimState({ ...reverted });
    if (appState === 'gameover' && !reverted.isWon && !reverted.isFailed) {
      setAppState('playing');
    }
  }, [simState, currentLevel, appState]);

  // Commit attempt as Echo and restart
  const handleRestartAndRecordEcho = useCallback(() => {
    if (simState.recordedPlayerActions.length === 0) {
      // Just reset if no moves made
      setSimState(createInitialState(currentLevel, pastEchoes));
      return;
    }

    // Limit echoes to maxEchoes
    let newPastEchoes = [...pastEchoes];
    if (newPastEchoes.length >= currentLevel.maxEchoes) {
      // Drop oldest echo to make room
      newPastEchoes.shift();
    }

    const echoIdx = newPastEchoes.length + 1;
    const newEcho: EchoRecord = {
      id: `echo_${Date.now()}_${echoIdx}`,
      color: echoIdx === 1 ? '#00e5ff' : '#ff2d55',
      label: echoIdx === 1 ? 'Echo α' : echoIdx === 2 ? 'Echo β' : `Echo γ`,
      spawn: { ...currentLevel.spawn },
      actions: [...simState.recordedPlayerActions],
    };

    newPastEchoes.push(newEcho);
    setPastEchoes(newPastEchoes);

    // Spawn new timeline
    const freshState = createInitialState(currentLevel, newPastEchoes);
    setSimState(freshState);
    setAttemptCount((prev) => prev + 1);
    setObserverMsg(`ECHO RECORDED. ATTEMPT #${attemptCount + 1} INITIALIZED.`);
    audioManager.playEchoCreate();
    setAppState('playing');
  }, [simState, currentLevel, pastEchoes, attemptCount]);

  // Restart current attempt (clear current moves, keep existing Echoes)
  const handleRestartAttempt = useCallback(() => {
    const freshState = createInitialState(currentLevel, pastEchoes);
    setSimState(freshState);
    setAppState('playing');
  }, [currentLevel, pastEchoes]);

  // Reset room completely (purge all Echoes)
  const handleClearEchoes = useCallback(() => {
    setPastEchoes([]);
    const freshState = createInitialState(currentLevel, []);
    setSimState(freshState);
    setObserverMsg(currentLevel.observerIntro);
    setAppState('playing');
  }, [currentLevel]);

  // Switch to a new level
  const handleSelectLevel = useCallback((levelId: number) => {
    setCurrentLevelId(levelId);
    setPastEchoes([]);
    const nextLvl = CAMPAIGN_LEVELS.find((l) => l.id === levelId) || CAMPAIGN_LEVELS[0];
    setSimState(createInitialState(nextLvl, []));
    setObserverMsg(nextLvl.observerIntro);
    setLevelStartTime(Date.now());
    setShowLevelSelect(false);
    setAppState('playing');
  }, []);

  // Keyboard navigation & edge triggers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in form/input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (e.key === 'Escape') {
        if (appState === 'playing') {
          setAppState('paused');
        } else if (appState === 'paused') {
          setAppState('playing');
        }
        return;
      }

      if (appState !== 'playing') return;

      switch (e.key.toLowerCase()) {
        case 'w':
        case 'arrowup':
          e.preventDefault();
          handleAction('MOVE_NORTH');
          break;
        case 's':
        case 'arrowdown':
          e.preventDefault();
          handleAction('MOVE_SOUTH');
          break;
        case 'a':
        case 'arrowleft':
          e.preventDefault();
          handleAction('MOVE_WEST');
          break;
        case 'd':
        case 'arrowright':
          e.preventDefault();
          handleAction('MOVE_EAST');
          break;
        case ' ':
          e.preventDefault();
          handleAction('INTERACT');
          break;
        case 'r':
          e.preventDefault();
          handleRestartAndRecordEcho();
          break;
        case 'u':
        case 'z':
          e.preventDefault();
          handleUndo();
          break;
        case 'h':
          e.preventDefault();
          setShowHints((prev) => !prev);
          break;
        case 'q':
          sceneMgrRef.current?.rotateCamera(-Math.PI / 8);
          break;
        case 'e':
          sceneMgrRef.current?.rotateCamera(Math.PI / 8);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [appState, handleAction, handleRestartAndRecordEcho, handleUndo]);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black text-slate-100 select-none">
      {/* 3D WebGL Canvas Mount Container */}
      <div
        ref={canvasMountRef}
        data-testid="three-canvas-container"
        className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing"
      />

      {/* Atmospheric scanlines overlay (purely visual, zero pointer obstruction) */}
      <div className="fixed inset-0 scanlines pointer-events-none z-20" />

      {/* Screen 1: Title Screen */}
      {appState === 'title' && (
        <TitleScreen
          onStartGame={() => {
            setAppState('playing');
            setLevelStartTime(Date.now());
          }}
          onOpenLevelSelect={() => setShowLevelSelect(true)}
          onOpenSettings={() => setShowSettings(true)}
          isMuted={isMuted}
          onToggleMute={() => {
            const next = !isMuted;
            setIsMuted(next);
            audioManager.setMuted(next);
            const updated = { ...progress, audioSettings: { ...progress.audioSettings, muted: next } };
            setProgress(updated);
            saveUserProgress(updated);
          }}
        />
      )}

      {/* Screen 2: Active Gameplay HUD */}
      {appState === 'playing' && (
        <GameHUD
          level={currentLevel}
          state={simState}
          onAction={handleAction}
          onUndo={handleUndo}
          onRestartAndRecordEcho={handleRestartAndRecordEcho}
          onResetRoom={handleClearEchoes}
          onOpenHints={() => setShowHints(true)}
          onOpenPause={() => setAppState('paused')}
          onRotateCamLeft={() => sceneMgrRef.current?.rotateCamera(-Math.PI / 6)}
          onRotateCamRight={() => sceneMgrRef.current?.rotateCamera(Math.PI / 6)}
          onResetCam={() => sceneMgrRef.current?.resetCamera()}
          observerMessage={observerMsg}
        />
      )}

      {/* Screen 3: Pause Menu Modal */}
      {appState === 'paused' && (
        <PauseModal
          onResume={() => setAppState('playing')}
          onRestartAttempt={handleRestartAttempt}
          onClearEchoes={handleClearEchoes}
          onOpenLevelSelect={() => setShowLevelSelect(true)}
          onReturnTitle={() => setAppState('title')}
          isMuted={isMuted}
          onToggleMute={() => {
            const next = !isMuted;
            setIsMuted(next);
            audioManager.setMuted(next);
            const updated = { ...progress, audioSettings: { ...progress.audioSettings, muted: next } };
            setProgress(updated);
            saveUserProgress(updated);
          }}
          sfxVolume={progress.audioSettings.sfxVolume}
          musicVolume={progress.audioSettings.musicVolume}
          onSetVolumes={(sfx, music) => {
            audioManager.setVolumes(sfx, music);
            const updated = {
              ...progress,
              audioSettings: { ...progress.audioSettings, sfxVolume: sfx, musicVolume: music },
            };
            setProgress(updated);
            saveUserProgress(updated);
          }}
        />
      )}

      {/* Screen 4: Victory Modal */}
      {appState === 'gameover' && simState.isWon && (
        <VictoryModal
          level={currentLevel}
          state={simState}
          elapsedMs={elapsedMs}
          onNextLevel={() => {
            if (currentLevel.id < 5) {
              handleSelectLevel(currentLevel.id + 1);
            } else {
              setShowLevelSelect(true);
            }
          }}
          onReplayLevel={handleRestartAttempt}
          onOpenLevelSelect={() => setShowLevelSelect(true)}
          isLastLevel={currentLevel.id === 5}
        />
      )}

      {/* Screen 5: Game Over / Failure Modal */}
      {appState === 'gameover' && simState.isFailed && (
        <GameOverModal
          level={currentLevel}
          state={simState}
          onRetry={handleRestartAttempt}
          onUndo={handleUndo}
          onOpenHints={() => setShowHints(true)}
          onOpenLevelSelect={() => setShowLevelSelect(true)}
        />
      )}

      {/* Screen 6: Progressive Tactical Hints Modal */}
      {showHints && (
        <HintModal
          level={currentLevel}
          onClose={() => setShowHints(false)}
        />
      )}

      {/* Screen 7: Level Selection Modal */}
      {showLevelSelect && (
        <LevelSelectModal
          progress={progress}
          currentLevelId={currentLevel.id}
          onSelectLevel={handleSelectLevel}
          onClose={() => setShowLevelSelect(false)}
        />
      )}

      {/* Screen 8: Settings Modal */}
      {showSettings && (
        <SettingsModal
          progress={progress}
          onUpdateAudio={(sfx, music, muted) => {
            setIsMuted(muted);
            audioManager.setMuted(muted);
            audioManager.setVolumes(sfx, music);
            const updated = {
              ...progress,
              audioSettings: { sfxVolume: sfx, musicVolume: music, muted },
            };
            setProgress(updated);
            saveUserProgress(updated);
          }}
          onResetProgress={() => {
            const reset = resetAllProgress();
            setProgress(reset);
            setCurrentLevelId(1);
            setPastEchoes([]);
            setSimState(createInitialState(CAMPAIGN_LEVELS[0], []));
          }}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  );
}
