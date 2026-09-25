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
 *   intro and outro are ordinary dialogue: a list of lines, or a list of
 *   conditional branches (`{ when: 'starter:pyrret', pages: [...] }`, ending in
 *   one with no condition) so a trainer can react to the player's progress.
 *
 * FIELDS FOR STORY TRAINERS (Phase 11) — all optional
 *   setFlags     story flags set when the player WINS, e.g. ['thornwayOpen']
 *   victoryLines what they say when THEY win, before the player blacks out
 *   rival        a rival id from src/data/rivals.js — this is one of their meetings
 *   stage        which meeting it is, counting from 1
 *   requires     the condition that must hold for the meeting to happen (the
 *                NPC's `presentWhen` on the map says the same, and a test
 *                checks the two agree)
 *   party entry  `{ rivalStarter: true, level }` — the rival's starter at that
 *                level, grown into whatever form the species data says (see
 *                src/systems/RivalSystem.js). Only in a rival's meetings.
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
import { RIVALS } from './rivals.js';
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

  // -------------------------------------------------------------------------
  // Kestrel, the rival (GAME_DESIGN.md sections 8 and 22)
  // -------------------------------------------------------------------------
  //
  // Each meeting is one ordinary trainer. The one new thing is the first party
  // slot: Kestrel's starter, which depends on the player's (RivalSystem).
  //
  // The first meeting the player actually has is GAME_DESIGN.md's appearance
  // 3 — the two in the vertical slice were never built — so these lines
  // introduce Kestrel as well as challenging the player. Kestrel picked right
  // after the player did, which is how they could take the starter that beats
  // it, and they have been one step ahead ever since.

  /**
   * At the Thornway gate in Thistlewood, once the player holds the Verdant
   * Sigil. Winning opens the gate (`thornwayOpen`); losing does not, and
   * Kestrel waits for a rematch.
   *
   * BALANCE — MEASURED, AND REVISED FROM THE ORIGINAL PLAN
   * GAME_DESIGN.md first planned "evolved starter L15 + Gustwing L14 + Grubbit
   * L13", written before the stat curve existed. Played out against a real
   * post-Fern team (starter 14, Flittle 13, both still first stages) it won
   * 0% of the time for EVERY starter: two second-stage creatures against none
   * is a wall, not a rival. Three first stages led by the starter was still
   * 3% for a Fire starter, because every one of them hit a Grass player hard.
   *
   * So this is the shape of the plan's appearance 2 — the starter and a
   * Flittle — at post-Fern levels, with the starter saved for last as the ace.
   * tests/rivalBalance.test.js holds the numbers (60 seeds, a sensible player
   * with 3 Super Potions): starter 14 + Flittle 13 wins about half the time
   * as Fire or Grass and nearly always as Water, whose Flittle answers
   * Kestrel's Sproutle; one more level or a third creature makes it
   * comfortable for everyone; the starter alone almost never wins. The
   * evolved starter and Gustwing the plan wanted come at the SECOND meeting,
   * on Route 2, where the species data puts them.
   */
  kestrelThornway: {
    id: 'kestrelThornway',
    name: 'Kestrel',
    title: 'Rival',
    rival: 'kestrel',
    stage: 1,
    requires: 'badge:verdantSigil',
    rewardMoney: 960,
    party: [
      { species: 'flittle', level: 12 },
      { rivalStarter: true, level: 13 },
    ],
    setFlags: ['thornwayOpen'],
    intro: [
      {
        when: 'starter:pyrret',
        pages: [
          'So YOU are the one Wick would not stop talking about. I am Kestrel.',
          'I picked right after you did. You took the fire one, so I took Drizzle. Water puts fires out.',
          'The keeper opens the Thornway for Sigil-bearers now. I am not walking it until I know which of us is ahead.',
        ],
      },
      {
        when: 'starter:drizzle',
        pages: [
          'So YOU are the one Wick would not stop talking about. I am Kestrel.',
          'I picked right after you did. You took the water one, so I took Sproutle. Roots drink water.',
          'The keeper opens the Thornway for Sigil-bearers now. I am not walking it until I know which of us is ahead.',
        ],
      },
      {
        when: 'starter:sproutle',
        pages: [
          'So YOU are the one Wick would not stop talking about. I am Kestrel.',
          'I picked right after you did. You took the grass one, so I took Pyrret. Grass burns.',
          'The keeper opens the Thornway for Sigil-bearers now. I am not walking it until I know which of us is ahead.',
        ],
      },
      {
        pages: [
          'So YOU are the one Wick would not stop talking about. I am Kestrel.',
          'The keeper opens the Thornway for Sigil-bearers now. I am not walking it until I know which of us is ahead.',
        ],
      },
    ],
    outro: [
      'Okay. OKAY. That was a real fight.',
      'You are good. Annoyingly good.',
      'Keeper! Open it up — we are both going through.',
      'See you on the Thornway. Try to keep up.',
    ],
    victoryLines: [
      'Ha! One step ahead. Like always.',
      'Go and get patched up. I will be right here — I am not going through until you have had a proper go.',
    ],
  },

  // -------------------------------------------------------------------------
  // Route 2 — the Thornway (Phase 11)
  // -------------------------------------------------------------------------
  //
  // Four people who work or wander the road, each a step up from Route 1 and
  // the Verdant Hall, pitched at the levels a player really has when they
  // walk it (tests/route2.test.js measures the walk). Low on the road the
  // teams mirror the thicket; high on it, the scree.

  /** At the bramble cutting, just north of Thistlewood. */
  route2Cutter: {
    id: 'route2Cutter',
    name: 'Hollis',
    title: 'Bramble-Cutter',
    rewardMoney: 540,
    party: [
      { species: 'jabbit', level: 13 },
      { species: 'vinelet', level: 14 },
    ],
    intro: [
      'The crew said a Warden might come up the cutting. Nobody said I could not test one!',
    ],
    outro: [
      'Clean work. You would make a decent cutter.',
    ],
  },

  /** In the tall grass on the thicket's western road. */
  route2Forager: {
    id: 'route2Forager',
    name: 'Maren',
    title: 'Forager',
    rewardMoney: 580,
    party: [
      { species: 'glimmote', level: 14 },
      { species: 'puffcap', level: 14 },
    ],
    intro: [
      'Mind where you tread — I have been gathering in this grass since sunrise.',
    ],
    outro: [
      'My basket is full and my team is flat. A fair trade, I suppose.',
    ],
  },

  /** On the thicket's eastern road, watching the weather come off the Brow. */
  route2Lookout: {
    id: 'route2Lookout',
    name: 'Tamsin',
    title: 'Lookout',
    rewardMoney: 600,
    party: [
      { species: 'flittle', level: 14 },
      { species: 'zaplet', level: 14 },
    ],
    intro: [
      'Storm coming off the Brow. My Zaplet can feel it in its fur — and it wants a fight first.',
    ],
    outro: [
      'Well, that cleared the air. Watch the sky up on the scree.',
    ],
  },

  /** On a gravel spur beside the scree road. */
  route2ScreeWalker: {
    id: 'route2ScreeWalker',
    name: 'Dunmore',
    title: 'Scree-Walker',
    rewardMoney: 680,
    party: [
      { species: 'delvit', level: 15 },
      { species: 'umbrat', level: 15 },
    ],
    intro: [
      'The whole slope has been shifting all week. This Umbrat came up out of Mistvault on its own — they never do that.',
    ],
    outro: [
      'Steady feet. The cavern is up the gully — for all the good it will do you.',
    ],
  },

  /**
   * Kestrel's second meeting: at the top of the Thornway, below the Wardens'
   * cordon across Mistvault Cavern. GAME_DESIGN.md's appearance 3 — the
   * evolved starter with a Gustwing and a Grubbit — belongs here, at the
   * levels the species data evolves them.
   *
   * No flags: this fight gates nothing. Mistvault stays shut either way
   * (Phase 12 opens it), so it is a rivalry beat and a reason to be here,
   * and Kestrel stays by the cordon afterwards rather than walking off.
   *
   * BALANCE: see tests/rivalBalance.test.js.
   */
  kestrelRoute2: {
    id: 'kestrelRoute2',
    name: 'Kestrel',
    title: 'Rival',
    rival: 'kestrel',
    stage: 2,
    requires: 'trainer:kestrelThornway',
    rewardMoney: 1000,
    party: [
      { species: 'gustwing', level: 14 },
      { species: 'grubbit', level: 13 },
      { rivalStarter: true, level: 16 },
    ],
    intro: [
      {
        when: 'starter:pyrret',
        pages: [
          'There you are! The Wardens have Mistvault roped off, and it is the only road to Tidewatch.',
          'They will not say why. So I am stuck here — and I am not wasting it.',
          'Drizzle turned into a Puddlurk on the way up. Want to see what Water does to a fire NOW?',
        ],
      },
      {
        when: 'starter:drizzle',
        pages: [
          'There you are! The Wardens have Mistvault roped off, and it is the only road to Tidewatch.',
          'They will not say why. So I am stuck here — and I am not wasting it.',
          'Sproutle turned into a Bramblit on the way up. Roots, meet water. Again.',
        ],
      },
      {
        when: 'starter:sproutle',
        pages: [
          'There you are! The Wardens have Mistvault roped off, and it is the only road to Tidewatch.',
          'They will not say why. So I am stuck here — and I am not wasting it.',
          'Pyrret turned into a Cindraw on the way up. Grass still burns.',
        ],
      },
      {
        pages: [
          'There you are! The Wardens have Mistvault roped off, and it is the only road to Tidewatch.',
          'They will not say why. So I am stuck here — and I am not wasting it.',
        ],
      },
    ],
    outro: [
      'Again?! Two for two. I am keeping count, you know.',
      'Fine. FINE. I am staying right here until that cordon comes down — and I am going in first.',
    ],
    victoryLines: [
      'Ha! That makes it one each.',
      'Go and get patched up. The cordon is not going anywhere, and neither am I.',
    ],
  },
};

/**
 * Look up a trainer. Returns null (and warns) for an unknown id rather than
 * throwing, so a typo in a map file cannot crash a conversation.
 */
export function getTrainer(id) {
  if (!id) return null;

  const trainer = Object.hasOwn(TRAINERS, id) ? TRAINERS[id] : undefined;
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

  if (trainer.rival !== undefined) {
    if (!Object.hasOwn(RIVALS, trainer.rival)) problems.push(`${id}: no such rival "${trainer.rival}"`);
    if (!Number.isInteger(trainer.stage) || trainer.stage < 1) {
      problems.push(`${id}: a rival meeting needs a stage of 1 or more`);
    }
  }

  if (!Array.isArray(trainer.party) || trainer.party.length === 0) {
    problems.push(`${id}: needs at least one creature`);
  } else {
    trainer.party.forEach((entry, index) => {
      const where = `${id}.party[${index}]`;

      if (entry && entry.rivalStarter === true) {
        // The rival's starter: the species is decided at battle time.
        if (trainer.rival === undefined) problems.push(`${where}: rivalStarter outside a rival's meeting`);
        if (entry.species !== undefined) problems.push(`${where}: rivalStarter must not also name a species`);
      } else if (!entry || typeof entry.species !== 'string') {
        problems.push(`${where}: needs a species id`);
        return;
      } else if (!CREATURES[entry.species]) {
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
    problems.push(...findLinesProblems(trainer[field], id, field));
  }
  if (trainer.victoryLines !== undefined) {
    problems.push(...findLinesProblems(trainer.victoryLines, id, 'victoryLines'));
  }

  if (trainer.setFlags !== undefined) {
    const ok = Array.isArray(trainer.setFlags)
      && trainer.setFlags.every((flag) => typeof flag === 'string' && flag.length > 0);
    if (!ok) problems.push(`${id}: setFlags must be a list of flag names`);
  }
  if (trainer.requires !== undefined) {
    const list = Array.isArray(trainer.requires) ? trainer.requires : [trainer.requires];
    if (list.length === 0 || list.some((flag) => typeof flag !== 'string' || !flag.length)) {
      problems.push(`${id}: requires must be a condition name or a list of them`);
    }
  }

  return problems;
}

/**
 * Trainer lines are ordinary dialogue: either plain lines, or branches that
 * end in one with no condition — so they always resolve to something.
 */
function findLinesProblems(lines, id, field) {
  const where = `${id}.${field}`;
  if (!Array.isArray(lines) || lines.length === 0) return [`${id}: needs ${field} lines`];

  if (lines.every((line) => typeof line === 'string')) {
    return lines.some((line) => !line.length) ? [`${id}: every ${field} line must be text`] : [];
  }

  const problems = [];
  lines.forEach((branch, index) => {
    const pages = branch && typeof branch === 'object' ? branch.pages : null;
    if (!Array.isArray(pages) || pages.length === 0
      || pages.some((page) => typeof page !== 'string' || !page.length)) {
      problems.push(`${where}[${index}]: a branch needs pages of text`);
    }
  });
  const last = lines[lines.length - 1];
  if (!last || last.when !== undefined || last.unless !== undefined) {
    problems.push(`${where}: the last branch must have no condition, so something is always said`);
  }
  return problems;
}
