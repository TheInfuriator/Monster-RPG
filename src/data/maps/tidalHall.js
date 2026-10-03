/**
 * tidalHall.js — The Tidal Hall, Tidewatch Harbor
 * ----------------------------------------------------------------------------
 * The region's second Beacon Hall (Phase 12): a sea-water hall of raised
 * walkways over flooded basins, with Leader Ondine at the top.
 *
 *   [  walkway (always dry)   ~  sea water   )  causeway   (  pontoon
 *   ^  a tide wheel           _ | I  the Hall's walls and windows
 *   M  door mat
 *
 * THE PUZZLE — one tide, three wheels
 * Every wheel in the Hall turns the SAME tide (they share one lever state,
 * `tide`, PuzzleSystem's `state` field). The tide moves two kinds of floor in
 * opposite directions:
 *
 *   LOW tide   the stone causeways surface (walkable); the pontoons sit on
 *              the bottom of their channel, out of reach
 *   HIGH tide  the causeways flood; the pontoons float up level with the
 *              walkways and bridge the channel
 *
 * The walkways are stacked: entrance -> causeway -> lower walk -> pontoons ->
 * upper walk -> causeway -> Ondine's dais. So the way up is low, then high,
 * then low again — and the wheel you need is always the one on the walkway
 * you are standing on. That is the difference from the other two puzzles in
 * the game: the Verdant Hall's coils each swap two particular hedges, and
 * Mistvault's valves route a current one way or another; here there is ONE
 * global state, and where you stand decides what changing it does for you.
 *
 * The tide starts LOW (the first position).
 *
 * WHY THE PLAYER CAN NEVER BE TRAPPED
 * Every walkway the player can stand on and change the tide from has a wheel
 * on it, and no wheel is next to a causeway or a pontoon. The dais has no
 * wheel, but it is only reachable at low tide and nothing can change the tide
 * while you are on it — so its causeway is always there to walk back down.
 * `tests/tidalHall.test.js` proves it over every tide and every place to stand.
 *
 * Once the Tidal Sigil is won, nothing changes: the tide is the Hall, and a
 * Sigil-holder can still play with it. (Unlike Fern, Ondine does not rest the
 * puzzle; it can never trap anyone, so it does not need to.)
 */

import { TRAINERS } from '../trainers.js';

export const tidalHall = {
  id: 'tidalHall',
  name: 'The Tidal Hall',
  interior: true,
  objectBase: '[',
  music: 'town',

  tiles: [
    // 0         1         2
    // 012345678901234567890
    '_____________________', //  0
    '_I_____I_____I_____I_', //  1
    '|||||||||||||||||||||', //  2
    '_~~~~~[[[[[[[[[[[~~~_', //  3  Ondine's dais; Ondine at (11,3)
    '_~~~~~[[[[[[[[[[[~~~_', //  4
    '_~~~~~~~~~~~~~~))~~~_', //  5  the upper causeway (15..16, 5..6) — LOW tide
    '_~~~~~~~~~~~[~~))~~~_', //  6  Diver Nerys's step at (12,6)
    '_~[[[[[[[[[[[[[[[[~~_', //  7  the upper walk
    '_~^~~~~((~~~~~~~~~~~_', //  8  wheel (2,8); the pontoons (7..8, 8..10) — HIGH tide
    '_~~~~~~((~~~~~~~~~~~_', //  9
    '_~~~~~~((~~~~~~~~~~~_', // 10
    '_~~[[[[[[[[[[[[[[[[~_', // 11  the lower walk
    '_~~~~~~~~~[~~))~~~^~_', // 12  Deckhand Corwen's step (10,12); wheel (18,12)
    '_~~~~~~~~~~~~))~~~~~_', // 13  the lower causeway (13..14, 12..14) — LOW tide
    '_~~~~~~~~~~~~))~~~~~_', // 14
    '_[[[[[[[[[[[[[[[[[[[_', // 15  the entrance walk
    '_[[[^[[[[[[[[[[[[[[[_', // 16  wheel (4,16)
    '_[[[[[[[[[[[[[[[[[[[_', // 17
    '_[[[[[[[[[M[[[[[[[[[_', // 18  the way out
    '_____________________', // 19
  ],

  /**
   * Three wheels, one tide. `state: 'tide'` makes them a single stored
   * boolean in `gameState.puzzles.tidalHall` — turn any one and every wheel
   * shows the new tide.
   */
  levers: [
    {
      id: 'wheelEntrance',
      name: 'the entrance wheel',
      x: 4,
      y: 16,
      look: 'wheel',
      state: 'tide',
      positions: ['low', 'high'],
      says: {
        low: 'You haul the wheel round. Sluices open somewhere below, and the water drains away. LOW TIDE.',
        high: 'You haul the wheel round. The sluices shut, and the sea comes pouring in. HIGH TIDE.',
      },
    },
    {
      id: 'wheelLower',
      name: 'the lower wheel',
      x: 18,
      y: 12,
      look: 'wheel',
      state: 'tide',
      positions: ['low', 'high'],
      says: {
        low: 'You haul the wheel round. The water drains away and the causeway below surfaces. LOW TIDE.',
        high: 'You haul the wheel round. The sea pours in — and up in the channel, pontoons rise to meet the walk. HIGH TIDE.',
      },
    },
    {
      id: 'wheelUpper',
      name: 'the upper wheel',
      x: 2,
      y: 8,
      look: 'wheel',
      state: 'tide',
      positions: ['low', 'high'],
      says: {
        low: 'You haul the wheel round. The pontoons settle to the bottom, and the causeway to the dais surfaces. LOW TIDE.',
        high: 'You haul the wheel round. The causeway to the dais floods, and the pontoons float up. HIGH TIDE.',
      },
    },
  ],

  barriers: [
    {
      id: 'lowerCauseway',
      name: 'the lower causeway',
      tile: '~',
      tiles: [[13, 12], [14, 12], [13, 13], [14, 13], [13, 14], [14, 14]],
      closed: false,
      closedWhenSignal: 'tide:high',
    },
    {
      id: 'pontoons',
      name: 'the pontoons',
      tile: '~',
      tiles: [[7, 8], [8, 8], [7, 9], [8, 9], [7, 10], [8, 10]],
      closed: true,
      closedWhenSignal: 'tide:low',
    },
    {
      id: 'upperCauseway',
      name: 'the upper causeway',
      tile: '~',
      tiles: [[15, 5], [16, 5], [15, 6], [16, 6]],
      closed: false,
      closedWhenSignal: 'tide:high',
    },
  ],

  spawnPoints: {
    default: { x: 10, y: 17, facing: 'up' },
  },

  exits: [{ x: 10, y: 18, to: 'tidewatch', spawn: 'fromTidalHall' }],

  npcs: [
    {
      id: 'tidalAttendant',
      name: 'Hall Attendant Lir',
      x: 16,
      y: 17,
      facing: 'left',
      sprite: 'villager',
      movement: 'static',
      dialogue: [
        {
          when: 'badge:tidalSigil',
          pages: [
            'The Tidal Sigil! Ondine has not given one of those since the spring storms.',
            'The tide is yours to play with, Sigil or not. Ondine says it keeps people humble.',
          ],
        },
        {
          pages: [
            'Welcome to the Tidal Hall. Leader Ondine is at the top, on the dais.',
            'Every wheel turns the same tide. High floods the stone causeways and floats the pontoons. Low drains the causeways and grounds the pontoons.',
            'Use the wheel on whichever walk you are standing on. And you cannot get stranded — the tide always leaves you a way back.',
          ],
        },
      ],
    },

    // --- The Gym trainers ---------------------------------------------------
    // Each stands on a one-tile step off a one-tile walk, looking straight
    // across it: never in the way, and nobody walks past unseen.
    {
      id: 'tidalDeckhand',
      name: 'Corwen',
      trainer: 'tidalDeckhand',
      sightRange: 1,
      x: 10,
      y: 12,
      facing: 'up',
      sprite: 'villagerAlt',
      movement: 'static',
      dialogue: [
        {
          when: 'trainer:tidalDeckhand',
          pages: [
            'The pontoons are along the walk, to the west. They only float at high tide — the wheel is at the east end.',
          ],
        },
        {
          action: 'trainer:tidalDeckhand',
          pages: TRAINERS.tidalDeckhand.intro,
        },
      ],
    },
    {
      id: 'tidalDiver',
      name: 'Nerys',
      trainer: 'tidalDiver',
      sightRange: 1,
      x: 12,
      y: 6,
      facing: 'down',
      sprite: 'child',
      movement: 'static',
      dialogue: [
        {
          when: 'trainer:tidalDiver',
          pages: [
            'The causeway up to the dais only surfaces at LOW tide. The wheel up here is at the west end.',
          ],
        },
        {
          action: 'trainer:tidalDiver',
          pages: TRAINERS.tidalDiver.intro,
        },
      ],
    },

    // --- The Leader -----------------------------------------------------------
    // No sight range: you come to the Leader. The Sigil is on the TRAINER
    // entry (`badge: 'tidalSigil'`), so winning awards it with no code here.
    {
      id: 'tidalLeaderOndine',
      name: 'Ondine',
      trainer: 'tidalLeaderOndine',
      x: 11,
      y: 3,
      facing: 'down',
      sprite: 'researcher',
      movement: 'static',
      dialogue: [
        {
          when: 'trainer:tidalLeaderOndine',
          pages: [
            'You carry the tide well. Keep the Sigil dry.',
            'If the Stormrise road ever opens, Voltspire\'s Leader will not wait for the tide. Be ready.',
          ],
        },
        {
          action: 'trainer:tidalLeaderOndine',
          pages: [
            'High, then low, then high, then low. You found the rhythm. Most challengers drown in it.',
            'I am Ondine. Let us see if you can keep your footing when the water is mine.',
          ],
        },
      ],
    },
  ],

  interactables: [
    {
      // The Hall's rules, on the wall by the door.
      x: 20,
      y: 16,
      type: 'sign',
      dialogue: [
        'HALL RULES',
        '1. Every wheel turns the same tide.',
        '2. Read the water before you turn it.',
        '3. The Leader stays dry. You come up.',
      ],
    },
  ],
};
