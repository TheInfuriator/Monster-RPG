/**
 * settings.test.js
 * ----------------------------------------------------------------------------
 * The player's preferences: text speed and master volume.
 *
 * They live under their own storage key, apart from every save, so they
 * survive a New Game and are never changed by loading one. These tests use an
 * in-memory store, including one that refuses to write, so every rule is
 * checked without a browser.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  createDefaultSettings, normalizeSettings, getSettings, getTextSpeed, getTypeDelay,
  getMasterVolume, updateSettings, loadSettings, saveSettings, onSettingsChange,
  VOLUME, TEXT_SPEED_IDS, TEXT_SPEED_LABELS, SETTINGS_VERSION, _resetSettingsForTests,
} from '../src/core/Settings.js';
import { createMemoryStorage, STORAGE_KEYS } from '../src/save/SaveStorage.js';
import { TEXT_SPEEDS, DIALOGUE } from '../src/config/balance.js';
import { createNewGameState, startNewGame } from '../src/core/GameState.js';
import { createSaveFile } from '../src/save/SaveSchema.js';
import { addPlayTime, formatPlayTime, MAX_FRAME_MS } from '../src/core/PlayClock.js';

let storage;

beforeEach(() => {
  _resetSettingsForTests();
  storage = createMemoryStorage();
});

afterEach(() => vi.restoreAllMocks());

describe('defaults', () => {
  it('start at the configured text speed and a documented volume', () => {
    expect(createDefaultSettings()).toEqual({
      textSpeed: DIALOGUE.defaultTextSpeed,
      masterVolume: VOLUME.default,
    });
  });

  it('offer every text speed the game defines, with a label for each', () => {
    expect(TEXT_SPEED_IDS).toEqual(Object.keys(TEXT_SPEEDS));
    for (const id of TEXT_SPEED_IDS) expect(typeof TEXT_SPEED_LABELS[id]).toBe('string');
  });

  it('keep the volume range 0-100 in steps that land on both ends', () => {
    expect(VOLUME.min).toBe(0);
    expect(VOLUME.max).toBe(100);
    expect((VOLUME.max - VOLUME.min) % VOLUME.step).toBe(0);
    expect((VOLUME.default - VOLUME.min) % VOLUME.step).toBe(0);
  });
});

describe('normalising stored settings', () => {
  it('keeps sound values', () => {
    expect(normalizeSettings({ textSpeed: 'fast', masterVolume: 30 })).toEqual({
      settings: { textSpeed: 'fast', masterVolume: 30 },
      warnings: [],
    });
  });

  it('repairs each value on its own, so one bad value never resets the other', () => {
    const { settings, warnings } = normalizeSettings({ textSpeed: 'ludicrous', masterVolume: 40 });
    expect(settings).toEqual({ textSpeed: DIALOGUE.defaultTextSpeed, masterVolume: 40 });
    expect(warnings).toHaveLength(1);
  });

  it('clamps a volume out of range and rounds a fractional one', () => {
    expect(normalizeSettings({ masterVolume: 400 }).settings.masterVolume).toBe(100);
    expect(normalizeSettings({ masterVolume: -2 }).settings.masterVolume).toBe(0);
    expect(normalizeSettings({ masterVolume: 33.6 }).settings.masterVolume).toBe(34);
  });

  it('ignores a volume that is not a number', () => {
    expect(normalizeSettings({ masterVolume: 'loud' }).settings.masterVolume).toBe(VOLUME.default);
  });

  it('falls back to defaults for something that is not settings at all', () => {
    for (const bad of [null, 5, 'fast', []]) {
      expect(normalizeSettings(bad).settings).toEqual(createDefaultSettings());
    }
  });

  it('drops unknown fields rather than carrying them around', () => {
    expect(normalizeSettings({ textSpeed: 'slow', cheat: true }).settings).toEqual({
      textSpeed: 'slow', masterVolume: VOLUME.default,
    });
  });
});

describe('changing settings', () => {
  it('applies at once', () => {
    updateSettings({ textSpeed: 'instant' }, { storage });
    expect(getTextSpeed()).toBe('instant');
    expect(getTypeDelay()).toBe(TEXT_SPEEDS.instant);
  });

  it('stores them under their own key, versioned', () => {
    updateSettings({ textSpeed: 'slow', masterVolume: 20 }, { storage });
    expect(JSON.parse(storage.getItem(STORAGE_KEYS.settings))).toEqual({
      version: SETTINGS_VERSION, textSpeed: 'slow', masterVolume: 20,
    });
  });

  it('refuses nonsense rather than storing it', () => {
    updateSettings({ textSpeed: 'warp', masterVolume: 9000 }, { storage });
    expect(getTextSpeed()).toBe(DIALOGUE.defaultTextSpeed);
    expect(getMasterVolume()).toBe(100);
  });

  it('tells listeners, and stops when they unsubscribe', () => {
    const heard = [];
    const stop = onSettingsChange((settings) => heard.push(settings.masterVolume));
    updateSettings({ masterVolume: 50 }, { storage });
    stop();
    updateSettings({ masterVolume: 60 }, { storage });
    expect(heard).toEqual([50]);
  });

  it('hands out copies, so nobody can change settings behind the store\'s back', () => {
    const copy = getSettings();
    copy.textSpeed = 'instant';
    expect(getTextSpeed()).toBe(DIALOGUE.defaultTextSpeed);
  });

  it('keeps working in memory when storage refuses to write', () => {
    const full = createMemoryStorage();
    full.setItem = () => { throw new Error('QuotaExceededError'); };
    vi.spyOn(console, 'warn').mockImplementation(() => {});

    const result = updateSettings({ textSpeed: 'fast' }, { storage: full });
    expect(result.stored).toBe(false);
    expect(getTextSpeed()).toBe('fast');
    expect(saveSettings({ storage: full })).toBe(false);
  });
});

describe('loading settings', () => {
  it('uses the defaults when nothing is stored', () => {
    expect(loadSettings({ storage }).status).toBe('default');
    expect(getSettings()).toEqual(createDefaultSettings());
  });

  it('survives a "reload": what was stored is what comes back', () => {
    updateSettings({ textSpeed: 'fast', masterVolume: 30 }, { storage });
    _resetSettingsForTests();
    expect(getTextSpeed()).toBe(DIALOGUE.defaultTextSpeed);

    expect(loadSettings({ storage }).status).toBe('loaded');
    expect(getSettings()).toEqual({ textSpeed: 'fast', masterVolume: 30 });
  });

  it('repairs a damaged value and reports it', () => {
    storage.setItem(STORAGE_KEYS.settings, JSON.stringify({ textSpeed: 'fast', masterVolume: 'x' }));
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const result = loadSettings({ storage });
    expect(result.status).toBe('repaired');
    expect(getSettings()).toEqual({ textSpeed: 'fast', masterVolume: VOLUME.default });
  });

  it('uses defaults for unreadable JSON — and does not overwrite it', () => {
    storage.setItem(STORAGE_KEYS.settings, '{not json');
    expect(loadSettings({ storage }).status).toBe('unreadable');
    expect(getSettings()).toEqual(createDefaultSettings());
    expect(storage.getItem(STORAGE_KEYS.settings)).toBe('{not json');
  });

  it('never throws when storage itself throws', () => {
    const broken = { getItem: () => { throw new Error('denied'); }, setItem() {}, removeItem() {} };
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(() => loadSettings({ storage: broken })).not.toThrow();
    expect(getSettings()).toEqual(createDefaultSettings());
  });
});

describe('settings are not part of a playthrough', () => {
  it('survive a New Game untouched', () => {
    updateSettings({ textSpeed: 'slow', masterVolume: 10 }, { storage });
    startNewGame();
    expect(getSettings()).toEqual({ textSpeed: 'slow', masterVolume: 10 });
  });

  it('never appear in a save file', () => {
    updateSettings({ textSpeed: 'slow' }, { storage });
    const text = JSON.stringify(createSaveFile(createNewGameState()));
    expect(text).not.toMatch(/textSpeed|masterVolume/);
  });

  it('use a key no save slot uses', () => {
    expect(new Set(Object.values(STORAGE_KEYS)).size).toBe(Object.keys(STORAGE_KEYS).length);
  });
});

describe('the play clock', () => {
  it('adds time frame by frame', () => {
    const state = createNewGameState();
    addPlayTime(state, 16);
    addPlayTime(state, 17);
    expect(state.playTimeMs).toBe(33);
  });

  it('ignores a suspended tab\'s giant frame, counting only a normal one', () => {
    const state = createNewGameState();
    addPlayTime(state, 60_000);
    expect(state.playTimeMs).toBe(MAX_FRAME_MS);
  });

  it('ignores nonsense deltas', () => {
    const state = createNewGameState();
    for (const bad of [-5, 0, NaN, undefined, '16']) addPlayTime(state, bad);
    expect(state.playTimeMs).toBe(0);
  });

  it('formats hours and minutes', () => {
    expect(formatPlayTime(0)).toBe('0:00');
    expect(formatPlayTime(59_999)).toBe('0:00');
    expect(formatPlayTime(7 * 60_000)).toBe('0:07');
    expect(formatPlayTime((84 * 60 + 5) * 1000)).toBe('1:24');
    expect(formatPlayTime(12 * 3_600_000 + 3 * 60_000)).toBe('12:03');
    expect(formatPlayTime(-5)).toBe('0:00');
  });
});
