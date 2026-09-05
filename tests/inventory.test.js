/**
 * Tests for the bag. Item counts touch saving, shops and battles later, so the
 * edge cases (removing more than you own, unknown ids) are pinned down now.
 */

import { describe, it, expect, vi } from 'vitest';
import {
  addItem,
  removeItem,
  getItemCount,
  hasItem,
  listInventory,
} from '../src/systems/InventorySystem.js';
import { ITEMS, getItem } from '../src/data/items.js';

describe('item data', () => {
  it('uses each key as that item\'s own id', () => {
    for (const [key, item] of Object.entries(ITEMS)) {
      expect(item.id).toBe(key);
    }
  });

  it('gives every item a name, category, description and price', () => {
    const categories = new Set(['healing', 'capture', 'battle', 'key']);
    for (const item of Object.values(ITEMS)) {
      expect(item.name).toBeTruthy();
      expect(categories.has(item.category), `${item.id}: bad category`).toBe(true);
      expect(item.description).toBeTruthy();
      expect(typeof item.price).toBe('number');
      expect(item.price).toBeGreaterThanOrEqual(0);
    }
  });

  it('warns for an unknown item id instead of throwing', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(getItem('nonsense')).toBeNull();
    warn.mockRestore();
  });
});

describe('adding items', () => {
  it('adds a new item', () => {
    const bag = {};
    expect(addItem(bag, 'potion')).toBe(true);
    expect(getItemCount(bag, 'potion')).toBe(1);
  });

  it('stacks with what is already held', () => {
    const bag = { potion: 2 };
    addItem(bag, 'potion', 3);
    expect(bag.potion).toBe(5);
  });

  it('refuses an unknown item id', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const bag = {};
    expect(addItem(bag, 'notAnItem')).toBe(false);
    expect(bag).toEqual({});
    warn.mockRestore();
  });

  it('refuses a zero or negative quantity', () => {
    const bag = {};
    expect(addItem(bag, 'potion', 0)).toBe(false);
    expect(addItem(bag, 'potion', -3)).toBe(false);
    expect(bag).toEqual({});
  });
});

describe('removing items', () => {
  it('removes some of a stack', () => {
    const bag = { potion: 5 };
    expect(removeItem(bag, 'potion', 2)).toBe(true);
    expect(bag.potion).toBe(3);
  });

  it('deletes the entry when the last one is used', () => {
    const bag = { potion: 1 };
    removeItem(bag, 'potion');
    expect(bag.potion).toBeUndefined();
    expect('potion' in bag).toBe(false);
  });

  it('removes nothing at all when the player has too few', () => {
    const bag = { potion: 2 };
    expect(removeItem(bag, 'potion', 5)).toBe(false);
    expect(bag.potion).toBe(2);
  });

  it('handles removing an item the player does not have', () => {
    const bag = {};
    expect(removeItem(bag, 'potion')).toBe(false);
  });
});

describe('querying the bag', () => {
  it('counts unknown items as zero', () => {
    expect(getItemCount({}, 'potion')).toBe(0);
  });

  it('hasItem is true only with at least one', () => {
    expect(hasItem({ potion: 1 }, 'potion')).toBe(true);
    expect(hasItem({}, 'potion')).toBe(false);
  });

  it('lists the bag grouped by category', () => {
    const bag = { wardensPass: 1, basicOrb: 3, potion: 2 };
    const list = listInventory(bag);
    expect(list.map((e) => e.item.category)).toEqual(['healing', 'capture', 'key']);
    expect(list[1].quantity).toBe(3);
  });

  it('skips entries whose item no longer exists', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const list = listInventory({ potion: 1, deletedItem: 4 });
    expect(list.length).toBe(1);
    warn.mockRestore();
  });
});
