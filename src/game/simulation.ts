/**
 * PARADOX - Pure Deterministic Simulation Engine
 * Handles grid mathematics, turns, Echo playback, collision, plates, switches, lasers, and doors.
 */

import {
  Action,
  ActionType,
  Direction,
  GridCoord,
  LevelDefinition,
  LaserSegment,
  MovableBlock,
  PressurePlate,
  SimulationActor,
  SimulationState,
  SimulationStateSnapshot,
  EchoRecord,
} from './types';

export const DIR_OFFSETS: Record<Direction, GridCoord> = {
  north: { x: 0, y: -1 },
  south: { x: 0, y: 1 },
  east: { x: 1, y: 0 },
  west: { x: -1, y: 0 },
};

export const OPPOSITE_DIR: Record<Direction, Direction> = {
  north: 'south',
  south: 'north',
  east: 'west',
  west: 'east',
};

export function getActionDirection(action: ActionType): Direction | null {
  switch (action) {
    case 'MOVE_NORTH': return 'north';
    case 'MOVE_SOUTH': return 'south';
    case 'MOVE_EAST': return 'east';
    case 'MOVE_WEST': return 'west';
    default: return null;
  }
}

export function createInitialState(
  level: LevelDefinition,
  pastEchoes: EchoRecord[] = []
): SimulationState {
  const doors: Record<string, boolean> = {};
  for (const d of level.doors) {
    doors[d.id] = d.initiallyOpen;
  }

  const switches: Record<string, boolean> = {};
  for (const s of level.switches) {
    switches[s.id] = s.isOn;
  }

  const receivers: Record<string, boolean> = {};
  for (const r of level.receivers) {
    receivers[r.id] = r.active;
  }

  const blocks: Record<string, MovableBlock> = {};
  for (const b of level.blocks) {
    blocks[b.id] = { ...b };
  }

  const player: SimulationActor = {
    id: 'player',
    isPlayer: true,
    x: level.spawn.x,
    y: level.spawn.y,
    facing: level.spawnFacing,
    alive: true,
    glitched: false,
  };

  const echoes: SimulationActor[] = pastEchoes.map((echo) => ({
    id: echo.id,
    isPlayer: false,
    x: echo.spawn.x,
    y: echo.spawn.y,
    facing: level.spawnFacing,
    alive: true,
    glitched: false,
  }));

  const state: SimulationState = {
    turn: 0,
    player,
    echoes,
    recordedPlayerActions: [],
    pastEchoes,
    doors,
    switches,
    receivers,
    blocks,
    laserSegments: [],
    isWon: false,
    isFailed: false,
    stepHistory: [],
  };

  // Run initial pass to update plates, lasers, doors
  evaluateEnvironment(state, level);

  // Take snapshot of turn 0
  state.stepHistory.push(createSnapshot(state));

  return state;
}

function createSnapshot(state: SimulationState): SimulationStateSnapshot {
  return {
    turn: state.turn,
    player: {
      x: state.player.x,
      y: state.player.y,
      facing: state.player.facing,
      alive: state.player.alive,
    },
    echoes: state.echoes.map((e) => ({
      id: e.id,
      x: e.x,
      y: e.y,
      facing: e.facing,
      glitched: e.glitched,
    })),
    recordedPlayerActions: [...state.recordedPlayerActions],
    doors: { ...state.doors },
    switches: { ...state.switches },
    receivers: { ...state.receivers },
    blocks: JSON.parse(JSON.stringify(state.blocks)),
  };
}

export function undoTurn(state: SimulationState, level: LevelDefinition): SimulationState {
  if (state.stepHistory.length <= 1) return state;

  // Pop current state
  state.stepHistory.pop();
  const prevSnapshot = state.stepHistory[state.stepHistory.length - 1];

  state.turn = prevSnapshot.turn;
  state.player = {
    ...state.player,
    ...prevSnapshot.player,
    glitched: false,
  };

  state.echoes = state.echoes.map((e) => {
    const prevEcho = prevSnapshot.echoes.find((pe) => pe.id === e.id);
    return prevEcho
      ? { ...e, ...prevEcho }
      : e;
  });

  state.recordedPlayerActions = [...prevSnapshot.recordedPlayerActions];
  state.doors = { ...prevSnapshot.doors };
  state.switches = { ...prevSnapshot.switches };
  state.receivers = { ...prevSnapshot.receivers };
  state.blocks = JSON.parse(JSON.stringify(prevSnapshot.blocks));
  state.isWon = false;
  state.isFailed = false;
  state.failureReason = undefined;

  evaluateEnvironment(state, level);
  return state;
}

export function isWalkableTile(
  level: LevelDefinition,
  x: number,
  y: number,
  doors: Record<string, boolean>
): boolean {
  if (x < 0 || x >= level.width || y < 0 || y >= level.height) {
    return false;
  }
  const tile = level.tiles[y][x];
  if (tile === 'WALL' || tile === 'HOLE') {
    return false;
  }

  // Check if there is a closed door here
  for (const door of level.doors) {
    if (door.x === x && door.y === y && !doors[door.id]) {
      return false; // closed door
    }
  }

  return true;
}

export function getBlockAt(
  blocks: Record<string, MovableBlock>,
  x: number,
  y: number
): MovableBlock | null {
  for (const b of Object.values(blocks)) {
    if (b.x === x && b.y === y) return b;
  }
  return null;
}

export function getActorAt(
  state: SimulationState,
  x: number,
  y: number
): SimulationActor | null {
  if (state.player.alive && state.player.x === x && state.player.y === y) {
    return state.player;
  }
  for (const echo of state.echoes) {
    if (echo.alive && echo.x === x && echo.y === y) {
      return echo;
    }
  }
  return null;
}

/**
 * Execute a single logical turn with player's action and synchronized Echo replays
 */
export function stepTurn(
  state: SimulationState,
  level: LevelDefinition,
  playerActionType: ActionType
): SimulationState {
  if (state.isWon || state.isFailed) {
    return state;
  }

  const currentTurn = state.turn;
  const playerAction: Action = {
    type: playerActionType,
    turn: currentTurn,
    direction: getActionDirection(playerActionType) || state.player.facing,
  };

  // Record player action
  state.recordedPlayerActions.push(playerAction);

  // Collect intended actions for all actors
  // Echoes read their action at index `currentTurn` from their recording
  const actorIntents: {
    actor: SimulationActor;
    action: Action;
    record?: EchoRecord;
  }[] = [];

  actorIntents.push({
    actor: state.player,
    action: playerAction,
  });

  for (const echo of state.echoes) {
    const record = state.pastEchoes.find((pe) => pe.id === echo.id);
    const recordedAction = record?.actions[currentTurn] || {
      type: 'WAIT',
      turn: currentTurn,
      direction: echo.facing,
    };
    actorIntents.push({
      actor: echo,
      action: recordedAction,
      record,
    });
  }

  // 1. Process Interactions (e.g. pressing console switch)
  for (const { actor, action } of actorIntents) {
    if (action.type === 'INTERACT' && actor.alive && !actor.glitched) {
      const facingOffset = DIR_OFFSETS[actor.facing];
      const targetX = actor.x + facingOffset.x;
      const targetY = actor.y + facingOffset.y;

      // Check switch either directly underneath actor or directly in front of actor
      for (const sw of level.switches) {
        if (
          (sw.x === actor.x && sw.y === actor.y) ||
          (sw.x === targetX && sw.y === targetY)
        ) {
          state.switches[sw.id] = !state.switches[sw.id];
        }
      }
    }
  }

  // 2. Process Movement & Pushing
  // We execute player first, then echoes
  for (const { actor, action } of actorIntents) {
    if (!actor.alive) continue;

    const dir = getActionDirection(action.type);
    if (!dir) {
      // WAIT or INTERACT doesn't change position
      continue;
    }

    actor.facing = dir;
    const offset = DIR_OFFSETS[dir];
    const targetX = actor.x + offset.x;
    const targetY = actor.y + offset.y;

    // Check walkability of target tile (walls, holes, closed doors)
    if (!isWalkableTile(level, targetX, targetY, state.doors)) {
      if (!actor.isPlayer) {
        actor.glitched = true;
        actor.glitchReason = `Echo collision at turn ${currentTurn}: blocked by barrier`;
      }
      continue;
    }

    // Check if target is blocked by a Movable Block
    const blockAtTarget = getBlockAt(state.blocks, targetX, targetY);
    if (blockAtTarget) {
      // Attempt to push block
      const blockPushX = targetX + offset.x;
      const blockPushY = targetY + offset.y;

      const canPush =
        isWalkableTile(level, blockPushX, blockPushY, state.doors) &&
        !getBlockAt(state.blocks, blockPushX, blockPushY) &&
        !getActorAt(state, blockPushX, blockPushY);

      if (canPush) {
        // Move block
        blockAtTarget.x = blockPushX;
        blockAtTarget.y = blockPushY;
        // Move actor
        actor.x = targetX;
        actor.y = targetY;
      } else {
        // Cannot push block
        if (!actor.isPlayer) {
          actor.glitched = true;
          actor.glitchReason = `Echo collision at turn ${currentTurn}: block obstructed`;
        }
      }
      continue;
    }

    // Check if target is blocked by another actor
    // In our tactical rules, two actors cannot occupy the same tile simultaneously
    const otherActor = getActorAt(state, targetX, targetY);
    if (otherActor && otherActor.id !== actor.id) {
      if (!actor.isPlayer) {
        actor.glitched = true;
        actor.glitchReason = `Echo temporal overlap at turn ${currentTurn}: tile occupied`;
      }
      continue;
    }

    // Free tile: advance actor
    actor.x = targetX;
    actor.y = targetY;
  }

  // 3. Evaluate environmental states: plates, lasers, receivers, doors
  evaluateEnvironment(state, level);

  // Advance turn count
  state.turn += 1;

  // 4. Check Win Condition
  // Player must be alive, non-glitched, and on the EXIT tile
  if (
    state.player.alive &&
    !state.player.glitched &&
    state.player.x === level.exit.x &&
    state.player.y === level.exit.y
  ) {
    state.isWon = true;
  }

  // 5. Check Turn Limit
  if (!state.isWon && state.turn >= level.maxTurns) {
    state.isFailed = true;
    state.failureReason = `Turn limit exceeded (${level.maxTurns} turns). Temporal stability compromised.`;
  }

  // Store snapshot for undo
  state.stepHistory.push(createSnapshot(state));

  return state;
}

/**
 * Re-evaluates all mechanical dependencies:
 * - Pressure Plates
 * - Optical Lasers & Receivers
 * - Security Doors
 * - Laser lethal hazards on actors
 */
export function evaluateEnvironment(
  state: SimulationState,
  level: LevelDefinition
) {
  // 1. Evaluate Pressure Plates
  const plateActivations: Record<string, boolean> = {};

  for (const plate of level.plates) {
    let weight = 0;
    // Check player
    if (state.player.alive && state.player.x === plate.x && state.player.y === plate.y) {
      weight += 1;
    }
    // Check Echoes
    for (const echo of state.echoes) {
      if (echo.alive && echo.x === plate.x && echo.y === plate.y) {
        weight += 1;
      }
    }
    // Check Blocks
    for (const block of Object.values(state.blocks)) {
      if (block.x === plate.x && block.y === plate.y) {
        weight += 1;
      }
    }

    const isPressedNow = weight >= plate.requiredWeight;
    if (plate.type === 'latch') {
      // If was previously active, or pressed now, stay active
      const wasActive = state.switches[`plate_latch_${plate.id}`] || false;
      const nowActive = wasActive || isPressedNow;
      state.switches[`plate_latch_${plate.id}`] = nowActive;
      plateActivations[plate.id] = nowActive;
    } else {
      plateActivations[plate.id] = isPressedNow;
    }
  }

  // 2. Clear Laser Receivers before raycasting
  for (const r of level.receivers) {
    state.receivers[r.id] = false;
  }
  state.laserSegments = [];

  // 3. Raycast Lasers
  for (const emitter of level.emitters) {
    if (!emitter.active) continue;

    let curX = emitter.x;
    let curY = emitter.y;
    let curDir: Direction = emitter.direction;
    const maxSteps = level.width + level.height + 10;
    let steps = 0;

    let segStartX = curX;
    let segStartY = curY;

    while (steps < maxSteps) {
      steps++;
      const offset = DIR_OFFSETS[curDir];
      curX += offset.x;
      curY += offset.y;

      // Check bounds
      if (curX < 0 || curX >= level.width || curY < 0 || curY >= level.height) {
        state.laserSegments.push({
          startX: segStartX,
          startY: segStartY,
          endX: curX - offset.x,
          endY: curY - offset.y,
          color: emitter.color,
        });
        break;
      }

      // Check wall or hole
      const tile = level.tiles[curY][curX];
      if (tile === 'WALL') {
        state.laserSegments.push({
          startX: segStartX,
          startY: segStartY,
          endX: curX,
          endY: curY,
          color: emitter.color,
        });
        break;
      }

      // Check closed door
      let hitClosedDoor = false;
      for (const door of level.doors) {
        if (door.x === curX && door.y === curY && !state.doors[door.id]) {
          hitClosedDoor = true;
          break;
        }
      }
      if (hitClosedDoor) {
        state.laserSegments.push({
          startX: segStartX,
          startY: segStartY,
          endX: curX,
          endY: curY,
          color: emitter.color,
        });
        break;
      }

      // Check block
      const block = getBlockAt(state.blocks, curX, curY);
      if (block) {
        if (block.type === 'mirror' && block.mirrorAngle) {
          // Reflect!
          state.laserSegments.push({
            startX: segStartX,
            startY: segStartY,
            endX: curX,
            endY: curY,
            color: emitter.color,
          });

          // Compute new direction
          let nextDir: Direction | null = null;
          if (block.mirrorAngle === '/') {
            if (curDir === 'north') nextDir = 'east';
            else if (curDir === 'east') nextDir = 'north';
            else if (curDir === 'south') nextDir = 'west';
            else if (curDir === 'west') nextDir = 'south';
          } else {
            // angle '\'
            if (curDir === 'north') nextDir = 'west';
            else if (curDir === 'west') nextDir = 'north';
            else if (curDir === 'south') nextDir = 'east';
            else if (curDir === 'east') nextDir = 'south';
          }

          if (nextDir) {
            curDir = nextDir;
            segStartX = curX;
            segStartY = curY;
            continue;
          } else {
            break;
          }
        } else {
          // Standard block absorbs laser
          state.laserSegments.push({
            startX: segStartX,
            startY: segStartY,
            endX: curX,
            endY: curY,
            color: emitter.color,
          });
          break;
        }
      }

      // Check receiver
      let hitReceiver = false;
      for (const rec of level.receivers) {
        if (rec.x === curX && rec.y === curY) {
          state.receivers[rec.id] = true;
          hitReceiver = true;
          break;
        }
      }
      if (hitReceiver) {
        state.laserSegments.push({
          startX: segStartX,
          startY: segStartY,
          endX: curX,
          endY: curY,
          color: emitter.color,
        });
        break;
      }

      // Check if player or echo is in this cell
      if (state.player.alive && state.player.x === curX && state.player.y === curY) {
        // Player stepped into laser!
        state.player.alive = false;
        state.isFailed = true;
        state.failureReason = 'Lethal optical beam breached suit containment.';
        state.laserSegments.push({
          startX: segStartX,
          startY: segStartY,
          endX: curX,
          endY: curY,
          color: emitter.color,
        });
        break;
      }

      for (const echo of state.echoes) {
        if (echo.alive && echo.x === curX && echo.y === curY) {
          echo.glitched = true;
          echo.glitchReason = 'Echo disrupted by high-intensity optical beam.';
        }
      }
    }
  }

  // 4. Evaluate Doors
  for (const door of level.doors) {
    if (door.controllingIds.length === 0) {
      continue;
    }

    if (door.latching && state.doors[door.id]) {
      // Already unlocked latching door
      continue;
    }

    const inputStates = door.controllingIds.map((id) => {
      if (id in plateActivations) return plateActivations[id];
      if (id in state.switches) return state.switches[id];
      if (id in state.receivers) return state.receivers[id];
      return false;
    });

    let open = false;
    if (door.requiredLogic === 'AND') {
      open = inputStates.every((s) => s);
    } else {
      open = inputStates.some((s) => s);
    }

    state.doors[door.id] = open;
  }
}
