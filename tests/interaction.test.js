/**
 * Tests for "what am I pressing the button at?".
 *
 * Interaction bugs are the sort players notice immediately — an NPC you cannot
 * talk to, a sign that reads while you stand beside it — so the rules are
 * pinned down here rather than checked by hand in the game.
 */

import { describe, it, expect } from 'vitest';
import { findInteractionTarget } from '../src/systems/InteractionSystem.js';
import { TileMap } from '../src/systems/TileMap.js';

/**
 * A little shop:  row 1 has the counter, row 0 is behind it.
 *   y0: _ o o o _      (floor behind the counter)
 *   y1: _ C C C _      (counter)
 *   y2: _ o o o _      (customer side)
 */
const shopMap = new TileMap({
  id: 'shop',
  tiles: [
    '_ooo_',
    '_CCC_',
    '_ooo_',
    '_oSo_',
  ],
  interactables: [
    { x: 2, y: 3, type: 'sign', dialogue: 'A notice board.' },
    { x: 1, y: 0, type: 'sign', dialogue: 'A crate of stock.' },
  ],
});

const shopkeeper = { id: 'bram', x: 2, y: 0 };
const floorNpc = { id: 'browser', x: 1, y: 2 };

const npcs = [shopkeeper, floorNpc];
const getNpcAt = (x, y) => npcs.find((n) => n.x === x && n.y === y) || null;

const look = (tileX, tileY, facing) =>
  findInteractionTarget({ map: shopMap, getNpcAt, tileX, tileY, facing });

describe('facing an NPC directly', () => {
  it('finds someone standing in front of you', () => {
    const result = look(2, 2, 'left');
    expect(result.kind).toBe('npc');
    expect(result.npc.id).toBe('browser');
  });

  it('finds nothing when facing empty floor', () => {
    expect(look(3, 2, 'right')).toBeNull();
  });

  it('finds nothing when facing away from someone', () => {
    expect(look(2, 2, 'right')).toBeNull();
  });
});

describe('talking across a counter', () => {
  it('reaches the shopkeeper behind the counter', () => {
    const result = look(2, 2, 'up');
    expect(result.kind).toBe('npc');
    expect(result.npc.id).toBe('bram');
    expect(result).toMatchObject({ x: 2, y: 0 });
  });

  it('finds nothing across a counter with nobody behind it', () => {
    // Facing up from (3,2) crosses the counter at (3,1) to empty floor (3,0).
    expect(look(3, 2, 'up')).toBeNull();
  });

  it('reaches an interactable behind a counter', () => {
    const result = look(1, 2, 'up');
    expect(result.kind).toBe('interactable');
    expect(result.target.dialogue).toBe('A crate of stock.');
  });

  it('does not reach two tiles past a normal wall', () => {
    // (1,3) faces left into the wall at (0,3); nothing beyond should be found.
    expect(look(1, 3, 'left')).toBeNull();
  });
});

describe('signs and objects', () => {
  it('reads a sign you are facing', () => {
    const result = look(2, 2, 'down');
    expect(result.kind).toBe('interactable');
    expect(result.target.type).toBe('sign');
  });

  it('does not read a sign you are merely standing next to', () => {
    expect(look(1, 3, 'down')).toBeNull();
  });
});

describe('edges and bad input', () => {
  it('returns null when facing off the edge of the map', () => {
    expect(look(0, 0, 'up')).toBeNull();
    expect(look(0, 0, 'left')).toBeNull();
  });

  it('returns null for an unknown facing direction', () => {
    expect(look(2, 2, 'sideways')).toBeNull();
  });

  it('works without an NPC lookup at all', () => {
    const result = findInteractionTarget({
      map: shopMap,
      getNpcAt: null,
      tileX: 2,
      tileY: 2,
      facing: 'down',
    });
    expect(result.kind).toBe('interactable');
  });
});

describe('priority', () => {
  it('prefers an NPC in front over anything behind a counter', () => {
    const blocker = { id: 'blocker', x: 2, y: 1 };
    const result = findInteractionTarget({
      map: shopMap,
      getNpcAt: (x, y) =>
        [blocker, shopkeeper].find((n) => n.x === x && n.y === y) || null,
      tileX: 2,
      tileY: 2,
      facing: 'up',
    });
    expect(result.npc.id).toBe('blocker');
  });
});
