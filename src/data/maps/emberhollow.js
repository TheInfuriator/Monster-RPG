/**
 * emberhollow.js — Emberhollow Town
 * ----------------------------------------------------------------------------
 * The player's home town and the starting map.
 *
 * HOW TO READ THIS MAP
 * Each string below is one row of tiles. Each character is one tile, and the
 * meaning of every character is defined in `src/data/tiles.js`. Quick reference:
 *
 *   .  ,  grass          "  tall grass       -  =  path        f  flowers
 *   T     tree           #  stone wall       ~  water          s  sand
 *   R  r  roof           W     wall          w  window         D  door
 *   S     sign           F     fence         o  floor          L  ledge
 *
 * Every row MUST be the same length or the map will refuse to load (with a
 * message telling you which row is wrong).
 */

export const emberhollow = {
  id: 'emberhollow',
  name: 'Emberhollow Town',
  music: 'town',
  encounterTable: 'emberhollowEdge',

  tiles: [
    // 0         1         2
    // 0123456789012345678901234567890
    'TTTTTTTTTTTT--TTTTTTTTTTTTTTTT', //  0  north exit gap to Route 1
    'TTTTTTTTTTTT--TTTTTTTTTTTTTTTT', //  1
    'TT..""".....--....."""......TT', //  2  town outskirts, tall grass
    'TT..........--...rrrrrr.....TT', //  3  Warden's Lodge roof ridge
    'TT..rrrr....--...RRRRRR.....TT', //  4  player's house roof ridge
    'TT..RRRR....--...RRRRRR.....TT', //  5
    'TT..WwDW....--...WwwDwW.....TT', //  6  house door x6, lodge door x20
    'TT....-.....--......-.......TT', //  7
    'TT....-....S--......-.......TT', //  8
    'TT.------------------------.TT', //  9  main road
    'TT..........--..............TT', // 10
    'TT.......ff.--..ff..........TT', // 11
    'TT..,.......--.......,......TT', // 12
    'TT..rrrrr...--....rrrrr.....TT', // 13  Mender's Hall / Supply Post
    'TT..RRRRR...--....RRRRR.....TT', // 14
    'TT..WwDwW...--....WwDwW.....TT', // 15  mender door x6, shop door x20
    'TT....-.....--S.....-.......TT', // 16
    'TT....---------------..FFFFFTT', // 17  south connector + pond railing
    'TT..........--.........s~~~sTT', // 18
    'TT.FF.FFF...--.........s~~~sTT', // 19  kitchen garden (gap at x5)
    'TT.FffffF...--.........s~~~sTT', // 20
    'TT.FFFFFF...--.........sssssTT', // 21
    'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTT', // 22
    'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTT', // 23
  ],

  /**
   * Where the player appears on this map. The key is the name the previous map
   * asks for; "default" is used for a brand new game.
   */
  spawnPoints: {
    default: { x: 6, y: 7, facing: 'down' },
    // Each building drops you back on the tile just outside its door, facing
    // away from it, so you never immediately walk back in.
    fromPlayerHouse: { x: 6, y: 7, facing: 'down' },
    fromWardensLodge: { x: 20, y: 7, facing: 'down' },
    fromMendersHall: { x: 6, y: 16, facing: 'down' },
    fromSupplyPost: { x: 20, y: 16, facing: 'down' },
    fromRoute1: { x: 12, y: 2, facing: 'down' },
  },

  /**
   * Map exits. Stepping onto one of these tiles moves the player to another map
   * and places them at the named spawn point there.
   */
  exits: [
    { x: 12, y: 0, to: 'route1', spawn: 'fromEmberhollow' },
    { x: 13, y: 0, to: 'route1', spawn: 'fromEmberhollow' },
    { x: 6, y: 6, to: 'playerHouse', spawn: 'default' },
    { x: 20, y: 6, to: 'wardensLodge', spawn: 'default' },
    { x: 6, y: 15, to: 'mendersHall', spawn: 'default' },
    { x: 20, y: 15, to: 'supplyPost', spawn: 'default' },
  ],

  npcs: [
    {
      id: 'townGossip',
      name: 'Villager',
      x: 9,
      y: 10,
      facing: 'down',
      sprite: 'villager',
      movement: 'wander',
      wanderRadius: 2,
      dialogue: [
        {
          when: 'gotStarter',
          pages: [
            'Word travels fast in a town this size. Congratulations, Warden!',
          ],
        },
        {
          when: 'metWick',
          pages: [
            'Off to the Lodge, are you? Mind the step, it sticks.',
          ],
        },
        {
          pages: [
            'Emberhollow is built right on top of an old ember vent.',
            'That is why the ground stays warm all winter. Handy, that.',
          ],
        },
      ],
    },
    {
      id: 'townChild',
      name: 'Child',
      x: 15,
      y: 11,
      facing: 'left',
      sprite: 'child',
      movement: 'wander',
      wanderRadius: 3,
      dialogue: [
        {
          pages: [
            'There is tall grass up by the north road!',
            'Mum says things live in it. I say she is trying to scare me.',
          ],
        },
      ],
    },
    {
      id: 'pondElder',
      name: 'Old Rell',
      x: 22,
      y: 19,
      facing: 'right',
      sprite: 'elder',
      movement: 'static',
      dialogue: [
        {
          pages: [
            'This pond has never once frozen. Not in ninety years.',
            'The current runs close to the surface here. You can feel it, if you stand still.',
          ],
        },
      ],
    },
    {
      id: 'northRoadWatcher',
      name: 'Villager',
      x: 15,
      y: 3,
      facing: 'down',
      sprite: 'villagerAlt',
      movement: 'lookAround',
      dialogue: [
        {
          when: 'badge:verdantSigil',
          pages: [
            'Back from Thistlewood already? And with a Sigil, they are saying.',
            'You will be wanting the Thornway next. Give the crews a while yet.',
          ],
        },
        {
          when: 'route1GateOpen',
          pages: [
            'So the warden finally shifted that bar. About time.',
            'Thistlewood is an hour up the Cinderpath. Mind the grass.',
          ],
        },
        {
          pages: [
            'That road north is the Cinderpath. It runs all the way to Thistlewood.',
            'Or it would, if the gate were open.',
          ],
        },
      ],
    },
  ],

  interactables: [
    {
      x: 11,
      y: 8,
      type: 'sign',
      dialogue: [
        'EMBERHOLLOW TOWN',
        '"Warm ground, warmer welcome."',
      ],
    },
    {
      x: 14,
      y: 16,
      type: 'sign',
      dialogue: [
        'Left: Mender’s Hall — rest and recovery.',
        'Right: Supply Post — orbs, potions and rope.',
      ],
    },
  ],
};
