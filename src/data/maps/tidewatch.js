/**
 * tidewatch.js — Tidewatch Harbor
 * ----------------------------------------------------------------------------
 * The third town (Phase 12), out of the far end of Mistvault Cavern: a slate-
 * roofed fishing harbour between the cliffs and the sea, with the region's
 * second Beacon Hall standing on the waterfront.
 *
 *   ~  sea        s  sand         [  boardwalk      U  moored boat
 *   Z  lighthouse 9  its lamp     a  slate roof     W  wall   w  window  D  door
 *   -  road       .  grass        f  flowers        F  fence  S  sign    T  tree
 *   %  cliff      X  cave mouth   c  cave floor
 *   @  the rockslide on the Stormrise road (a barrier, not written in the grid)
 *
 * THE SHAPE
 * The road comes up out of the cave mouth in the south cliffs, past the beach,
 * into the harbour road along the middle of town. West: the Tidewatch light
 * on its point. Middle: the Mender's Hall (the third place a blackout can send
 * you) and the Supply Post. East: the waterfront boardwalk and two piers. North-
 * east: the Tidal Hall, its forecourt fenced so the only way to its door is up
 * the Hall road — where Kestrel is waiting. North: the Stormrise Climb, under a
 * rockslide.
 *
 * THE ROCKSLIDE (Phase 12 -> Phase 13)
 * In Phase 12 the Stormrise road was buried under a rockslide, behind
 * `stormriseOpen`, a flag nothing set. Phase 13 lifts it the way Phase 12
 * lifted Mistvault's cordon: once the player holds the Tidal Sigil, Warden
 * Hale has the road cleared, and talking to them sets `stormriseOpen` — the
 * boulders roll aside while the player watches, and the game autosaves. A
 * Phase 12 save loads with the slide still down and Hale ready to say so.
 */

import { TRAINERS } from '../trainers.js';

export const tidewatch = {
  id: 'tidewatch',
  name: 'Tidewatch Harbor',
  music: 'town',

  /**
   * The rockslide on the Stormrise Climb. Lifted by one flag, set by Warden
   * Hale once the Tidal Sigil is won (Phase 13).
   */
  barriers: [
    {
      id: 'stormriseRockslide',
      name: 'the rockslide',
      tile: '@',
      tiles: [[17, 1], [18, 1]],
      closed: true,
      openWhen: 'stormriseOpen',
    },
  ],

  tiles: [
    // 0         1         2         3
    // 012345678901234567890123456789012345
    '%%%%%%%%%%%%%%%%%--%%%%%%%%%~~~~~~~~', //  0  the northern cliffs; north exit up the Stormrise Climb
    '%%%%%%%%%%%%%%%%%--%%%%%%%%%~~~~~~~~', //  1  THE ROCKSLIDE across the Stormrise road at (17..18, 1)
    '~~TTTTTTTTTTTTTT.--.TTTTTTTT~~~~~~~~', //  2  Warden Hale at (19,2)
    '~~%99ssss........--.aaaaaaaa~~~~~~~~', //  3  the Tidewatch light (3..4, 3..7); the Tidal Hall (20..27, 3..7)
    '~~%ZZssss........--.aaaaaaaa~~~~~~~~', //  4
    '~~%ZZssss........--.aaaaaaaa~~~~~~~~', //  5
    '~~%ZZssss........--.WwWWWWwW~~~~~~~~', //  6  the lighthouse keeper at (6,6)
    '~~%ZZssss........--.WwWDDWwW~~~~~~~~', //  7  the Hall's double door at (23,7),(24,7)
    '~~%ss----........--...F--F[[~~~~~~~~', //  8  the Hall road, fenced: Kestrel at (25,10) watches it
    '~~......-.......S--...F--S[[~~U~~~~~', //  9  signs: Stormrise (16,9), the Tidal Hall (25,9)
    '~~...aaaaa.aaaaa.--...F--.[[[[[[[[~~', // 10  Mender's Hall (5..9) and Supply Post (11..15); the north pier
    '~~...aaaaa.aaaaa.--...F--.[[~~~U~~~~', // 11
    '~~...WwDwW.WwDwW.--...F--.[[~~~~~~~~', // 12  their doors at (7,12) and (13,12)
    '~~....--------------------[[~~~~~~~~', // 13  the harbour road, three wide
    '~~....--------------------[[~~~~~~~~', // 14
    '~~....--------------------[[~~~~~~~~', // 15  the harbourmaster at (27,15)
    '~~ssssff.--.......fff.....[[~~~~~~~~', // 16
    '~~ssss...--.....FFFFFFF...[[~U~~~~~~', // 17  a little fenced garden
    '~~ssss...--.aaaa..........[[[[[[[[~~', // 18  the net-maker's cottage; the south pier, a fisher at its end (33,18)
    '~~ssss...--.aaaa..........[[~~U~U~~~', // 19
    '~~ssss...--.WwwW..........[[~~~~~~~~', // 20  Pip on the beach
    '~~ssss...--...............[[~~~~~~~~', // 21
    '~~ssss...--...............[[~~~~~~~~', // 22
    '~~ssss...--...............[[~~~~~~~~', // 23
    '~~ssss...--S..............[[~~~~~~~~', // 24  town sign (11,24); clear tonic on the beach (2,24)
    '%%%%%%%%XccX%%%%%%%%%%%%%%%%~~~~~~~~', // 25  the cave mouth: the road from Mistvault
    '%%%%%%%%XccX%%%%%%%%%%%%%%%%~~~~~~~~', // 26
    '%%%%%%%%%cc%%%%%%%%%%%%%%%%%~~~~~~~~', // 27  south exit to Mistvault Cavern
  ],

  spawnPoints: {
    // Up out of the cave mouth from the Tideward Grotto.
    fromMistvault: { x: 9, y: 26, facing: 'up' },
    default: { x: 9, y: 26, facing: 'up' },
    fromMendersHall: { x: 7, y: 13, facing: 'down' },
    fromSupplyPost: { x: 13, y: 13, facing: 'down' },
    fromTidalHall: { x: 23, y: 8, facing: 'down' },
    // Down off the Stormrise Climb, just below where the rockslide was.
    fromStormrise: { x: 17, y: 2, facing: 'down' },
  },

  exits: [
    { x: 9, y: 27, to: 'mistvaultCore', spawn: 'fromTidewatch' },
    { x: 10, y: 27, to: 'mistvaultCore', spawn: 'fromTidewatch' },
    { x: 7, y: 12, to: 'tidewatchMendersHall', spawn: 'default' },
    { x: 13, y: 12, to: 'tidewatchSupplyPost', spawn: 'default' },
    { x: 23, y: 7, to: 'tidalHall', spawn: 'default' },
    { x: 24, y: 7, to: 'tidalHall', spawn: 'default' },
    { x: 17, y: 0, to: 'stormriseLower', spawn: 'fromTidewatch' },
    { x: 18, y: 0, to: 'stormriseLower', spawn: 'fromTidewatch' },
  ],

  npcs: [
    {
      // THE RIVAL — third meeting. Beside the Hall road, which is fenced, so
      // nobody reaches the Tidal Hall without walking into Kestrel's sight.
      // Kestrel stays here afterwards, out of the road, for the rest of the
      // visit and beyond.
      id: 'kestrelHarbor',
      name: 'Kestrel',
      trainer: 'kestrelTidewatch',
      sightRange: 3,
      x: 25,
      y: 10,
      facing: 'left',
      sprite: 'rival',
      movement: 'static',
      presentWhen: 'trainer:kestrelRoute2',
      returnAfterDefeat: true,
      dialogue: [
        {
          when: 'stormriseOpen',
          pages: [
            'The Stormrise road is open! I KNEW Hale would dig it out for a Sigil-holder.',
            'Just let me take my turn with Ondine first. Then I am right behind you. Again.',
          ],
        },
        {
          when: 'badge:tidalSigil',
          pages: [
            'Two Sigils. Fine — I am going in next, and Ondine is not going to know what hit her.',
            'And when the Wardens dig out the Stormrise road, I am going first. Again.',
          ],
        },
        {
          when: 'trainer:kestrelTidewatch',
          pages: [
            'Three for three. I am starting to take it personally.',
            'The Hall floods and drains while you watch. Ondine likes people to work for it — good luck.',
          ],
        },
        ...TRAINERS.kestrelTidewatch.intro.map((branch) => ({
          ...branch,
          action: 'trainer:kestrelTidewatch',
        })),
      ],
    },
    {
      id: 'harbourmaster',
      name: 'Harbourmaster Brannoch',
      x: 27,
      y: 15,
      facing: 'left',
      sprite: 'elder',
      movement: 'static',
      dialogue: [
        {
          when: 'badge:tidalSigil',
          pages: [
            'A Tidal Sigil! Ondine does not hand those out to just anyone.',
            'Those grey coats on the north pier took a boat out at dawn. Heading up the coast, toward Stormrise. Good riddance — for now.',
          ],
        },
        {
          pages: [
            'Up through Mistvault? Nobody has come that way in a month. Then it was you who set the current running again.',
            'It had been running thin under the harbour, and the light dimmed with it. Last night — back, all at once.',
            'There is a Mender\'s Hall and a Supply Post on the harbour road. The Tidal Hall is north-east, up the Hall road.',
          ],
        },
      ],
    },
    {
      id: 'lighthouseKeeper',
      name: 'Keeper Marrow',
      x: 6,
      y: 6,
      facing: 'left',
      sprite: 'villagerAlt',
      movement: 'static',
      dialogue: [
        {
          when: 'badge:tidalSigil',
          pages: [
            'Two hundred years this light has burned on the harbour current. Thanks to you, another two hundred, maybe.',
          ],
        },
        {
          pages: [
            'The Tidewatch light. It burns on the aether current that runs under the harbour.',
            'A month back, grey coats came asking how much it draws. Wrote it all down. Never said why.',
            'Then the current thinned and the lamp went dim. I do not believe in coincidences.',
          ],
        },
      ],
    },
    {
      // The Hollow Vane are not finished: one is still here, surveying, and
      // says nothing useful. Gone — up the coast — once the Sigil is won.
      id: 'vaneHarbourSurveyor',
      name: 'Vane Surveyor',
      x: 33,
      y: 10,
      facing: 'right',
      sprite: 'vane',
      movement: 'static',
      absentWhen: 'badge:tidalSigil',
      dialogue: [
        {
          when: 'mistvaultSiphonStopped',
          pages: [
            'Survey 14 is closed, thanks to you. Nobody at the company is pleased.',
            'This is Survey 15. The harbour current. I am only measuring it. For now.',
          ],
        },
        {
          pages: ['Company business. Move along.'],
        },
      ],
    },
    {
      id: 'pierFisher',
      name: 'Ysolde',
      x: 33,
      y: 18,
      facing: 'down',
      sprite: 'villager',
      movement: 'static',
      dialogue: [
        {
          when: 'badge:tidalSigil',
          pages: ['Ondine says you read the tide like a local. High praise, from that one.'],
        },
        {
          pages: [
            'The Tidal Hall floods and drains on wheels, same as the harbour sluices. Ondine built it that way.',
            'Every wheel in there turns the SAME tide. High floods the low floors and floats the pontoons. Low does the opposite.',
            'And bring something that is not afraid of water. Grass, or a good jolt of lightning.',
          ],
        },
      ],
    },
    {
      id: 'beachChild',
      name: 'Pip',
      x: 3,
      y: 20,
      facing: 'down',
      sprite: 'child',
      movement: 'lookAround',
      dialogue: [
        {
          when: 'badge:tidalSigil',
          pages: ['You beat ONDINE? Show me the Sigil! ...It is just a shell. A really, really good shell.'],
        },
        {
          pages: [
            'The crabs here pinch! Barnaclaw, they are called. They glue themselves to the pier and wait.',
            'There are more in the Grotto, in the shallows. And little silver fish everywhere.',
          ],
        },
      ],
    },
    {
      // The Warden at the rockslide. Opens the Stormrise road for a holder of
      // the Tidal Sigil (Phase 13), then goes up the Climb themself once the
      // Vane's relay is grounded (they reappear on the Frost Shelf).
      id: 'stormriseWarden',
      name: 'Warden Hale',
      x: 19,
      y: 2,
      facing: 'left',
      sprite: 'warden',
      movement: 'static',
      absentWhen: 'stormriseRelayStopped',
      dialogue: [
        {
          when: 'stormriseOpen',
          pages: [
            'The road is clear all the way to the Frost Shelf. Past that, the Climb is in a strange temper — the sky has been dead still for a month.',
            'Some grey coats went up before the slide came down. If you meet them, mind yourself.',
          ],
        },
        {
          // PHASE 13: the rockslide comes down. Only for a Tidal Sigil-holder,
          // so it is earned — and it ends with the boulders rolling aside.
          when: 'badge:tidalSigil',
          setFlags: ['stormriseOpen'],
          pages: [
            'A Tidal Sigil! Then you are exactly who the Circle told me to wait for.',
            'We have had the slide shored up since the morning. Stand back — I will have the last of it moved.',
            'There. The Stormrise Climb, open. Voltspire City is at the top, and the Storm Hall with it. Go carefully.',
          ],
        },
        {
          pages: [
            'The Stormrise Climb — the road north to Voltspire City. Or it was, until the rockslide.',
            'The Wardens are clearing it. It will be a while. In the meantime, the Tidal Hall could use a challenger.',
          ],
        },
      ],
    },
  ],

  interactables: [
    {
      x: 11,
      y: 24,
      type: 'sign',
      dialogue: [
        'TIDEWATCH HARBOR',
        'North: the Stormrise Climb.  South: the cavern road through Mistvault.',
      ],
    },
    {
      x: 25,
      y: 9,
      type: 'sign',
      dialogue: [
        'THE TIDAL HALL — Beacon Hall of Tidewatch.  Leader: Ondine.',
        'The tide waits for no one. Neither does the Leader.',
      ],
    },
    {
      x: 16,
      y: 9,
      type: 'sign',
      dialogue: [
        {
          when: 'stormriseOpen',
          pages: [
            'THE STORMRISE CLIMB — to Voltspire City.',
            'OPEN. Mind the ledges, and the weather.',
          ],
        },
        {
          pages: [
            'THE STORMRISE CLIMB — to Voltspire City.',
            'CLOSED: rockslide. The Wardens are clearing the road.',
          ],
        },
      ],
    },
    {
      // The landmark.
      x: 4,
      y: 7,
      type: 'sign',
      dialogue: [
        {
          when: 'mistvaultSiphonStopped',
          pages: [
            'The Tidewatch light: a white tower on the harbour point, its lamp fed by the current running under the town.',
            'Even by day you can see the lamp glowing steadily at the top.',
          ],
        },
        {
          pages: ['The Tidewatch light: a white tower on the harbour point.'],
        },
      ],
    },

    { x: 2, y: 24, type: 'item', item: 'clearTonic', quantity: 1, flag: 'pickedUpTidewatchBeachTonic' },
  ],
};
