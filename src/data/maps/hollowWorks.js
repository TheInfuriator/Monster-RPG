/**
 * hollowWorks.js — the Hollow: the Vane's Works
 * ----------------------------------------------------------------------------
 * The Hollow Vane's last operation (Phase 14). The Hollow is the old cave
 * under the Aerie, where the valley's three currents meet before they rise at
 * the Wellspring. The Vane bought the old mining rights, bored their Works
 * into it, and brought up every cell they ever filled: the earth's current
 * (Survey 14, Mistvault), the sea's (Survey 15, the harbour) and the storm's
 * (Survey 16, Stormrise) — a BANK of forty cells for each.
 *
 * THE CONVERGENCE (the engine in the next map) is primed by those three
 * banks. Primed and run, it would make itself the place the valley's
 * currents meet — instead of the Wellspring — and every current in the
 * valley would flow to it, and out only through the Vane's lines.
 *
 * THE OBJECTIVE: vent the three banks. The Vane's own safety interlock does
 * the rest — the core door opens only while every bank is vented (the board
 * in the hall says so, and Kestrel reads it out).
 *
 * THE MECHANIC — the whole game's puzzles, once each, with nothing new:
 *   EARTH BANK (west wing)   a valve (Mistvault). Vented, the earth current
 *                            runs back down the old channel — and the mist
 *                            bridge over the chasm north holds while it runs
 *                            (Mistvault's bridges, `openWhenSignal`).
 *   SEA BANK (north-west)    a valve. Vented, the sea current floods the dry
 *                            cistern east and floats its pontoons up into a
 *                            walkway (the Tidal Hall's floating floor).
 *   STORM BANK (north-east)  a valve. Vented, the storm current runs back out
 *                            along the old lightning line, and the shutter
 *                            wired to the bank lifts — a short way back to
 *                            the hall (the Storm Hall's wired gates).
 *   THE CORE DOOR            a CIRCUIT (the Storm Hall's AND-gate): open only
 *                            while all three banks are vented.
 *
 * Each bank's valve stands in an alcove whose only open side is held by
 * the wing's Vane boss, as Crale held the relay console: beat them and they
 * walk off. Every valve turns both ways, nothing ever closes on the player
 * (PuzzleSystem refuses), and tests/hollow.test.js proves with the lever
 * proof that from every reachable situation the way out and every valve can
 * still be reached. Once the Convergence is stopped, every barrier here
 * stands open for good (`openWhen: 'convergenceStopped'`).
 *
 *   c  cave floor   Y  cave wall   ]  grating   l  storage cells   y  valve
 *   q  old channel (Q once the current runs)   d  old lightning line (< lit)
 *   v  chasm / the dry cistern   n  mist bridge   (  pontoon
 *   m  Vane machinery   J  Vane board   {  dead coils
 *   G  the shutter and the core door (barriers, not written in the grid)
 */

import { TRAINERS } from '../trainers.js';

const range = (from, to) => Array.from({ length: to - from + 1 }, (_, i) => from + i);
const row = (y, fromX, toX) => range(fromX, toX).map((x) => [x, y]);

export const hollowWorks = {
  id: 'hollowWorks',
  name: 'The Hollow — the Works',
  music: 'route',

  levers: [
    {
      id: 'earthBank',
      name: 'the earth bank valve',
      x: 5,
      y: 9,
      look: 'valve',
      positions: ['primed', 'vented'],
      says: {
        primed: 'The valve swings shut. The earth bank hums again. PRIMED.',
        vented: 'The valve swings open. The earth current pours out of the bank and away down the old channel. VENTED.',
      },
    },
    {
      id: 'seaBank',
      name: 'the sea bank valve',
      x: 5,
      y: 1,
      look: 'valve',
      positions: ['primed', 'vented'],
      says: {
        primed: 'The valve swings shut. The sea bank hums again — and the cistern drains away. PRIMED.',
        vented: 'The valve swings open. The sea current roars into the cistern; the pontoons float up. VENTED.',
      },
    },
    {
      id: 'stormBank',
      name: 'the storm bank valve',
      x: 29,
      y: 1,
      look: 'valve',
      positions: ['primed', 'vented'],
      says: {
        primed: 'The valve swings shut. The storm bank crackles again, and the shutter drops. PRIMED.',
        vented: 'The valve swings open. The storm current snaps out along the old lightning line — somewhere below, a shutter lifts. VENTED.',
      },
    },
  ],

  // The Vane's own safety interlock: the core opens only with every bank vented.
  circuits: [
    { id: 'core', needs: ['earthBank:vented', 'seaBank:vented', 'stormBank:vented'] },
  ],

  barriers: [
    {
      id: 'mistBridge',
      name: 'the mist bridge',
      tile: 'v',
      tiles: [[9, 7], [10, 7], [9, 8], [10, 8]],
      closed: true,
      openWhen: 'convergenceStopped',
      openWhenSignal: 'earthBank:vented',
    },
    {
      id: 'pontoons',
      name: 'the cistern pontoons',
      tile: 'v',
      tiles: [...row(3, 14, 21), ...row(4, 14, 21)],
      closed: true,
      openWhen: 'convergenceStopped',
      openWhenSignal: 'seaBank:vented',
    },
    {
      id: 'stormShutter',
      name: 'the storm shutter',
      tile: 'G',
      tiles: [[27, 12], [28, 12]],
      closed: true,
      openWhen: 'convergenceStopped',
      openWhenSignal: 'stormBank:vented',
    },
    {
      id: 'coreDoor',
      name: 'the core door',
      tile: 'G',
      tiles: [[33, 21], [33, 22]],
      closed: true,
      openWhen: 'convergenceStopped',
      openWhenSignal: 'circuit:core',
    },
  ],

  // Where each vented current goes — a picture, so the player SEES it run.
  glows: [
    { signal: 'earthBank:vented', tile: 'Q', tiles: [[1, 12], [1, 13], [1, 14], [1, 15], [1, 16]] },
    { signal: 'seaBank:vented', tile: 'Q', tiles: row(1, 7, 12) },
    { signal: 'seaBank:vented', tile: '~', tiles: [...row(1, 14, 21), ...row(2, 14, 21), ...row(5, 14, 21), ...row(6, 14, 21)] },
    { signal: 'stormBank:vented', tile: '<', tiles: row(9, 23, 33) },
  ],

  tiles: [
    // 0         1         2         3
    // 012345678901234567890123456789012345
    'YYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYY', //  0
    'YllllylqqqqqqcvvvvvvvvcccccclylllllY', //  1  SEA BANK valve (5,1); STORM BANK valve (29,1); the dry cistern (14..21, 1..6)
    'YllllcccccccccvvvvvvvvcccccccclllllY', //  2  Foreman Brack (5,2); Overseer Crale (29,2)
    'Yllllccccccccc((((((((cccccccclllllY', //  3  the pontoons (14..21, 3..4): a pit until the sea bank is vented
    'Yccccccccccccc((((((((cccccccccccccY', //  4
    'Ycccccccccccccvvvvvvvvcc{{cccccccccY', //  5
    'Ycccccccccccccvvvvvvvvcc{{cccccccccY', //  6
    'YvvvvvvvvnnvYYYYYYYYYYcccccccccccccY', //  7  the chasm; the mist bridge (9..10, 7..8) holds while the earth bank is vented
    'YvvvvvvvvnnvYYYYYYYYYYcccccccccccccY', //  8
    'YllllylcccccYYYYYYYYYYcdddddddddddcY', //  9  EARTH BANK valve (5,9); the old lightning line (23..33, 9)
    'YllllcccccccYYYYYYYYYYcccccccccccccY', // 10  Foreman Vossler (5,10)
    'YllllcccccccYYYYYYYYYYcccccccccccccY', // 11
    'YqccccccccccYYYYYYYYYYYYYYYccYYYYYYY', // 12  the shutter (27..28, 12) lifts while the storm bank is vented
    'YqccccccccccYYYYYYYYYYcccccccccccYYY', // 13
    'YqccccccccccYYYYYYYYYYcccccccllccYYY', // 14
    'YqccccccccccYYYYYYYYYYcmmmcccllccYYY', // 15  the manifold
    'YqccccccccccYYYYYYYYYYcmmmcccccccYYY', // 16
    'YYYYcccYYYYYYYYYYYYYYYcccccccccccYYY', // 17  the passage into the earth wing (4..6, 17)
    'YcccccccccJccccccmmccccccccccccccYYY', // 18  the Director's memo (10,18)
    'YccccccccccccccccccccccJJJcccccccYYY', // 19  Kestrel (2,19); Surveyor Odile (9,19); the prime board (23..25, 19); Surveyor Rusk (31,19)
    'YccccccccccccccccccccccccccccccccYYY', // 20
    'c]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]ccc', // 21  west exit to the Aerie; THE CORE DOOR (33,21),(33,22); east exit to the core
    'c]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]ccc', // 22
    'YccccccccccccccccccccccccccccccccYYY', // 23
    'YccccccccccccccccccccccccccccccccYYY', // 24
    'YccccccccccccccccccccccccccccccccYYY', // 25
    'YYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYY', // 26
    'YYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYY', // 27
  ],

  spawnPoints: {
    fromAerie: { x: 1, y: 21, facing: 'right' },
    default: { x: 1, y: 21, facing: 'right' },
    fromCore: { x: 34, y: 21, facing: 'left' },
  },

  exits: [
    { x: 0, y: 21, to: 'aerie', spawn: 'fromHollow' },
    { x: 0, y: 22, to: 'aerie', spawn: 'fromHollow' },
    { x: 35, y: 21, to: 'convergenceCore', spawn: 'fromWorks' },
    { x: 35, y: 22, to: 'convergenceCore', spawn: 'fromWorks' },
  ],

  npcs: [
    {
      // Kestrel got in first, and reads the objective out. Not a battle.
      id: 'kestrelHollow',
      name: 'Kestrel',
      x: 2,
      y: 19,
      facing: 'right',
      sprite: 'rival',
      movement: 'static',
      presentWhen: 'aerieOpen',
      absentWhen: 'convergenceStopped',
      dialogue: [
        {
          pages: [
            'You made it up. Good. I have been sitting in this hall for an hour, watching.',
            'Three banks of cells — earth in the west wing, sea past the chasm, storm at the far end. Surveys 14, 15 and 16. Every cell the Vane ever filled.',
            'And that door at the end of the walkway will not open while a single bank is primed. Their own board says so: a safety interlock.',
            'So vent all three, and the door opens. I tried the west wing. Their Foreman sent me back out with my Gustwing in my arms.',
            'You go. I will watch the door behind you. ...For the record, I am not saying you are better than me. I am saying you are rested.',
          ],
        },
      ],
    },
    {
      id: 'vaneOdile',
      name: 'Odile',
      trainer: 'vaneOdile',
      sightRange: 3,
      x: 9,
      y: 19,
      facing: 'down',
      sprite: 'vane',
      movement: 'static',
      dialogue: [
        {
          when: 'trainer:vaneOdile',
          pages: ['The banks are in the wings. You will not get past the Foremen. Nobody has.'],
        },
        { action: 'trainer:vaneOdile', pages: TRAINERS.vaneOdile.intro },
      ],
    },
    {
      // THE EARTH BANK. On the only open tile in front of its valve.
      id: 'vaneVosslerHollow',
      name: 'Vossler',
      trainer: 'vaneVosslerHollow',
      sightRange: 3,
      x: 5,
      y: 10,
      facing: 'down',
      sprite: 'vaneForeman',
      movement: 'static',
      absentWhen: 'trainer:vaneVosslerHollow',
      exitAfterDefeat: { direction: 'right', steps: 4 },
      dialogue: [
        { action: 'trainer:vaneVosslerHollow', pages: TRAINERS.vaneVosslerHollow.intro },
      ],
    },
    {
      // THE SEA BANK.
      id: 'vaneBrack',
      name: 'Brack',
      trainer: 'vaneBrack',
      sightRange: 3,
      x: 5,
      y: 2,
      facing: 'down',
      sprite: 'vaneForeman',
      movement: 'static',
      absentWhen: 'trainer:vaneBrack',
      exitAfterDefeat: { direction: 'right', steps: 4 },
      dialogue: [
        { action: 'trainer:vaneBrack', pages: TRAINERS.vaneBrack.intro },
      ],
    },
    {
      // THE STORM BANK.
      id: 'vaneCraleHollow',
      name: 'Crale',
      trainer: 'vaneCraleHollow',
      sightRange: 3,
      x: 29,
      y: 2,
      facing: 'down',
      sprite: 'vaneForeman',
      movement: 'static',
      absentWhen: 'trainer:vaneCraleHollow',
      exitAfterDefeat: { direction: 'left', steps: 4 },
      dialogue: [
        { action: 'trainer:vaneCraleHollow', pages: TRAINERS.vaneCraleHollow.intro },
      ],
    },
    {
      // The last guard before the core door.
      id: 'vaneRusk',
      name: 'Rusk',
      trainer: 'vaneRusk',
      sightRange: 3,
      x: 31,
      y: 19,
      facing: 'down',
      sprite: 'vane',
      movement: 'static',
      dialogue: [
        {
          when: 'convergenceStopped',
          pages: ['The Director shut it down? ...Then I suppose I am out of a job. Good.'],
        },
        {
          when: 'trainer:vaneRusk',
          pages: ['The door will not open for you while a bank is primed. I did not design it. I only guard it.'],
        },
        { action: 'trainer:vaneRusk', pages: TRAINERS.vaneRusk.intro },
      ],
    },
    {
      // Once it is over: the Circle in the Works.
      id: 'worksWarden',
      name: 'Warden Corran',
      x: 3,
      y: 24,
      facing: 'up',
      sprite: 'warden',
      movement: 'static',
      presentWhen: 'convergenceStopped',
      dialogue: [
        {
          pages: [
            'Corran — we met at the Mistvault cordon, a lifetime ago. The Circle sent everyone up.',
            'We will take the banks apart one cell at a time and carry every drop back where it came from. It will take all winter.',
          ],
        },
      ],
    },
  ],

  interactables: [
    {
      // Environmental story: why.
      x: 10,
      y: 18,
      type: 'sign',
      dialogue: [
        'A memo pinned to a Vane board: FROM THE DIRECTOR, TO ALL WORKS STAFF.',
        '"Sixteen surveys. Four years. One Convergence. When the prime is complete, the valley\'s currents will meet here and not at the Wellspring — and go out through our lines, at a fair price, every hour of every day."',
        '"No more dark months. No more wasted storms. Remember why we are here."  It is signed: THALE, DIRECTOR.',
      ],
    },
    {
      // The objective, in the Vane's own words.
      x: 24,
      y: 19,
      type: 'sign',
      dialogue: [
        {
          when: 'convergenceStopped',
          pages: ['The prime board: ENGINE — SHUT DOWN. Someone has written underneath, in a careful hand: "By the Director. Do not restart."'],
        },
        {
          pages: [
            'CONVERGENCE — PRIME BOARD.  EARTH BANK (SURVEY 14): 40 cells.  SEA BANK (SURVEY 15): 40 cells.  STORM BANK (SURVEY 16): 40 cells.',
            'SAFETY INTERLOCK: the core door opens only while ALL THREE banks are vented. Never enter the core with a bank primed.',
          ],
        },
      ],
    },
    {
      x: 17,
      y: 18,
      type: 'sign',
      dialogue: [
        'The manifold. Three great pipes come in — from the west wing, the north-west and the north-east — and one goes out, east, through the core door.',
      ],
    },
    {
      x: 3,
      y: 11,
      type: 'sign',
      dialogue: ['EARTH BANK — SURVEY 14, MISTVAULT. Forty cells, warm to the touch, humming like a hive.'],
    },
    {
      x: 3,
      y: 3,
      type: 'sign',
      dialogue: ['SEA BANK — SURVEY 15, TIDEWATCH HARBOR. Forty cells. Inside each one, something sloshes like a tide.'],
    },
    {
      x: 31,
      y: 3,
      type: 'sign',
      dialogue: ['STORM BANK — SURVEY 16, STORMRISE. Forty cells. The hair on your arms stands up just looking at them.'],
    },
    { x: 33, y: 11, type: 'item', item: 'mendersDraught', quantity: 1, flag: 'pickedUpHollowDraught' },
    { x: 1, y: 6, type: 'item', item: 'clearTonic', quantity: 1, flag: 'pickedUpHollowTonic' },
  ],
};
