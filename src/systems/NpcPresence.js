/**
 * NpcPresence.js
 * ----------------------------------------------------------------------------
 * Whether an NPC is on their map right now.
 *
 * Most NPCs are always there. A few come and go with the story: Kestrel waits
 * at the Thornway gate only once the player holds the Verdant Sigil, and is
 * gone once beaten. A map says so with two optional fields on the NPC:
 *
 *   presentWhen: 'badge:verdantSigil'         must ALL hold for them to be there
 *   absentWhen:  'trainer:kestrelThornway'    any one of these sends them away
 *
 * Both read the same conditions as dialogue (ProgressionSystem), so an NPC can
 * follow a story flag, a beaten trainer, a Sigil or the player's starter.
 *
 * Pure, so the map loader (NpcManager) and the save loader (RestorePosition)
 * ask exactly the same question — a player is never restored onto the tile of
 * someone who is not there, nor kept off it by someone who has left.
 */

import { branchMatches } from './DialogueResolver.js';

/**
 * @param {object} definition an entry from a map's `npcs` list
 * @param {Record<string, boolean>} conditions from getWorldConditions()
 */
export function isNpcPresent(definition, conditions = {}) {
  if (definition.presentWhen === undefined && definition.absentWhen === undefined) return true;
  return branchMatches({ when: definition.presentWhen, unless: definition.absentWhen }, conditions);
}

/**
 * How many steps a beaten trainer walks to leave, from wherever they are now.
 *
 * `exitAfterDefeat: { direction, steps }` on the map is measured from the
 * NPC's HOME tile — "three tiles past where they stood" — because after a
 * sight challenge they are standing somewhere down their lane, next to the
 * player, and three steps from there would leave them short of the gate they
 * are meant to walk through. So any ground they covered coming over is walked
 * back first.
 *
 * @param {{ tileX: number, tileY: number, homeX: number, homeY: number }} npc
 * @param {{ direction: string, steps: number }} exit
 */
export function stepsToLeave(npc, exit) {
  const behindHome = {
    up: npc.tileY - npc.homeY,
    down: npc.homeY - npc.tileY,
    left: npc.tileX - npc.homeX,
    right: npc.homeX - npc.tileX,
  }[exit.direction] ?? 0;
  return Math.max(0, behindHome) + exit.steps;
}
