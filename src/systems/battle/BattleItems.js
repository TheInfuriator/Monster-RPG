/**
 * BattleItems.js
 * ----------------------------------------------------------------------------
 * Which bag items may be used in a battle, and why not when they may not.
 *
 * Pulled out of BattleScene so the rule is one plain function that can be
 * tested without a browser. The battle screen only asks the question and draws
 * the answer.
 *
 * Capture is decided by the BATTLE, not by the item and not by the scene: the
 * engine's `allowCapture` flag (which defaults to "wild battles only") is the
 * single source of truth. A practice bout and a trainer fight both refuse orbs
 * for the same reason, without anyone naming an NPC or a scene.
 */

import { getCaptureModifier, CAPTURE_REFUSAL } from './CaptureCalculator.js';

/**
 * @param {object} item an entry from src/data/items.js
 * @param {object} [context]
 * @param {boolean} [context.allowCapture] whether THIS battle allows catching
 * @returns {{ok: boolean, reason: string|null}} `reason` is shown to the player
 */
export function isItemUsableInBattle(item, context = {}) {
  if (!item) return { ok: false, reason: 'This cannot be used in battle.' };

  if (item.category === 'capture') {
    // An orb with no usable modifier is a data mistake, not a player one.
    if (getCaptureModifier(item) === null) {
      return { ok: false, reason: 'This orb does not seem to work.' };
    }
    if (!context.allowCapture) {
      return { ok: false, reason: CAPTURE_REFUSAL.NOT_WILD };
    }
    return { ok: true, reason: null };
  }

  if (item.category === 'key') {
    return { ok: false, reason: 'This cannot be used in battle.' };
  }
  if (!item.effect) return { ok: false, reason: 'This cannot be used in battle.' };

  return { ok: true, reason: null };
}

/** True when using this item means throwing it at the opponent. */
export function isCaptureItem(item) {
  return Boolean(item) && item.category === 'capture';
}
