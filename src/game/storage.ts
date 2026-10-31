/**
 * PARADOX - Local Persistent Save Manager
 * Handles offline progress, stars, completion times, and settings in LocalStorage.
 */

import { UserProgress } from './types';

const STORAGE_KEY = 'paradox_save_v1';

const DEFAULT_PROGRESS: UserProgress = {
  unlockedLevel: 1,
  completedLevels: {},
  audioSettings: {
    sfxVolume: 0.7,
    musicVolume: 0.4,
    muted: false,
  },
  cameraSettings: {
    zoom: 1,
    invertRotate: false,
  },
};

export function loadUserProgress(): UserProgress {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_PROGRESS };
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_PROGRESS,
      ...parsed,
      audioSettings: {
        ...DEFAULT_PROGRESS.audioSettings,
        ...(parsed.audioSettings || {}),
      },
      cameraSettings: {
        ...DEFAULT_PROGRESS.cameraSettings,
        ...(parsed.cameraSettings || {}),
      },
    };
  } catch {
    return { ...DEFAULT_PROGRESS };
  }
}

export function saveUserProgress(progress: UserProgress): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch {
    // LocalStorage full or blocked
  }
}

export function recordLevelCompletion(
  levelId: number,
  turns: number,
  echoesCount: number,
  timeMs: number,
  parTurns: number
): UserProgress {
  const current = loadUserProgress();

  let stars = 1;
  if (turns <= parTurns) stars = 3;
  else if (turns <= parTurns + 3) stars = 2;

  const existing = current.completedLevels[levelId];
  if (!existing) {
    current.completedLevels[levelId] = {
      stars,
      bestTurns: turns,
      bestEchoes: echoesCount,
      bestTimeMs: timeMs,
    };
  } else {
    current.completedLevels[levelId] = {
      stars: Math.max(existing.stars, stars),
      bestTurns: Math.min(existing.bestTurns, turns),
      bestEchoes: Math.min(existing.bestEchoes, echoesCount),
      bestTimeMs: Math.min(existing.bestTimeMs, timeMs),
    };
  }

  // Unlock next level
  if (levelId >= current.unlockedLevel && levelId < 5) {
    current.unlockedLevel = levelId + 1;
  }

  saveUserProgress(current);
  return current;
}

export function resetAllProgress(): UserProgress {
  saveUserProgress(DEFAULT_PROGRESS);
  return { ...DEFAULT_PROGRESS };
}
