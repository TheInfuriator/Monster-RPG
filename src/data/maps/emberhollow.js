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
    'TT..........--.........s~~~sTT', // 19
    'TT..........--.........s~~~sTT', // 20
    'TT..........--.........sssssTT', // 21
    'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTT', // 22
    'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTT', // 23
  ],

  /**
   * Where the player appears on this map. The key is the name the previous map
   * asks for; "default" is used for a brand new game.
   */
  spawnPoints: {
    default: { x: 6, y: 7, facing: 'down' },
    fromHouse: { x: 6, y: 7, facing: 'down' },
    fromRoute1: { x: 12, y: 2, facing: 'down' },
  },

  /**
   * Map exits. NOTE: exit handling is implemented in Phase 2 — this data is here
   * so the map is already complete when that system lands, but nothing reads it
   * yet. See TODO.md.
   */
  exits: [
    { x: 12, y: 0, to: 'route1', spawn: 'fromEmberhollow' },
    { x: 13, y: 0, to: 'route1', spawn: 'fromEmberhollow' },
    { x: 6, y: 6, to: 'playerHouse', spawn: 'default' },
    { x: 20, y: 6, to: 'wardensLodge', spawn: 'default' },
    { x: 6, y: 15, to: 'mendersHall', spawn: 'default' },
    { x: 20, y: 15, to: 'supplyPost', spawn: 'default' },
  ],
};
