/**
 * stormriseLower.js — Route 3, the Stormrise Climb: the Terraces
 * ----------------------------------------------------------------------------
 * The first of the Climb's three maps (Phase 13), up out of Tidewatch Harbor
 * once the Wardens have cleared the rockslide. Five grassy terraces stacked
 * up the mountainside, the road switching back and forth between them.
 *
 * THE SHAPE, SOUTH TO NORTH
 *   The road comes up from Tidewatch and climbs the terraces in a zig-zag,
 *   through a gap in each cliff at alternate ends. Under each stretch of road
 *   lies heath, where the wild Aethers are; two strips of it run right across
 *   the road (on the second and fourth terraces), so nobody climbs without
 *   meeting something.
 *
 * ELEVATION: ONE-WAY LEDGES
 *   Each cliff has a run of ledges (L). Walk into one going DOWNHILL and you
 *   hop over it to the terrace below — a quick way back to the harbour. You
 *   can never climb one. tests/ledges.test.js walks every tile of this map,
 *   ledges and all, and proves the road out is always still reachable.
 *
 * WEATHER: a light wind (a picture only — see WeatherRenderer.js).
 *
 *   .  grass       1  heath (wild Aethers)   -  road     5  snow
 *   T  tree        %  rock face   @  boulder   L  ledge (hop down)
 *   $  sign on rock
 */

import { TRAINERS } from '../trainers.js';

export const stormriseLower = {
  id: 'stormriseLower',
  name: 'Stormrise Climb — the Terraces',
  music: 'route',
  encounterTable: 'stormriseHeath',
  weather: { kind: 'wind', amount: 1 },

  tiles: [
    // 0         1         2
    // 012345678901234567890123456789
    '%%%%%%%%%%%%%%--%%%%%%%%%%%%%%', //  0
    '%%T..555......--555.555555TT%%', //  1
    '%%.-------------......555555%%', //  2
    '%%.-------------..........55%%', //  3
    '%%1--1111@111111111111111111%%', //  4
    '%%T--1111111111111111111111T%%', //  5
    '%%%--%%%%%%%%%%%%%LLLLLL%%%%%%', //  6
    '%%T--...........11........TT%%', //  7
    '%%.-------------111-------..%%', //  8
    '%%.-------------111-------..%%', //  9
    '%%1111111111111111111111--11%%', // 10
    '%%1111111111111111111@11--11%%', // 11
    '%%T111111111111111111111--1T%%', // 12
    '%%%%%%%LLLLLL%%%%%%%%%%%--%%%%', // 13
    '%%T.....................--.T%%', // 14
    '%%.-----------------------..%%', // 15
    '%%.-----------------------..%%', // 16
    '%%1--11111111111111111111111%%', // 17
    '%%1--11111111@11111111111111%%', // 18
    '%%T--111111111111111111111TT%%', // 19
    '%%%--%%%%%%%%%%LLLLLLL%%%%%%%%', // 20
    '%%T--.....111.............TT%%', // 21
    '%%.-------111-------------..%%', // 22
    '%%.-------111-------------..%%', // 23
    '%%1111@11111111111111111--11%%', // 24
    '%%11111111111111111@1111--11%%', // 25
    '%%T111111111111111111111--1T%%', // 26
    '%%%%%%LLLLLL%%%%%%%%%%%%--%%%%', // 27
    '%%TT....................--TT%%', // 28
    '%%T...........------------.T%%', // 29
    '%%............------------..%%', // 30
    '%%111111111111--111111111111%%', // 31
    '%%111111@11111--111111111111%%', // 32
    '%%111111111111--1111@1111111%%', // 33
    '%%111111111111--11111111111T%%', // 34
    '%%T11111111111--$111111111TT%%', // 35
    '%%%%%%%%%%%%%%--%%%%%%%%%%%%%%', // 36
    '%%%%%%%%%%%%%%--%%%%%%%%%%%%%%', // 37
  ],

  spawnPoints: {
    fromTidewatch: { x: 14, y: 36, facing: 'up' },
    default: { x: 14, y: 36, facing: 'up' },
    fromHigh: { x: 14, y: 1, facing: 'down' },
  },

  exits: [
    { x: 14, y: 37, to: 'tidewatch', spawn: 'fromStormrise' },
    { x: 15, y: 37, to: 'tidewatch', spawn: 'fromStormrise' },
    { x: 14, y: 0, to: 'stormriseHigh', spawn: 'fromLower' },
    { x: 15, y: 0, to: 'stormriseHigh', spawn: 'fromLower' },
  ],

  npcs: [
    {
      // Below the second terrace's road, looking up at it.
      id: 'stormriseClimber',
      name: 'Tamsin',
      trainer: 'stormriseClimber',
      sightRange: 2,
      x: 8,
      y: 24,
      facing: 'up',
      sprite: 'villager',
      movement: 'static',
      dialogue: [
        {
          when: 'stormriseRelayStopped',
          pages: ['Hear that wind? That is the Climb as it should sound. Whatever you did up there — thank you.'],
        },
        {
          when: 'trainer:stormriseClimber',
          pages: [
            'The ledges are the quick way down. Walk off one and you will hop to the terrace below. There is no hopping back up, mind.',
          ],
        },
        { action: 'trainer:stormriseClimber', pages: TRAINERS.stormriseClimber.intro },
      ],
    },
    {
      // Below the third terrace's road.
      id: 'stormriseHerder',
      name: 'Bryn',
      trainer: 'stormriseHerder',
      sightRange: 2,
      x: 20,
      y: 17,
      facing: 'up',
      sprite: 'villagerAlt',
      movement: 'static',
      dialogue: [
        {
          when: 'trainer:stormriseHerder',
          pages: [
            'The Climb has three grounds: heath down here, frost scree on the shelf, and stormgrass at the top. Each has its own Aethers.',
          ],
        },
        { action: 'trainer:stormriseHerder', pages: TRAINERS.stormriseHerder.intro },
      ],
    },
  ],

  interactables: [
    {
      x: 16,
      y: 35,
      type: 'sign',
      dialogue: [
        'ROUTE 3 — THE STORMRISE CLIMB.  North: Voltspire City.  South: Tidewatch Harbor.',
        'Ledges go one way: down. Mind your footing.',
      ],
    },
    { x: 2, y: 31, type: 'item', item: 'superPotion', quantity: 1, flag: 'pickedUpStormriseTerracePotion' },
    { x: 27, y: 17, type: 'item', item: 'greatOrb', quantity: 2, flag: 'pickedUpStormriseTerraceOrbs' },
    { x: 5, y: 1, type: 'item', item: 'clearTonic', quantity: 1, flag: 'pickedUpStormriseSnowTonic' },
  ],
};
