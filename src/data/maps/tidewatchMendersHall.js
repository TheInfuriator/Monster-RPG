/**
 * tidewatchMendersHall.js — the Mender's Hall, Tidewatch Harbor
 * ----------------------------------------------------------------------------
 * The third healing point (Phase 12). Like Thistlewood's, there is no new
 * code behind it: Mender Coral heals with the same `action: 'heal'`, and
 * healing here makes Tidewatch where a blackout wakes you — so a loss in the
 * Tidal Hall costs a short walk, not the whole cavern.
 */

export const tidewatchMendersHall = {
  id: 'tidewatchMendersHall',
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
    '_OOOOOOOOOO_', // 4  Mender Coral stands here
    '_CCCCOOOOOO_', // 5  counter
    '_OOOOOOOAAO_', // 6  benches
    '_OOOOMOOOOO_', // 7  door mat at x5
    '____________', // 8
  ],

  spawnPoints: {
    default: { x: 5, y: 6, facing: 'down' },
  },

  exits: [{ x: 5, y: 7, to: 'tidewatch', spawn: 'fromMendersHall' }],

  npcs: [
    {
      id: 'tidewatchMender',
      name: 'Mender Coral',
      x: 2,
      y: 4,
      facing: 'down',
      sprite: 'mender',
      movement: 'static',
      dialogue: [
        {
          action: 'heal',
          pages: [
            'The Tidewatch Mender\'s Hall. You look like you walked through a cave to get here.',
            'Set them down. Free, as always — and if the Tidal Hall goes badly, this is where you will wake.',
          ],
        },
      ],
    },
    {
      id: 'storageFitter',
      name: 'Fitter Dace',
      x: 8,
      y: 4,
      facing: 'left',
      sprite: 'shopkeeper',
      movement: 'static',
      dialogue: [
        {
          // GAME_DESIGN.md gives Tidewatch "storage access". Phase 12 said
          // honestly that the link was not finished; Phase 13 finishes it —
          // the terminal is in, here and in every Mender's Hall.
          pages: [
            'The storage link is finished! That terminal in the corner — and one like it in every Mender\'s Hall in the valley.',
            'Send an Aether to safe keeping, call one back, or trade one for another. Six can travel with you; the rest wait, exactly as you left them.',
          ],
        },
      ],
    },
  ],

  interactables: [
    {
      // The storage terminal (Phase 13): the same in every Mender's Hall.
      x: 10,
      y: 3,
      type: 'sign',
      dialogue: [
        { action: 'storage', pages: ['A storage terminal. Its screen glows a patient green.'] },
      ],
    },
    {
      x: 3,
      y: 3,
      type: 'sign',
      dialogue: [
        'The mending array. Salt has crusted the casing, but it hums along happily.',
      ],
    },
  ],
};
