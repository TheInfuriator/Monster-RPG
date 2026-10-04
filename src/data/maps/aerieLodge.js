/**
 * aerieLodge.js — the Aerie Lodge
 * ----------------------------------------------------------------------------
 * The last place to rest before the Circle's Trial (Phase 14): a Mender's
 * Hall and a Supply Post under one copper roof, with a storage terminal in
 * the corner. No new code — Mender Brann heals with the same `action: 'heal'`
 * (so a loss anywhere on the Aerie, in the Hollow or in the Trial wakes you
 * here), Quill opens `shop:aerieLodge`, and the terminal is every Mender's
 * Hall's terminal.
 */

export const aerieLodge = {
  id: 'aerieLodge',
  name: 'Aerie Lodge',
  interior: true,
  objectBase: 'O',
  music: 'town',

  tiles: [
    // 0    5    10
    '______________', // 0
    '_I__________I_', // 1
    '||||||||||||||', // 2
    '_OHHOOO?OVVVO_', // 3  the mending array; the storage terminal (7,3); the shop's shelves
    '_OOOOOOOOOOOO_', // 4  Mender Brann (2,4); Quill (10,4)
    '_CCCCOOOOCCCC_', // 5  two counters
    '_OOOOOOOOOOAP_', // 6  a bench by the fire
    '_OOOOOOMOOOOO_', // 7  door mat at x7
    '______________', // 8
  ],

  spawnPoints: {
    default: { x: 7, y: 6, facing: 'down' },
  },

  exits: [{ x: 7, y: 7, to: 'aerie', spawn: 'fromLodge' }],

  npcs: [
    {
      id: 'aerieMender',
      name: 'Mender Brann',
      x: 2,
      y: 4,
      facing: 'down',
      sprite: 'mender',
      movement: 'static',
      dialogue: [
        {
          action: 'heal',
          pages: [
            'The Aerie Lodge. Highest Mender\'s Hall in the valley — the air is thin, but the fire is warm.',
            'Set them down. Free, as always. If the Hollow or the Trial goes badly, this is where you will wake.',
          ],
        },
      ],
    },
    {
      id: 'aerieShopkeeper',
      name: 'Quill',
      x: 10,
      y: 4,
      facing: 'down',
      sprite: 'shopkeeper',
      movement: 'static',
      dialogue: [
        {
          action: 'shop:aerieLodge',
          pages: [
            'Everything Voltspire sells, carried up the road on my own back. Prices to match, I am afraid.',
          ],
        },
      ],
    },
    {
      id: 'aerieLodgeGuest',
      name: 'Old Warden Pell',
      x: 10,
      y: 6,
      facing: 'left',
      sprite: 'elder',
      movement: 'static',
      dialogue: [
        {
          when: 'storyComplete',
          pages: ['Champion, eh? I lost to the Earth Warden three times, in my day. Never even saw the Champion\'s door.'],
        },
        {
          when: 'convergenceStopped',
          pages: [
            'You came out of the Hollow? Then rest, and stock up. The Trial is four battles, one after another, and no Mender inside.',
            'Three Wardens — the earth, the sea and the sky. Bring an answer to each: water or grass for the earth, electric or grass for the sea, rock or ice for the sky.',
            'The road up here has all of those, if your team is short. And bring six. The Champion always does.',
          ],
        },
        {
          pages: [
            'Forty years I have come up here to watch the Trial. First year I can remember it closed.',
            'The Circle will not hold it while the Wellspring is failing. Quite right too.',
            'When it opens again, you will want a full team of six. The Aerie Road has the strongest wild Aethers in the valley — and the Lodge has a terminal for the rest.',
          ],
        },
      ],
    },
  ],

  interactables: [
    {
      x: 7,
      y: 3,
      type: 'sign',
      dialogue: [
        { action: 'storage', pages: ['A storage terminal. Its screen glows a patient green.'] },
      ],
    },
    {
      x: 2,
      y: 3,
      type: 'sign',
      dialogue: ['The mending array. Someone has carved WARDENS REST HERE into the frame, a long time ago.'],
    },
  ],
};
