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
    '_OOHHOOOOPO_', // 3  healing array
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
          // GAME_DESIGN.md gives Tidewatch "storage access". Phase 12 does
          // not build a storage manager (it is out of scope), so the town
          // says so honestly rather than pretending: the terminal is not in yet.
          pages: [
            'I am fitting a storage link for the Circle — so a Warden can send a creature to safe keeping and call it back.',
            'Not finished, I am afraid. Anything you catch with a full party still goes to storage the usual way.',
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
        'The mending array. Salt has crusted the casing, but it hums along happily.',
      ],
    },
  ],
};
