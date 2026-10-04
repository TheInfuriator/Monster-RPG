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
 * FIELDS FOR FACTION TRAINERS (Phase 12) — optional
 *   faction      a faction id from src/data/factions.js ('hollowVane')
 *   rank         that faction's rank key ('surveyor', 'foreman'); the trainer's
 *                `title` must be the rank's title
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
import { FACTIONS } from './factions.js';
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

  /**
   * Kestrel's third meeting: in Tidewatch Harbor, beside the road up to the
   * Tidal Hall (GAME_DESIGN.md section 8: "3+ — later routes, Phase 12
   * onwards"). The same three as on Route 2, a few levels on — and Grubbit
   * one level short of evolving.
   *
   * No flags: like the second meeting it gates nothing; the Hall road is
   * fenced so the fight happens on the way, and Kestrel stays put afterwards.
   *
   * BALANCE — MEASURED against teams walked here through Mistvault (see
   * tests/tidewatchBalance.test.js). The first draft — Gustwing 19, a Carapex
   * at 20 and the starter at 22 — won 87% of the time for the Fire player's
   * walked team and every time for the Grass player's: a wall, because a
   * Carapex resists Grass AND shrugs off Ground, and a starter six levels up
   * on a type advantage is not a rival, it is a gate. At Gustwing 18, Grubbit
   * 19 and the starter at 19 (Route 2's 16, plus three), the walked teams win
   * about 80% (Fire), 95% (Water) and 75% (Grass) of the time.
   */
  kestrelTidewatch: {
    id: 'kestrelTidewatch',
    name: 'Kestrel',
    title: 'Rival',
    rival: 'kestrel',
    stage: 3,
    requires: 'trainer:kestrelRoute2',
    rewardMoney: 1000,
    party: [
      { species: 'gustwing', level: 18 },
      { species: 'grubbit', level: 19 },
      { rivalStarter: true, level: 19 },
    ],
    intro: [
      {
        when: 'starter:pyrret',
        pages: [
          'THERE you are. I got lost in those galleries for an hour — and you went and shut the whole thing down.',
          'Fine. You saved the harbour. I am still going to beat you before you get to Ondine — and my Grubbit is one good fight from evolving.',
          'My Puddlurk has been swimming in the Grotto all night. It has never been happier.',
        ],
      },
      {
        when: 'starter:drizzle',
        pages: [
          'THERE you are. I got lost in those galleries for an hour — and you went and shut the whole thing down.',
          'Fine. You saved the harbour. I am still going to beat you before you get to Ondine — and my Grubbit is one good fight from evolving.',
          'My Bramblit has been chewing on cave moss all the way here. Watch out.',
        ],
      },
      {
        when: 'starter:sproutle',
        pages: [
          'THERE you are. I got lost in those galleries for an hour — and you went and shut the whole thing down.',
          'Fine. You saved the harbour. I am still going to beat you before you get to Ondine — and my Grubbit is one good fight from evolving.',
          'My Cindraw has been itching for this since the cordon. Grass still burns.',
        ],
      },
      {
        pages: [
          'THERE you are. I got lost in those galleries for an hour — and you went and shut the whole thing down.',
          'Fine. You saved the harbour. I am still going to beat you before you get to Ondine — and my Grubbit is one good fight from evolving.',
        ],
      },
    ],
    outro: [
      'Three for three?! How?',
      'Go on, then. The Hall is all yours. I will be right here, thinking about what I did wrong.',
    ],
    victoryLines: [
      'Ha! Finally!',
      'Go and get patched up at the Mender. I will be here — and Ondine is not going anywhere either.',
    ],
  },

  // -------------------------------------------------------------------------
  // The Tidal Hall, Tidewatch Harbor (Phase 12)
  // -------------------------------------------------------------------------
  // Water through and through, with the harbour's own Aethers: Minnet,
  // Barnaclaw, Marlance. Each Gym trainer stands on a step beside a walk, so
  // the tide puzzle and the fights are one climb.
  //
  // BALANCE: measured — see tests/tidewatchBalance.test.js.

  tidalDeckhand: {
    id: 'tidalDeckhand',
    name: 'Corwen',
    title: 'Deckhand',
    rewardMoney: 580,
    party: [
      { species: 'barnaclaw', level: 18 },
      { species: 'minnet', level: 18 },
    ],
    intro: [
      'Mind your footing — the lower walk is wet at every tide.',
      'And mind ME. Nobody gets to the pontoons past me without a soaking.',
    ],
    outro: [
      'Soaked, myself. The pontoons are west along the walk — they float at HIGH tide.',
    ],
  },

  tidalDiver: {
    id: 'tidalDiver',
    name: 'Nerys',
    title: 'Diver',
    rewardMoney: 620,
    party: [
      { species: 'minnet', level: 19 },
      { species: 'brookel', level: 19 },
    ],
    intro: [
      'I have been diving this Hall since I could swim. I know every tide in it.',
      'You are on the upper walk, so you got the pontoons right. Now get past me.',
    ],
    outro: [
      'Hm. The causeway to the dais surfaces at LOW tide. Ondine is waiting.',
    ],
  },

  /**
   * LEADER ONDINE. Three Aethers with an ace, stronger than Fern by every
   * measure: eight levels higher, an evolved Water line, and Marlance — the
   * harbour's Water/Steel lance-fish — as the ace, two levels above the
   * others as Fern's Ivorn is. Water, as the Hall's name promised.
   *
   * BALANCE — MEASURED (tests/tidewatchBalance.test.js). Like Fern, the Hall
   * is hard for exactly one starter: here the Fire player, whose walked team
   * wins about 28% of tries and takes two in the walk. The Water and Grass
   * players' walked teams win every time — as the Fire and Grass players do
   * against Fern. The first draft (20 / 20 / 22) walled the Fire player
   * outright: 13%, and twenty tries without a win.
   *
   * Beating Ondine awards the Tidal Sigil, once, through the same `badge`
   * field Fern uses — no code names either Leader.
   */
  tidalLeaderOndine: {
    id: 'tidalLeaderOndine',
    name: 'Ondine',
    title: 'Leader',
    rewardMoney: 1600,
    badge: 'tidalSigil',
    party: [
      { species: 'barnaclaw', level: 19 },
      { species: 'brookel', level: 19 },
      { species: 'marlance', level: 21 },
    ],
    intro: [
      'High, then low, then high, then low. You found the rhythm. Most challengers drown in it.',
      'I am Ondine. I keep the Tidal Hall, and the tide keeps me.',
      'Let us see if you can keep your footing when the water is mine.',
    ],
    outro: [
      'The tide has turned, then.',
      'You read the Hall, and you read my Marlance. Take the Tidal Sigil — you have earned it twice over.',
    ],
  },

  // -------------------------------------------------------------------------
  // The Storm Hall, Voltspire City (Phase 13)
  // -------------------------------------------------------------------------
  // Electric through and through, with the Climb's own fliers: Zaplet and
  // Voltmane, Burrzap, Cirrup — and Halcyon's ace, a Stormcrest. One
  // Stormwright waits past each chamber's gate, so the coils and the fights
  // are one climb. Pitched from a real walk of the road to here (see
  // tests/stormriseBalance.test.js).

  stormHallAda: {
    id: 'stormHallAda',
    name: 'Ada',
    title: 'Stormwright',
    rewardMoney: 820,
    party: [
      { species: 'zaplet', level: 23 },
      { species: 'cirrup', level: 23 },
    ],
    intro: [
      'Through the first gate already? Then you have the trick of it. Let us see if you have the spark.',
    ],
    outro: [
      'Grounded. Fairly, too.',
    ],
  },

  stormHallFenn: {
    id: 'stormHallFenn',
    name: 'Fenn',
    title: 'Stormwright',
    rewardMoney: 860,
    party: [
      { species: 'burrzap', level: 23 },
      { species: 'voltmane', level: 24 },
    ],
    intro: [
      'Two gates! Most challengers are still sitting in the first chamber, touching coils at random.',
    ],
    outro: [
      'You do not waste a move, do you? Halcyon will like that.',
    ],
  },

  stormHallInes: {
    id: 'stormHallInes',
    name: 'Ines',
    title: 'Stormwright',
    rewardMoney: 900,
    party: [
      { species: 'cirrup', level: 24 },
      { species: 'voltmane', level: 24 },
    ],
    intro: [
      'The whole Hall is lit. That means you are good enough to fight me — not that you will win.',
    ],
    outro: [
      'Go on, then. The storm is waiting for you.',
    ],
  },

  stormLeaderHalcyon: {
    id: 'stormLeaderHalcyon',
    name: 'Halcyon',
    title: 'Leader',
    rewardMoney: 2000,
    badge: 'stormSigil',
    // Electric against Water is the Hall's whole point, so the Water starter
    // finds Halcyon hardest — measured hard, never a wall (see
    // tests/stormriseBalance.test.js).
    party: [
      { species: 'voltmane', level: 24 },
      { species: 'burrzap', level: 24 },
      { species: 'stormcrest', level: 26 },
    ],
    intro: [
      'For a month this Hall was dark. Then this morning the storm came back over the Climb — and here you are.',
      'I am Halcyon. I keep the Storm Hall, and I do not believe in coincidences.',
      'Show me what grounded a Vane relay. Show me everything.',
    ],
    outro: [
      'Struck, and grounded. Well done.',
      'Take the Storm Sigil. Three of three — the valley has not seen a Warden like you in a long while.',
    ],
  },

  // -------------------------------------------------------------------------
  // The Hollow Vane in Mistvault Cavern (Phase 12)
  // -------------------------------------------------------------------------
  // Ordinary trainers with a faction and a rank (src/data/factions.js). Their
  // Aethers are the Vane's: Poison, Dark and Steel. Four Surveyors and the
  // Draw Foreman, in the order the player meets them; Brede is off the way
  // north and can be skipped.
  //
  // BALANCE: pitched from a real walk of Route 2 (tests/helpers/routeWalk.js)
  // — see tests/mistvaultBalance.test.js.

  vaneTallis: {
    id: 'vaneTallis',
    name: 'Tallis',
    title: 'Vane Surveyor',
    faction: 'hollowVane',
    rank: 'surveyor',
    rewardMoney: 640,
    party: [
      { species: 'umbrat', level: 16 },
      { species: 'corrodit', level: 16 },
    ],
    intro: [
      'Hold it. This passage is closed to the public — company survey.',
      'The Wardens let a kid in? Then I will just have to send you back out.',
    ],
    outro: [
      'Tch. Fine. Nobody said the Wardens were sending ones who could fight.',
    ],
  },

  vaneBrede: {
    id: 'vaneBrede',
    name: 'Brede',
    title: 'Vane Surveyor',
    faction: 'hollowVane',
    rank: 'surveyor',
    rewardMoney: 680,
    party: [
      { species: 'carapex', level: 17 },
      { species: 'gloamite', level: 17 },
    ],
    intro: [
      'You worked the valve? Clever. The east wing is still company ground.',
    ],
    outro: [
      'Go and read the board, then. It will not help you get past Quill.',
    ],
  },

  vaneQuill: {
    id: 'vaneQuill',
    name: 'Quill',
    title: 'Vane Surveyor',
    faction: 'hollowVane',
    rank: 'surveyor',
    rewardMoney: 700,
    party: [
      { species: 'umbrat', level: 17 },
      { species: 'corrodit', level: 17 },
    ],
    intro: [
      'Somebody turned the valves. And the somebody is YOU.',
      'The Draw Site is up that passage, and you are not going up it.',
    ],
    outro: [
      'The bridge held for you and everything. Unbelievable.',
    ],
  },

  vaneTechnician: {
    id: 'vaneTechnician',
    name: 'Seld',
    title: 'Vane Surveyor',
    faction: 'hollowVane',
    rank: 'surveyor',
    rewardMoney: 720,
    party: [
      { species: 'gloamite', level: 18 },
      { species: 'corrodit', level: 18 },
    ],
    intro: [
      'Careful — those are live cables. Not that you will be here long.',
    ],
    outro: [
      'Right. I am going to finish splicing this, and you are going to be the Foreman\'s problem.',
    ],
  },

  /**
   * The first real Hollow Vane confrontation. The Foreman stands at the
   * siphon's breaker; beating them is what lets the player reach it. Three
   * Aethers, one of each Vane type, with a Steel ace.
   */
  vaneForeman: {
    id: 'vaneForeman',
    name: 'Vossler',
    title: 'Draw Foreman',
    faction: 'hollowVane',
    rank: 'foreman',
    rewardMoney: 960,
    party: [
      { species: 'umbrat', level: 18 },
      { species: 'gloamite', level: 19 },
      { species: 'corrodit', level: 20 },
    ],
    intro: [
      'So you are the reason my crews are sitting on their hands.',
      'The Hollow Vane holds a survey licence for this cavern. What the current is FOR is not your concern, Warden.',
      'Step away from the rig.',
    ],
    outro: [
      'Enough. Pull the breaker if it makes you feel better.',
      'One rig. One survey. The Vane have the cells we came for — and this valley is very much bigger than one cave.',
    ],
    victoryLines: [
      'Go home, Warden. The current has better uses than you.',
    ],
  },

  // -------------------------------------------------------------------------
  // Route 3 — the Stormrise Climb (Phase 13)
  // -------------------------------------------------------------------------
  // Pitched from what players really have at the Tidal Sigil (team's best
  // 21-22; see tests/stormriseBalance.test.js): two on the lower terraces at
  // 21-22, one on the Frost Shelf, two on the summit at 22-23. Each watches a
  // stretch of the road, so the climb is a run of fights with breathing room.

  stormriseClimber: {
    id: 'stormriseClimber',
    name: 'Tamsin',
    title: 'Climber',
    rewardMoney: 760,
    party: [
      { species: 'gustwing', level: 21 },
      { species: 'delvit', level: 21 },
    ],
    intro: [
      'Up from the harbour? The road has been shut for a month — you are the first fresh face I have seen.',
      'Let us see if you have the legs for the Climb!',
    ],
    outro: [
      'Good legs. Good partners, too.',
    ],
  },

  stormriseHerder: {
    id: 'stormriseHerder',
    name: 'Bryn',
    title: 'Herder',
    rewardMoney: 780,
    party: [
      { species: 'chompkin', level: 21 },
      { species: 'glimmote', level: 21 },
      { species: 'jabbit', level: 22 },
    ],
    intro: [
      'Mind the heath — my herd grazes it. And mind ME.',
    ],
    outro: [
      'Off you go, then. The terraces get steeper from here.',
    ],
  },

  stormriseMountaineer: {
    id: 'stormriseMountaineer',
    name: 'Ossian',
    title: 'Mountaineer',
    rewardMoney: 840,
    party: [
      { species: 'rimelet', level: 22 },
      { species: 'cragmaw', level: 23 },
    ],
    intro: [
      'Forty years on this mountain and I have never seen the sky sit this still.',
      'Something is wrong with the weather. Until I know what, I am fighting anyone who comes up the road.',
    ],
    outro: [
      'Strong. The Vane are camped east of the road. If anyone can find out what they are doing to my sky, it is you.',
    ],
  },

  stormriseStormchaser: {
    id: 'stormriseStormchaser',
    name: 'Vey',
    title: 'Stormchaser',
    rewardMoney: 860,
    party: [
      { species: 'zaplet', level: 22 },
      { species: 'cirrup', level: 22 },
      { species: 'burrzap', level: 23 },
    ],
    intro: [
      'The storm is BACK! A month of dead air, and now listen to it!',
      'I have been waiting all month for a fight in weather like this!',
    ],
    outro: [
      'Ha! Struck twice in one day!',
    ],
  },

  stormriseSkyherd: {
    id: 'stormriseSkyherd',
    name: 'Linnet',
    title: 'Skyherd',
    rewardMoney: 820,
    party: [
      { species: 'gustwing', level: 22 },
      { species: 'cirrup', level: 23 },
    ],
    intro: [
      'My flock rides the updraughts over the saddle. They have been grounded for weeks — until this morning.',
      'Now they want to show off. Shall we?',
    ],
    outro: [
      'Fair winds to you. Voltspire is just over the pass.',
    ],
  },

  // The Hollow Vane on the Frost Shelf: one Surveyor on the road, and the
  // Overseer of the relay, the operation's real confrontation.
  vaneMarl: {
    id: 'vaneMarl',
    name: 'Marl',
    title: 'Vane Surveyor',
    faction: 'hollowVane',
    rank: 'surveyor',
    rewardMoney: 800,
    party: [
      { species: 'gloamite', level: 21 },
      { species: 'corrodit', level: 22 },
    ],
    intro: [
      'Survey 16 is a closed site. The fence is charged, and so am I.',
    ],
    outro: [
      'The Overseer is at the relay. Do not say I sent you.',
    ],
  },

  vaneOverseer: {
    id: 'vaneOverseer',
    name: 'Crale',
    title: 'Relay Overseer',
    faction: 'hollowVane',
    rank: 'overseer',
    rewardMoney: 1240,
    // Measured (tests/stormriseBalance.test.js): an Ironvole here walled the
    // Fire and Grass starters' real teams (7% and 0%), so the ace is a
    // Corrodit — still the strongest Vane the player has met.
    party: [
      { species: 'umbrat', level: 21 },
      { species: 'gloamite', level: 22 },
      { species: 'corrodit', level: 23 },
    ],
    intro: [
      'The one who shut down Survey 14. Vossler described you. He was not kind.',
      'This is a lightning relay. Every bolt that strikes this mountain comes down that mast and into a cell, instead of into the sky.',
      'The storm has been ours for a month. You are not taking it back.',
    ],
    outro: [
      'Ground the relay, then. Go on — the console behind me.',
      'The cells are already on their way to the Convergence, with the earth\'s current and the sea\'s. You are too late to matter.',
    ],
    victoryLines: [
      'Go home, Warden. The sky belongs to whoever can hold it.',
    ],
  },

  // -------------------------------------------------------------------------
  // Kestrel, fourth meeting: the summit of the Stormrise Climb (Phase 13)
  // -------------------------------------------------------------------------
  // Kestrel took the goat track while the relay fence was up and was waiting
  // at the top of the pass when the storm came back. The first meeting where
  // the rivalry gives a little: they have seen what the Vane are doing, and
  // the Sigils are no longer the whole point.
  kestrelStormrise: {
    id: 'kestrelStormrise',
    name: 'Kestrel',
    title: 'Rival',
    rival: 'kestrel',
    stage: 4,
    requires: 'trainer:kestrelTidewatch',
    rewardMoney: 1200,
    // The new member is a Zaplet caught on the way up. A Rimelet was tried
    // first and measured: with it, ALL FOUR of Kestrel's Aethers hit Grass
    // hard and the Grass starter won 0% of the time. A Zaplet is a threat to
    // the Water starter instead, which keeps every starter's fight fair.
    party: [
      { species: 'gustwing', level: 21 },
      { species: 'carapex', level: 21 },
      { species: 'zaplet', level: 21 },
      { rivalStarter: true, level: 23 },
    ],
    intro: [
      {
        when: 'starter:pyrret',
        pages: [
          'You grounded the relay. I watched the storm come back from up here — it went right over my head.',
          'I took the goat track round the fence. Took me all night. And then I just stood here, watching it. I did not know what to do.',
          'So I am going to do what I know. One more fight before Voltspire. My Puddlurk is not afraid of a little rain.',
        ],
      },
      {
        when: 'starter:drizzle',
        pages: [
          'You grounded the relay. I watched the storm come back from up here — it went right over my head.',
          'I took the goat track round the fence. Took me all night. And then I just stood here, watching it. I did not know what to do.',
          'So I am going to do what I know. One more fight before Voltspire. My Bramblit has roots like iron now.',
        ],
      },
      {
        when: 'starter:sproutle',
        pages: [
          'You grounded the relay. I watched the storm come back from up here — it went right over my head.',
          'I took the goat track round the fence. Took me all night. And then I just stood here, watching it. I did not know what to do.',
          'So I am going to do what I know. One more fight before Voltspire. My Cindraw likes the cold. It burns hotter.',
        ],
      },
      {
        pages: [
          'You grounded the relay. I watched the storm come back from up here — it went right over my head.',
          'I took the goat track round the fence. Took me all night. And then I just stood here, watching it. I did not know what to do.',
          'So I am going to do what I know. One more fight before Voltspire.',
        ],
      },
    ],
    outro: [
      'Four. Four in a row. ...You know what? Fine.',
      'I used to think the Sigils were the whole point. Then I watched the Vane sit on a mountain and switch off the SKY.',
      'Go on to Voltspire. I am going to find out where those cells went. Somebody should.',
    ],
    victoryLines: [
      'Finally! ...It does not feel like I thought it would.',
      'Go and get patched up. Voltspire has a Mender — it is just over the pass.',
    ],
  },

  // -------------------------------------------------------------------------
  // The Aerie Road (Phase 14)
  // -------------------------------------------------------------------------
  // Wardens on their way up to the Trial, turned back by the Circle while the
  // Vane are dug in under the Aerie.
  //
  // PHASE 14 BALANCE (tests/aerieBalance.test.js, through the real engine).
  // Every walk before this one leans on whatever leads, and reaches the Aerie
  // with ONE strong Aether (27-33) and the rest far behind. So the road is
  // pitched at 24-27 — fought before the Lodge, with that lopsided team, and
  // no wall even for the never-switching player. At the Lodge the measured
  // player rounds the team out to six from the Aerie Road and trains it up
  // together (routeWalk.js, walkToChampion), and from the Hollow on they
  // switch like a player at the end of a game does (battleSim.js,
  // `switching`). Measured that way the Hollow is 27-32, Kestrel's six top
  // out at the starter's 34 — its final form for every starter — the Trial's
  // Wardens are 33-35 and the Champion's six 35-38: nothing takes more than
  // three tries, the Director is a real fight below the climax, and the
  // Champion is the hardest fight of the Trial for every starter.

  aerieAce: {
    id: 'aerieAce',
    name: 'Corin',
    title: 'Ace Warden',
    rewardMoney: 1400,
    party: [
      { species: 'voltmane', level: 26 },
      { species: 'brawnhare', level: 27 },
    ],
    intro: [
      'Three Sigils and nowhere to spend them. The Circle has shut the Trial — something about the Vane.',
      'So I have been waiting on this road for a week, and you are the first Warden who looks worth the wait!',
    ],
    outro: [
      'Ha! You will do. Whatever the Circle is waiting for, I think it is you.',
    ],
  },

  aerieGuide: {
    id: 'aerieGuide',
    name: 'Orla',
    title: 'Summit Guide',
    rewardMoney: 1420,
    party: [
      { species: 'brawnhare', level: 26 },
      { species: 'rimelet', level: 27 },
    ],
    intro: [
      'I have walked Wardens up this road for twenty years. Every one of them had to get past me first.',
    ],
    outro: [
      'Past me, then. The road switches back to the west — keep to it in the snow.',
    ],
  },

  aerieHopeful: {
    id: 'aerieHopeful',
    name: 'Mabry',
    title: 'Circle Hopeful',
    rewardMoney: 1350,
    party: [
      { species: 'brambelle', level: 24 },
      { species: 'marlance', level: 25 },
      { species: 'voltmane', level: 25 },
    ],
    intro: [
      'This is it — the top of the valley! One day I am going to walk into that Hall and come out Champion.',
      'Today I am going to practise on you.',
    ],
    outro: [
      'Practice over. ...I am going to need a lot more practice.',
    ],
  },

  // -------------------------------------------------------------------------
  // The Hollow — the Vane's Works and the Convergence (Phase 14)
  // -------------------------------------------------------------------------
  // The Vane's last stand: a Surveyor in the hall, the three bank bosses —
  // Vossler and Crale back again, and a new Foreman for the sea — a Surveyor
  // at the core door, and the Director. Each stronger than the last Vane the
  // player met; the Director stronger again, and still below the Trial.

  vaneOdile: {
    id: 'vaneOdile',
    name: 'Odile',
    title: 'Vane Surveyor',
    faction: 'hollowVane',
    rank: 'surveyor',
    rewardMoney: 1300,
    party: [
      { species: 'umbrat', level: 27 },
      { species: 'corrodit', level: 27 },
    ],
    intro: [
      'A Warden, in the Works? The Circle sent four this morning. You will go out the same way they did.',
    ],
    outro: [
      'Fine. The banks are in the wings. Good luck getting past the Foremen.',
    ],
  },

  vaneVosslerHollow: {
    id: 'vaneVosslerHollow',
    name: 'Vossler',
    title: 'Draw Foreman',
    faction: 'hollowVane',
    rank: 'foreman',
    rewardMoney: 1550,
    party: [
      { species: 'gloamite', level: 28 },
      { species: 'cragmaw', level: 28 },
      { species: 'ironvole', level: 29 },
    ],
    intro: [
      'You. Mistvault was MY survey. Forty cells of the earth\'s current, and every one of them is in this bank.',
      'You are not touching that valve.',
    ],
    outro: [
      'Go on, then. Vent it. Forty cells, poured back into the ground like dishwater.',
      'The Director will not care. The Director never cares about one bank.',
    ],
    victoryLines: [
      'Twice is not a habit, Warden. Go home.',
    ],
  },

  vaneBrack: {
    id: 'vaneBrack',
    name: 'Brack',
    title: 'Draw Foreman',
    faction: 'hollowVane',
    rank: 'foreman',
    rewardMoney: 1590,
    party: [
      { species: 'barnaclaw', level: 28 },
      { species: 'corrodit', level: 29 },
      { species: 'marlance', level: 29 },
    ],
    intro: [
      'Survey 15 was mine — the harbour. Took me a month to bottle a tide. You will not undo it in a minute.',
    ],
    outro: [
      'All right! All right. The valve is yours. Mind the cistern — it fills faster than you think.',
    ],
    victoryLines: [
      'The tide goes out, Warden. Go with it.',
    ],
  },

  vaneCraleHollow: {
    id: 'vaneCraleHollow',
    name: 'Crale',
    title: 'Relay Overseer',
    faction: 'hollowVane',
    rank: 'overseer',
    rewardMoney: 1650,
    party: [
      { species: 'umbrat', level: 29 },
      { species: 'stormcrest', level: 29 },
      { species: 'corrodit', level: 30 },
    ],
    intro: [
      'You grounded my relay, and now you have come for the storm I DID get away with.',
      'Forty cells of lightning. Do you know how long it took to catch them?',
    ],
    outro: [
      'Vent it, then. Let the sky have it back. ...It was always going to win in the end, I suppose.',
      'The Director is behind the core door. Do not expect them to be impressed.',
    ],
    victoryLines: [
      'Go home, Warden. The storm is spoken for.',
    ],
  },

  vaneRusk: {
    id: 'vaneRusk',
    name: 'Rusk',
    title: 'Vane Surveyor',
    faction: 'hollowVane',
    rank: 'surveyor',
    rewardMoney: 1450,
    party: [
      { species: 'gloamite', level: 28 },
      { species: 'ironvole', level: 28 },
    ],
    intro: [
      'Nobody goes into the core. Director\'s orders. Especially not you.',
    ],
    outro: [
      'The door is wired to the banks. If they are vented, it opens. I just stand here.',
    ],
  },

  vaneDirector: {
    id: 'vaneDirector',
    name: 'Thale',
    title: 'Vane Director',
    faction: 'hollowVane',
    rank: 'director',
    rewardMoney: 1750,
    setFlags: ['convergenceStopped'],
    party: [
      { species: 'gloamite', level: 29 },
      { species: 'ivorn', level: 30 },
      { species: 'corrodit', level: 30 },
      { species: 'ironvole', level: 31 },
      { species: 'marlance', level: 32 },
    ],
    intro: [
      'So you are the one who keeps turning my lights off. Thale — I run the Hollow Vane.',
      'I grew up under the Voltspire. Every winter the storm wandered off and the city went dark, and every winter we waited for the sky to remember us.',
      'The Convergence ends that. Every current in the valley, meeting here, going out through our lines — steady, measured, paid for. Nobody waits in the dark again.',
      'You have vented my banks. Fine: there is enough in the lines to start it. Step aside, Warden, or be stepped over.',
    ],
    outro: [
      'Enough. ...Enough. I will not run it on what is left in the lines. Half a prime would crack the Wellspring in two, and I am not a vandal.',
      'There. The engine is down. Sixteen surveys and four years, gone in an afternoon.',
      'You think the valley is better off with storms that come and go as they please. Perhaps. I hope you are right — you are the ones who will be living in it.',
    ],
    victoryLines: [
      'Go back down the mountain, Warden. When the lights stay on this winter, you will know who to thank.',
    ],
  },

  // -------------------------------------------------------------------------
  // Kestrel, fifth and last meeting: the Aerie (Phase 14)
  // -------------------------------------------------------------------------
  // On the Circle's Walk, once the Convergence is stopped — the last thing
  // between the player and the Trial. A full team of six: every Aether
  // Kestrel has fought with since the Thornway, all grown up, two new ones
  // caught on the way up, and the starter in its final form.
  kestrelAerie: {
    id: 'kestrelAerie',
    name: 'Kestrel',
    title: 'Rival',
    rival: 'kestrel',
    stage: 5,
    requires: 'convergenceStopped',
    rewardMoney: 1800,
    party: [
      { species: 'gustwing', level: 29 },
      { species: 'carapex', level: 29 },
      { species: 'voltmane', level: 29 },
      { species: 'cragmaw', level: 30 },
      { species: 'brambelle', level: 30 },
      { rivalStarter: true, level: 34 },
    ],
    intro: [
      {
        when: 'starter:pyrret',
        pages: [
          'You did it. I watched the Vane walk out of the Hollow one by one. The Wellspring is running — you can hear it from here.',
          'Before the Circle sees you, I want one more. Not for a Sigil. Not for the Circle. Just to know.',
          'Six of us, all grown up. My Torrentine has been waiting since the Thornway for this.',
        ],
      },
      {
        when: 'starter:drizzle',
        pages: [
          'You did it. I watched the Vane walk out of the Hollow one by one. The Wellspring is running — you can hear it from here.',
          'Before the Circle sees you, I want one more. Not for a Sigil. Not for the Circle. Just to know.',
          'Six of us, all grown up. My Thornmane has been waiting since the Thornway for this.',
        ],
      },
      {
        when: 'starter:sproutle',
        pages: [
          'You did it. I watched the Vane walk out of the Hollow one by one. The Wellspring is running — you can hear it from here.',
          'Before the Circle sees you, I want one more. Not for a Sigil. Not for the Circle. Just to know.',
          'Six of us, all grown up. My Emberax has been waiting since the Thornway for this.',
        ],
      },
      {
        pages: [
          'You did it. I watched the Vane walk out of the Hollow one by one. The Wellspring is running — you can hear it from here.',
          'Before the Circle sees you, I want one more. Not for a Sigil. Not for the Circle. Just to know.',
        ],
      },
    ],
    outro: [
      'Five times. ...Do you know, I think I stopped minding somewhere on the mountain.',
      'I came up here to beat you to the Champion. I think I really came up here because you were the only one who ever kept up.',
      'Go on. The Circle is waiting. I will be in the gallery — loudly.',
    ],
    victoryLines: [
      'Ha! ...One. Out of five. I will take it.',
      'Go and rest at the Lodge, and come back. I am not letting you face the Circle tired.',
    ],
  },

  // -------------------------------------------------------------------------
  // The Circle's Trial (Phase 14)
  // -------------------------------------------------------------------------
  // Three Wardens of the Circle, one for each current, and the Champion.
  // Ordinary trainers: spoken to, like the Leaders, and a gate behind each
  // opens once they are beaten (src/data/maps/circleHall.js). The Champion
  // carries the story's last flag; the world plays the ending from it.

  circleAshby: {
    id: 'circleAshby',
    name: 'Ashby',
    title: 'Earth Warden',
    rewardMoney: 1800,
    party: [
      { species: 'gloamite', level: 33 },
      { species: 'brawnhare', level: 33 },
      { species: 'cragmaw', level: 34 },
      { species: 'ironvole', level: 34 },
    ],
    intro: [
      'Ashby again — Earth Warden of the Circle. You thought I only read boards?',
      'The earth\'s current runs under everything: slow, deep, and very hard to move. Let us see if you can.',
    ],
    outro: [
      'Moved. Well done. The gate is open — Isla is next.',
    ],
  },

  circleIsla: {
    id: 'circleIsla',
    name: 'Isla',
    title: 'Sea Warden',
    rewardMoney: 1850,
    party: [
      { species: 'barnaclaw', level: 32 },
      { species: 'rimelet', level: 33 },
      { species: 'brookel', level: 33 },
      { species: 'marlance', level: 34 },
    ],
    intro: [
      'Isla, Sea Warden of the Circle. I kept the harbour\'s current for thirty years, until the Vane bottled it.',
      'You poured it back. So I will not go easy on you — that would be an insult.',
    ],
    outro: [
      'Like the tide: you were always going to come in. Hale is next.',
    ],
  },

  circleHale: {
    id: 'circleHale',
    name: 'Hale',
    title: 'Sky Warden',
    rewardMoney: 1900,
    party: [
      { species: 'gustwing', level: 34 },
      { species: 'voltmane', level: 34 },
      { species: 'stormcrest', level: 35 },
      { species: 'thundrel', level: 35 },
    ],
    intro: [
      'Surprised? The Circle sent me to hold your rockslide and your relay because the sky is mine to keep.',
      'You have earned this chamber twice over. Now earn the gate.',
    ],
    outro: [
      'Blown clean through. The Champion is waiting — and the Champion has been waiting a long time for someone like you.',
    ],
  },

  circleChampion: {
    id: 'circleChampion',
    name: 'Seren',
    title: 'Champion',
    rewardMoney: 2000,
    setFlags: ['championshipWon'],
    party: [
      { species: 'stormcrest', level: 35 },
      { species: 'rimelet', level: 35 },
      { species: 'cragmaw', level: 35 },
      { species: 'gustwing', level: 36 },
      { species: 'brawnhare', level: 36 },
      { species: 'thundrel', level: 38 },
    ],
    intro: [
      'Seren, Champion of the Warden Circle. I have held this chamber for eleven years.',
      'I watched the Wellspring rise this morning. I know whose doing it was, and I am grateful — truly.',
      'But that is not what this chamber is for. This chamber asks one question: are you and your Aethers the strongest team in Aetheria?',
      'Show me.',
    ],
    outro: [
      'There it is. The answer.',
      'Champion of the Warden Circle — it is yours. Come, the Circle will want to see you.',
    ],
    victoryLines: [
      'Not today. Rest at the Lodge, and come back up — the chamber will be here.',
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

  if (trainer.faction !== undefined) {
    const faction = Object.hasOwn(FACTIONS, trainer.faction) ? FACTIONS[trainer.faction] : null;
    if (!faction) {
      problems.push(`${id}: no such faction "${trainer.faction}"`);
    } else if (!Object.hasOwn(faction.ranks, trainer.rank)) {
      problems.push(`${id}: "${trainer.rank}" is not a rank of ${faction.name}`);
    } else if (trainer.title !== faction.ranks[trainer.rank].title) {
      problems.push(`${id}: a ${trainer.rank}'s title is "${faction.ranks[trainer.rank].title}"`);
    }
  } else if (trainer.rank !== undefined) {
    problems.push(`${id}: a rank needs a faction`);
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
