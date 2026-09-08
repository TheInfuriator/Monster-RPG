/**
 * trainers.js
 * ----------------------------------------------------------------------------
 * Every trainer in the game, described as data.
 *
 * A trainer NPC on a map carries only a REFERENCE (`trainer: 'route1Scout'`)
 * and where they stand — their team, their money and everything they say lives
 * here. That way a trainer can be rebalanced without touching a map, and moved
 * without touching their party.
 *
 * FIELDS
 *   id           stable key, also what `defeatedTrainers` records. Never derive
 *                it from a position: a trainer who moves must stay defeated.
 *   name         what they are called
 *   title        their class, shown before the name ("Pathfinder Wren")
 *   party        [{ species, level, nickname? }] — built by CreatureFactory, so
 *                levels, stats and moves come from the ordinary rules
 *   rewardMoney  coins for beating them, paid once
 *   intro        what they say when the battle starts
 *   outro        what they say once beaten, before control returns
 *   badge        optional Sigil id awarded for beating them (Leaders only)
 *
 * The lines an already-beaten trainer says afterwards live with the NPC in the
 * map file, because that is ordinary conditional dialogue —
 * `when: 'trainer:route1Scout'` — and needs no special machinery.
 *
 * TO ADD A TRAINER: an entry here, then an NPC with `trainer: '<id>'` and a
 * `sightRange` on some map. No code either way — and the Verdant Hall's
 * Gardeners and Leader Fern below are the proof: a Gym Leader is an ordinary
 * trainer with a bigger party and one extra field, `badge`.
 *
 * BALANCE NOTE (Route 1)
 * The player arrives with a level 5 starter and meets wild Aethers at levels
 * 2-6. These three sit just above that: a single level 6, then two around 7,
 * then two at 8-9 by the gate. Rewards run 240 / 320 / 420, so clearing the
 * route funds four or five Potions — useful, not game-breaking, against a
 * 200-coin Potion and 800 starting coins.
 */

import { CREATURES } from './creatures.js';
import { BADGES } from './badges.js';
import { PROGRESSION } from '../config/balance.js';

export const TRAINERS = {
  /**
   * The first trainer the player meets, low on the route. One creature, no
   * type advantage against any starter — a fight you are meant to win, to
   * teach what the "!" means.
   */
  route1Scout: {
    id: 'route1Scout',
    name: 'Wren',
    title: 'Pathfinder',
    rewardMoney: 240,
    party: [{ species: 'nibbit', level: 6 }],
    intro: [
      'You walk like someone with a partner. Let me see it!',
    ],
    outro: [
      'Ha! Straight down the Cinderpath with you, then.',
    ],
  },

  /**
   * Halfway up, on the western jog. Two creatures, so the player meets a
   * trainer sending out a replacement for the first time — and a Grass type
   * after a Normal one, so switching starts to look like an idea.
   */
  route1Treader: {
    id: 'route1Treader',
    name: 'Osrin',
    title: 'Grass-Treader',
    rewardMoney: 320,
    party: [
      { species: 'grubbit', level: 7 },
      { species: 'vinelet', level: 7 },
    ],
    intro: [
      'I have been in that grass since dawn. You look fresher than I feel.',
      'Go on then. Show me what the Professor gave you.',
    ],
    outro: [
      'Fresher AND faster. Go on, get up the road.',
    ],
  },

  /**
   * By the closed gate — the last thing between the player and the north.
   * Two creatures, a little higher, and a Fire type so the roster's triangle
   * gets one more airing before the route ends.
   */
  route1Aspirant: {
    id: 'route1Aspirant',
    name: 'Halla',
    title: 'Warden Aspirant',
    rewardMoney: 420,
    party: [
      { species: 'flittle', level: 8 },
      { species: 'emberfly', level: 9 },
    ],
    intro: [
      'Waiting on the gate too? Everyone is.',
      'No sense standing about idle. One round while we wait.',
    ],
    outro: [
      'Then you will be through that gate before I am. Fair enough.',
    ],
  },

  // -------------------------------------------------------------------------
  // The Verdant Hall, Thistlewood
  // -------------------------------------------------------------------------
  //
  // BALANCE: the player arrives around level 10-13 with a starter and one or
  // two Route 1 captures. The Gardeners sit at 9-10 — a clear step up from
  // Route 1's 6-9 without being a wall — and Fern's team runs 11-13 with a
  // level 13 ace, so she is above the Gardeners rather than above the player.
  //
  // Every one of these is Grass or Grass/Poison, which is the point: a Fire
  // starter walks it, and Water and Grass starters are expected to bring
  // something with wings. Flittle is the second most common Aether on Route 1
  // and knows Peck from level 1, so the answer is cheap, early and obvious —
  // three separate NPCs point at it.

  /**
   * Guards the west walkway. Two creatures, no surprises: the fight that tells
   * the player how much harder a Hall is than a route.
   */
  verdantGardenerTeal: {
    id: 'verdantGardenerTeal',
    name: 'Teal',
    title: 'Gardener',
    rewardMoney: 480,
    party: [
      { species: 'vinelet', level: 9 },
      { species: 'puffcap', level: 9 },
    ],
    intro: [
      'Nobody walks up my side of the Hall without a round first.',
      'Nothing personal. It is just how we do it here.',
    ],
    outro: [
      'Neatly done. The west coil is up past me — mind what it closes.',
    ],
  },

  /**
   * Guards the east walkway, and a shade tougher: a Bug type to break up the
   * Grass, and the higher of the two Vinelets.
   */
  verdantGardenerBracken: {
    id: 'verdantGardenerBracken',
    name: 'Bracken',
    title: 'Gardener',
    rewardMoney: 520,
    party: [
      { species: 'grubbit', level: 9 },
      { species: 'vinelet', level: 10 },
    ],
    intro: [
      'Two hedges and one Gardener between you and the Leader.',
      'I am the Gardener. Let us see about the hedges afterwards.',
    ],
    outro: [
      'Then you have earned the east coil. It is behind me — go on.',
    ],
  },

  /**
   * LEADER FERN. The canonical team from GAME_DESIGN.md: Vinelet 11,
   * Puffcap 11, and Ivorn 13 as the ace.
   *
   * `badge` is the only field a Leader has that an ordinary trainer does not.
   * Beating her awards the Verdant Sigil — once, after the win is completely
   * resolved — and nothing in BattleScene or WorldScene names her to do it.
   */
  verdantLeaderFern: {
    id: 'verdantLeaderFern',
    name: 'Fern',
    title: 'Leader',
    rewardMoney: 1200,
    badge: 'verdantSigil',
    party: [
      { species: 'vinelet', level: 11 },
      { species: 'puffcap', level: 11 },
      { species: 'ivorn', level: 13 },
    ],
    intro: [
      'You found your way through. Most people give up at the second hedge.',
      'I am Fern. I grew every wall in this building, and I have never lost in it.',
      'Let us find out how much that is worth.',
    ],
    outro: [
      'Ah. Well.',
      'You read the hedges and then you read my Ivorn. That is a Warden.',
    ],
  },
};

/**
 * Look up a trainer. Returns null (and warns) for an unknown id rather than
 * throwing, so a typo in a map file cannot crash a conversation.
 */
export function getTrainer(id) {
  if (!id) return null;

  const trainer = TRAINERS[id];
  if (!trainer) {
    console.warn(
      `[trainers] Unknown trainer "${id}". Known: ${Object.keys(TRAINERS).join(', ')}.`
    );
    return null;
  }
  return trainer;
}

/** How a trainer is announced: "Pathfinder Wren", or just "Wren". */
export function getTrainerDisplayName(trainer) {
  if (!trainer) return 'Trainer';
  return trainer.title ? `${trainer.title} ${trainer.name}` : trainer.name;
}

/**
 * Check one trainer and list everything wrong with it.
 *
 * A list rather than a throw, so the data tests can run it over EVERY trainer
 * automatically — a trainer added later is validated the moment it exists.
 *
 * @returns {string[]} empty when the trainer is sound
 */
export function findTrainerProblems(trainer, id = 'trainer') {
  const problems = [];

  if (!trainer || typeof trainer !== 'object') return [`${id}: is not a trainer`];
  if (trainer.id !== id) problems.push(`${id}: id field says "${trainer.id}"`);

  if (typeof trainer.name !== 'string' || trainer.name.length === 0) {
    problems.push(`${id}: needs a name`);
  }
  if (trainer.title !== undefined && typeof trainer.title !== 'string') {
    problems.push(`${id}: title must be text`);
  }

  if (!Number.isInteger(trainer.rewardMoney) || trainer.rewardMoney < 0) {
    problems.push(`${id}: rewardMoney must be a whole number, never negative`);
  }

  if (!Array.isArray(trainer.party) || trainer.party.length === 0) {
    problems.push(`${id}: needs at least one creature`);
  } else {
    trainer.party.forEach((entry, index) => {
      const where = `${id}.party[${index}]`;

      if (!entry || typeof entry.species !== 'string') {
        problems.push(`${where}: needs a species id`);
        return;
      }
      if (!CREATURES[entry.species]) {
        problems.push(`${where}: no such species "${entry.species}"`);
      }
      if (!Number.isInteger(entry.level)) {
        problems.push(`${where}: level must be a whole number`);
        return;
      }
      if (entry.level < 1 || entry.level > PROGRESSION.maxLevel) {
        problems.push(`${where}: level must be between 1 and ${PROGRESSION.maxLevel}`);
      }
    });
  }

  // Only a Leader carries a Sigil, and it has to be one that exists.
  if (trainer.badge !== undefined && !BADGES[trainer.badge]) {
    problems.push(`${id}: awards unknown Sigil "${trainer.badge}"`);
  }

  for (const field of ['intro', 'outro']) {
    if (!Array.isArray(trainer[field]) || trainer[field].length === 0) {
      problems.push(`${id}: needs ${field} lines`);
    } else if (trainer[field].some((line) => typeof line !== 'string' || !line.length)) {
      problems.push(`${id}: every ${field} line must be text`);
    }
  }

  return problems;
}
