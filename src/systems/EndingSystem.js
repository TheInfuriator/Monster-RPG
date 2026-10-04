/**
 * EndingSystem.js
 * ----------------------------------------------------------------------------
 * The end of the main story (Phase 14): when it plays, what it says, who the
 * credits name, and the one change it makes to the save.
 *
 * Pure: no Phaser, no scenes. WorldScene asks `shouldPlayEnding()`, calls
 * `beginEnding()` once, and hands the pages and credits to EndingScene and
 * CreditsScene, which only draw them.
 *
 * THE ORDER, from the Champion's last Aether fainting:
 *   experience        the battle narrates it, as after every battle
 *   the Champion's    their outro — ordinary trainer dialogue
 *     last word
 *   championshipWon   set by the Champion's trainer record (`setFlags`), once
 *   storyComplete     set here, once, as the ending begins
 *   the ending        EndingScene
 *   the credits       CreditsScene
 *   free roam         the player wakes on the Aerie, and the game autosaves
 *
 * WHY TWO FLAGS. `championshipWon` says the Champion is beaten; `storyComplete`
 * says the ending has been shown. Between the two, the ending is OWED: a game
 * closed during the ending or the credits Continues straight back into it
 * (WorldScene saves at the start of the ending for exactly that), and once the
 * ending has begun it is never shown again.
 */

import { getDisplayName } from './CreatureFactory.js';
import { healParty } from './HealingSystem.js';
import { getSpecies, STARTER_MET_AT } from '../data/creatures.js';

/** The flag the Champion's trainer record sets. */
export const CHAMPIONSHIP_FLAG = 'championshipWon';

/** The flag that says the ending has been shown — the main story is over. */
export const STORY_COMPLETE_FLAG = 'storyComplete';

/** Where the player is set down once the credits have rolled. */
export const POST_STORY_DESTINATION = { mapId: 'aerie', spawn: 'afterCredits' };

/** True when the Champion is beaten and the ending has not yet begun. */
export function shouldPlayEnding(state) {
  const flags = state?.flags || {};
  return flags[CHAMPIONSHIP_FLAG] === true && flags[STORY_COMPLETE_FLAG] !== true;
}

/** True once the ending has begun: the main story is complete. */
export function isStoryComplete(state) {
  return state?.flags?.[STORY_COMPLETE_FLAG] === true;
}

/**
 * Begin the ending, once.
 *
 * Marks the story complete and has the Circle's Menders see to the team, so
 * the player walks out onto the Aerie ready to go anywhere. Refuses — changing
 * nothing — unless the ending is owed, so it can never run twice.
 *
 * @returns {{ started: boolean }}
 */
export function beginEnding(state) {
  if (!shouldPlayEnding(state)) return { started: false };
  state.flags[STORY_COMPLETE_FLAG] = true;
  healParty(state);
  return { started: true };
}

/**
 * The player's partner for the ending: the starter if it is still with them
 * (party or storage), otherwise whoever leads the party.
 */
function findPartner(state) {
  const all = [...(state.party || []), ...(state.storage || [])];
  const starter = all.find((creature) => creature && creature.metAt === STARTER_MET_AT);
  return starter || (state.party || [])[0] || null;
}

/**
 * The ending, as pages: each a line or two of text and the picture behind it.
 *
 * `scene` is a hint for EndingScene's backdrop: 'aerie' (the plateau at
 * dawn), 'valley' (the valley below), 'wellspring' or 'partner'.
 *
 * @returns {Array<{ scene: string, text: string }>}
 */
export function buildEndingPages(state) {
  const partner = findPartner(state);
  const partnerName = partner ? getDisplayName(partner) : 'your Aethers';

  return [
    {
      scene: 'wellspring',
      text: 'That night the Wellspring ran higher than anyone on the Aerie could remember, and the sky over the valley answered.',
    },
    {
      scene: 'valley',
      text: 'In Voltspire the lamps burned steady. In Tidewatch the tide came in on time. On the Thornway, the old spring filled to the brim.',
    },
    {
      scene: 'valley',
      text: 'The Circle took the Hollow apart, cell by cell, and carried every drop of current back to where it came from.',
    },
    {
      scene: 'aerie',
      text: 'The hollow ring came down off the Works\' doors. Director Thale was not seen on the Aerie again.',
    },
    {
      scene: 'aerie',
      text: 'Kestrel went back down the valley. There were thirteen more surveys out there, they said — and somebody ought to pull up the stakes.',
    },
    {
      scene: 'partner',
      text: `And ${partnerName}, who had walked out of the Warden's Lodge with you a lifetime ago, stood beside the new Champion of the Warden Circle.`,
    },
    {
      scene: 'aerie',
      text: 'The Aerie is open. The valley is yours to wander.',
    },
  ];
}

/**
 * The credits, in order. Honest attribution only: the project's own author,
 * the tools it was written with, and the open-source software it is built on
 * — no invented people. The player's own team closes it.
 *
 * @returns {Array<{ heading?: string, lines: string[] }>}
 */
export function buildCredits(state) {
  const team = (state?.party || []).map((creature) => {
    const species = getSpecies(creature.speciesId);
    const name = getDisplayName(creature);
    const kind = species && species.name !== name ? ` the ${species.name}` : '';
    return `${name}${kind}, level ${creature.level}`;
  });

  return [
    { heading: 'AETHERIA CHRONICLES', lines: ['A monster-catching adventure, made for the browser.'] },
    { heading: 'Created and directed by', lines: ['TheInfuriator'] },
    { heading: 'Design, code, art and tests', lines: ['Written with Claude Code, by Anthropic'] },
    {
      heading: 'Built with',
      lines: [
        'Phaser 3 — Richard Davey and Phaser Studio Inc. (MIT licence)',
        'Vite — build tool (MIT licence)',
        'Vitest — tests (MIT licence)',
        'ESLint — linting (MIT licence)',
      ],
    },
    {
      heading: 'Art',
      lines: ['Every tile, character, creature and Sigil is drawn in code as the game starts. There are no image files.'],
    },
    {
      heading: 'The world',
      lines: ['Aetheria, its Aethers, its Wardens and its Hollow Vane are original to this game.'],
    },
    { heading: 'Your team', lines: team.length > 0 ? team : ['—'] },
    { heading: 'Thank you for playing', lines: [] },
  ];
}
