/**
 * mistvaultMouth.js — Mistvault Cavern: the Mouth
 * ----------------------------------------------------------------------------
 * The first of Mistvault's three maps (Phase 12), straight in from the top of
 * Route 2 once the Wardens' cordon comes down.
 *
 * THE SHAPE
 *   the way in      rows 21-25  a short tunnel up from Route 2
 *   the Mouth       rows 12-20  a broad chamber: rubble either side, Warden
 *                               Ashby of the Circle, and the first sign that
 *                               somebody has MOVED IN — cables, a cell depot
 *   the west pocket rows 6-11   a dead-end side chamber with an item
 *   the passage     rows 0-11   north to the Galleries, past a Vane Surveyor
 *                               who cannot miss you in a two-tile passage
 *
 * THE STORY HERE
 * Ashby gives the objective in one breath: find where the cables end and shut
 * it off. The Vane's grey board and their humming cell depot say who laid the
 * cables, without a cut scene. Once the siphon is stopped (deep in the Core,
 * `mistvaultSiphonStopped`), the dry channels cut in both walls light up again
 * and everyone here says so.
 *
 *   c  cave floor   Y  cave wall     ;  rubble (wild Aethers)
 *   z  Vane cables  l  storage cells m  Vane machinery   J  Vane notice board
 *   q  a dry current channel, cut in the rock
 */

import { TRAINERS } from '../trainers.js';

export const mistvaultMouth = {
  id: 'mistvaultMouth',
  name: 'Mistvault Cavern — the Mouth',
  music: 'route',

  // Rubble is the cave's encounter terrain, as busy and obvious as tall grass.
  encounters: { table: 'mistvaultCave' },

  tiles: [
    // 0         1         2
    // 012345678901234567890123456789
    'YYYYYYYYYYYYYYccYYYYYYYYYYYYYY', //  0  north passage out to the Galleries
    'YYYYYYYYYYYYYYczYYYYYYYYYYYYYY', //  1
    'YYYYYYYYYYYYYYczYYYYYYYYYYYYYY', //  2
    'YYYYYYYYYYYYYYczYYYYYYYYYYYYYY', //  3
    'YYYYYYYYYYYYYYczYYYYYYYYYYYYYY', //  4
    'YYYYYYYYYYYYYYczccYYYYYYYYYYYY', //  5  Tallis's alcove (16..17, 5..7); Tallis at (17,6)
    'YYYcccccYYYYYYczccYYYYYYYYYYYY', //  6  the west pocket: great orb at (4,7)
    'YYYc;;;cYYYYYYczccYYYYYYYYYYYY', //  7
    'YYYc;;;cYYYYYYczYYYYYYYYYYYYYY', //  8
    'YYYc;;;cYYYYYYczYYYYYYYYYYYYYY', //  9
    'YYYc;;;cYYYYYYczJYYYYYYYYYYYYY', // 10  Vane notice board at (16,10)
    'YYYcccccYYYYYYczYYYYYYYYYYYYYY', // 11
    'YYYYYYccccccccczzzzzzcccYYYYYY', // 12  the Mouth chamber; Vane cables run in from the east
    'YYYYYYccccccccccccccclllmYYYYY', // 13  the cell depot (21..23, 13..14); its meter at (24,13)
    'YYYYcc;;;;ccccccccccclllccqYYY', // 14
    'YYYqcc;;;;ccccccccccccccccqYYY', // 15  dry channels in both walls (light up once the siphon stops)
    'YYYqcc;;;;ccccccccc;;;;;ccqYYY', // 16
    'YYYqcc;;;;ccccccccc;;;;;ccqYYY', // 17
    'YYYqccccccccccccccc;;;;;ccqYYY', // 18  Warden Ashby at (11,18)
    'YYYqccccccccccccccc;;;;;ccqYYY', // 19  clear tonic at (23,19)
    'YYYYYYYccccccccccccccccYYYYYYY', // 20
    'YYYYYYYYYYYYYYccYYYYYYYYYYYYYY', // 21  the way in from Route 2
    'YYYYYYYYYYYYYYccYYYYYYYYYYYYYY', // 22
    'YYYYYYYYYYYYYYccYYYYYYYYYYYYYY', // 23
    'YYYYYYYYYYYYYYccYYYYYYYYYYYYYY', // 24
    'YYYYYYYYYYYYYYccYYYYYYYYYYYYYY', // 25  south exit to Route 2
  ],

  spawnPoints: {
    // Arriving from Route 2: just inside the tunnel, facing in.
    fromRoute2: { x: 14, y: 24, facing: 'up' },
    // Back from the Galleries: at the top of the north passage.
    fromGalleries: { x: 14, y: 1, facing: 'down' },
    default: { x: 14, y: 24, facing: 'up' },
  },

  exits: [
    { x: 14, y: 25, to: 'route2', spawn: 'fromMistvault' },
    { x: 15, y: 25, to: 'route2', spawn: 'fromMistvault' },
    { x: 14, y: 0, to: 'mistvaultGalleries', spawn: 'fromMouth' },
    { x: 15, y: 0, to: 'mistvaultGalleries', spawn: 'fromMouth' },
  ],

  /**
   * The dry channels in the chamber walls. Drawn dark in the grid; once the
   * siphon is stopped the current runs again and these draw them lit.
   */
  glows: [
    {
      when: 'mistvaultSiphonStopped',
      tile: 'Q',
      tiles: [
        [3, 15], [3, 16], [3, 17], [3, 18], [3, 19],
        [26, 14], [26, 15], [26, 16], [26, 17], [26, 18], [26, 19],
      ],
    },
  ],

  npcs: [
    {
      // The Circle's Warden, who asked for Sigil-holders: the objective said
      // plainly, then lines that follow how far the player has got.
      id: 'circleWarden',
      name: 'Warden Ashby',
      x: 11,
      y: 18,
      facing: 'right',
      sprite: 'warden',
      movement: 'static',
      dialogue: [
        {
          when: 'mistvaultSiphonStopped',
          pages: [
            'Feel that? The current is running back through the walls. Whatever you did down there, it worked.',
            'But a rig that size, cells stamped SURVEY 14... There are thirteen more surveys somewhere. The Vane are not finished.',
            'The way north through the Grotto comes out at Tidewatch Harbor. Go on — the Circle will want to hear it from you.',
          ],
        },
        {
          when: 'trainer:vaneTallis',
          pages: [
            'Hollow Vane — that is what they call themselves. Grey coats, a hollow ring on the chest.',
            'Their cables run up the north passage and into the Galleries. Follow them to where they end.',
            'The old valves in the Galleries still steer the spring\'s current, and the mist bridges only hold where it runs.',
            'And mind what they carry: steel and poison. Fire bites on steel, but not on the rock-hard things down here — something that digs cracks both.',
          ],
        },
        {
          pages: [
            'Warden Ashby, of the Circle. Corran sent you in? Good. I need Sigil-holders, and you are the ones we have.',
            'Something deep in this cavern is drawing the current out of the rock. It is why the Thornway spring ran dry.',
            'Find where it is being drawn, and shut it off. Follow the cables — somebody laid them, and recently.',
            'One more thing. What lives down here is rock and shadow, and fire barely scratches it. If your partner breathes fire, catch something that digs — there are Delvit in this rubble.',
          ],
        },
      ],
    },
    {
      id: 'vaneTallis',
      name: 'Tallis',
      trainer: 'vaneTallis',
      sightRange: 3,
      // In a side alcove off the two-tile passage: nobody walks north unseen.
      x: 17,
      y: 6,
      facing: 'left',
      sprite: 'vane',
      movement: 'static',
      dialogue: [
        {
          when: 'trainer:vaneTallis',
          pages: [
            'Go on, follow the cables. The Foreman will not be as polite as me.',
          ],
        },
        {
          action: 'trainer:vaneTallis',
          pages: TRAINERS.vaneTallis.intro,
        },
      ],
    },
  ],

  interactables: [
    {
      x: 16,
      y: 10,
      type: 'sign',
      dialogue: [
        'A grey board bolted to the rock, stamped with a hollow ring crossed by a line.',
        'HOLLOW VANE — SURVEY 14.  Cable run: MOUTH, GALLERIES, DRAW SITE.',
        'Draw quota: 40 cells.  Wardens are not to reach the Draw Site.',
      ],
    },
    {
      // The depot's meter: the cells are filling while the siphon runs.
      x: 24,
      y: 13,
      type: 'sign',
      dialogue: [
        {
          when: 'mistvaultSiphonStopped',
          pages: [
            'The meter on the cell depot has fallen still. Whatever filled these cells is not flowing in any more.',
          ],
        },
        {
          pages: [
            'Racks of grey storage cells, humming. Each is stamped SURVEY 14 and glows faintly from inside.',
            'A meter on the end of the rack ticks over as you watch. Something is still flowing in.',
          ],
        },
      ],
    },

    { x: 4, y: 7, type: 'item', item: 'greatOrb', quantity: 1, flag: 'pickedUpMistvaultMouthOrb' },
    { x: 23, y: 19, type: 'item', item: 'clearTonic', quantity: 1, flag: 'pickedUpMistvaultMouthTonic' },
  ],
};
