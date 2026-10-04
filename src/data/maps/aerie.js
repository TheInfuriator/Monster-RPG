/**
 * aerie.js — the Aerie
 * ----------------------------------------------------------------------------
 * The top of the valley (Phase 14): a snow plateau above Voltspire where the
 * Warden Circle meets, and where the valley's three currents — the earth's,
 * the sea's and the storm's — rise together at the Wellspring. The words on
 * the Stormrise cairn were about this place: WHERE THE THREE CURRENTS RISE,
 * THE SKY ANSWERS.
 *
 * WHAT IS HERE
 *   the Wellspring    the landmark, in the middle of the flagstones: low and
 *                     dim while the Hollow Vane draw on it, bright once the
 *                     Convergence is stopped (a `glows` picture on the flag)
 *   the Circle Hall   north, at the top of the Circle's Walk: the Trial. A
 *                     barred gate across the top of the Walk opens once Kestrel has had
 *                     their last word (`trainer:kestrelAerie`) — and Kestrel
 *                     is only here once the Convergence is stopped, so the
 *                     Trial can never come before the Hollow
 *   the Aerie Lodge   west: a Mender, a shop counter and a storage terminal —
 *                     the last place to rest before the Trial
 *   the Hollow        east, a cave mouth in the rock with the Vane's cables
 *                     running into it: the Works, and the Convergence
 *
 * THE CIRCLE'S WALK (rows 7-10) is a corridor of standing stones, two tiles
 * wide, from the flagstones to the Hall doors. Kestrel waits in a niche off
 * it (16,9), watching both tiles of the row in front of them, so nobody
 * reaches the doors without meeting them.
 *
 * WEATHER: a still mist while the Wellspring is low; snow on a clean wind
 * once it runs high again.
 *
 *   5  snow   8  flagstones   4  the Wellspring   a  slate roof   W  wall
 *   w  window   D  door   0  copper roof   :  lamp   @  standing stone
 *   $  marker stone   z  Vane cables   c  cave floor   X  cave mouth
 *   G  the gate across the top of the Walk (a barrier, not written in the grid)
 */

import { TRAINERS } from '../trainers.js';

/** The Wellspring's tiles: drawn bright once the Convergence is stopped. */
const WELLSPRING = [];
for (let y = 14; y <= 17; y += 1) {
  for (let x = 15; x <= 20; x += 1) WELLSPRING.push([x, y]);
}

export const aerie = {
  id: 'aerie',
  name: 'The Aerie',
  music: 'town',
  weather: [
    { when: 'convergenceStopped', kind: 'snow', amount: 1 },
    { kind: 'mist', amount: 2 },
  ],

  barriers: [
    {
      // The Trial opens once the last rival meeting is over — and that
      // meeting only happens once the Convergence is stopped.
      id: 'trialDoors',
      name: 'the Circle Hall doors',
      tile: 'G',
      tiles: [[17, 7], [18, 7]],
      closed: true,
      openWhen: 'trainer:kestrelAerie',
    },
  ],

  glows: [
    { when: 'convergenceStopped', tile: '}', tiles: WELLSPRING },
  ],

  tiles: [
    // 0         1         2         3
    // 012345678901234567890123456789012345
    '%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%', //  0
    '%%%%%%%%%%aaaaaaaaaaaaaaaa%%%%%%%%%%', //  1  THE CIRCLE HALL (10..25, 1..6)
    '%%55555555aaaaaaaaaaaaaaaa55555555%%', //  2
    '%%5@555555aaaaaaaaaaaaaaaa555555@5%%', //  3
    '%%55555555aaaaaaaaaaaaaaaa55555555%%', //  4
    '%%55555555WWwWWwWWWWwWWwWW55555555%%', //  5
    '%%55555555WWWWWWWDDWWWWWWW55555555%%', //  6  its doors (17,6),(18,6)
    '%%55555555555555@88@55555555555555%%', //  7  the Circle's Walk, standing stones either side; a gate (17..18, 7) until the Trial is open
    '%%55555555555555@88@55555555555555%%', //  8
    '%%5555555555555@888@55555555555555%%', //  9  Kestrel's niche (16,9) — the final rival meeting
    '%%55555555555555@88@55555555555555%%', // 10
    '%%500000000555:558855:555555555555%%', // 11  the Aerie Lodge (3..10, 11..15); the Trial Steward at (20,11)
    '%%5000000005888888888888555555$555%%', // 12  the Hollow notice (30,12)
    '%%5000000005888888888888555555555%XX', // 13
    '%%5WWwWWwWW5888444444888555555555ccc', // 14  THE WELLSPRING (15..20, 14..17); east: the Hollow (exits 35,14 and 35,15)
    '%%5WWWDWWWW588844444488855555555zccc', // 15  the Lodge's door (6,15)
    '%%555588888888844444488855555555z%XX', // 16
    '%%555555555588844444488855555555z5%%', // 17
    '%%555555555588888$88888855555555z5%%', // 18  the Wellspring's marker stone (17,18)
    '%%555555555588888888888855555555z5%%', // 19  Warden Oriel at (13,19)
    '%%555555555588888888888855555555z5%%', // 20
    '%%555555555555555885555555555555z5%%', // 21
    '%%55555555555555588zzzzzzzzzzzzzz5%%', // 22  the Vane cable run, road to Hollow
    '%%55555555555555588z55555555555555%%', // 23
    '%%55555555555555588z55555555555555%%', // 24
    '%%55@55555555555588z555555555@5555%%', // 25
    '%%55555555555555588z55555555555555%%', // 26
    '%%55555555555555$88555555555555555%%', // 27  the Aerie sign (16,27)
    '%%%%%%%%%%%%%%%%%88%%%%%%%%%%%%%%%%%', // 28
    '%%%%%%%%%%%%%%%%%--%%%%%%%%%%%%%%%%%', // 29  south exit down the Aerie Road
  ],

  spawnPoints: {
    fromAerieRoad: { x: 17, y: 28, facing: 'up' },
    default: { x: 17, y: 28, facing: 'up' },
    fromLodge: { x: 6, y: 16, facing: 'down' },
    fromHollow: { x: 34, y: 14, facing: 'left' },
    fromCircleHall: { x: 17, y: 8, facing: 'down' },
    // Where the story leaves the player once the credits have rolled: just
    // outside the Circle Hall, free to go anywhere.
    afterCredits: { x: 17, y: 8, facing: 'down' },
  },

  exits: [
    { x: 17, y: 29, to: 'aerieRoad', spawn: 'fromAerie' },
    { x: 18, y: 29, to: 'aerieRoad', spawn: 'fromAerie' },
    { x: 6, y: 15, to: 'aerieLodge', spawn: 'default' },
    { x: 35, y: 14, to: 'hollowWorks', spawn: 'fromAerie' },
    { x: 35, y: 15, to: 'hollowWorks', spawn: 'fromAerie' },
    { x: 17, y: 6, to: 'circleHall', spawn: 'default' },
    { x: 18, y: 6, to: 'circleHall', spawn: 'default' },
  ],

  npcs: [
    {
      // THE RIVAL — the fifth and last meeting. In a niche off the Circle's
      // Walk, once the Convergence is stopped; back to the niche afterwards.
      id: 'kestrelAerie',
      name: 'Kestrel',
      trainer: 'kestrelAerie',
      sightRange: 2,
      x: 16,
      y: 9,
      facing: 'right',
      sprite: 'rival',
      movement: 'static',
      presentWhen: 'convergenceStopped',
      returnAfterDefeat: true,
      dialogue: [
        {
          when: 'storyComplete',
          pages: [
            'Champion. Say it slower. ...No, I mean it. It suits you.',
            'I am going back down the valley. Ashby says there were thirteen surveys before Mistvault — thirteen places the Vane drove stakes in.',
            'Somebody should go and pull them up. I think I would like it to be me. Come and find me, if you are ever bored.',
          ],
        },
        {
          when: 'trainer:kestrelAerie',
          pages: [
            'Go on. The Circle is waiting, and I want a good seat.',
            'And if the Champion beats you — and they might — the Lodge is right there. Come back and try again. That is what I always did.',
          ],
        },
        ...TRAINERS.kestrelAerie.intro.map((branch) => ({
          ...branch,
          action: 'trainer:kestrelAerie',
        })),
      ],
    },
    {
      // The Trial's rules, said once, plainly.
      id: 'trialSteward',
      name: 'Steward Aurel',
      x: 20,
      y: 11,
      facing: 'down',
      sprite: 'warden',
      movement: 'static',
      dialogue: [
        {
          when: 'storyComplete',
          pages: [
            'Champion. The Circle Hall is yours to walk in whenever you like. The Wardens will want to see your team again.',
          ],
        },
        {
          when: 'trainer:kestrelAerie',
          pages: [
            'The Circle\'s Trial. Three Wardens of the Circle — the earth, the sea and the sky — and then the Champion.',
            'One at a time, in order. There is no Mender inside, but your Bag is your own, and the doors behind you never lock.',
            'A Warden you beat stays beaten. Lose, and you wake at the last Mender you rested with — the Lodge, if you are wise.',
          ],
        },
        {
          when: 'convergenceStopped',
          pages: [
            'The Wellspring is running! Then the Trial is open again — or it will be, once your friend on the Walk has had their say.',
          ],
        },
        {
          pages: [
            'The Circle Hall. The Trial is held inside: three Wardens of the Circle, then the Champion.',
            'But the doors stay barred while the Wellspring fails. The Circle will not hold a Trial on top of whatever the Vane are doing down there.',
          ],
        },
      ],
    },
    {
      id: 'wellspringWarden',
      name: 'Warden Oriel',
      x: 13,
      y: 19,
      facing: 'right',
      sprite: 'warden',
      movement: 'static',
      dialogue: [
        {
          when: 'storyComplete',
          pages: [
            'I have watched the Wellspring for twenty years. I never saw it this bright. I think it is glad.',
          ],
        },
        {
          when: 'convergenceStopped',
          pages: [
            'Look at it! The earth\'s current, the sea\'s and the storm\'s, all rising together. Exactly as the old stones say.',
            'Every spring in the valley drinks from this one. You will hear it in Tidewatch\'s tide by tonight.',
          ],
        },
        {
          pages: [
            'The Wellspring. Every current in the valley rises here — the earth\'s, the sea\'s, the storm\'s — before it goes back down to the springs and the storms.',
            'It has been falling for a month. Today it is barely moving.',
            'The Vane are under it. Their cables run into the Hollow, east — the old cave beneath the Aerie. Whatever they are building, it is drinking the Wellspring dry.',
          ],
        },
      ],
    },
    {
      id: 'hollowWarden',
      name: 'Warden Dace',
      x: 31,
      y: 13,
      facing: 'down',
      sprite: 'warden',
      movement: 'static',
      dialogue: [
        {
          when: 'convergenceStopped',
          pages: [
            'The Vane walked out of the Hollow an hour ago, one by one, with their hands in their pockets. Not one of them looked back.',
            'The Circle will take the Works apart, cell by cell, and pour every drop back where it came from.',
          ],
        },
        {
          pages: [
            'The Hollow. The Vane bored their Works into it a month ago — bought the old mining rights, all stamped and legal.',
            'The Circle sent four Wardens in at dawn. Four came out at noon, carried by their Aethers. The Vane have brought everyone they have.',
            'There is a Mender in the Lodge, west. Go in rested.',
          ],
        },
      ],
    },
    {
      // Only once the story is complete: the Professor has come all the way
      // up from Emberhollow.
      id: 'wickAerie',
      name: 'Prof. Wick',
      x: 14,
      y: 21,
      facing: 'up',
      sprite: 'researcher',
      movement: 'static',
      presentWhen: 'storyComplete',
      dialogue: [
        {
          pages: [
            'There you are! I came up the moment the news reached Emberhollow. All that way — my knees will never forgive you.',
            'Champion of the Warden Circle. And it started with one Aether from my Lodge.',
            'Go wherever you like now. The valley is a little safer, and a great deal brighter, for you.',
          ],
        },
      ],
    },
  ],

  interactables: [
    {
      // THE LANDMARK.
      x: 17,
      y: 18,
      type: 'sign',
      dialogue: [
        {
          when: 'convergenceStopped',
          pages: [
            'The Wellspring\'s marker stone. Behind it the water stands high and bright — amber, blue and white, rising together.',
            'Words are cut into the stone: WHERE THE THREE CURRENTS RISE, THE SKY ANSWERS.',
          ],
        },
        {
          pages: [
            'The Wellspring\'s marker stone. Behind it the water lies low and dark. Three faint colours stir at the bottom, barely moving.',
            'Words are cut into the stone: WHERE THE THREE CURRENTS RISE, THE SKY ANSWERS.',
          ],
        },
      ],
    },
    {
      x: 16,
      y: 27,
      type: 'sign',
      dialogue: [
        'THE AERIE — seat of the Warden Circle.',
        'North: the Circle Hall.  West: the Aerie Lodge.  South: the Aerie Road.',
      ],
    },
    {
      x: 30,
      y: 12,
      type: 'sign',
      dialogue: [
        {
          when: 'convergenceStopped',
          pages: ['A Hollow Vane notice. Someone has torn it half away; only the ring is left, and the word WORKS.'],
        },
        {
          pages: [
            'A Hollow Vane notice, bolted to the rock: THE WORKS. Authorised staff only.',
            'Below it, smaller: CONVERGENCE — PRIME IN PROGRESS. Do not enter the core while any bank is primed.',
          ],
        },
      ],
    },
  ],
};
