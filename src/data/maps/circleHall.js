/**
 * circleHall.js — the Circle Hall, the Aerie
 * ----------------------------------------------------------------------------
 * The championship (Phase 14): the Circle's Trial. Three Wardens of the
 * Circle — the earth, the sea and the sky — and then the Champion, each in a
 * chamber of their own, stacked from the doors to the top of the Hall.
 *
 * THE TRIAL'S RULES (the Steward says them, and GAME_DESIGN.md section 25)
 *   - One at a time, in order: each chamber's gate opens once the Warden in
 *     front of it is beaten (`openWhen: 'trainer:<id>'`), and stays open.
 *   - Healing: there is no Mender inside. The doors behind you never lock —
 *     the Aerie Lodge is a short walk away, between any two battles.
 *   - The Bag is yours, in battle and out; reorder the party as you like
 *     between battles.
 *   - A Warden you beat stays beaten. Lose to anyone and it is an ordinary
 *     blackout — you wake at the last Mender you rested with — and only that
 *     battle is waiting for you when you come back.
 *   - Saving works as it does everywhere; every battle autosaves after.
 *
 * Nothing about the Trial is stored except what any trainer leaves behind —
 * who has been beaten — so there is no attempt to lose, reset or corrupt.
 *
 * Beating the Champion sets `championshipWon` (the trainer record, once), and
 * the world plays the ending and the credits (WorldScene.startEnding).
 *
 *   O  floor   c  the earth chamber   )  the sea chamber   ]  the sky chamber
 *   8  the Champion's chamber   P  plant   _ | I  walls and windows
 *   M  door mat   G  a chamber gate (a barrier, not written in the grid)
 */

import { TRAINERS } from '../trainers.js';

/** A Trial Warden's map entry: spoken to, like a Leader, in front of their gate. */
function trialWarden(id, name, y, beatenLines) {
  return {
    id,
    name,
    trainer: id,
    x: 8,
    y,
    facing: 'down',
    sprite: 'warden',
    movement: 'static',
    dialogue: [
      { when: `trainer:${id}`, pages: beatenLines },
      { action: `trainer:${id}`, pages: TRAINERS[id].intro },
    ],
  };
}

export const circleHall = {
  id: 'circleHall',
  name: 'The Circle Hall',
  interior: true,
  objectBase: 'O',
  music: 'town',

  tiles: [
    // 0         1
    // 012345678901234567
    '__________________', //  0
    '_I______II______I_', //  1
    '||||||||||||||||||', //  2
    '_P88888888888888P_', //  3  THE CHAMPION'S CHAMBER: Champion Seren at (8,3)
    '_8888888888888888_', //  4
    '_8888888888888888_', //  5
    '________88________', //  6  GATE 3 (8,6),(9,6): opens once Warden Hale is beaten
    '_]]]]]]]]]]]]]]]]_', //  7  the sky chamber
    '_]]]]]]]]]]]]]]]]_', //  8  Warden Hale at (8,8)
    '_]]]]]]]]]]]]]]]]_', //  9
    '________88________', // 10  GATE 2 (8,10),(9,10): opens once Warden Isla is beaten
    '_))))))))))))))))_', // 11  the sea chamber
    '_))))))))))))))))_', // 12  Warden Isla at (8,12)
    '_))))))))))))))))_', // 13
    '________88________', // 14  GATE 1 (8,14),(9,14): opens once Warden Ashby is beaten
    '_cccccccccccccccc_', // 15  the earth chamber
    '_cccccccccccccccc_', // 16  Warden Ashby at (8,16)
    '_cccccccccccccccc_', // 17
    '________OO________', // 18  the archway (always open)
    '_OOOOOOOOOOOOOOOO_', // 19  the antechamber: Steward Ilka (4,19)
    '_OOOOOOOOOOOOOOOO_', // 20
    '_POOOOOOMMOOOOOOP_', // 21  the doors out (8,21),(9,21)
    '__________________', // 22
  ],

  barriers: [
    {
      id: 'earthGate', name: 'the earth chamber\'s gate', tile: 'G', tiles: [[8, 14], [9, 14]],
      closed: true, openWhen: 'trainer:circleAshby',
    },
    {
      id: 'seaGate', name: 'the sea chamber\'s gate', tile: 'G', tiles: [[8, 10], [9, 10]],
      closed: true, openWhen: 'trainer:circleIsla',
    },
    {
      id: 'skyGate', name: 'the sky chamber\'s gate', tile: 'G', tiles: [[8, 6], [9, 6]],
      closed: true, openWhen: 'trainer:circleHale',
    },
  ],

  spawnPoints: {
    default: { x: 8, y: 20, facing: 'up' },
  },

  exits: [
    { x: 8, y: 21, to: 'aerie', spawn: 'fromCircleHall' },
    { x: 9, y: 21, to: 'aerie', spawn: 'fromCircleHall' },
  ],

  npcs: [
    {
      id: 'hallSteward',
      name: 'Steward Ilka',
      x: 4,
      y: 19,
      facing: 'right',
      sprite: 'warden',
      movement: 'static',
      dialogue: [
        {
          when: 'storyComplete',
          pages: ['Champion. Your name is cut into the stone above the top chamber now. It will be there long after all of us.'],
        },
        {
          pages: [
            'Welcome to the Circle\'s Trial. Three Wardens of the Circle — the earth, the sea and the sky — and then the Champion.',
            'One at a time, in order. Each gate opens when the Warden before it is beaten, and stays open.',
            'There is no Mender in the Hall. Your Bag is your own, and the doors behind you never lock: the Lodge is a short walk away.',
            'A Warden you beat stays beaten. Lose, and you wake at the last Mender you rested with, and only that battle waits for you.',
          ],
        },
      ],
    },
    trialWarden('circleAshby', 'Warden Ashby', 16, [
      'Go on up. Isla is waiting, and the sea does not like to be kept waiting.',
    ]),
    trialWarden('circleIsla', 'Warden Isla', 12, [
      'The tide always comes back. So will I, next year. Go on — Hale is next.',
    ]),
    trialWarden('circleHale', 'Warden Hale', 8, [
      'You lifted my rockslide, grounded my relay and blew through my chamber. I am running out of things to guard.',
      'The Champion is through that gate. Good luck — you will not need much.',
    ]),
    {
      // THE CHAMPION.
      id: 'circleChampion',
      name: 'Champion Seren',
      trainer: 'circleChampion',
      x: 8,
      y: 3,
      facing: 'down',
      sprite: 'champion',
      movement: 'static',
      dialogue: [
        {
          when: 'trainer:circleChampion',
          pages: [
            'I held this chamber for eleven years. I am glad it was you who took it.',
            'Come back up whenever you like, Champion. The Aerie is yours as much as mine now.',
          ],
        },
        { action: 'trainer:circleChampion', pages: TRAINERS.circleChampion.intro },
      ],
    },
  ],

  interactables: [],
};
