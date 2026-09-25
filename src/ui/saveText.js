/**
 * saveText.js
 * ----------------------------------------------------------------------------
 * How a save slot is described on screen — the words, not the drawing.
 *
 * The title screen's Continue chooser and the pause menu's Save screen show
 * the same facts about a slot, so both use these. They are plain functions of
 * a slot summary (see `SaveManager.readSlot`), which keeps them easy to test
 * and keeps the two screens from ever describing a save differently.
 */

import { SLOT_LABELS } from '../save/SaveManager.js';
import { formatPlayTime } from '../core/PlayClock.js';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/**
 * "25 Sep 2026, 16:05" in the player's own time zone.
 * A save whose time is unknown (one brought forward from an older version)
 * says so rather than claiming to be from 1970.
 */
export function formatSavedAt(ms) {
  if (typeof ms !== 'number' || !Number.isFinite(ms) || ms <= 0) return 'Time unknown';
  const date = new Date(ms);
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}, ${hours}:${minutes}`;
}

/** "Manual Save", "Autosave — Corrupted", "Autosave — Newer version". */
export function describeSlotTitle(summary) {
  const label = SLOT_LABELS[summary.slot] || summary.slot;
  if (summary.status === 'corrupt') return `${label} — Corrupted`;
  if (summary.status === 'incompatible') return `${label} — Newer version`;
  if (summary.status === 'empty') return `${label} — Empty`;
  return label;
}

/**
 * The lines under a slot's title.
 *
 *   valid         where, when, and a one-line progress summary
 *   corrupt       why it cannot be loaded
 *   incompatible  the newer-version message
 *   empty         nothing saved here yet
 */
export function describeSlotLines(summary) {
  if (summary.status === 'valid') {
    const meta = summary.metadata;
    const lead = meta.lead ? `${meta.lead.name} Lv ${meta.lead.level}` : 'No partner yet';
    const sigils = meta.badgeCount === 1 ? '1 Sigil' : `${meta.badgeCount} Sigils`;
    return [
      `${meta.locationName}`,
      `${lead}   ${sigils}   ${meta.caughtCount} caught   Time ${formatPlayTime(meta.playTimeMs)}`,
      `Saved ${formatSavedAt(meta.savedAt)}`,
    ];
  }
  if (summary.status === 'empty') return ['Nothing has been saved here yet.'];
  return [summary.message || 'This save cannot be loaded.'];
}

/** A short note for the title screen about slots that cannot be used. */
export function describeSlotProblems(problems) {
  return problems
    .map((problem) => describeSlotTitle({ slot: problem.slot, status: problem.status }))
    .join('     ');
}
