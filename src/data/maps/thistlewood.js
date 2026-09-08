/**
 * thistlewood.js — Thistlewood
 * ----------------------------------------------------------------------------
 * The second town, and the end of the first-badge journey.
 *
 * An overgrown timber town half-swallowed by hedges, built around the Verdant
 * Hall. It has everything Emberhollow has — a Mender, a Supply Post, people
 * with opinions — plus the region's first Beacon Hall and a road north that is
 * not open yet.
 *
 *   .  ,  grass      -  path        f  flowers      h  hedge      p  planter
 *   T     tree       K  turf roof   k  timber wall  w  window     D  door
 *   R  r  roof       W  wall        F  fence        S  sign       ~  water
 *   G     the Thornway gate — drawn by the barrier below, not written in the grid
 *
 * THE ROADS
 * One road comes up from Route 1 in the south and runs to the Verdant Hall's
 * door. It crosses an east-west road that serves the Mender's Hall and the
 * Supply Post. A third road climbs north-east to the Thornway gate, which is
 * shut: Route 2 is a later phase, and a road that visibly stops at a gate is
 * more honest than an invisible wall.
 */

export const thistlewood = {
  id: 'thistlewood',
  name: 'Thistlewood',
  music: 'town',

  tiles: [
    // 0         1         2
    // 0123456789012345678901234567890
    'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTT', //  0
    'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTT', //  1
    'TTTTTTTTTTTTTTTTTTTTTTTTTT--TT', //  2  the Thornway, beyond the gate
    'TT........h.........h.FFFF--TT', //  3  THE THORNWAY GATE at (26,3),(27,3)
    'TT.........KKKKKKKK......S--TT', //  4  the Verdant Hall
    'TT.........KKKKKKKK.....h.--TT', //  5
    'TT.h.......kwkkkkwk.....h.--TT', //  6
    'TT.h.......kkkDDkkk.....h.--TT', //  7  the Hall's double door
    'TT.h.....hh..S--...hh...h.--TT', //  8
    'TT..rrrrr.....--....rrrrr.--TT', //  9  Mender's Hall / Supply Post
    'TT..RRRRR.....--....RRRRR.--TT', // 10
    'TT..WwDwW.....--....WwDwW.--TT', // 11  mender door x6, shop door x22
    'TT...f.f....p.--.p...f.f..--TT', // 12
    'TT..------------------------TT', // 13  the east-west road
    'TT......p.....--.....p......TT', // 14
    'TT..hhhh......--....hhhh....TT', // 15
    'TT..rrrrr.....--............TT', // 16  Nan Thistle's cottage
    'TT..RRRRR.....--............TT', // 17
    'TT..WwDwW.....--............TT', // 18
    'TT............--....s~~~s...TT', // 19
    'TT...,...hhh..--....s~~~s...TT', // 20
    'TT..,........S--....sssss...TT', // 21
    'TTTTTTTTTTTTTT--TTTTTTTTTTTTTT', // 22
    'TTTTTTTTTTTTTT--TTTTTTTTTTTTTT', // 23  south exit to Route 1
  ],

  /**
   * The Thornway gate.
   *
   * `openWhen: 'thornwayOpen'` is a flag NOTHING sets in this build, so the
   * gate is shut and the road behind it is visible but unreachable. That is
   * deliberate: Route 2 is a later phase, and the seam for opening it is
   * already here — one flag, no code.
   */
  barriers: [
    {
      id: 'thornwayGate',
      name: 'the Thornway gate',
      tile: 'G',
      tiles: [[26, 3], [27, 3]],
      closed: true,
      openWhen: 'thornwayOpen',
    },
  ],

  spawnPoints: {
    // Arriving from Route 1: just inside the southern treeline, facing north.
    fromRoute1: { x: 14, y: 22, facing: 'up' },
    default: { x: 14, y: 22, facing: 'up' },
    // Each building drops you on the tile outside its door, facing away.
    fromVerdantHall: { x: 14, y: 8, facing: 'down' },
    fromMendersHall: { x: 6, y: 12, facing: 'down' },
    fromSupplyPost: { x: 22, y: 12, facing: 'down' },
    fromCottage: { x: 6, y: 19, facing: 'down' },
  },

  exits: [
    { x: 14, y: 23, to: 'route1', spawn: 'fromThistlewood' },
    { x: 15, y: 23, to: 'route1', spawn: 'fromThistlewood' },
    { x: 14, y: 7, to: 'verdantHall', spawn: 'default' },
    { x: 15, y: 7, to: 'verdantHall', spawn: 'default' },
    { x: 6, y: 11, to: 'thistlewoodMendersHall', spawn: 'default' },
    { x: 22, y: 11, to: 'thistlewoodSupplyPost', spawn: 'default' },
    { x: 6, y: 18, to: 'thistlewoodCottage', spawn: 'default' },
  ],

  npcs: [
    {
      id: 'hedgeWeaver',
      name: 'Bryn',
      x: 10,
      y: 12,
      facing: 'right',
      sprite: 'elder',
      movement: 'lookAround',
      dialogue: [
        {
          when: 'badge:verdantSigil',
          pages: [
            'You beat her. I felt the hedges settle from out here.',
            'Weaving them is my trade and I still could not tell you how she does it.',
          ],
        },
        {
          pages: [
            'Everything in Thistlewood grows sideways. You get used to it.',
            'Fern weaves the Hall hedges herself. Nobody else is allowed to touch them.',
          ],
        },
      ],
    },
    {
      id: 'thistleTraveller',
      name: 'Mose',
      x: 18,
      y: 14,
      facing: 'left',
      sprite: 'villager',
      movement: 'static',
      dialogue: [
        {
          when: 'badge:verdantSigil',
          pages: [
            'Word travels fast in a small town. Congratulations, Warden.',
            'The Mender will still patch you up for nothing. Some things do not change.',
          ],
        },
        {
          pages: [
            'Grass everywhere in that Hall. Grass, grass and more grass.',
            'Something with wings would do well in there. Or something with a bit of fire in it.',
          ],
        },
      ],
    },
    {
      id: 'thistleKid',
      name: 'Linnet',
      x: 11,
      y: 19,
      facing: 'down',
      sprite: 'child',
      movement: 'wander',
      wanderRadius: 2,
      dialogue: [
        {
          pages: [
            'I am going to be a Gardener at the Hall when I am big enough.',
            'You have to know all the hedges by name. I know four already!',
          ],
        },
      ],
    },
    {
      id: 'hallWatcher',
      name: 'Hesper',
      x: 16,
      y: 8,
      facing: 'left',
      sprite: 'villagerAlt',
      movement: 'static',
      dialogue: [
        {
          when: 'badge:verdantSigil',
          pages: [
            'A Sigil. That is one of three, you know — Tidewatch and Voltspire hold the others.',
            'Long road. Better start walking.',
          ],
        },
        {
          pages: [
            'Leader Fern is inside. Two of her Gardeners as well, and they do not stand aside.',
            'Bring something that can hurt a hedge and you will be fine.',
          ],
        },
      ],
    },
    {
      id: 'thornwayKeeper',
      name: 'Pell',
      x: 25,
      y: 5,
      facing: 'right',
      sprite: 'villager',
      movement: 'static',
      dialogue: [
        {
          when: 'badge:verdantSigil',
          pages: [
            'Sigil on you? Then the gate is not the problem any more — the road is.',
            'Half the Thornway is under bramble. Give the crews a while yet.',
          ],
        },
        {
          pages: [
            'Thornway is shut. Bramble took the whole cutting last winter.',
            'Even with a Sigil you would not get far. Try the Hall instead.',
          ],
        },
      ],
    },
  ],

  interactables: [
    {
      x: 13,
      y: 21,
      type: 'sign',
      dialogue: [
        'THISTLEWOOD',
        'Home of the Verdant Hall.  South: Route 1 — the Cinderpath.',
      ],
    },
    {
      x: 13,
      y: 8,
      type: 'sign',
      dialogue: [
        'THE VERDANT HALL — Beacon Hall of Thistlewood',
        'Leader: Fern.  Challengers welcome. Mind the hedges.',
      ],
    },
    {
      x: 25,
      y: 4,
      type: 'sign',
      dialogue: [
        'THE THORNWAY — north to Route 2',
        'CLOSED. Bramble clearance in progress. Do not climb the gate.',
      ],
    },
    {
      // Tucked in the south-west corner, off the road — worth a look around.
      x: 3,
      y: 20,
      type: 'item',
      item: 'greatOrb',
      quantity: 1,
      flag: 'pickedUpThistlewoodOrb',
    },
  ],
};
