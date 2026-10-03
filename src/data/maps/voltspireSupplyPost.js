/**
 * voltspireSupplyPost.js — the Supply Post, Voltspire City
 * ----------------------------------------------------------------------------
 * The fourth shop (Phase 13). As with every Supply Post, there is no new code:
 * Cassia opens `shop:voltspireSupplyPost`, and the difference is one stock
 * list in src/data/shops.js — which here, for the first time, has the
 * Mender's Draught on it.
 */

export const voltspireSupplyPost = {
  id: 'voltspireSupplyPost',
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

  exits: [{ x: 2, y: 6, to: 'voltspire', spawn: 'fromSupplyPost' }],

  npcs: [
    {
      id: 'voltspireShopkeeper',
      name: 'Cassia',
      x: 5,
      y: 4,
      facing: 'down',
      sprite: 'shopkeeper',
      movement: 'static',
      dialogue: [
        {
          action: 'shop:voltspireSupplyPost',
          pages: [
            'Welcome to the top of the world. Everything the harbour sells, and one thing it does not.',
            'Mender\'s Draught — brewed here, from the Mender\'s own recipe. It will put a tired Aether right back on its feet.',
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
      dialogue: [
        'Stoppered bottles of Mender\'s Draught, faintly warm to the touch.',
      ],
    },
    {
      x: 9,
      y: 3,
      type: 'sign',
      dialogue: [
        'A card in a careful hand: "FOR THE STORM HALL: things that are not afraid of lightning."',
      ],
    },
  ],
};
