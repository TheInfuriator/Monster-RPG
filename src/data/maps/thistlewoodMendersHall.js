/**
 * thistlewoodMendersHall.js — the Mender's Hall, Thistlewood
 * ----------------------------------------------------------------------------
 * The second healing centre, and the proof that the first one was built right.
 *
 * There is NO new code behind this file. Mender Rell heals with the same
 * `action: 'heal'` as Mender Ines in Emberhollow; WorldScene runs the same
 * HealingSystem and calls the same `setRecoveryPoint()` with THIS map's id. So
 * healing here makes Thistlewood where you wake up after a blackout, and going
 * back to Emberhollow and healing there moves it back. Neither Hall knows the
 * other exists.
 */

export const thistlewoodMendersHall = {
  id: 'thistlewoodMendersHall',
  name: "Mender's Hall",
  interior: true,
  objectBase: 'O',
  music: 'town',

  tiles: [
    // 0    5    10
    '____________', // 0
    '_I________I_', // 1
    '||||||||||||', // 2
    '_OOHHOOOOPO_', // 3  healing array
    '_OOOOOOOOOO_', // 4  Mender Rell stands here
    '_CCCCOOOOOO_', // 5  counter
    '_OOOOOOOAAO_', // 6  benches
    '_OOOOMOOOOO_', // 7  door mat at x5
    '____________', // 8
  ],

  spawnPoints: {
    default: { x: 5, y: 6, facing: 'down' },
  },

  exits: [{ x: 5, y: 7, to: 'thistlewood', spawn: 'fromMendersHall' }],

  npcs: [
    {
      id: 'thistlewoodMender',
      name: 'Mender Rell',
      // Behind the counter — the player talks to her across it.
      x: 2,
      y: 4,
      facing: 'down',
      sprite: 'mender',
      movement: 'static',
      dialogue: [
        {
          action: 'heal',
          pages: [
            'Welcome to the Thistlewood Mender’s Hall. Set them down and I will see to them.',
            'Free, same as everywhere. And if the Hall goes badly, this is where you will wake.',
          ],
        },
      ],
    },
    {
      id: 'gymHopeful',
      name: 'Challenger',
      x: 8,
      y: 4,
      facing: 'left',
      sprite: 'villagerAlt',
      movement: 'static',
      dialogue: [
        {
          when: 'badge:verdantSigil',
          pages: [
            'You got the Sigil? On your first run at her?',
            'Right. I am going back in. Rell, patch them up again please.',
          ],
        },
        {
          pages: [
            'Third time back here today. Fern’s Ivorn keeps draining me dry.',
            'Heal up BEFORE you go in. I keep forgetting and I keep regretting it.',
          ],
        },
      ],
    },
  ],

  interactables: [
    {
      x: 3,
      y: 3,
      type: 'sign',
      dialogue: [
        'The mending array — an older model than Emberhollow’s, and slower.',
        'Someone has trained ivy up one side of it.',
      ],
    },
  ],
};
