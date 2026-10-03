/**
 * mistvaultGalleries.js — Mistvault Cavern: the Galleries
 * ----------------------------------------------------------------------------
 * The middle of Mistvault (Phase 12), and its puzzle.
 *
 * THE PUZZLE — steering the current
 * A spring wells up at the bottom of the Galleries and its aether current runs
 * off along channels cut in the rock. Over each chasm hangs a MIST BRIDGE, and
 * a mist bridge only holds while current runs beneath it. Two old valves
 * decide where the current goes:
 *
 *   the spring valve (14,21)  sends the spring's current EAST or WEST
 *   the far valve    (8,7)    sends whatever reaches it to the POCKET or DEEP
 *
 *              spring
 *                |
 *        [spring valve]
 *          /          \
 *      westRun       eastRun ── the east bridge (to the east wing)
 *        |
 *   the west bridge
 *        |
 *     [far valve]
 *      /        \
 *  pocketRun    deepRun ── the deep bridge (north, to the Draw Site)
 *      |
 *  the pocket bridge
 *
 * The far valve does NOTHING unless the spring valve is sending current west:
 * the second valve depends on the first. That is the puzzle, and it is not a
 * hedge swap — no lever here moves a barrier directly; it moves the current,
 * and the bridges follow the current (PuzzleSystem: levers, `flow`, signals).
 *
 * The channels in the walls LIGHT UP where the current runs, so the player
 * can see what each turn did. Everything starts as found: the spring valve
 * east (the east wing open), the far valve to the pocket.
 *
 *   The way north:  spring valve WEST, then far valve DEEP.
 *
 * WHY THE PLAYER CAN NEVER BE TRAPPED
 * A bridge only changes when a valve turns, and both valves stand on the side
 * the player came from: the spring valve in the central hall (which every
 * bridge leads back to) and the far valve on the west side, where turning it
 * never touches the west bridge the player crossed to get there. Nothing
 * stands on or beside a bridge. `tests/mistvault.test.js` proves it over every
 * position the player could stand in and every setting of the valves.
 *
 * Once the siphon is stopped (`mistvaultSiphonStopped`) the current runs at
 * full strength along EVERY channel (`allPoweredWhen`) and every bridge holds
 * for good — the way back from Tidewatch can never be closed.
 *
 *   c  cave floor   Y  cave wall   ;  rubble (wild Aethers)   v  chasm
 *   n  mist bridge (drawn as chasm while no current holds it)
 *   q  channel      Q  lit channel E  the vault spring        y  a valve
 *   J  Vane notice board
 */

import { TRAINERS } from '../trainers.js';

export const mistvaultGalleries = {
  id: 'mistvaultGalleries',
  name: 'Mistvault Cavern — the Galleries',
  music: 'route',

  encounters: { table: 'mistvaultGalleries' },

  tiles: [
    // 0         1         2         3
    // 0123456789012345678901234567890123
    'YYYYYYYYYYYYYYYYccYYYYYYYYYYYYYYYY', //  0  north exit to the Draw Site
    'YYYccccYYYYYYYYYccYYYYYYYYYYYYYYYY', //  1  the pocket: ultra orb at (3,1)
    'YYYccccYYYYYccccccccccYYYYYYYYYYYY', //  2
    'YYYccccYYYYYc;;cccccccYYYYYYYYYYYY', //  3  Quill at (20,3) watches the way north
    'YYvvnvvvYYYYc;;cccccccYYYYYYYYYYYY', //  4  the pocket bridge (4, 4..6) over the pocket chasm
    'YYvvnvvvYYYYccccccccccYYYYYYYYYYYY', //  5
    'YYYYnqqqqqqqvvvvnnvvvvYYYYYYYYYYYY', //  6  the deep bridge (16..17, 6..8); the deep channel (8..11,6), the pocket channel (5..7,6)
    'YYccccccyYYYvvvvnnvvvvYYYccccccccY', //  7  the far valve at (8,7)
    'YYcccccccYYYvvvvnnvvvvYYYcc;;;;;cY', //  8
    'YYcccccccYYYccccccccccYYYcc;;;;;cY', //  9
    'YYcccccccYYYccccccccccYYYcc;;;;;cY', // 10  Kestrel at (20,10)
    'YYcccccccvvvc;;;ccccccvvvccccccccY', // 11
    'YYcccccccvvvc;;;ccccccvvvcccccccJY', // 12  Vane notice board at (32,12)
    'YYcccccccnnnc;;;ccccccnnnccccccccY', // 13  the west bridge (9..11,13) and the east bridge (22..24,13); Brede at (29,13)
    'YYcccccccvvvccccccccccvvvccccccccY', // 14
    'YYc;;;;ccvvvcccccc;;;cvvvccccccccY', // 15
    'YYc;;;;ccYYqcccccc;;;cqYYc;;;;cccY', // 16  the west channel (11, 16..20) and the east channel (22, 16..21)
    'YYc;;;;ccYYqcccccc;;;cqYYc;;;;cccY', // 17
    'YYc;;;;ccYYqccccccccccqYYc;;;;cccY', // 18  super potion at (31,18)
    'YYcccccccYYqccccccccccqYYccccccccY', // 19
    'YYYYYYYYYYYqccccccccccqYYYYYYYYYYY', // 20
    'YYYYYYYYYYYQQQyccccqqqqYYYYYYYYYYY', // 21  the spring valve at (14,21); the spring's groove is always lit
    'YYYYYYYYYYYQccccccccccYYYYYYYYYYYY', // 22
    'YYYYYYYYYYYQccccccccccYYYYYYYYYYYY', // 23
    'YYYYYYYYYYYQccccccccccYYYYYYYYYYYY', // 24
    'YYYYYYYYYYYYEEccccc;;;YYYYYYYYYYYY', // 25  the vault spring (12..13, 25..27)
    'YYYYYYYYYYYYEEccccc;;;YYYYYYYYYYYY', // 26
    'YYYYYYYYYYYYEEccccc;;;YYYYYYYYYYYY', // 27
    'YYYYYYYYYYYYccccccccccYYYYYYYYYYYY', // 28
    'YYYYYYYYYYYYYYYYccYYYYYYYYYYYYYYYY', // 29  south exit to the Mouth
  ],

  /**
   * The two valves. Each is one boolean in `gameState.puzzles.mistvaultGalleries`
   * (false = its FIRST position), saved like the Verdant Hall's hedges.
   */
  levers: [
    {
      id: 'springValve',
      name: 'the spring valve',
      x: 14,
      y: 21,
      look: 'valve',
      positions: ['east', 'west'],
      input: 'spring',
      outputs: { east: 'eastRun', west: 'westRun' },
      says: {
        east: 'The spring valve swings east. Light races along the channel toward the east chasm.',
        west: 'The spring valve swings west. Light races along the channel toward the west chasm.',
      },
      dry: 'The spring valve turns, but no current reaches it.',
    },
    {
      id: 'farValve',
      name: 'the far valve',
      x: 8,
      y: 7,
      look: 'valve',
      positions: ['pocket', 'deep'],
      input: 'westRun',
      outputs: { pocket: 'pocketRun', deep: 'deepRun' },
      says: {
        pocket: 'The far valve turns. The current spills into the little channel up toward the pocket.',
        deep: 'The far valve turns. The current runs off along the deep channel, toward the great chasm.',
      },
      dry: 'The far valve turns, but no current reaches it. The channel it feeds from is dark.',
    },
  ],

  flow: {
    sources: ['spring'],
    // The siphon stopped: the current is back at full strength everywhere.
    allPoweredWhen: 'mistvaultSiphonStopped',
  },

  /** The four mist bridges. Each holds only while current runs beneath it. */
  barriers: [
    {
      id: 'deepBridge',
      name: 'the deep bridge',
      tile: 'v',
      tiles: [[16, 6], [17, 6], [16, 7], [17, 7], [16, 8], [17, 8]],
      closed: true,
      openWhenSignal: 'current:deepRun',
    },
    {
      id: 'westBridge',
      name: 'the west bridge',
      tile: 'v',
      tiles: [[9, 13], [10, 13], [11, 13]],
      closed: true,
      openWhenSignal: 'current:westRun',
    },
    {
      id: 'eastBridge',
      name: 'the east bridge',
      tile: 'v',
      tiles: [[22, 13], [23, 13], [24, 13]],
      closed: true,
      openWhenSignal: 'current:eastRun',
    },
    {
      id: 'pocketBridge',
      name: 'the pocket bridge',
      tile: 'v',
      tiles: [[4, 4], [4, 5], [4, 6]],
      closed: true,
      openWhenSignal: 'current:pocketRun',
    },
  ],

  /** Where the current can be SEEN running: each channel lights while it flows. */
  glows: [
    {
      signal: 'current:westRun',
      tile: 'Q',
      tiles: [[11, 16], [11, 17], [11, 18], [11, 19], [11, 20]],
    },
    {
      signal: 'current:eastRun',
      tile: 'Q',
      tiles: [[19, 21], [20, 21], [21, 21], [22, 21], [22, 20], [22, 19], [22, 18], [22, 17], [22, 16]],
    },
    {
      signal: 'current:deepRun',
      tile: 'Q',
      tiles: [[8, 6], [9, 6], [10, 6], [11, 6]],
    },
    {
      signal: 'current:pocketRun',
      tile: 'Q',
      tiles: [[5, 6], [6, 6], [7, 6]],
    },
  ],

  spawnPoints: {
    fromMouth: { x: 16, y: 28, facing: 'up' },
    fromCore: { x: 16, y: 1, facing: 'down' },
    default: { x: 16, y: 28, facing: 'up' },
  },

  exits: [
    { x: 16, y: 29, to: 'mistvaultMouth', spawn: 'fromGalleries' },
    { x: 17, y: 29, to: 'mistvaultMouth', spawn: 'fromGalleries' },
    { x: 16, y: 0, to: 'mistvaultCore', spawn: 'fromGalleries' },
    { x: 17, y: 0, to: 'mistvaultCore', spawn: 'fromGalleries' },
  ],

  npcs: [
    {
      // Kestrel ran in first, as promised — and got stuck at the chasm. Gone
      // once the siphon is stopped (they go on ahead to Tidewatch).
      id: 'kestrelGalleries',
      name: 'Kestrel',
      x: 20,
      y: 10,
      facing: 'left',
      sprite: 'rival',
      movement: 'static',
      presentWhen: 'mistvaultOpen',
      absentWhen: 'mistvaultSiphonStopped',
      dialogue: [
        {
          when: 'trainer:vaneQuill',
          pages: [
            'You got across! And there was one of those grey coats on the other side? Figures.',
            'Go on. I will be right behind you. Probably.',
          ],
        },
        {
          pages: [
            'Took you long enough. I have been staring at this chasm for ten minutes.',
            'Watch the channels in the walls. Where the light runs past a bridge, the bridge holds. Where it does not, it is just mist.',
            'The valve by the spring sends it one way or the other. I would work out the rest myself, but SOMEONE has to keep watch.',
          ],
        },
      ],
    },
    {
      id: 'vaneBrede',
      name: 'Brede',
      trainer: 'vaneBrede',
      sightRange: 4,
      // Guarding the east wing — off the way north, so a fight you can skip.
      x: 29,
      y: 13,
      facing: 'left',
      sprite: 'vane',
      movement: 'static',
      dialogue: [
        {
          when: 'trainer:vaneBrede',
          pages: [
            'The crew notice is right there on the board. Much good may it do you.',
          ],
        },
        {
          action: 'trainer:vaneBrede',
          pages: TRAINERS.vaneBrede.intro,
        },
      ],
    },
    {
      id: 'vaneQuill',
      name: 'Quill',
      trainer: 'vaneQuill',
      sightRange: 5,
      // Across the deep bridge, watching the way to the Draw Site.
      x: 20,
      y: 3,
      facing: 'left',
      sprite: 'vane',
      movement: 'static',
      dialogue: [
        {
          when: 'trainer:vaneQuill',
          pages: [
            'The Foreman is at the Draw Site, up the passage. Tell Vossler I held you up for as long as I could.',
          ],
        },
        {
          action: 'trainer:vaneQuill',
          pages: TRAINERS.vaneQuill.intro,
        },
      ],
    },
  ],

  interactables: [
    {
      // In the east wing, which is open as the Galleries are found: so the
      // answer is there for anyone who explores before they experiment.
      x: 32,
      y: 12,
      type: 'sign',
      dialogue: [
        'A grey Vane board. CREW NOTICE — SURVEY 14.',
        'To the Draw Site: spring valve WEST, then the far valve DEEP. Bridges hold only where the current runs.',
        'Turn the valves back behind you. Wardens are NOT to find the Draw Site.',
      ],
    },
    {
      x: 13,
      y: 26,
      type: 'sign',
      dialogue: [
        {
          when: 'mistvaultSiphonStopped',
          pages: ['The vault spring is brimming over. Its current runs strong down every channel at once.'],
        },
        {
          pages: [
            'The vault spring. Aether current wells up here and runs off along a groove in the rock.',
            'It is weaker than it should be. Something is drawing on it from deeper in.',
          ],
        },
      ],
    },

    { x: 3, y: 1, type: 'item', item: 'ultraOrb', quantity: 1, flag: 'pickedUpMistvaultPocketOrb' },
    { x: 31, y: 18, type: 'item', item: 'superPotion', quantity: 2, flag: 'pickedUpMistvaultEastPotions' },
  ],
};
