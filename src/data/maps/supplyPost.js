/**
 * supplyPost.js — the Supply Post, Emberhollow Town
 * ----------------------------------------------------------------------------
 * The town shop. Buying and selling arrives in Phase 7, when money and the bag
 * screen exist; for now the shopkeeper describes the stock.
 */

export const supplyPost = {
  id: 'supplyPost',
  name: 'Supply Post',
  interior: true,
  objectBase: 'O',
  music: 'town',

  tiles: [
    // 0    5    10
    '____________', // 0
    '_I________I_', // 1
    '||||||||||||', // 2
    '_VVVOOOOVVV_', // 3  stock shelves
    '_OOOOOOOOOO_', // 4  the shopkeeper stands here
    '_OOOCCCCOOO_', // 5  counter
    '_OMOOOOOOOO_', // 6  door mat at x2
    '____________', // 7
  ],

  spawnPoints: {
    default: { x: 2, y: 5, facing: 'down' },
  },

  exits: [{ x: 2, y: 6, to: 'emberhollow', spawn: 'fromSupplyPost' }],

  npcs: [
    {
      id: 'shopkeeper',
      name: 'Bram',
      // Behind the counter — reachable by facing the counter from below.
      x: 5,
      y: 4,
      facing: 'down',
      sprite: 'shopkeeper',
      movement: 'static',
      dialogue: [
        {
          when: 'gotStarter',
          pages: [
            'A Warden! Then you will be wanting orbs and potions.',
            'Come back when I have the till open — I am still counting yesterday.',
          ],
        },
        {
          pages: [
            'Morning. Supply Post — orbs, potions, rope, the usual.',
            'No sense selling you an orb before you have anything to walk beside you, mind.',
          ],
        },
      ],
    },
  ],

  interactables: [
    {
      x: 2,
      y: 3,
      type: 'sign',
      dialogue: 'Crates of capture orbs, stacked and labelled by grade.',
    },
    {
      x: 9,
      y: 3,
      type: 'sign',
      dialogue: 'Shelves of potions in careful rows. They smell faintly of mint.',
    },
  ],
};
