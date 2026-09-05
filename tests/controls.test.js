/**
 * Guards against a bug that already bit us once: a key bound with a name Phaser
 * does not recognise. Phaser silently creates a key that never fires, so the
 * control just does nothing and nothing in the console explains why.
 *
 * Rather than importing Phaser (which wants a browser), we read the key names
 * straight out of Phaser's own KeyCodes source file.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { KEY_BINDINGS } from '../src/config/controls.js';

/** Every key name Phaser understands, parsed from its KeyCodes definition. */
function loadPhaserKeyNames() {
  const source = readFileSync(
    'node_modules/phaser/src/input/keyboard/keys/KeyCodes.js',
    'utf8'
  );
  const names = new Set();
  // Matches lines like `    BACKTICK: 192,`
  for (const match of source.matchAll(/^\s{4}([A-Z][A-Z0-9_]*):\s*\d+/gm)) {
    names.add(match[1]);
  }
  return names;
}

describe('key bindings', () => {
  const phaserKeys = loadPhaserKeyNames();

  it('parses a sensible number of key names out of Phaser', () => {
    // Sanity check on the parser itself — if Phaser changes its file format,
    // this fails instead of the test quietly passing with an empty set.
    expect(phaserKeys.size).toBeGreaterThan(50);
    expect(phaserKeys.has('BACKTICK')).toBe(true);
    expect(phaserKeys.has('SPACE')).toBe(true);
  });

  it('uses only key names Phaser actually recognises', () => {
    const invalid = [];
    for (const [action, names] of Object.entries(KEY_BINDINGS)) {
      for (const name of names) {
        if (!phaserKeys.has(name)) invalid.push(`${action}: "${name}"`);
      }
    }
    expect(invalid).toEqual([]);
  });

  it('binds at least one key to every action', () => {
    for (const [action, names] of Object.entries(KEY_BINDINGS)) {
      expect(names.length, `action "${action}" has no keys`).toBeGreaterThan(0);
    }
  });

  it('does not bind the same key to two different actions', () => {
    const seen = new Map();
    const clashes = [];
    for (const [action, names] of Object.entries(KEY_BINDINGS)) {
      for (const name of names) {
        if (seen.has(name)) clashes.push(`${name}: ${seen.get(name)} & ${action}`);
        seen.set(name, action);
      }
    }
    expect(clashes).toEqual([]);
  });
});
