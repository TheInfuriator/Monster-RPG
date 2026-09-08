/**
 * thistlewoodSupplyPost.js — the Supply Post, Thistlewood
 * ----------------------------------------------------------------------------
 * The second shop. Like the second Mender's Hall, there is no new code behind
 * it: Perrin opens `shop:thistlewoodSupplyPost` and the whole difference
 * between this shop and Emberhollow's is one stock list in src/data/shops.js.
 */

export const thistlewoodSupplyPost = {
  id: 'thistlewoodSupplyPost',
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
    '_OOOOOOOOPO_', // 4  the shopkeeper stands here
    '_OOOCCCCOOO_', // 5  counter
    '_OMOOOOOOOO_', // 6  door mat at x2
    '____________', // 7
  ],

  spawnPoints: {
    default: { x: 2, y: 5, facing: 'down' },
  },

  exits: [{ x: 2, y: 6, to: 'thistlewood', spawn: 'fromSupplyPost' }],

  npcs: [
    {
      id: 'thistlewoodShopkeeper',
      name: 'Perrin',
      x: 5,
      y: 4,
      facing: 'down',
      sprite: 'shopkeeper',
      movement: 'static',
      dialogue: [
        {
          // The shelf itself lives in src/data/shops.js.
          action: 'shop:thistlewoodSupplyPost',
          pages: [
            'Hall challenger, are you? You all come through here first.',
            'I stock the strong stuff. Emberhollow will not sell you a Super Potion; I will.',
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
      dialogue: 'Great Orbs in a locked case, priced accordingly.',
    },
    {
      x: 9,
      y: 3,
      type: 'sign',
      dialogue: [
        'A hand-lettered card: "SUPER POTION — 50 HP. Worth it before the Hall."',
        'Someone has written "IT REALLY IS" underneath in a different hand.',
      ],
    },
  ],
};
