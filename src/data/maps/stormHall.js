/**
 * stormHall.js — The Storm Hall, Voltspire City
 * ----------------------------------------------------------------------------
 * The region's third Beacon Hall (Phase 13): a copper hall of wired coils,
 * three chambers stacked one above another, with Leader Halcyon on the dais
 * at the top.
 *
 *   O  floor   ]  grating   {  a coil   d  wire (lit while its circuit holds)
 *   S  the pattern plate   P  plant   _ | I  the Hall's walls and windows
 *   M  door mat   !  a chamber gate (a barrier, not written in the grid)
 *
 * THE PUZZLE — wired coils
 * Each chamber has a few coils, and the coils are WIRED TOGETHER: touch one
 * and it flips (dark to lit, or lit to dark) — and so does every coil wired to
 * it (PuzzleSystem's `toggles`). A chamber's gate opens while its CIRCUIT is
 * complete — a `circuits` entry that holds only while every coil it needs is
 * in the right state:
 *
 *   chamber 1  three coils in a row, each wired to its neighbours.
 *              Starts dark-LIT-dark; the gate wants all three lit.
 *   chamber 2  four in a row, wired the same way.
 *              Starts LIT-dark-LIT-dark; the gate wants all four lit.
 *   chamber 3  four in a square, each wired to the two beside it.
 *              The gate wants the pattern on the plate: two lit, on the
 *              diagonal — not simply "all lit".
 *
 * Touch the coil in the middle of chamber 1 and the two either side go out
 * with it: the naive answer is wrong, and that is the lesson. That is the
 * difference from the game's other puzzles: the Verdant Hall's coils each
 * swap two particular hedges, Mistvault's valves route one current, the Tidal
 * Hall has ONE shared tide — here every press changes several things at once,
 * and the order does not matter, only which coils you touch.
 *
 * Each coil's starting state is its FIRST position, so a coil that starts lit
 * lists 'lit' first; `art` keeps the picture right either way.
 *
 * WHY THE PLAYER CAN NEVER BE TRAPPED
 * Touching a coil twice undoes it, so every pattern can always be walked back.
 * No coil stands beside a gate, every chamber's coils are inside that chamber,
 * and a gate only follows its own chamber's coils — so nothing the player
 * does on one side of a gate can shut it while they are on the other.
 * `tests/stormHall.test.js` proves it over every coil pattern and every place
 * to stand, and that every chamber can be solved from where it starts.
 *
 * Once the Storm Sigil is won the gates stay open (`openWhen`), whatever the
 * coils say: Halcyon leaves the Hall open for a Sigil-holder.
 */

import { TRAINERS } from '../trainers.js';

/** A coil: two positions, wired to `toggles`, starting in `first`. */
function coil(id, x, y, first, toggles) {
  return {
    id,
    name: 'a coil',
    x,
    y,
    look: 'coil',
    positions: first === 'lit' ? ['lit', 'dark'] : ['dark', 'lit'],
    art: { dark: 0, lit: 1 },
    toggles,
    says: {
      lit: 'The coil crackles awake — and the coils wired to it flip with it.',
      dark: 'The coil fizzles out — and the coils wired to it flip with it.',
    },
  };
}

export const stormHall = {
  id: 'stormHall',
  name: 'The Storm Hall',
  interior: true,
  objectBase: 'O',
  music: 'town',

  tiles: [
    // 0         1         2
    // 012345678901234567890
    '_____________________', //  0
    '_I_____I_____I_____I_', //  1
    '|||||||||||||||||||||', //  2
    '_P]]]]]]]]]]]]]]]]]P_', //  3  Leader Halcyon at (10,3)
    '_]]]]]]]]]]]]]]]]]]]_', //  4  Stormwright Ines at (14,4), watching the top of the stair
    '_]]]]ddddd]ddddd]]]]_', //  5  the dais wire: lights when the whole Hall is lit
    '__________]__________', //  6  GATE 3 (10,6): opens on circuit "room3"
    '_OOSOOOOOOdOOOOOOOOO_', //  7  the pattern plate (3,7)
    '_OOOOOOOOOdddd{{OOOO_', //  8  room 3: four coils in a square (14..15, 8..9); Fenn at (4,8)
    '_OOOOOOOOOOOOO{{OOOO_', //  9
    '_OOOOOOOOOOOOOOOOOOO_', // 10
    '____O________________', // 11  GATE 2 (4,11): opens on circuit "room2"
    '_OOOdOOOOOOOOOOOOOOO_', // 12
    '_OOOddd{OO{OO{OO{OOO_', // 13  room 2: four coils in a row at x 7, 10, 13, 16
    '_OOOOOOOOOOOOOOOOOOO_', // 14
    '_OOOOOOOOOOOOOOOOOOO_', // 15  Stormwright Ada at (17,15), beside gate 1
    '________________O____', // 16  GATE 1 (16,16): opens on circuit "room1"
    '_OOOOOOOOOOOOOOOdOOO_', // 17
    '_OOOOOOOOOOOOOOOdOOO_', // 18
    '_OOOO{OO{OO{dddddOOO_', // 19  room 1: three coils in a row at x 5, 8, 11
    '_OOOOOOOOOOOOOOOOOOO_', // 20
    '_OOOOOOOOOOOOOOOOOOO_', // 21  Coilwright Ottilie at (7,21)
    '_POOOOOOOOMOOOOOOOOP_', // 22  the way out (10,22)
    '_____________________', // 23
  ],

  levers: [
    // Chamber 1: a row of three. dark-LIT-dark.
    coil('r1a', 5, 19, 'dark', ['r1b']),
    coil('r1b', 8, 19, 'lit', ['r1a', 'r1c']),
    coil('r1c', 11, 19, 'dark', ['r1b']),
    // Chamber 2: a row of four. LIT-dark-LIT-dark.
    coil('r2a', 7, 13, 'lit', ['r2b']),
    coil('r2b', 10, 13, 'dark', ['r2a', 'r2c']),
    coil('r2c', 13, 13, 'lit', ['r2b', 'r2d']),
    coil('r2d', 16, 13, 'dark', ['r2c']),
    // Chamber 3: a square. a b / c d — each wired to the two beside it.
    coil('r3a', 14, 8, 'lit', ['r3b', 'r3c']),
    coil('r3b', 15, 8, 'lit', ['r3a', 'r3d']),
    coil('r3c', 14, 9, 'dark', ['r3a', 'r3d']),
    coil('r3d', 15, 9, 'lit', ['r3b', 'r3c']),
  ],

  circuits: [
    { id: 'room1', needs: ['r1a:lit', 'r1b:lit', 'r1c:lit'] },
    { id: 'room2', needs: ['r2a:lit', 'r2b:lit', 'r2c:lit', 'r2d:lit'] },
    // The plate's pattern: lit on the diagonal.
    { id: 'room3', needs: ['r3a:lit', 'r3b:dark', 'r3c:dark', 'r3d:lit'] },
    // All three at once: the dais lights up.
    { id: 'hall', needs: ['circuit:room1', 'circuit:room2', 'circuit:room3'] },
  ],

  barriers: [
    {
      id: 'gate1', name: 'the first gate', tile: '!', tiles: [[16, 16]],
      closed: true, openWhenSignal: 'circuit:room1', openWhen: 'badge:stormSigil',
    },
    {
      id: 'gate2', name: 'the second gate', tile: '!', tiles: [[4, 11]],
      closed: true, openWhenSignal: 'circuit:room2', openWhen: 'badge:stormSigil',
    },
    {
      id: 'gate3', name: 'the third gate', tile: '!', tiles: [[10, 6]],
      closed: true, openWhenSignal: 'circuit:room3', openWhen: 'badge:stormSigil',
    },
  ],

  /** Each chamber's wire lights while its circuit holds; the dais's while all do. */
  glows: [
    { signal: 'circuit:room1', tile: '<', tiles: [[12, 19], [13, 19], [14, 19], [15, 19], [16, 19], [16, 18], [16, 17]] },
    { signal: 'circuit:room2', tile: '<', tiles: [[6, 13], [5, 13], [4, 13], [4, 12]] },
    { signal: 'circuit:room3', tile: '<', tiles: [[13, 8], [12, 8], [11, 8], [10, 8], [10, 7]] },
    { signal: 'circuit:hall', tile: '<', tiles: [[5, 5], [6, 5], [7, 5], [8, 5], [9, 5], [11, 5], [12, 5], [13, 5], [14, 5], [15, 5]] },
  ],

  spawnPoints: {
    default: { x: 10, y: 21, facing: 'up' },
  },

  exits: [{ x: 10, y: 22, to: 'voltspire', spawn: 'fromStormHall' }],

  npcs: [
    {
      // The Hall's guide. Says the rule plainly, once — the rest is the puzzle.
      id: 'stormHallGuide',
      name: 'Coilwright Ottilie',
      x: 7,
      y: 21,
      facing: 'right',
      sprite: 'researcher',
      movement: 'static',
      dialogue: [
        {
          when: 'badge:stormSigil',
          pages: ['The gates stay open for you now. Play with the coils all you like — Halcyon would.'],
        },
        {
          pages: [
            'Welcome to the Storm Hall. Every gate here opens when its chamber\'s coils make a complete circuit.',
            'But the coils are wired together. Touch one, and every coil wired to it flips too — lit goes dark, dark goes lit.',
            'Touch the same coil twice and you are back where you started. Nothing here can trap you. Think before you touch.',
          ],
        },
      ],
    },
    {
      id: 'stormHallAda',
      name: 'Ada',
      trainer: 'stormHallAda',
      sightRange: 2,
      x: 17,
      y: 15,
      facing: 'left',
      sprite: 'villager',
      movement: 'static',
      dialogue: [
        {
          when: 'trainer:stormHallAda',
          pages: ['Four in a row, now. The ends only have one neighbour each — that is your way in.'],
        },
        { action: 'trainer:stormHallAda', pages: TRAINERS.stormHallAda.intro },
      ],
    },
    {
      id: 'stormHallFenn',
      name: 'Fenn',
      trainer: 'stormHallFenn',
      sightRange: 2,
      x: 4,
      y: 8,
      facing: 'down',
      sprite: 'villagerAlt',
      movement: 'static',
      dialogue: [
        {
          when: 'trainer:stormHallFenn',
          pages: ['The plate wants two lit, on the diagonal. Not all four. Read it twice.'],
        },
        { action: 'trainer:stormHallFenn', pages: TRAINERS.stormHallFenn.intro },
      ],
    },
    {
      id: 'stormHallInes',
      name: 'Ines',
      trainer: 'stormHallInes',
      sightRange: 4,
      x: 14,
      y: 4,
      facing: 'left',
      sprite: 'villager',
      movement: 'static',
      dialogue: [
        {
          when: 'trainer:stormHallInes',
          pages: ['Halcyon is waiting. Do not keep a storm waiting.'],
        },
        { action: 'trainer:stormHallInes', pages: TRAINERS.stormHallInes.intro },
      ],
    },
    {
      // THE LEADER. An ordinary trainer with a badge, like Fern and Ondine.
      id: 'stormLeaderHalcyon',
      name: 'Halcyon',
      trainer: 'stormLeaderHalcyon',
      sightRange: 1,
      x: 10,
      y: 3,
      facing: 'down',
      sprite: 'elder',
      movement: 'static',
      dialogue: [
        {
          when: 'trainer:stormLeaderHalcyon',
          pages: [
            'Three Sigils. Every Leader in the valley has now said the same thing about you.',
            'Crale\'s cells went up the Aerie road before the Wardens shut the gate. I have told the Circle. They are coming.',
            'When that gate opens, the Champion will be waiting — and, I think, the Vane. Be ready for both.',
          ],
        },
        { action: 'trainer:stormLeaderHalcyon', pages: TRAINERS.stormLeaderHalcyon.intro },
      ],
    },
  ],

  interactables: [
    {
      // The pattern plate: chamber 3's answer, in plain sight.
      x: 3,
      y: 7,
      type: 'sign',
      dialogue: [
        'A copper plate, etched with four circles in a square. Two are filled in: top-left and bottom-right.',
        'Under it: THE STORM CREST. AS ABOVE, SO BELOW.',
      ],
    },
  ],
};
