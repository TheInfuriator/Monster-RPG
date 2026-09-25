/**
 * saveText.test.js
 * ----------------------------------------------------------------------------
 * How a save slot is described on the title screen and the Save screen.
 * One set of words for both, so they can never tell the player different
 * things about the same save.
 */

import { describe, it, expect } from 'vitest';
import {
  formatSavedAt, describeSlotTitle, describeSlotLines, describeSlotProblems,
} from '../src/ui/saveText.js';
import { buildSaveMetadata } from '../src/save/SaveSchema.js';
import { SLOT_MESSAGES } from '../src/save/SaveManager.js';
import { FUTURE_VERSION_MESSAGE } from '../src/save/SaveMigrations.js';
import { buildRichState } from './helpers/richState.js';
import { createNewGameState } from '../src/core/GameState.js';

const valid = (slot, state = buildRichState()) => ({
  slot, status: 'valid', metadata: buildSaveMetadata(state, { source: slot, savedAt: new Date(2026, 8, 25, 16, 5).getTime() }),
});

describe('the save time', () => {
  it('is written as a date and a 24-hour time', () => {
    expect(formatSavedAt(new Date(2026, 8, 25, 16, 5).getTime())).toBe('25 Sep 2026, 16:05');
    expect(formatSavedAt(new Date(2027, 0, 3, 9, 0).getTime())).toBe('3 Jan 2027, 09:00');
  });

  it('admits when it is unknown rather than claiming 1970', () => {
    for (const unknown of [0, -1, NaN, undefined, null, 'yesterday']) {
      expect(formatSavedAt(unknown)).toBe('Time unknown');
    }
  });
});

describe('a slot\'s title', () => {
  it('names the slot, and says when it cannot be used', () => {
    expect(describeSlotTitle({ slot: 'manual', status: 'valid' })).toBe('Manual Save');
    expect(describeSlotTitle({ slot: 'autosave', status: 'valid' })).toBe('Autosave');
    expect(describeSlotTitle({ slot: 'manual', status: 'corrupt' })).toBe('Manual Save — Corrupted');
    expect(describeSlotTitle({ slot: 'autosave', status: 'incompatible' })).toBe('Autosave — Newer version');
    expect(describeSlotTitle({ slot: 'manual', status: 'empty' })).toBe('Manual Save — Empty');
  });
});

describe('a slot\'s details', () => {
  it('a valid save says where, who, how far, and when', () => {
    const lines = describeSlotLines(valid('manual'));
    expect(lines).toEqual([
      'Thistlewood — The Verdant Hall',
      expect.stringMatching(/^Cindraw Lv \d+ {3}1 Sigil {3}\d+ caught {3}Time 3:17$/),
      'Saved 25 Sep 2026, 16:05',
    ]);
  });

  it('counts Sigils in the plural when there are several, and none before any', () => {
    const state = createNewGameState();
    expect(describeSlotLines(valid('manual', state))[1]).toMatch(/No partner yet {3}0 Sigils/);
  });

  it('a damaged save says why it cannot be loaded', () => {
    expect(describeSlotLines({ slot: 'manual', status: 'corrupt', message: SLOT_MESSAGES.corrupt }))
      .toEqual([SLOT_MESSAGES.corrupt]);
  });

  it('a newer save gives the exact newer-version message', () => {
    expect(describeSlotLines({ slot: 'autosave', status: 'incompatible', message: FUTURE_VERSION_MESSAGE }))
      .toEqual(['This save was created by a newer version of the game and cannot be loaded here.']);
  });

  it('an empty slot says so', () => {
    expect(describeSlotLines({ slot: 'manual', status: 'empty' })).toEqual(['Nothing has been saved here yet.']);
  });
});

describe('the title screen notice', () => {
  it('names every unusable slot', () => {
    expect(describeSlotProblems([
      { slot: 'manual', status: 'corrupt' },
      { slot: 'autosave', status: 'incompatible' },
    ])).toBe('Manual Save — Corrupted     Autosave — Newer version');
  });

  it('is empty when nothing is wrong', () => {
    expect(describeSlotProblems([])).toBe('');
  });
});
