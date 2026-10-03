/**
 * mistvaultCore.js — Mistvault Cavern: the Draw Site and the Tideward Grotto
 * ----------------------------------------------------------------------------
 * The deepest of Mistvault's three maps (Phase 12): where the Vane's cables
 * end, and where the player meets the Hollow Vane properly for the first time.
 *
 * THE SHAPE
 *   the approach      rows 22-31  a cable loop up from the Galleries, and a
 *                                 Vane technician working on it
 *   the Draw Site     rows 9-21   the siphon rig, its storage cells, and Draw
 *                                 Foreman Vossler standing at its breaker
 *   the tideward way  rows 5-8    a passage choked with thick mist
 *   the Grotto        rows 0-4    shallows, and the way on to Tidewatch Harbor
 *
 * THE OBJECTIVE
 * The breaker (15,12) can only be reached from the one tile in front of it,
 * and the Foreman stands on that tile, watching the cables. Beat the Foreman
 * and they walk off; throw the breaker and `mistvaultSiphonStopped` is set:
 *
 *   - the mist in the tideward passage clears (a barrier with `openWhen`)
 *   - the intake channels by the rig go dark (a `glows` entry)
 *   - every channel in the Galleries runs again, every bridge holds for good
 *   - Route 2's dry spring fills back up
 *   - and one `story` autosave records it
 *
 * The Vane are beaten here, not finished: the Foreman leaves with "we already
 * have what we came for", and the cells say where they were bound.
 *
 *   c  cave floor   Y  cave wall   ;  rubble   N  shallows (both: wild Aethers)
 *   z  Vane cables  m  Vane machinery  l  storage cells
 *   Q  an intake channel, lit while the siphon draws   i  thick mist
 */

import { TRAINERS } from '../trainers.js';

export const mistvaultCore = {
  id: 'mistvaultCore',
  name: 'Mistvault Cavern — the Draw Site',
  music: 'route',

  // Two habitats, like Route 2: rubble rolls on the Galleries' table, the
  // Grotto's shallows on their own.
  encounters: {
    table: 'mistvaultGalleries',
    byTerrain: { shallows: 'mistvaultShallows' },
  },

  /** The mist the siphon leaves in the tideward passage. Gone once it stops. */
  barriers: [
    {
      id: 'tidewardMist',
      name: 'the thick mist',
      tile: 'i',
      tiles: [[6, 7], [7, 7], [6, 8], [7, 8]],
      closed: true,
      openWhen: 'mistvaultSiphonStopped',
    },
  ],

  /** The intake channels by the rig: lit while it draws, dark once it stops. */
  glows: [
    {
      when: 'mistvaultSiphonStopped',
      tile: 'q',
      tiles: [[11, 9], [11, 10], [11, 11], [18, 9], [18, 10], [18, 11]],
    },
  ],

  tiles: [
    // 0         1         2
    // 012345678901234567890123456789
    'YYYYYYYYYYYYYYYYYYYYYYYYYYYYYY', //  0  north: sealed until Tidewatch Harbor is built (checkpoint 4)
    'YYcccccccccYYcNNNNNNNNcYccccYY', //  1  the Tideward Grotto: great orb at (26,1)
    'YYcNNNNNNNcYYcNNNNNNNNcYccccYY', //  2  shallows (wade through them: their own wild Aethers)
    'YYcNNNNNNNccccNNNNNNNNccNNNcYY', //  3
    'YYcNNNNNNNccccccccccccccNNNcYY', //  4
    'YYYYYYccYYYYYYYYYYYYYYYYYYYYYY', //  5  the tideward passage
    'YYYYYYccYYYYYYYYYYYYYYYYYYYYYY', //  6
    'YYYYYYccYYYYYYYYYYYYYYYYYYYYYY', //  7  thick mist (6..7, 7..8) until the siphon stops
    'YYYYYYccYYYYYYYYYYYYYYYYYYYYYY', //  8
    'YYYYYYcccccQmmmmmmQcccccYYYYYY', //  9  the siphon rig (12..17, 9..12); intake channels either side
    'YYYYYYcccccQmmmmmmQcccccYYYYYY', // 10
    'YYYYcccccccQmmmmmmQcccccccYYYY', // 11
    'YYYYccccccccmmmmmmccccccccYYYY', // 12  the breaker at (15,12)
    'YYYYcccccccccczczcccccccccYYYY', // 13  Draw Foreman Vossler at (15,13), watching the cables
    'YYYYcccccccccczczcccccccccYYYY', // 14
    'YYYYcclllccccczczcccclllccYYYY', // 15  storage cells either side; a label at (22,19)
    'YYYYcclllccccczczcccclllccYYYY', // 16
    'YYYYcclllccccczczcccclllccYYYY', // 17
    'YYYYcclllccccczczcccclllccYYYY', // 18
    'YYYYcclllccccczczcccclll;;YYYY', // 19
    'YYYY;;cccccccczczccccccc;;YYYY', // 20
    'YYYY;;cccccccczczccccccc;;YYYY', // 21  clear tonic at (4,21)
    'YYYYYYYYYYY;cccccccYYYYYYYYYYY', // 22  super potion at (18,22)
    'YYYYYYYYYYY;zzzzzzcYYYYYYYYYYY', // 23
    'YYYYYYYYYYYczcccczcYYYYYYYYYYY', // 24
    'YYYYYYYYYYYczcccc;;YYYYYYYYYYY', // 25
    'YYYYYYYYYYYczcccc;;YYYYYYYYYYY', // 26  Seld at (11,26)
    'YYYYYYYYYYYczcccc;;YYYYYYYYYYY', // 27
    'YYYYYYYYYYYczzzzzzcYYYYYYYYYYY', // 28
    'YYYYYYYYYYYYYYccYYYYYYYYYYYYYY', // 29  south exit to the Galleries
    'YYYYYYYYYYYYYYccYYYYYYYYYYYYYY', // 30
    'YYYYYYYYYYYYYYccYYYYYYYYYYYYYY', // 31
  ],

  spawnPoints: {
    fromGalleries: { x: 14, y: 30, facing: 'up' },
    default: { x: 14, y: 30, facing: 'up' },
  },

  exits: [
    { x: 14, y: 31, to: 'mistvaultGalleries', spawn: 'fromCore' },
    { x: 15, y: 31, to: 'mistvaultGalleries', spawn: 'fromCore' },
  ],

  npcs: [
    {
      // THE FIRST REAL HOLLOW VANE CONFRONTATION. Stands on the only tile
      // the breaker can be reached from; once beaten, walks off for good.
      id: 'vaneForeman',
      name: 'Vossler',
      trainer: 'vaneForeman',
      sightRange: 6,
      x: 15,
      y: 13,
      facing: 'down',
      sprite: 'vaneForeman',
      movement: 'static',
      absentWhen: 'trainer:vaneForeman',
      exitAfterDefeat: { direction: 'left', steps: 6 },
      dialogue: [
        {
          action: 'trainer:vaneForeman',
          pages: TRAINERS.vaneForeman.intro,
        },
      ],
    },
    {
      id: 'vaneTechnician',
      name: 'Seld',
      trainer: 'vaneTechnician',
      sightRange: 4,
      // Beside the cable loop, looking across the straight way up.
      x: 11,
      y: 26,
      facing: 'right',
      sprite: 'vane',
      movement: 'static',
      dialogue: [
        {
          when: 'mistvaultSiphonStopped',
          pages: [
            'You pulled the breaker. Vossler is going to be insufferable about this.',
            'Not that it matters. The cells were nearly full anyway.',
          ],
        },
        {
          when: 'trainer:vaneTechnician',
          pages: [
            'The Foreman is at the rig, straight up. I would not, if I were you.',
          ],
        },
        {
          action: 'trainer:vaneTechnician',
          pages: TRAINERS.vaneTechnician.intro,
        },
      ],
    },
  ],

  interactables: [
    {
      // THE OBJECTIVE. Reachable only from (15,13), where the Foreman stands.
      x: 15,
      y: 12,
      type: 'sign',
      dialogue: [
        {
          when: 'mistvaultSiphonStopped',
          pages: [
            'The breaker is down and the rig is silent. The current runs where it always ran.',
          ],
        },
        {
          when: 'trainer:vaneForeman',
          setFlags: ['mistvaultSiphonStopped'],
          pages: [
            'A heavy breaker, stamped with a hollow ring. You haul it down.',
            'The rig shudders, whines... and stops. All through the cavern, the current comes rushing back into the rock.',
            'Far off to the north-west, the mist in the passage begins to thin.',
          ],
        },
        {
          pages: ['A heavy breaker, stamped with a hollow ring.'],
        },
      ],
    },
    {
      // The cells say where the Vane were taking the current — and no more.
      x: 22,
      y: 19,
      type: 'sign',
      dialogue: [
        'Storage cells, racked three deep and glowing. Every label reads SURVEY 14.',
        'Under it, stencilled on the rack: FOR SHIPMENT — STORMRISE.',
      ],
    },

    { x: 18, y: 22, type: 'item', item: 'superPotion', quantity: 1, flag: 'pickedUpMistvaultCorePotion' },
    { x: 4, y: 21, type: 'item', item: 'clearTonic', quantity: 1, flag: 'pickedUpMistvaultCoreTonic' },
    { x: 26, y: 1, type: 'item', item: 'greatOrb', quantity: 2, flag: 'pickedUpMistvaultGrottoOrbs' },
  ],
};
