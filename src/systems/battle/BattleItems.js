/**
 * BattleItems.js
 * ----------------------------------------------------------------------------
 * Which bag items may be used in a battle, and why not when they may not.
 *
 * Pulled out of BattleScene so the rule is one plain function that can be
 * tested without a browser. The battle screen only asks the question and draws
 * the answer.
 *
 * The rule is about the ITEM, not the kind of battle: a capture orb is refused
 * in a wild fight exactly as it is in a practice bout. That is what lets Phase 6
 * add catching by changing this one function, rather than by touching the
 * encounter pipeline or the battle scene.
 */

/**
 * @param {object} item an entry from src/data/items.js
 * @returns {{ok: boolean, reason: string|null}} `reason` is shown to the player
 */
export function isItemUsableInBattle(item) {
  if (!item) return { ok: false, reason: 'This cannot be used in battle.' };

  // Capture orbs are shown but disabled: catching arrives in Phase 6, and a
  // half-implemented capture would be worse than an honest "not yet". They are
  // never consumed and no probability is rolled.
  if (item.category === 'capture') {
    return { ok: false, reason: 'Catching arrives in a later update.' };
  }
  if (item.category === 'key') {
    return { ok: false, reason: 'This cannot be used in battle.' };
  }
  if (!item.effect) return { ok: false, reason: 'This cannot be used in battle.' };

  return { ok: true, reason: null };
}
