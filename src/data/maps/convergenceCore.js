/**
 * convergenceCore.js — the Hollow: the Convergence
 * ----------------------------------------------------------------------------
 * The heart of the Hollow Vane's last operation (Phase 14), behind the Works'
 * core door: the Convergence engine, fed by the three banks next door, and
 * the one who built it — Director Thale.
 *
 * WHAT THE CONVERGENCE DOES
 * The valley's currents meet in the Hollow and rise at the Wellspring; every
 * spring, storm and vein in Aetheria is fed from that meeting. A current runs
 * toward where currents meet. The engine, primed with all three — the earth's,
 * the sea's and the storm's, a hundred and twenty cells of them — would
 * BECOME that meeting place. Every current in the valley would run here
 * instead of to the Wellspring, and out only through the Vane's lines:
 * metered, steady, and sold. The Wellspring would go dry, the springs and
 * storms that live off it would fail, and the wild Aethers — born of the
 * currents — would fade with them.
 *
 * Why: Thale grew up under the Voltspire, and has never forgiven the sky for
 * the months it goes dark. The Convergence is meant to make the valley's
 * power steady and paid for, forever — that the Vane darkened Voltspire for
 * a month to build it is, to Thale, the price of never being dark again.
 *
 * THE CONFRONTATION
 * With the banks vented the engine cannot be primed, but Thale means to run
 * it on what is still in the lines. Beat them (an ordinary trainer battle —
 * no boosts, no new species) and they shut the engine down by hand rather
 * than run it half-primed: `convergenceStopped` is set once, by the trainer
 * record, the engine goes cold while the player watches (a `glows` picture),
 * Thale walks off, and the game autosaves. A loss is an ordinary blackout to
 * the last Mender, with Thale still waiting.
 *
 *   c  cave floor   ]  grating   `  the engine (/ once cold)   z  feed cables
 *   l  storage cells   m  machinery   J  Vane board   Y  cave wall
 */

import { TRAINERS } from '../trainers.js';

const ENGINE = [];
for (let y = 4; y <= 11; y += 1) {
  for (let x = 17; x <= 20; x += 1) ENGINE.push([x, y]);
}

export const convergenceCore = {
  id: 'convergenceCore',
  name: 'The Hollow — the Convergence',
  music: 'route',

  glows: [
    { when: 'convergenceStopped', tile: '/', tiles: ENGINE },
  ],

  tiles: [
    // 0         1         2
    // 012345678901234567890123
    'YYYYYYYYYYYYYYYYYYYYYYYY', //  0
    'YmmccccccccccccllczzcllY', //  1
    'YmmccccccccccccllczzcllY', //  2
    'YcccJccccccccccccczzcccY', //  3  the design board (4,3)
    'Ycccccccccccccccc````mmY', //  4  THE CONVERGENCE ENGINE (17..20, 4..11)
    'Ycccccccccccccccc````mmY', //  5
    'Ycccccccccccccccc````ccY', //  6
    'c]]]]]]]]]]]]]]]c````zzY', //  7  west exit to the Works; Director Thale (16,7)
    'c]]]]]]]]]]]]]]]c````zzY', //  8
    'Ycccccccccccccccc````ccY', //  9
    'Ycccccccccccccccm````mmY', // 10  the engine's console (16,10)
    'Ycccccccccccccccc````mmY', // 11
    'YccccccccJcccccccczzcccY', // 12  the Director's log (9,12)
    'YllccccccccccccllczzcllY', // 13
    'YllccccccccccccllczzcllY', // 14
    'YYYYYYYYYYYYYYYYYYYYYYYY', // 15
  ],

  spawnPoints: {
    fromWorks: { x: 1, y: 7, facing: 'right' },
    default: { x: 1, y: 7, facing: 'right' },
  },

  exits: [
    { x: 0, y: 7, to: 'hollowWorks', spawn: 'fromCore' },
    { x: 0, y: 8, to: 'hollowWorks', spawn: 'fromCore' },
  ],

  npcs: [
    {
      // THE VANE'S LEADER. In front of the engine; walks off once beaten.
      id: 'vaneDirector',
      name: 'Thale',
      trainer: 'vaneDirector',
      sightRange: 3,
      x: 16,
      y: 7,
      facing: 'left',
      sprite: 'vaneDirector',
      movement: 'static',
      absentWhen: 'trainer:vaneDirector',
      exitAfterDefeat: { direction: 'down', steps: 5 },
      dialogue: [
        { action: 'trainer:vaneDirector', pages: TRAINERS.vaneDirector.intro },
      ],
    },
    {
      // Once it is over: the Circle comes to see the engine for themselves.
      id: 'coreWarden',
      name: 'Warden Emrys',
      x: 12,
      y: 10,
      facing: 'right',
      sprite: 'warden',
      movement: 'static',
      presentWhen: 'convergenceStopped',
      dialogue: [
        {
          when: 'storyComplete',
          pages: ['Cold as a stone. The Circle wants it left exactly like this — so that nobody ever forgets what it nearly did.'],
        },
        {
          pages: [
            'I came down with the first of the Circle. A thing this size, under our feet, and none of us knew.',
            'It is cold now. The Circle is waiting for you at the Hall, Champion-to-be. Go on.',
          ],
        },
      ],
    },
  ],

  interactables: [
    {
      x: 4,
      y: 3,
      type: 'sign',
      dialogue: [
        'A Vane design board, covered edge to edge in a neat engineer\'s hand.',
        '"A current runs toward where currents meet. Prime the engine with all three and it becomes the meeting place. The valley does the rest."',
        'Underneath, a list: WELLSPRING — DRY. SPRINGS — DRY. STORMS — ON DEMAND. WILD AETHERS — "REGRETTABLE. UNAVOIDABLE."',
      ],
    },
    {
      x: 9,
      y: 12,
      type: 'sign',
      dialogue: [
        'The Director\'s log. The last entry is in pencil.',
        '"Voltspire is dark again tonight — our relay, my order. Thirty nights of dark to buy a thousand years of light. I would make the same trade again."',
      ],
    },
    {
      x: 16,
      y: 10,
      type: 'sign',
      dialogue: [
        {
          when: 'convergenceStopped',
          pages: ['The engine\'s console. Every switch is down, and the master key has been snapped off in the lock.'],
        },
        {
          pages: ['The engine\'s console, a forest of switches. You do not know what any of them do — and the Director is watching you.'],
        },
      ],
    },
  ],
};
