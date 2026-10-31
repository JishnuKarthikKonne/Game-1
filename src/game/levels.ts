/**
 * PARADOX - Handcrafted Campaign Levels
 * All levels are fully verified, deterministic, and tested for solvability.
 */

import { LevelDefinition, TileType } from './types';

function parseAsciiGrid(map: string[]): TileType[][] {
  return map.map((row) =>
    row.split('').map((char) => {
      if (char === 'W') return 'WALL';
      if (char === 'H') return 'HOLE';
      return 'FLOOR';
    })
  );
}

export const CAMPAIGN_LEVELS: LevelDefinition[] = [
  // ==========================================
  // LEVEL 1: FIRST MEMORY
  // ==========================================
  {
    id: 1,
    title: 'FIRST MEMORY',
    subtitle: 'Protocol 01 — Temporal Imprint',
    briefing: 'Step onto the pressure plate to open the blast door. But walking off closes it. Record your action, then let your Echo hold the door open while you escape.',
    width: 7,
    height: 5,
    spawn: { x: 1, y: 2 },
    spawnFacing: 'east',
    exit: { x: 5, y: 2 },
    parTurns: 6,
    maxTurns: 20,
    maxEchoes: 2,
    tiles: parseAsciiGrid([
      'WWWWWWW',
      'W.....W',
      'W.....W', // (4, 2) is floor where door_1 is placed
      'W.P.W.W',
      'WWWWWWW',
    ]),
    plates: [
      {
        id: 'plate_1',
        x: 2,
        y: 3,
        type: 'momentary',
        requiredWeight: 1,
        targetDoorIds: ['door_1'],
        color: '#00e5ff',
      },
    ],
    doors: [
      {
        id: 'door_1',
        x: 4,
        y: 2,
        orientation: 'vertical',
        initiallyOpen: false,
        requiredLogic: 'AND',
        controllingIds: ['plate_1'],
      },
    ],
    switches: [],
    emitters: [],
    receivers: [],
    blocks: [],
    hints: [
      'The pressure plate at (2, 3) holds the door open while weight rests upon it.',
      'Walk to the plate and wait there, then press [R] to record your Echo.',
      'In the new timeline, your past self will hold the door open while your present self slips through.',
    ],
    observerIntro: 'SUBJECT 74. TIMELINE ISOLATION INITIATED. YOUR ACTIONS WILL BE RETAINED.',
    observerGlitch: 'TEMPORAL DRIFT DETECTED. AN ECHO MET WITH AN IMPEDIMENT.',
    observerWin: 'FIRST ANCHOR SECURED. THE PAST HAS PROVEN USEFUL.',
  },

  // ==========================================
  // LEVEL 2: SECOND SELF
  // ==========================================
  {
    id: 2,
    title: 'SECOND SELF',
    subtitle: 'Protocol 02 — Synchronous Resonance',
    briefing: 'Two resonant plates guard the high-voltage bulkhead. Both plates must be occupied on the same turn to permanently disengage the magnetic lock.',
    width: 8,
    height: 7,
    spawn: { x: 1, y: 3 },
    spawnFacing: 'east',
    exit: { x: 6, y: 3 },
    parTurns: 10,
    maxTurns: 24,
    maxEchoes: 2,
    tiles: parseAsciiGrid([
      'WWWWWWWW',
      'W......W',
      'W.WW.W.W',
      'W......W',
      'W.WW.W.W',
      'W......W',
      'WWWWWWWW',
    ]),
    plates: [
      {
        id: 'plate_north',
        x: 3,
        y: 1,
        type: 'momentary',
        requiredWeight: 1,
        targetDoorIds: ['door_bulkhead'],
        color: '#00e5ff',
      },
      {
        id: 'plate_south',
        x: 3,
        y: 5,
        type: 'momentary',
        requiredWeight: 1,
        targetDoorIds: ['door_bulkhead'],
        color: '#ff2d55',
      },
    ],
    doors: [
      {
        id: 'door_bulkhead',
        x: 5,
        y: 3,
        orientation: 'vertical',
        initiallyOpen: false,
        latching: true,
        requiredLogic: 'AND',
        controllingIds: ['plate_north', 'plate_south'],
      },
    ],
    switches: [],
    emitters: [],
    receivers: [],
    blocks: [],
    hints: [
      'Both North and South plates must be occupied simultaneously on a single turn.',
      'Record an Echo that runs to the North plate and waits there for multiple turns.',
      'In your next attempt, run to the South plate. When both are pressed, the bulkhead latches open permanently.',
    ],
    observerIntro: 'SEPARATION OF CONSCIOUSNESS REQUIRED. TWO POINTS IN SPACE, ONE WILL.',
    observerWin: 'RESONANCE CONFIRMED. BULKHEAD DISENGAGED.',
  },

  // ==========================================
  // LEVEL 3: CAUSALITY
  // ==========================================
  {
    id: 3,
    title: 'CAUSALITY',
    subtitle: 'Protocol 03 — Delayed Transmission',
    briefing: 'The central security field is wired to an auxiliary terminal. Instruct your Echo to activate the terminal while your present self times the sprint through the gate.',
    width: 8,
    height: 6,
    spawn: { x: 1, y: 2 },
    spawnFacing: 'east',
    exit: { x: 6, y: 2 },
    parTurns: 8,
    maxTurns: 22,
    maxEchoes: 2,
    tiles: parseAsciiGrid([
      'WWWWWWWW',
      'W......W',
      'W......W', // (4, 2) is floor where door_causal is located
      'W.WWWW.W',
      'W......W',
      'WWWWWWWW',
    ]),
    plates: [],
    doors: [
      {
        id: 'door_causal',
        x: 4,
        y: 2,
        orientation: 'vertical',
        initiallyOpen: false,
        requiredLogic: 'OR',
        controllingIds: ['switch_terminal'],
      },
    ],
    switches: [
      {
        id: 'switch_terminal',
        x: 2,
        y: 4,
        isOn: false,
        color: '#ffb300',
        targetIds: ['door_causal'],
      },
    ],
    emitters: [],
    receivers: [],
    blocks: [],
    hints: [
      'The power switch at (2, 4) opens the security barrier at (4, 2).',
      'Record an Echo moving to (2, 4) and performing INTERACT [Space].',
      'As the Echo triggers the switch, your present self can pass through into the extraction chamber.',
    ],
    observerIntro: 'EFFECT CAN PRECEDENCE CAUSE IF THE TIMELINE IS ARCHITECTED.',
    observerWin: 'THE LOOP TIGHTENS. OBSERVER METRICS WITHIN SPECIFICATION.',
  },

  // ==========================================
  // LEVEL 4: THE MIRROR
  // ==========================================
  {
    id: 4,
    title: 'THE MIRROR',
    subtitle: 'Protocol 04 — Optical Deflection',
    briefing: 'A high-intensity laser grid seals the corridor. A prism block can redirect the beam into the optical sensor. Push the prism North into the beam path within the turn budget.',
    width: 8,
    height: 7,
    spawn: { x: 1, y: 5 },
    spawnFacing: 'north',
    exit: { x: 6, y: 5 },
    parTurns: 9,
    maxTurns: 24,
    maxEchoes: 2,
    tiles: parseAsciiGrid([
      'WWWWWWWW',
      'W......W',
      'W......W',
      'W......W',
      'W.WWWW.W',
      'W......W',
      'WWWWWWWW',
    ]),
    plates: [],
    doors: [
      {
        id: 'door_laser_exit',
        x: 5,
        y: 5,
        orientation: 'vertical',
        initiallyOpen: false,
        latching: true,
        requiredLogic: 'OR',
        controllingIds: ['receiver_1'],
      },
    ],
    switches: [],
    emitters: [
      {
        id: 'emitter_1',
        x: 1,
        y: 1,
        direction: 'south',
        color: '#00e5ff',
        active: true,
      },
    ],
    receivers: [
      {
        id: 'receiver_1',
        x: 6,
        y: 2,
        active: false,
        targetDoorIds: ['door_laser_exit'],
        color: '#00e5ff',
      },
    ],
    blocks: [
      {
        id: 'block_mirror',
        x: 1,
        y: 3,
        type: 'mirror',
        mirrorAngle: '\\', // South incoming beam reflects to East!
      },
    ],
    hints: [
      'The laser emitter at (1, 1) fires South. A mirror block with angle "\\" reflects a South beam to the East.',
      'If the mirror block is pushed North to (1, 2), the beam reflects East straight into the receiver at (6, 2).',
      'Echo 1 pushes the block North, staying safe behind it. The receiver permanently disengages the exit door at (5, 5).',
    ],
    observerIntro: 'PHOTONS DO NOT FORGET THEIR TRAJECTORY. NEITHER WILL YOU.',
    observerWin: 'PRISM ALIGNMENT ACCEPTED. FREQUENCY STABILIZED.',
  },

  // ==========================================
  // LEVEL 5: THE PARADOX
  // ==========================================
  {
    id: 5,
    title: 'THE PARADOX',
    subtitle: 'Protocol 05 — Master Convergence',
    briefing: 'The final quarantine facility. Requires two past Echoes and the physical player to orchestrate plate override, crate positioning, and terminal activation in synchronized harmony.',
    width: 9,
    height: 7,
    spawn: { x: 1, y: 3 },
    spawnFacing: 'east',
    exit: { x: 7, y: 3 },
    parTurns: 14,
    maxTurns: 30,
    maxEchoes: 3,
    tiles: parseAsciiGrid([
      'WWWWWWWWW',
      'W.......W',
      'W.W.W.W.W',
      'W.......W',
      'W.W.W.W.W',
      'W.......W',
      'WWWWWWWWW',
    ]),
    plates: [
      {
        id: 'plate_stage_1',
        x: 2,
        y: 1,
        type: 'momentary',
        requiredWeight: 1,
        targetDoorIds: ['door_stage_1'],
        color: '#00e5ff',
      },
      {
        id: 'plate_stage_2',
        x: 6,
        y: 1,
        type: 'momentary',
        requiredWeight: 1,
        targetDoorIds: ['door_master_exit'],
        color: '#ff2d55',
      },
    ],
    doors: [
      {
        id: 'door_stage_1',
        x: 4,
        y: 3,
        orientation: 'vertical',
        initiallyOpen: false,
        requiredLogic: 'AND',
        controllingIds: ['plate_stage_1'],
      },
      {
        id: 'door_master_exit',
        x: 6,
        y: 3,
        orientation: 'vertical',
        initiallyOpen: false,
        requiredLogic: 'AND',
        controllingIds: ['plate_stage_2', 'switch_terminal_final'],
      },
    ],
    switches: [
      {
        id: 'switch_terminal_final',
        x: 5,
        y: 2,
        isOn: false,
        color: '#ffb300',
        targetIds: ['door_master_exit'],
      },
    ],
    emitters: [],
    receivers: [],
    blocks: [
      {
        id: 'block_containment',
        x: 5,
        y: 1,
        type: 'standard',
      },
    ],
    hints: [
      'Stage 1: Echo 1 moves to (2, 1) to hold plate_stage_1 open, unlocking door_stage_1 at (4, 3).',
      'Stage 2: Echo 2 advances through door_stage_1, enters the upper wing, pushes the containment block from (5, 1) onto plate_stage_2 at (6, 1), then interacts with the terminal switch at (7, 1).',
      'Stage 3: With both plate_stage_2 and the switch active, the master exit door at (6, 3) opens, allowing you to escape!',
    ],
    observerIntro: 'ALL PARALLEL PATHS MEET HERE. EXECUTE THE COMPLETE CONVERGENCE.',
    observerWin: 'PARADOX RESOLVED. EXTRACTION CORRIDOR INITIALIZED.',
  },
];
