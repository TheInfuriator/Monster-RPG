/**
 * tidewatchSupplyPost.js — the Supply Post, Tidewatch Harbor
 * ----------------------------------------------------------------------------
 * The third shop. As with Thistlewood's, there is no new code: Morwen opens
 * `shop:tidewatchSupplyPost`, and the whole difference is one stock list in
 * src/data/shops.js — which here, for the first time, has the Ultra Orb and
 * the Clear Tonic on it.
 */

export const tidewatchSupplyPost = {
  id: 'tidewatchSupplyPost',
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

  exits: [{ x: 2, y: 6, to: 'tidewatch', spawn: 'fromSupplyPost' }],

  npcs: [
    {
      id: 'tidewatchShopkeeper',
      name: 'Morwen',
      x: 5,
      y: 4,
      facing: 'down',
      sprite: 'shopkeeper',
      movement: 'static',
      dialogue: [
        {
          action: 'shop:tidewatchSupplyPost',
          pages: [
            'A harbour shop sells what harbour folk need: everything, and the best of it.',
            'Ultra Orbs are new in. Dear, but they hold what a Great Orb lets slip.',
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
      dialogue: 'Ultra Orbs, gleaming in a glass case. The price tag is face-down.',
    },
    {
      x: 9,
      y: 3,
      type: 'sign',
      dialogue: [
        'A card in a neat hand: "CLEAR TONIC — cures anything. For the Hall, and for the cave."',
      ],
    },
  ],
};
