/**
 * thistlewoodCottage.js — Nan Thistle's cottage, Thistlewood
 * ----------------------------------------------------------------------------
 * One house you can actually go inside, so the town is somewhere people live
 * rather than a row of shopfronts. Nan Thistle is the town's memory; her
 * grandson Cob is the one who tells you how the root switches work, in case
 * the Hall Keeper's explanation did not land.
 */

export const thistlewoodCottage = {
  id: 'thistlewoodCottage',
  name: 'Thistle Cottage',
  interior: true,
  objectBase: 'o',
  music: 'town',

  tiles: [
    // 0    5    10
    '___________', // 0
    '_I_______I_', // 1
    '|||||||||||', // 2
    '_oooooooBb_', // 3  bookshelf and a bed along the back wall
    '_oAAoooooo_', // 4  table, well clear of the doorway
    '_oAAoooooP_', // 5
    '_ooooMoooo_', // 6  door mat at x5
    '___________', // 7
  ],

  spawnPoints: {
    default: { x: 5, y: 5, facing: 'down' },
  },

  exits: [{ x: 5, y: 6, to: 'thistlewood', spawn: 'fromCottage' }],

  npcs: [
    {
      id: 'nanThistle',
      name: 'Nan Thistle',
      x: 4,
      y: 3,
      facing: 'down',
      sprite: 'elder',
      movement: 'static',
      dialogue: [
        {
          when: 'badge:verdantSigil',
          pages: [
            'A Sigil, at your age. Fern was twice as old before she earned one.',
            'Do not tell her I said that.',
          ],
        },
        {
          pages: [
            'This town was three houses and a hedge when I was small.',
            'Then someone planted the Hall and the hedge decided to stay.',
          ],
        },
      ],
    },
    {
      id: 'cottageBoy',
      name: 'Cob',
      x: 7,
      y: 5,
      facing: 'left',
      sprite: 'child',
      movement: 'lookAround',
      dialogue: [
        {
          pages: [
            'The root coils in the Hall! I know how they work.',
            'Every one pulls ONE hedge back and pushes ANOTHER out. Always both.',
            'So you have to think about what you are closing, not just what you are opening.',
          ],
        },
      ],
    },
  ],

  interactables: [
    {
      x: 2,
      y: 4,
      type: 'sign',
      dialogue: 'A table crowded with seed trays. Every one is labelled in tiny handwriting.',
    },
  ],
};
