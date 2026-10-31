/**
 * PARADOX - Core Type Definitions
 * Deterministic tactical puzzle engine types.
 */

export type Direction = 'north' | 'south' | 'east' | 'west';

export type ActionType = 
  | 'MOVE_NORTH'
  | 'MOVE_SOUTH'
  | 'MOVE_EAST'
  | 'MOVE_WEST'
  | 'INTERACT'
  | 'WAIT'
  | 'PUSH';

export interface Action {
  type: ActionType;
  turn: number;
  direction?: Direction;
  targetId?: string;
}

export interface GridCoord {
  x: number;
  y: number;
}

export type TileType = 
  | 'FLOOR'
  | 'WALL'
  | 'HOLE'
  | 'EXIT';

export interface PressurePlate {
  id: string;
  x: number;
  y: number;
  type: 'momentary' | 'latch'; // momentary requires active weight; latch stays on once stepped
  requiredWeight: number; // usually 1 (player, echo, or block)
  targetDoorIds: string[];
  color: string;
}

export interface Door {
  id: string;
  x: number;
  y: number;
  orientation: 'horizontal' | 'vertical';
  initiallyOpen: boolean;
  latching?: boolean; // once opened, stays open
  requiredLogic: 'AND' | 'OR'; // if multiple inputs
  controllingIds: string[]; // plate, switch, receiver IDs
}

export interface Switch {
  id: string;
  x: number;
  y: number;
  isOn: boolean;
  color: string;
  targetIds: string[];
}

export interface LaserEmitter {
  id: string;
  x: number;
  y: number;
  direction: Direction;
  color: string;
  active: boolean;
}

export interface LaserReceiver {
  id: string;
  x: number;
  y: number;
  active: boolean;
  targetDoorIds: string[];
  color: string;
}

export interface MovableBlock {
  id: string;
  x: number;
  y: number;
  type: 'standard' | 'mirror'; // mirror reflects lasers 90 degrees
  mirrorAngle?: '/' | '\\'; // optical diagonal orientation
}

export interface LaserSegment {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  color: string;
}

export interface LevelDefinition {
  id: number;
  title: string;
  subtitle: string;
  briefing: string;
  width: number;
  height: number;
  spawn: GridCoord;
  spawnFacing: Direction;
  exit: GridCoord;
  parTurns: number;
  maxTurns: number;
  maxEchoes: number;
  tiles: TileType[][]; // [y][x]
  plates: PressurePlate[];
  doors: Door[];
  switches: Switch[];
  emitters: LaserEmitter[];
  receivers: LaserReceiver[];
  blocks: MovableBlock[];
  hints: string[];
  observerIntro: string;
  observerGlitch?: string;
  observerWin: string;
}

export interface EchoRecord {
  id: string;
  color: string;
  label: string;
  spawn: GridCoord;
  actions: Action[];
}

export interface SimulationActor {
  id: string;
  isPlayer: boolean;
  x: number;
  y: number;
  facing: Direction;
  alive: boolean;
  glitched: boolean;
  glitchReason?: string;
}

export interface SimulationState {
  turn: number;
  player: SimulationActor;
  echoes: SimulationActor[];
  recordedPlayerActions: Action[];
  pastEchoes: EchoRecord[];
  doors: Record<string, boolean>; // id -> isOpen
  switches: Record<string, boolean>; // id -> isOn
  receivers: Record<string, boolean>; // id -> isHitByLaser
  blocks: Record<string, MovableBlock>; // id -> block
  laserSegments: LaserSegment[];
  isWon: boolean;
  isFailed: boolean;
  failureReason?: string;
  stepHistory: SimulationStateSnapshot[];
}

export interface SimulationStateSnapshot {
  turn: number;
  player: { x: number; y: number; facing: Direction; alive: boolean };
  echoes: { id: string; x: number; y: number; facing: Direction; glitched: boolean }[];
  recordedPlayerActions: Action[];
  doors: Record<string, boolean>;
  switches: Record<string, boolean>;
  receivers: Record<string, boolean>;
  blocks: Record<string, MovableBlock>;
}

export interface UserProgress {
  unlockedLevel: number;
  completedLevels: Record<number, {
    stars: number;
    bestTurns: number;
    bestEchoes: number;
    bestTimeMs: number;
  }>;
  audioSettings: {
    sfxVolume: number;
    musicVolume: number;
    muted: boolean;
  };
  cameraSettings: {
    zoom: number;
    invertRotate: boolean;
  };
}
