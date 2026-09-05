/**
 * battles.js
 * ----------------------------------------------------------------------------
 * Scripted battles, described as data.
 *
 * A map's dialogue says `action: 'practiceBattle'` and WorldScene looks the
 * battle up here. Adding a new scripted fight is a data change: an entry here
 * and an `action` on an NPC.
 *
 * FIELDS
 *   id             the key dialogue refers to
 *   battleType     'wild' | 'trainer' | 'practice'
 *   opponentName   shown in the opening and closing lines
 *   party          [{ species, level }] built through CreatureFactory
 *   canRun         defaults to true only for wild battles
 *   awardExperience  false for a repeatable practice fight, so it cannot be
 *                    farmed for infinite levels
 *   rewardMoney    coins awarded on a win
 *
 * NOTE ON THE PRACTICE BATTLE
 * It is repeatable on purpose — it is how you test the battle system — and it
 * therefore awards NO experience and NO money. That is a deliberate trade: a
 * repeatable fight that paid out would be an infinite progression exploit.
 * The real, once-only rival battles arrive with the trainer system in Phase 8.
 */

export const SCRIPTED_BATTLES = {
  lodgePractice: {
    id: 'lodgePractice',
    battleType: 'practice',
    opponentName: 'Assistant Bly',
    party: [{ species: 'nibbit', level: 5 }],
    canRun: false,
    awardExperience: false,
    rewardMoney: 0,
  },

  /**
   * A second, tougher practice fight with two creatures, for testing switching
   * and the opponent sending out a replacement.
   */
  lodgePracticeDouble: {
    id: 'lodgePracticeDouble',
    battleType: 'practice',
    opponentName: 'Assistant Bly',
    party: [
      { species: 'nibbit', level: 6 },
      { species: 'grubbit', level: 6 },
    ],
    canRun: false,
    awardExperience: false,
    rewardMoney: 0,
  },
};

/** Look up a scripted battle. Returns null and warns for an unknown id. */
export function getScriptedBattle(id) {
  const battle = SCRIPTED_BATTLES[id];
  if (!battle) {
    console.warn(
      `[battles] Unknown scripted battle "${id}". ` +
        `Known: ${Object.keys(SCRIPTED_BATTLES).join(', ')}.`
    );
    return null;
  }
  return battle;
}
