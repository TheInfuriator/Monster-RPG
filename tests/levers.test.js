/**
 * levers.test.js
 * ----------------------------------------------------------------------------
 * The Phase 12 half of PuzzleSystem — levers, the current, signals, glows and
 * `closedWhen` — tested on tiny made-up maps, so these keep meaning the same
 * thing however Mistvault and the Tidal Hall are redesigned.
 */

import { describe, it, expect } from 'vitest';
import {
  createBarrierState, findPuzzleProblems, getChannels, getLeverAt, getLeverPositions,
  getPossibleSignals, getPoweredChannels, getPuzzleSignals, hasPuzzle, isPuzzleStateKey,
  leverStateId, pressLever, exploreLeverStates,
} from '../src/systems/PuzzleSystem.js';
import { createNewGameState } from '../src/core/GameState.js';

/**
 * Two valves in a row and a tide wheel pair.
 *
 *   #######
 *   #.....#     y  valves at (1,2) and (5,2); a wheel at (3,4)
 *   #y.#.y#     the "first" valve feeds the "second"
 *   #..#..#     bridge A at (3,1) follows current:aRun
 *   #..^..#     floor F at (4,5) is shut at high tide
 *   #.....#
 *   #######
 */
const valves = {
  id: 'valveTest',
  name: 'Valve test',
  tiles: [
    '#######',
    '#.....#',
    '#y.#.y#',
    '#..#..#',
    '#..^..#',
    '#.....#',
    '#######',
  ],
  levers: [
    {
      id: 'first', name: 'the first valve', x: 1, y: 2, look: 'valve',
      positions: ['off', 'on'], input: 'source', outputs: { on: 'middle' },
      says: { on: 'It opens.', off: 'It closes.' },
      dry: 'Nothing reaches it.',
    },
    {
      id: 'second', name: 'the second valve', x: 5, y: 2, look: 'valve',
      positions: ['left', 'right'], input: 'middle', outputs: { left: 'aRun', right: 'bRun' },
    },
    {
      id: 'wheelA', name: 'a tide wheel', x: 3, y: 4, look: 'wheel',
      positions: ['low', 'high'], state: 'tide',
    },
  ],
  flow: { sources: ['source'], allPoweredWhen: 'allOn' },
  barriers: [
    { id: 'bridgeA', tile: '#', tiles: [[3, 1]], closed: true, openWhenSignal: 'current:aRun' },
    { id: 'floodF', tile: '#', tiles: [[1, 5]], closed: false, closedWhenSignal: 'tide:high' },
    { id: 'spring', tile: '#', tiles: [[5, 5]], closed: false, closedWhen: 'filled' },
  ],
  glows: [
    { signal: 'current:bRun', tile: '#', tiles: [[3, 3]] },
    { when: 'filled', tile: '#', tiles: [[3, 2]] },
  ],
  spawnPoints: { default: { x: 2, y: 1, facing: 'down' } },
};

const fresh = () => createNewGameState();
const closedNow = (state, conditions = {}) => createBarrierState(valves, { state, conditions });

describe('levers: positions and storage', () => {
  it('finds a lever by its tile, and counts as a puzzle', () => {
    expect(getLeverAt(valves, 1, 2).id).toBe('first');
    expect(getLeverAt(valves, 2, 2)).toBeNull();
    expect(hasPuzzle(valves)).toBe(true);
  });

  it('reads a missing record as every lever in its first position', () => {
    expect(getLeverPositions(valves, fresh())).toEqual({ first: 'off', second: 'left', tide: 'low' });
  });

  it('stores one boolean per lever STATE — levers can share one', () => {
    expect(leverStateId(valves.levers[2])).toBe('tide');
    const state = fresh();
    pressLever(valves, 'wheelA', { state });
    expect(state.puzzles.valveTest).toEqual({ tide: true });
    expect(getLeverPositions(valves, state).tide).toBe('high');
  });

  it('only lets the save keep what this map really stores', () => {
    expect(isPuzzleStateKey(valves, 'first')).toBe(true);
    expect(isPuzzleStateKey(valves, 'tide')).toBe(true);
    expect(isPuzzleStateKey(valves, 'wheelA')).toBe(false);   // shares 'tide'
    expect(isPuzzleStateKey(valves, 'bridgeA')).toBe(false);  // follows a signal
    expect(isPuzzleStateKey(valves, 'nonsense')).toBe(false);
  });
});

describe('the current', () => {
  it('knows every channel and every signal the map could ever make', () => {
    expect([...getChannels(valves)].sort()).toEqual(['aRun', 'bRun', 'middle', 'source']);
    expect(getPossibleSignals(valves)).toEqual(new Set([
      'first:off', 'first:on', 'second:left', 'second:right', 'tide:low', 'tide:high',
      'current:source', 'current:middle', 'current:aRun', 'current:bRun',
    ]));
  });

  it('flows only as far as the valves let it', () => {
    const at = (first, second) => [...getPoweredChannels(valves, { first, second, tide: 'low' })].sort();
    expect(at('off', 'left')).toEqual(['source']);
    expect(at('off', 'right')).toEqual(['source']);
    expect(at('on', 'left')).toEqual(['aRun', 'middle', 'source']);
    expect(at('on', 'right')).toEqual(['bRun', 'middle', 'source']);
  });

  it('runs everywhere at once when allPoweredWhen holds', () => {
    expect([...getPoweredChannels(valves, { first: 'off', second: 'left' }, { allOn: true })].sort())
      .toEqual(['aRun', 'bRun', 'middle', 'source']);
  });

  it('turns signals into barriers: a bridge that holds while current runs', () => {
    const state = fresh();
    expect(closedNow(state).bridgeA).toBe(true);
    pressLever(valves, 'first', { state });
    expect(closedNow(state).bridgeA).toBe(false);
    pressLever(valves, 'second', { state });
    expect(closedNow(state).bridgeA).toBe(true);
    expect(getPuzzleSignals(valves, { state }).has('current:bRun')).toBe(true);
  });

  it('shuts a barrier while a signal holds: a floor that floods at high tide', () => {
    const state = fresh();
    expect(closedNow(state).floodF).toBe(false);
    pressLever(valves, 'wheelA', { state });
    expect(closedNow(state).floodF).toBe(true);
  });

  it('shuts a barrier while a world condition holds (closedWhen)', () => {
    expect(closedNow(fresh()).spring).toBe(false);
    expect(closedNow(fresh(), { filled: true }).spring).toBe(true);
  });
});

describe('pressing a lever', () => {
  it('reports what opened, what closed, and the new position', () => {
    const state = fresh();
    pressLever(valves, 'first', { state });
    const outcome = pressLever(valves, 'second', { state });
    expect(outcome).toEqual({
      changed: true, position: 'right', opened: [], closed: ['bridgeA'], dry: false, reason: null,
    });
  });

  it('says when a valve turned with no current reaching it', () => {
    const outcome = pressLever(valves, 'second', { state: fresh() });
    expect(outcome.changed).toBe(true);
    expect(outcome.dry).toBe(true);
  });

  it('refuses — changing nothing — to close a barrier on somebody', () => {
    const state = fresh();
    pressLever(valves, 'first', { state });           // bridge A holds
    const before = JSON.stringify(state.puzzles);
    const outcome = pressLever(valves, 'second', { state, occupants: [{ x: 3, y: 1 }] });
    expect(outcome).toMatchObject({ changed: false, reason: 'occupied' });
    expect(JSON.stringify(state.puzzles)).toBe(before);
  });

  it('refuses an unknown lever', () => {
    expect(pressLever(valves, 'nope', { state: fresh() }).reason).toBe('unknownLever');
  });

  it('can be explored: every setting reachable from the spawn', () => {
    const results = exploreLeverStates(valves, valves.spawnPoints.default);
    expect(results.length).toBe(8);
  });
});

describe('validation catches lever mistakes', () => {
  const broken = (changes) => findPuzzleProblems({ ...valves, ...changes }).join(' | ');

  it('passes the sound test map', () => {
    expect(findPuzzleProblems(valves)).toEqual([]);
  });

  it('rejects a lever on a walkable tile', () => {
    expect(broken({ levers: [{ ...valves.levers[1], x: 2, y: 2 }] })).toMatch(/walkable/);
  });

  it('rejects a lever beside a barrier', () => {
    expect(broken({ levers: [{ ...valves.levers[2], x: 3, y: 2, state: undefined }] }))
      .toMatch(/next to barrier/);
  });

  it('rejects a lever without exactly two different positions', () => {
    expect(broken({ levers: [{ ...valves.levers[2], positions: ['low', 'low'] }] }))
      .toMatch(/two different positions/);
  });

  it('rejects levers that share a state but not its positions', () => {
    const levers = [valves.levers[2], { ...valves.levers[2], id: 'wheelB', x: 3, y: 3, positions: ['ebb', 'flood'] }];
    expect(broken({ levers, tiles: valves.tiles.map((r, y) => (y === 3 ? '#..#..#' : r)) }))
      .toMatch(/shares state/);
  });

  it('rejects a valve fed by a channel that does not exist', () => {
    expect(broken({ levers: [{ ...valves.levers[1], input: 'nowhere' }] })).toMatch(/unknown channel/);
  });

  it('rejects a current that runs in a circle', () => {
    const loop = { ...valves.levers[0], id: 'loop', x: 5, y: 2, input: 'middle', outputs: { on: 'source' } };
    expect(broken({ levers: [valves.levers[0], loop] })).toMatch(/circle/);
  });

  it('rejects a barrier following a signal nothing makes', () => {
    expect(broken({ barriers: [{ ...valves.barriers[0], openWhenSignal: 'current:ghost' }] }))
      .toMatch(/nothing produces/);
  });

  it('rejects a glow with neither (or both) a signal and a condition', () => {
    expect(broken({ glows: [{ tile: '#', tiles: [[3, 3]] }] })).toMatch(/exactly one/);
    expect(broken({ glows: [{ signal: 'tide:high', when: 'x', tile: '#', tiles: [[3, 3]] }] }))
      .toMatch(/exactly one/);
  });

  it('rejects "dry" words on a lever with no input', () => {
    expect(broken({ levers: [{ ...valves.levers[2], dry: 'Nothing.' }] })).toMatch(/"dry"/);
  });

  it('rejects a lever whose state id is a barrier\'s', () => {
    expect(broken({ levers: [{ ...valves.levers[2], state: 'floodF' }] })).toMatch(/also a barrier/);
  });
});
