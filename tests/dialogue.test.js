/**
 * Tests for the dialogue resolver — the piece that decides WHICH lines an NPC
 * says based on the player's progress. Getting this wrong means NPCs talking
 * about events that have not happened yet, so it is worth testing thoroughly.
 */

import { describe, it, expect, vi } from 'vitest';
import {
  resolveDialogue,
  branchMatches,
  collectAllPages,
} from '../src/systems/DialogueResolver.js';

describe('simple dialogue shapes', () => {
  it('treats a bare string as one page', () => {
    expect(resolveDialogue('Hello there.')).toEqual({
      pages: ['Hello there.'],
      speaker: null,
      setFlags: [],
    });
  });

  it('treats an array of strings as multiple pages', () => {
    const result = resolveDialogue(['One.', 'Two.', 'Three.']);
    expect(result.pages).toEqual(['One.', 'Two.', 'Three.']);
  });

  it('returns no pages for missing dialogue instead of throwing', () => {
    expect(resolveDialogue(undefined).pages).toEqual([]);
    expect(resolveDialogue(null).pages).toEqual([]);
    expect(resolveDialogue([]).pages).toEqual([]);
  });

  it('reads a speaker name from an object', () => {
    const result = resolveDialogue({ speaker: 'Mum', pages: ['Be careful!'] });
    expect(result.speaker).toBe('Mum');
    expect(result.pages).toEqual(['Be careful!']);
  });

  it('accepts a single string in the pages field', () => {
    expect(resolveDialogue({ pages: 'Just one.' }).pages).toEqual(['Just one.']);
  });
});

describe('branch conditions', () => {
  it('matches a branch with no condition', () => {
    expect(branchMatches({ pages: ['x'] }, {})).toBe(true);
  });

  it('matches "when" only if the flag is set', () => {
    expect(branchMatches({ when: 'gotStarter' }, { gotStarter: true })).toBe(true);
    expect(branchMatches({ when: 'gotStarter' }, {})).toBe(false);
  });

  it('matches "unless" only if the flag is NOT set', () => {
    expect(branchMatches({ unless: 'gotStarter' }, {})).toBe(true);
    expect(branchMatches({ unless: 'gotStarter' }, { gotStarter: true })).toBe(false);
  });

  it('requires every flag when given an array', () => {
    const branch = { when: ['a', 'b'] };
    expect(branchMatches(branch, { a: true, b: true })).toBe(true);
    expect(branchMatches(branch, { a: true })).toBe(false);
  });

  it('can combine when and unless', () => {
    const branch = { when: 'metWick', unless: 'gotStarter' };
    expect(branchMatches(branch, { metWick: true })).toBe(true);
    expect(branchMatches(branch, { metWick: true, gotStarter: true })).toBe(false);
    expect(branchMatches(branch, {})).toBe(false);
  });
});

describe('choosing between branches', () => {
  const dialogue = [
    { when: 'gotStarter', pages: ['Look after it!'] },
    { when: 'metWick', pages: ['Wick is waiting for you.'] },
    { pages: ['Who are you?'] },
  ];

  it('uses the first matching branch, not the last', () => {
    expect(resolveDialogue(dialogue, { gotStarter: true, metWick: true }).pages).toEqual([
      'Look after it!',
    ]);
  });

  it('falls through to a later branch when earlier ones do not match', () => {
    expect(resolveDialogue(dialogue, { metWick: true }).pages).toEqual([
      'Wick is waiting for you.',
    ]);
  });

  it('uses the unconditional fallback when nothing else matches', () => {
    expect(resolveDialogue(dialogue, {}).pages).toEqual(['Who are you?']);
  });

  it('returns no pages when no branch matches and there is no fallback', () => {
    expect(resolveDialogue([{ when: 'never', pages: ['hi'] }], {}).pages).toEqual([]);
  });

  it('carries setFlags from the matched branch', () => {
    const result = resolveDialogue(
      [{ pages: ['Take this.'], setFlags: ['gotOrbs', 'metWick'] }],
      {}
    );
    expect(result.setFlags).toEqual(['gotOrbs', 'metWick']);
  });

  it('accepts a single setFlags string', () => {
    expect(resolveDialogue([{ pages: ['x'], setFlags: 'oneFlag' }], {}).setFlags).toEqual([
      'oneFlag',
    ]);
  });
});

describe('robustness', () => {
  it('warns and returns no pages for a branch missing its pages', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(resolveDialogue([{ when: undefined }], {}).pages).toEqual([]);
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  it('warns on a completely unsupported value', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(resolveDialogue(42).pages).toEqual([]);
    warn.mockRestore();
  });

  it('never returns the same array the data holds, so pages cannot be mutated', () => {
    const data = ['a', 'b'];
    const result = resolveDialogue(data);
    result.pages.push('c');
    expect(data).toEqual(['a', 'b']);
  });
});

describe('collectAllPages', () => {
  it('gathers text from every branch, matched or not', () => {
    const pages = collectAllPages([
      { when: 'a', pages: ['one', 'two'] },
      { pages: ['three'] },
    ]);
    expect(pages).toEqual(['one', 'two', 'three']);
  });

  it('handles plain strings and arrays', () => {
    expect(collectAllPages('solo')).toEqual(['solo']);
    expect(collectAllPages(['a', 'b'])).toEqual(['a', 'b']);
  });
});
