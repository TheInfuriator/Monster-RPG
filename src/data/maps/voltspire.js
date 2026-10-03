/**
 * voltspire.js — Voltspire City
 * ----------------------------------------------------------------------------
 * The fourth town, and the last before the championship (Phase 13): a copper-
 * roofed city on a high shelf at the top of the Stormrise Climb, built round
 * the Voltspire — a copper spire that has drawn the storm down into the
 * city's lamps for three hundred years. Home of the third Beacon Hall, the
 * Storm Hall, and the gate to the Aerie.
 *
 *   8  cobblestone   0  copper roof   a  slate roof   W  wall   w  window
 *   D  door          :  street lamp   7  the Voltspire  >  its lightning rod
 *   .  grass         f  flowers       T  tree         S  sign   %  rock face
 *   G  the Aerie Gate (a barrier, not written in the grid)
 *
 * THE SHAPE
 * The road comes up from the Climb at the bottom, across the low street,
 * round the Voltspire in the plaza (it stands in the middle of the road: the
 * road goes round it), across the high street and into the gate square. West:
 * the Mender's Hall (the fourth place a blackout can send you) and the Supply
 * Post. East: the Storm Hall, the biggest roof in the city. North: the Aerie
 * Gate, shut.
 *
 * WHERE PHASE 13 ENDS
 * The Aerie road climbs from the gate square to the championship. The Aerie
 * Gate is a barrier with `openWhen: 'aerieOpen'` — a flag NOTHING sets in
 * Phase 13, exactly the honest seam the rockslide was in Phase 12. A Warden
 * and a sign say why; behind the gate the road runs into the rock with no
 * exit, so there is no empty map waiting there either.
 *
 * WEATHER: a light rain — the storm is back over the city.
 */

export const voltspire = {
  id: 'voltspire',
  name: 'Voltspire City',
  music: 'town',
  weather: { kind: 'rain', amount: 1 },

  /** The gate up to the Aerie. Phase 14 opens it; nothing does yet. */
  barriers: [
    {
      id: 'aerieGate',
      name: 'the Aerie Gate',
      tile: 'G',
      tiles: [[17, 2], [18, 2]],
      closed: true,
      openWhen: 'aerieOpen',
    },
  ],

  tiles: [
    // 0         1         2         3
    // 012345678901234567890123456789012345
    '%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%', //  0  the mountain: the Aerie road ends in rock (no exit — the Phase 14 boundary)
    '%%%%%%%%%%%%%%%%%88%%%%%%%%%%%%%%%%%', //  1  the first yards of the Aerie road, behind the gate
    '%%%%%%%%%%%%%%%%%88%%%%%%%%%%%%%%%%%', //  2  THE AERIE GATE (17,2),(18,2): a barrier nothing opens yet
    '%%............88S88888000000000000%%', //  3  the gate sign (16,3); Warden Sorrel at (19,3) keeps the gate
    '%%............88888888000000000000%%', //  4
    '%%............88888888000000000000%%', //  5
    '%%.aaaaaaa....88888888000000000000%%', //  6  the Mender's Hall (3..9); the Storm Hall (22..33), the biggest roof in the city
    '%%.aaaaaaa....88888888000000000000%%', //  7
    '%%.WwWWWwW....88888888WwWWwWWwWWwW%%', //  8
    '%%.WWWDWWW:..:8888888SWWWWWDDWWWWW%%', //  9  doors: Mender's Hall (6,9), Storm Hall (27,9),(28,9); the Hall's sign (21,9)
    '%%88888888888888888888888888888888%%', // 10  the high street
    '%%88888888888888888888888888888888%%', // 11
    '%%:.........8:888>>888:8.........:%%', // 12  THE VOLTSPIRE (17..18, 12..16), the landmark, in the plaza
    '%%.0000000..888887788888..0000000.%%', // 13  the Supply Post (3..9, 13..16); a house (26..32)
    '%%.0000000..888887788888..0000000.%%', // 14
    '%%.WwWWWwW..888887788888..WwWWWwW.%%', // 15
    '%%.WWWDWWW..888887788888..WWWWWWW.%%', // 16  the Supply Post door (6,16)
    '%%...888....8:88888888:8..........%%', // 17
    '%%88888888888888888888888888888888%%', // 18  the low street
    '%%88888888888888888888888888888888%%', // 19
    '%%..............:88:..............%%', // 20
    '%%.aaaaaa..Tffff.88.fffT..0000000.%%', // 21  two more houses, and the plaza gardens
    '%%.aaaaaa...ffff.88.fff...0000000.%%', // 22
    '%%.WwWWwW...ffff.88.fff...WwWWWwW.%%', // 23
    '%%...............88...............%%', // 24
    '%%T..............88.............T.%%', // 25
    '%%.T......T.....:88:....T........T%%', // 26
    '%%..............S88...............%%', // 27  the city sign (16,27)
    '%%%%%%%%%%%%%%%%%88%%%%%%%%%%%%%%%%%', // 28
    '%%%%%%%%%%%%%%%%%88%%%%%%%%%%%%%%%%%', // 29  south exit down the Stormrise Climb
  ],

  spawnPoints: {
    // Up out of the pass from the Stormrise Climb.
    fromStormrise: { x: 17, y: 28, facing: 'up' },
    default: { x: 17, y: 28, facing: 'up' },
    fromMendersHall: { x: 6, y: 10, facing: 'down' },
    fromSupplyPost: { x: 6, y: 17, facing: 'down' },
    fromStormHall: { x: 27, y: 10, facing: 'down' },
  },

  exits: [
    { x: 17, y: 29, to: 'stormriseSummit', spawn: 'fromVoltspire' },
    { x: 18, y: 29, to: 'stormriseSummit', spawn: 'fromVoltspire' },
    { x: 6, y: 9, to: 'voltspireMendersHall', spawn: 'default' },
    { x: 6, y: 16, to: 'voltspireSupplyPost', spawn: 'default' },
    { x: 27, y: 9, to: 'stormHall', spawn: 'default' },
    { x: 28, y: 9, to: 'stormHall', spawn: 'default' },
  ],

  npcs: [
    {
      // The honest end of Phase 13: a Warden at the Aerie Gate.
      id: 'aerieWarden',
      name: 'Warden Sorrel',
      x: 19,
      y: 3,
      facing: 'left',
      sprite: 'warden',
      movement: 'static',
      dialogue: [
        {
          when: 'badge:stormSigil',
          pages: [
            'Three Sigils. Then you have earned the right to walk this road — but not yet the leave.',
            'The Aerie opens when the Warden Circle convenes, and not a day before. Word has gone out; they are coming.',
            'And I have orders to tell you this, and only this: nobody, not even the Vane, gets past this gate before they do.',
          ],
        },
        {
          pages: [
            'The Aerie Gate. The road beyond climbs to the Aerie, where the Champion waits.',
            'It opens for Wardens who hold all three Sigils — and only when the Circle says so. You have some way to go yet.',
          ],
        },
      ],
    },
    {
      id: 'spireKeeper',
      name: 'Keeper Aldous',
      x: 20,
      y: 16,
      facing: 'down',
      sprite: 'elder',
      movement: 'static',
      dialogue: [
        {
          when: 'badge:stormSigil',
          pages: ['Halcyon gave you a Sigil? Then the spire has a new story to tell. I will add you to it.'],
        },
        {
          pages: [
            'The Voltspire. Three hundred years old, and it has called the storm down into this city every night of them.',
            'Every lamp in Voltspire runs on what it catches. For a month it caught nothing — the lamps went out street by street.',
            'This morning they came back on. All at once. I hear a young Warden had something to do with that.',
          ],
        },
      ],
    },
    {
      id: 'lampwright',
      name: 'Lampwright Odo',
      x: 13,
      y: 11,
      facing: 'down',
      sprite: 'villager',
      movement: 'static',
      dialogue: [
        {
          when: 'badge:stormSigil',
          pages: ['Every lamp lit and the Storm Hall\'s coils singing. That is Voltspire as it should be.'],
        },
        {
          pages: [
            'The Storm Hall runs its coils off the spire too. Halcyon closed it while the storm was gone — opened it again this morning.',
            'Inside, the coils are wired together. Touch one and its neighbours flip with it. Halcyon says it teaches patience.',
          ],
        },
      ],
    },
    {
      id: 'voltspireChild',
      name: 'Fen',
      x: 24,
      y: 24,
      facing: 'left',
      sprite: 'child',
      movement: 'lookAround',
      dialogue: [
        {
          when: 'badge:stormSigil',
          pages: ['THREE Sigils?! Can I hold them? Just one? Just the storm one?'],
        },
        {
          pages: [
            'When it storms, the spire sings! Like a kettle, but a really, really big one.',
            'My friend says there is an Aether that lives IN the lightning. I think she made it up.',
          ],
        },
      ],
    },
    {
      id: 'voltspireTraveller',
      name: 'Bettany',
      x: 9,
      y: 19,
      facing: 'up',
      sprite: 'villagerAlt',
      movement: 'static',
      dialogue: [
        {
          pages: [
            'You came up the Climb? Then you met the Vane. They came through here a month back, all grey coats and paperwork.',
            'They bought every cart in the city. Loaded them with something heavy, and drove them up toward the Aerie road.',
            'The Wardens turned them back at the gate, of course. But I never saw the carts come down again.',
          ],
        },
      ],
    },
    {
      // THE POST-SIGIL HOOK. Only once the third Sigil is won: a Vane
      // Surveyor at the edge of the gate square, watching the Aerie road. Not
      // a battle, and not an answer — the confrontation is Phase 14's.
      id: 'vaneGateWatcher',
      name: 'Vane Surveyor',
      x: 14,
      y: 4,
      facing: 'up',
      sprite: 'vane',
      movement: 'static',
      presentWhen: 'badge:stormSigil',
      dialogue: [
        {
          pages: [
            'Three Sigils. Crale said you would come up here. Crale says a lot of things.',
            'Surveys 14, 15 and 16 are closed. The cells are where they need to be. The Convergence does not need your permission.',
            'Enjoy the gate while it is shut, Warden. When it opens, you will wish it had stayed that way.',
          ],
        },
      ],
    },
  ],

  interactables: [
    {
      x: 16,
      y: 27,
      type: 'sign',
      dialogue: [
        'VOLTSPIRE CITY — where the storm comes down.',
        'South: the Stormrise Climb.  North: the Aerie Gate.',
      ],
    },
    {
      x: 21,
      y: 9,
      type: 'sign',
      dialogue: [
        'THE STORM HALL — Beacon Hall of Voltspire.  Leader: Halcyon.',
        'Mind the coils. They remember every touch.',
      ],
    },
    {
      x: 16,
      y: 3,
      type: 'sign',
      dialogue: [
        'THE AERIE GATE.  Beyond: the Aerie, and the Champion.',
        'CLOSED by order of the Warden Circle. Holders of three Sigils will be sent for.',
      ],
    },
    {
      // The landmark. Readable from the plaza on any side.
      x: 17,
      y: 16,
      type: 'sign',
      dialogue: [
        'The Voltspire: a copper spire green with age, taller than anything in the city. A lightning rod crowns it.',
        'A plate at its foot reads: RAISED TO CATCH THE STORM, SO THAT THE CITY MIGHT NEVER BE DARK.',
      ],
    },
  ],
};
