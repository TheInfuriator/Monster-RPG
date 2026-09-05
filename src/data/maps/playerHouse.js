/**
 * playerHouse.js — the player's home, Emberhollow Town
 * ----------------------------------------------------------------------------
 * Interior tiles: _ wall  | wall base  I window  o floor  M door mat
 *                 b bed   A table      B bookshelf  P plant
 *
 * Stepping on the door mat (M) takes you back outside.
 */

export const playerHouse = {
  id: 'playerHouse',
  name: 'Home',
  interior: true,
  /** Furniture is drawn on top of this floor tile. See src/data/tiles.js. */
  objectBase: 'o',
  music: 'town',

  tiles: [
    // 0    5    10
    '___________', // 0
    '_I_______I_', // 1
    '|||||||||||', // 2
    '_booooooBB_', // 3
    '_oooooooBB_', // 4
    '_ooAAAoooo_', // 5
    '_oooooooPo_', // 6
    '_ooooMoooo_', // 7  door mat at x5
    '___________', // 8
  ],

  spawnPoints: {
    // One tile above the mat, so arriving never re-triggers the exit.
    default: { x: 5, y: 6, facing: 'down' },
  },

  exits: [{ x: 5, y: 7, to: 'emberhollow', spawn: 'fromPlayerHouse' }],

  npcs: [
    {
      id: 'mum',
      name: 'Mum',
      x: 7,
      y: 4,
      facing: 'left',
      sprite: 'villagerAlt',
      movement: 'lookAround',
      dialogue: [
        {
          when: 'gotStarter',
          pages: [
            'Look at you — a Warden with a partner of your own.',
            'Come home and rest any time. I will keep the kettle on.',
          ],
        },
        {
          when: 'metWick',
          pages: [
            'Professor Wick has been waiting all morning, love.',
            'Do not keep her standing about in that draughty lodge!',
          ],
        },
        {
          pages: [
            'Morning, sleepyhead! Professor Wick came by looking for you.',
            'She is up at the Warden’s Lodge, north-east of here.',
            'Go on — today is the day you become a Warden!',
          ],
        },
      ],
    },
  ],

  interactables: [
    {
      x: 8,
      y: 3,
      type: 'sign',
      dialogue: 'Shelves of well-thumbed books about Aethers and the currents.',
    },
    {
      x: 1,
      y: 3,
      type: 'sign',
      dialogue: 'Your bed. Neatly made, for once.',
    },
  ],
};
