/**
 * mendersHall.js — the Mender's Hall, Emberhollow Town
 * ----------------------------------------------------------------------------
 * This world's healing centre. The Mender restores your party for free.
 *
 * Talking to Mender Ines restores the whole party — HP, every move's PP and any
 * status — and makes this Hall the place you wake up after blacking out. Both
 * come from the dialogue `action: 'heal'`, so a second Hall in a later town
 * needs no code at all.
 */

export const mendersHall = {
  id: 'mendersHall',
  name: "Mender's Hall",
  interior: true,
  objectBase: 'O',
  music: 'town',

  tiles: [
    // 0    5    10
    '____________', // 0
    '_I________I_', // 1
    '||||||||||||', // 2
    '_OOHHOOOOOO_', // 3  healing machine
    '_OOOOOOOOOO_', // 4  the Mender stands here
    '_CCCCOOOOOO_', // 5  counter
    '_OOOOOOOAAO_', // 6  waiting benches
    '_OOOOMOOOOO_', // 7  door mat at x5
    '____________', // 8
  ],

  spawnPoints: {
    default: { x: 5, y: 6, facing: 'down' },
  },

  exits: [{ x: 5, y: 7, to: 'emberhollow', spawn: 'fromMendersHall' }],

  npcs: [
    {
      id: 'mender',
      name: 'Mender Ines',
      // Behind the counter — the player talks to her across it.
      x: 2,
      y: 4,
      facing: 'down',
      sprite: 'mender',
      movement: 'static',
      dialogue: [
        {
          // The heal runs when the conversation ENDS, and speaks for itself.
          action: 'heal',
          pages: [
            'Welcome to the Mender’s Hall! Bring me any tired Aether and I will set it right.',
            'It costs nothing. Wardens look after each other out here.',
          ],
        },
      ],
    },
    {
      id: 'restingTraveller',
      name: 'Traveller',
      // Sitting on the floor beside the benches at x8-x9, not inside them.
      x: 7,
      y: 6,
      facing: 'right',
      sprite: 'elder',
      movement: 'static',
      dialogue: [
        {
          pages: [
            'These benches have held up more weary Wardens than I can count.',
            'Cinderpath is gentle enough. It is what comes after that tests you.',
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
        'The mending array. Lamps blink softly along its side.',
        'Green, amber, red — and back to green.',
      ],
    },
  ],
};
