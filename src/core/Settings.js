/**
 * Settings.js
 * ----------------------------------------------------------------------------
 * The player's preferences: how fast text appears, and how loud the game is.
 *
 * WHY THESE ARE NOT PART OF A SAVE
 * A preference belongs to the PLAYER, not to a playthrough. Someone who reads
 * quickly wants fast text in every game they start, including a New Game, and
 * loading an old save should not quietly put their volume back. So settings
 * live under their own storage key, load before the title screen appears, and
 * nothing in the save system reads or writes them.
 *
 * Changes apply at once: the dialogue box and the battle log read the text
 * speed as each page starts typing, and the volume is pushed to Phaser's sound
 * manager by whoever subscribes with `onSettingsChange()` (see BootScene).
 */

import { TEXT_SPEEDS, DIALOGUE } from '../config/balance.js';
import { getStorage, STORAGE_KEYS } from '../save/SaveStorage.js';

/** Bumped if the stored shape of settings ever changes. */
export const SETTINGS_VERSION = 1;

/**
 * Master volume, as a whole number the player sees: 0 is silent, 100 is full.
 * Stepped in tens so Left/Right moves it a noticeable amount each press.
 */
export const VOLUME = { min: 0, max: 100, step: 10, default: 80 };

/** The text speeds, slowest first — the order Left/Right cycles through. */
export const TEXT_SPEED_IDS = Object.keys(TEXT_SPEEDS);

/** How each speed is written on screen. */
export const TEXT_SPEED_LABELS = {
  slow: 'Slow',
  normal: 'Normal',
  fast: 'Fast',
  instant: 'Instant',
};

export function createDefaultSettings() {
  return {
    textSpeed: DIALOGUE.defaultTextSpeed,
    masterVolume: VOLUME.default,
  };
}

/**
 * Stored settings, made safe to use. Anything unreadable falls back to its
 * default on its own, so one bad value never resets the other.
 *
 * @returns {{ settings: object, warnings: string[] }}
 */
export function normalizeSettings(raw) {
  const settings = createDefaultSettings();
  const warnings = [];

  if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) {
    warnings.push('Settings were unreadable; using the defaults.');
    return { settings, warnings };
  }

  if (TEXT_SPEED_IDS.includes(raw.textSpeed)) {
    settings.textSpeed = raw.textSpeed;
  } else if (raw.textSpeed !== undefined) {
    warnings.push(`Unknown text speed "${raw.textSpeed}"; using ${settings.textSpeed}.`);
  }

  if (typeof raw.masterVolume === 'number' && Number.isFinite(raw.masterVolume)) {
    settings.masterVolume = Math.min(
      Math.max(Math.round(raw.masterVolume), VOLUME.min),
      VOLUME.max
    );
    if (settings.masterVolume !== raw.masterVolume) {
      warnings.push(`Volume ${raw.masterVolume} corrected to ${settings.masterVolume}.`);
    }
  } else if (raw.masterVolume !== undefined) {
    warnings.push(`Volume ${raw.masterVolume} is not a number; using ${settings.masterVolume}.`);
  }

  return { settings, warnings };
}

// ---------------------------------------------------------------------------
// The current settings
// ---------------------------------------------------------------------------

let current = createDefaultSettings();
const listeners = new Set();

/** A copy of the current settings. Change them with `updateSettings()`. */
export function getSettings() {
  return { ...current };
}

/** The current text speed id — a key of TEXT_SPEEDS. */
export function getTextSpeed() {
  return current.textSpeed;
}

/** Milliseconds per character at the current text speed. */
export function getTypeDelay() {
  return TEXT_SPEEDS[current.textSpeed] ?? TEXT_SPEEDS.normal;
}

/** The current master volume, 0-100. */
export function getMasterVolume() {
  return current.masterVolume;
}

/**
 * Be told whenever the settings change. Returns a function that stops it.
 * @param {(settings: object) => void} listener
 */
export function onSettingsChange(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Write the current settings to storage. Never throws. */
export function saveSettings({ storage = getStorage() } = {}) {
  try {
    storage.setItem(
      STORAGE_KEYS.settings,
      JSON.stringify({ version: SETTINGS_VERSION, ...current })
    );
    return true;
  } catch (error) {
    console.warn('[Settings] Could not store settings:', error?.message || error);
    return false;
  }
}

/**
 * Change one or more settings, store them, and tell anyone listening.
 *
 * @param {object} changes  e.g. `{ textSpeed: 'fast' }`
 * @returns {{ settings: object, stored: boolean }}
 */
export function updateSettings(changes, { storage = getStorage() } = {}) {
  current = normalizeSettings({ ...current, ...changes }).settings;
  const stored = saveSettings({ storage });

  for (const listener of listeners) listener(getSettings());
  return { settings: getSettings(), stored };
}

/**
 * Read the stored settings into the game. Called once, as the game boots.
 *
 * Unreadable settings are NOT overwritten here: the defaults are used, and
 * the stored value is only replaced when the player next changes something.
 *
 * @returns {{ status: 'default'|'loaded'|'repaired'|'unreadable', warnings: string[] }}
 */
export function loadSettings({ storage = getStorage() } = {}) {
  let text = null;
  try {
    text = storage.getItem(STORAGE_KEYS.settings);
  } catch (error) {
    console.warn('[Settings] Could not read settings:', error?.message || error);
  }

  if (text === null) {
    current = createDefaultSettings();
    return { status: 'default', warnings: [] };
  }

  let raw;
  try {
    raw = JSON.parse(text);
  } catch {
    current = createDefaultSettings();
    return { status: 'unreadable', warnings: ['Stored settings were not valid JSON; using the defaults.'] };
  }

  const { settings, warnings } = normalizeSettings(raw);
  current = settings;
  for (const warning of warnings) console.warn(`[Settings] ${warning}`);

  for (const listener of listeners) listener(getSettings());
  return { status: warnings.length > 0 ? 'repaired' : 'loaded', warnings };
}

/** Put everything back to the defaults, in memory only. Tests use this. */
export function _resetSettingsForTests() {
  current = createDefaultSettings();
  listeners.clear();
}
