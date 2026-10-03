/**
 * voltspireMendersHall.js — the Mender's Hall, Voltspire City
 * ----------------------------------------------------------------------------
 * The fourth healing point (Phase 13). Like every Mender's Hall, there is no
 * new code behind it: Mender Ilse heals with the same `action: 'heal'`, and
 * healing here makes Voltspire where a blackout wakes you — so a loss in the
 * Storm Hall costs a walk across the high street, not the whole Climb.
 *
 * The STORAGE TERMINAL (10,3) is the same one every Mender's Hall now has:
 * `action: 'storage'` opens the storage screen (see src/systems/StorageSystem.js).
 */

export const voltspireMendersHall = {
  id: 'voltspireMendersHall',
  name: "Mender's Hall",
  interior: true,
  objectBase: 'O',
  music: 'town',

  tiles: [
    // 0    5    10
    '____________', // 0
    '_I________I_', // 1
    '||||||||||||', // 2
    '_OOHHOOOOP?_', // 3  healing array; the storage terminal (10,3)
    '_OOOOOOOOOO_', // 4  Mender Ilse stands here
    '_CCCCOOOOOO_', // 5  counter
    '_OOOOOOOAAO_', // 6  benches
    '_OOOOMOOOOO_', // 7  door mat at x5
    '____________', // 8
  ],

  spawnPoints: {
    default: { x: 5, y: 6, facing: 'down' },
  },

  exits: [{ x: 5, y: 7, to: 'voltspire', spawn: 'fromMendersHall' }],

  npcs: [
    {
      id: 'voltspireMender',
      name: 'Mender Ilse',
      x: 2,
      y: 4,
      facing: 'down',
      sprite: 'mender',
      movement: 'static',
      dialogue: [
        {
          action: 'heal',
          pages: [
            'The Voltspire Mender\'s Hall. You came up the Climb? Then you will want this.',
            'Set them down. Free, as always — and if the Storm Hall goes badly, this is where you will wake.',
          ],
        },
      ],
    },
    {
      id: 'voltspireStorageClerk',
      name: 'Clerk Imre',
      x: 8,
      y: 4,
      facing: 'right',
      sprite: 'researcher',
      movement: 'static',
      dialogue: [
        {
          pages: [
            'The storage terminal, there in the corner. Every Mender\'s Hall has one now — the link is finally finished.',
            'Send an Aether to safe keeping, call one back, or trade one for another. Six may travel with you; the rest wait, exactly as you left them.',
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
        'The mending array. A copper wire runs up the wall from it — to the spire, someone has scrawled beside it.',
      ],
    },
    {
      x: 10,
      y: 3,
      type: 'sign',
      dialogue: [
        { action: 'storage', pages: ['A storage terminal. Its screen glows a patient green.'] },
      ],
    },
  ],
};
