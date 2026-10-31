/**
 * PARADOX - Unit Tests & Solvability Verification Suite
 * Uses Node's built-in test runner: node:test & node:assert/strict
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createInitialState,
  stepTurn,
  undoTurn,
} from './simulation';
import { CAMPAIGN_LEVELS } from './levels';
import { ActionType, EchoRecord } from './types';

test('Level 1: First Memory Solvability & Echo Replay', () => {
  const level = CAMPAIGN_LEVELS[0];

  // Run 1: Player walks to plate at (2, 3) and holds it
  let state1 = createInitialState(level, []);
  assert.equal(state1.turn, 0);
  assert.equal(state1.player.x, 1);
  assert.equal(state1.player.y, 2);
  assert.equal(state1.doors['door_1'], false);

  // Path: (1, 2) -> East to (2, 2) -> South to (2, 3) [plate pressed!] -> wait
  const run1Actions: ActionType[] = [
    'MOVE_EAST',
    'MOVE_SOUTH',
    'WAIT',
    'WAIT',
    'WAIT',
    'WAIT',
    'WAIT',
  ];

  for (const act of run1Actions) {
    state1 = stepTurn(state1, level, act);
  }

  assert.equal(state1.player.x, 2);
  assert.equal(state1.player.y, 3);
  assert.equal(state1.doors['door_1'], true, 'Plate 1 must open Door 1');

  // Create Echo 1
  const echo1: EchoRecord = {
    id: 'echo_1',
    color: '#00e5ff',
    label: 'Echo α',
    spawn: { ...level.spawn },
    actions: [...state1.recordedPlayerActions],
  };

  // Run 2: Echo 1 goes to plate, Player walks straight to Exit at (5, 2)
  let state2 = createInitialState(level, [echo1]);
  const run2Actions: ActionType[] = [
    'WAIT',       // turn 0: Echo moves to (2, 2)
    'WAIT',       // turn 1: Echo moves to (2, 3 plate). Door opens!
    'MOVE_EAST',  // turn 2: Player to (2, 2)
    'MOVE_EAST',  // turn 3: Player to (3, 2)
    'MOVE_EAST',  // turn 4: Player to (4, 2) through door_1
    'MOVE_EAST',  // turn 5: Player to (5, 2) EXIT!
  ];

  for (const act of run2Actions) {
    state2 = stepTurn(state2, level, act);
  }

  assert.equal(state2.player.x, level.exit.x);
  assert.equal(state2.player.y, level.exit.y);
  assert.equal(state2.isWon, true, 'Level 1 must be won!');
  assert.equal(state2.isFailed, false);
});

test('Level 2: Second Self Simultaneous Resonance', () => {
  const level = CAMPAIGN_LEVELS[1];

  // Run 1: Player walks to plate_north at (3, 1) and waits
  // Spawn is at (1, 3).
  // Path: (1, 3) -> N (1, 2) -> N (1, 1) -> E (2, 1) -> E (3, 1) -> WAITs
  let state1 = createInitialState(level, []);
  const run1Actions: ActionType[] = [
    'MOVE_NORTH', // (1, 2)
    'MOVE_NORTH', // (1, 1)
    'MOVE_EAST',  // (2, 1)
    'MOVE_EAST',  // (3, 1) on plate_north!
    'WAIT',
    'WAIT',
    'WAIT',
    'WAIT',
    'WAIT',
    'WAIT',
    'WAIT',
  ];

  for (const act of run1Actions) {
    state1 = stepTurn(state1, level, act);
  }

  const echo1: EchoRecord = {
    id: 'echo_1',
    color: '#00e5ff',
    label: 'Echo α',
    spawn: { ...level.spawn },
    actions: [...state1.recordedPlayerActions],
  };

  // Run 2: Echo 1 goes to North plate. Player goes to South plate at (3, 5).
  // At turn 4, both plates are held! Door at (5, 3) latches open!
  // Player returns via (2, 5) -> (1, 5) -> (1, 4) -> (1, 3) -> (2, 3) -> (3, 3) -> (4, 3) -> (5, 3 door) -> (6, 3 exit)!
  let state2 = createInitialState(level, [echo1]);
  const run2Actions: ActionType[] = [
    'MOVE_SOUTH', // turn 0: (1, 4)
    'MOVE_SOUTH', // turn 1: (1, 5)
    'MOVE_EAST',  // turn 2: (2, 5)
    'MOVE_EAST',  // turn 3: (3, 5 on plate_south while Echo is on plate_north! Bulkhead latches open!)
    'MOVE_WEST',  // turn 4: (2, 5)
    'MOVE_WEST',  // turn 5: (1, 5)
    'MOVE_NORTH', // turn 6: (1, 4)
    'MOVE_NORTH', // turn 7: (1, 3)
    'MOVE_EAST',  // turn 8: (2, 3)
    'MOVE_EAST',  // turn 9: (3, 3)
    'MOVE_EAST',  // turn 10: (4, 3)
    'MOVE_EAST',  // turn 11: (5, 3 through open door)
    'MOVE_EAST',  // turn 12: (6, 3 EXIT!)
  ];

  for (const act of run2Actions) {
    state2 = stepTurn(state2, level, act);
  }

  assert.equal(state2.doors['door_bulkhead'], true, 'Bulkhead door must latch open!');
  assert.equal(state2.isWon, true, 'Level 2 must be won!');
});

test('Level 3: Causality Terminal Switch Activation', () => {
  const level = CAMPAIGN_LEVELS[2];

  // Run 1: Player walks to switch at (2, 4) and interacts
  // Spawn at (1, 2).
  // Path: (1, 2) -> S (1, 3) -> S (1, 4) -> E (2, 4) -> INTERACT!
  let state1 = createInitialState(level, []);
  const run1Actions: ActionType[] = [
    'MOVE_SOUTH', // (1, 3)
    'MOVE_SOUTH', // (1, 4)
    'MOVE_EAST',  // (2, 4 on switch)
    'INTERACT',   // switch toggled on!
    'WAIT',
    'WAIT',
    'WAIT',
  ];

  for (const act of run1Actions) {
    state1 = stepTurn(state1, level, act);
  }

  assert.equal(state1.switches['switch_terminal'], true);
  assert.equal(state1.doors['door_causal'], true);

  const echo1: EchoRecord = {
    id: 'echo_1',
    color: '#00e5ff',
    label: 'Echo α',
    spawn: { ...level.spawn },
    actions: [...state1.recordedPlayerActions],
  };

  // Run 2: Player waits for switch activation at turn 3, then moves through (4, 2) to (6, 2)
  let state2 = createInitialState(level, [echo1]);
  const run2Actions: ActionType[] = [
    'WAIT',       // turn 0
    'WAIT',       // turn 1
    'MOVE_EAST',  // turn 2: (2, 2)
    'MOVE_EAST',  // turn 3: (3, 2). Echo interacts on switch! Door opens!
    'MOVE_EAST',  // turn 4: (4, 2 through door_causal)
    'MOVE_EAST',  // turn 5: (5, 2)
    'MOVE_EAST',  // turn 6: (6, 2 EXIT!)
  ];

  for (const act of run2Actions) {
    state2 = stepTurn(state2, level, act);
  }

  assert.equal(state2.isWon, true, 'Level 3 must be won!');
});

test('Level 4: Optical Mirror Laser Deflection', () => {
  const level = CAMPAIGN_LEVELS[3];

  // Spawn at (1, 5). Emitter at (1, 1) firing South. Mirror at (1, 3).
  // Receiver at (6, 2).
  // Pushing mirror North:
  // Move North to (1, 4), then push mirror North to (1, 2)!
  let state1 = createInitialState(level, []);
  const run1Actions: ActionType[] = [
    'MOVE_NORTH', // (1, 4)
    'MOVE_NORTH', // pushes mirror at (1, 3) to (1, 2)! Actor is at (1, 3).
    'WAIT',
    'WAIT',
    'WAIT',
    'WAIT',
    'WAIT',
  ];

  for (const act of run1Actions) {
    state1 = stepTurn(state1, level, act);
  }

  assert.equal(state1.blocks['block_mirror'].x, 1);
  assert.equal(state1.blocks['block_mirror'].y, 2);
  assert.equal(state1.receivers['receiver_1'], true, 'Receiver must be illuminated!');
  assert.equal(state1.doors['door_laser_exit'], true, 'Exit door must be open!');

  const echo1: EchoRecord = {
    id: 'echo_1',
    color: '#00e5ff',
    label: 'Echo α',
    spawn: { ...level.spawn },
    actions: [...state1.recordedPlayerActions],
  };

  // Run 2: Player walks East along row 5 to Exit at (6, 5)
  let state2 = createInitialState(level, [echo1]);
  const run2Actions: ActionType[] = [
    'WAIT',       // turn 0
    'WAIT',       // turn 1: Echo pushes mirror into beam! Door at (5, 5) latches open!
    'MOVE_EAST',  // turn 2: (2, 5)
    'MOVE_EAST',  // turn 3: (3, 5)
    'MOVE_EAST',  // turn 4: (4, 5)
    'MOVE_EAST',  // turn 5: (5, 5 through door)
    'MOVE_EAST',  // turn 6: (6, 5 EXIT!)
  ];

  for (const act of run2Actions) {
    state2 = stepTurn(state2, level, act);
  }

  assert.equal(state2.isWon, true, 'Level 4 must be won!');
});

test('Level 5: The Paradox Multi-Stage Master Convergence', () => {
  const level = CAMPAIGN_LEVELS[4];

  // Stage 1: Echo 1 goes to plate_chamber_a at (2, 1) and holds it
  // Spawn at (1, 3).
  // Path: (1, 3) -> N (1, 2) -> N (1, 1) -> E (2, 1) -> WAITs
  let state1 = createInitialState(level, []);
  const run1Actions: ActionType[] = [
    'MOVE_NORTH', // (1, 2)
    'MOVE_NORTH', // (1, 1)
    'MOVE_EAST',  // (2, 1 on plate_chamber_a!)
    'WAIT',
    'WAIT',
    'WAIT',
    'WAIT',
    'WAIT',
    'WAIT',
    'WAIT',
  ];
  for (const act of run1Actions) {
    state1 = stepTurn(state1, level, act);
  }
  const echo1: EchoRecord = {
    id: 'echo_1',
    color: '#00e5ff',
    label: 'Echo α',
    spawn: { ...level.spawn },
    actions: [...state1.recordedPlayerActions],
  };

  // Stage 2: Echo 2 advances through door_stage_1 at (4, 3), loops around to (4, 1),
  // pushes containment block from (5, 1) onto plate_stage_2 at (6, 1), and interacts with switch at (5, 2)!
  let state2 = createInitialState(level, [echo1]);
  const run2Actions: ActionType[] = [
    'WAIT',       // turn 0
    'WAIT',       // turn 1
    'WAIT',       // turn 2: Echo 1 arrives on plate at turn 3
    'MOVE_EAST',  // turn 3: (2, 3)
    'MOVE_EAST',  // turn 4: (3, 3)
    'MOVE_EAST',  // turn 5: (4, 3 through open door_stage_1)
    'MOVE_WEST',  // turn 6: (3, 3)
    'MOVE_NORTH', // turn 7: (3, 2)
    'MOVE_NORTH', // turn 8: (3, 1)
    'MOVE_EAST',  // turn 9: (4, 1)
    'MOVE_EAST',  // turn 10: pushes block at (5, 1) onto plate at (6, 1)! Echo moves to (5, 1)
    'MOVE_SOUTH', // turn 11: moves South onto switch at (5, 2)
    'INTERACT',   // turn 12: activates switch! Door at (6, 3) opens!
    'WAIT',
    'WAIT',
    'WAIT',
    'WAIT',
    'WAIT',
    'WAIT',
  ];
  for (const act of run2Actions) {
    state2 = stepTurn(state2, level, act);
  }
  const echo2: EchoRecord = {
    id: 'echo_2',
    color: '#ff2d55',
    label: 'Echo β',
    spawn: { ...level.spawn },
    actions: [...state2.recordedPlayerActions],
  };

  // Stage 3: Current Player now walks through both doors to Exit at (7, 3)!
  let state3 = createInitialState(level, [echo1, echo2]);
  const run3Actions: ActionType[] = [
    'WAIT',       // turn 0
    'WAIT',       // turn 1
    'WAIT',       // turn 2
    'WAIT',       // turn 3
    'WAIT',       // turn 4
    'WAIT',       // turn 5
    'WAIT',       // turn 6
    'WAIT',       // turn 7
    'WAIT',       // turn 8
    'WAIT',       // turn 9
    'WAIT',       // turn 10
    'WAIT',       // turn 11
    'MOVE_EAST',  // turn 12: (2, 3) - switch active, door opens!
    'MOVE_EAST',  // turn 13: (3, 3)
    'MOVE_EAST',  // turn 14: (4, 3 through door_stage_1)
    'MOVE_EAST',  // turn 15: (5, 3)
    'MOVE_EAST',  // turn 16: (6, 3 through door_master_exit)
    'MOVE_EAST',  // turn 17: (7, 3 EXIT!)
  ];
  for (const act of run3Actions) {
    state3 = stepTurn(state3, level, act);
  }

  assert.equal(state3.isWon, true, 'Level 5 must be won!');
});

test('Undo turn reverts simulation snapshot correctly', () => {
  const level1 = CAMPAIGN_LEVELS[0];
  let state = createInitialState(level1, []);

  state = stepTurn(state, level1, 'MOVE_EAST');
  assert.equal(state.player.x, 2);
  assert.equal(state.turn, 1);

  state = undoTurn(state, level1);
  assert.equal(state.player.x, 1);
  assert.equal(state.turn, 0);
});
