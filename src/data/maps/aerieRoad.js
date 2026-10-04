/**
 * aerieRoad.js — the Aerie Road
 * ----------------------------------------------------------------------------
 * The last road in the valley (Phase 14): from Voltspire's Aerie Gate up a
 * long snow valley to the Aerie, where the Warden Circle meets and the
 * valley's three currents rise together at the Wellspring.
 *
 * THE SHAPE, SOUTH TO NORTH
 *   the gorge        rows 33-39  the road out of the gate, a Vane cable run
 *                                laid beside it
 *   the meadow       rows 25-32  stormgrass either side; an overturned Vane
 *                                cart; an Ace Warden on the road
 *   the ridge        row 24      the road through it, and ledges off the
 *                                shelf above — a quick way back down
 *   the shelf        rows 16-23  frost scree; the road switches west, where a
 *                                Summit Guide watches it
 *   the snowfield    rows 3-14   the road comes back east and climbs north;
 *                                more stormgrass and scree, a Circle Hopeful
 *   the top          rows 0-2    on to the Aerie
 *
 * The cable run follows the road all the way up: the Vane's carts came this
 * way before the gate was shut, and never came down.
 *
 * WEATHER: snow on the wind.
 *
 *   5  snow   3  stormgrass   2  frost scree (both wild Aethers)   -  road
 *   z  Vane cables   m  a Vane cart   L  ledge (hop down)   %  rock face
 *   @  boulder   $  sign on rock
 */

import { TRAINERS } from '../trainers.js';

export const aerieRoad = {
  id: 'aerieRoad',
  name: 'The Aerie Road',
  music: 'route',
  encounterTable: 'aerieRoad',
  weather: { kind: 'snow', amount: 2 },

  tiles: [
    // 0         1         2
    // 012345678901234567890123456789
    '%%%%%%%%%%%%%%--%%%%%%%%%%%%%%', //  0  north exit to the Aerie
    '%%%%%%%%%%%%%5--5%%%%%%%%%%%%%', //  1
    '%%%%%%%%%%%%%5--5%%%%%%%%%%%%%', //  2
    '%%%@5555555555--z555555555@%%%', //  3
    '%%%55553333335--z5555555555%%%', //  4  an item (24,4)
    '%%%55553333335--z5222222225%%%', //  5
    '%%%55553333335--z5222222225%%%', //  6  Circle Hopeful Mabry at (13,6)
    '%%%55553333335--z5222222225%%%', //  7
    '%%%55553333335--z5222222225%%%', //  8
    '%%%55553333335--z5222222225%%%', //  9
    '%%%55555555555--z5222222225%%%', // 10
    '%%%5------------z5555555555%%%', // 11  the road turns east...
    '%%%5--555555555555333333335%%%', // 12
    '%%%5--@55555555555333333335%%%', // 13
    '%%%5--555555555555333333335%%%', // 14
    '%%%%--%%%%%%%%%%%%%%%%%%%%%%%%', // 15  a rock band: the road climbs through the gap (4..5, 15)
    '%%%5--52222225555522222222@%%%', // 16  an item in the scree (25,16)
    '%%%5--522222255555222222225%%%', // 17
    '%%%5--522222255555222222225%%%', // 18
    '%%%5--555555555555222222225%%%', // 19  Summit Guide Orla at (9,19)
    '%%%5------------z5555555555%%%', // 20  the switchback
    '%%%5------------z5555555555%%%', // 21
    '%%%55555555555--z5555555555%%%', // 22
    '%%%@5555555555--z5555555555%%%', // 23
    '%%%%%%%%%%%%%%--z%%%LLLLLL%%%%', // 24  the ridge: the road, and ledges down off the shelf (20..25, 24)
    '%%%@5555555555--z555555555@%%%', // 25
    '%%%53333333555--z5m55555555%%%', // 26  an overturned Vane cart (18,26)
    '%%%53333333355--z5533333335%%%', // 27
    '%%%53333333355--z5533333335%%%', // 28
    '%%%53333333355--z5533333335%%%', // 29  Ace Warden Corin at (12,29)
    '%%%53333333355--z5533333335%%%', // 30
    '%%%55333333355--z5533333335%%%', // 31  an item (4,31)
    '%%%55555555555--z555555555@%%%', // 32
    '%%%%%%%%%%%%55--55%%%%%%%%%%%%', // 33
    '%%%%%%%%%%%%55--z5%%%%%%%%%%%%', // 34
    '%%%%%%%%%%%%55--z5%%%%%%%%%%%%', // 35
    '%%%%%%%%%%%%55--z5%%%%%%%%%%%%', // 36
    '%%%%%%%%%%%%5$--z5%%%%%%%%%%%%', // 37  the road sign (13,37)
    '%%%%%%%%%%%%55--z5%%%%%%%%%%%%', // 38
    '%%%%%%%%%%%%%%--%%%%%%%%%%%%%%', // 39  south exit to Voltspire City
  ],

  spawnPoints: {
    fromVoltspire: { x: 14, y: 38, facing: 'up' },
    default: { x: 14, y: 38, facing: 'up' },
    fromAerie: { x: 14, y: 1, facing: 'down' },
  },

  exits: [
    { x: 14, y: 39, to: 'voltspire', spawn: 'fromAerieRoad' },
    { x: 15, y: 39, to: 'voltspire', spawn: 'fromAerieRoad' },
    { x: 14, y: 0, to: 'aerie', spawn: 'fromAerieRoad' },
    { x: 15, y: 0, to: 'aerie', spawn: 'fromAerieRoad' },
  ],

  npcs: [
    {
      id: 'aerieAce',
      name: 'Corin',
      trainer: 'aerieAce',
      sightRange: 3,
      x: 12,
      y: 29,
      facing: 'right',
      sprite: 'villager',
      movement: 'static',
      dialogue: [
        {
          when: 'convergenceStopped',
          pages: [
            'The Circle sent word down the road: the Wellspring is running high again. Whoever went into the Hollow, I owe them.',
          ],
        },
        {
          when: 'trainer:aerieAce',
          pages: [
            'I came up for the Trial. The Circle turned me back — no Trial while the Vane are dug in under the Aerie.',
            'They say the Vane\'s doors will not open for a Warden. Maybe they will for you.',
          ],
        },
        { action: 'trainer:aerieAce', pages: TRAINERS.aerieAce.intro },
      ],
    },
    {
      id: 'aerieGuide',
      name: 'Orla',
      trainer: 'aerieGuide',
      sightRange: 2,
      x: 9,
      y: 19,
      facing: 'down',
      sprite: 'villagerAlt',
      movement: 'static',
      dialogue: [
        {
          when: 'trainer:aerieGuide',
          pages: [
            'The ledges past the cart will drop you back to the meadow, if you need Voltspire\'s Mender in a hurry.',
            'Up top there is a Lodge with a Mender of its own. Most Wardens never get further than its fire.',
          ],
        },
        { action: 'trainer:aerieGuide', pages: TRAINERS.aerieGuide.intro },
      ],
    },
    {
      id: 'aerieHopeful',
      name: 'Mabry',
      trainer: 'aerieHopeful',
      sightRange: 2,
      x: 13,
      y: 6,
      facing: 'right',
      sprite: 'villager',
      movement: 'static',
      dialogue: [
        {
          when: 'storyComplete',
          pages: ['You are the new Champion? ...Then I lost to the Champion. I am telling everyone that.'],
        },
        {
          when: 'trainer:aerieHopeful',
          pages: [
            'The Aerie is just up there. The Circle Hall at the top, the Lodge on the left.',
            'And the Wellspring in the middle. It is meant to shine. It has not, all month.',
          ],
        },
        { action: 'trainer:aerieHopeful', pages: TRAINERS.aerieHopeful.intro },
      ],
    },
  ],

  interactables: [
    {
      x: 13,
      y: 37,
      type: 'sign',
      dialogue: [
        'THE AERIE ROAD.  North: the Aerie and the Circle Hall.  South: Voltspire City.',
        'Wardens of three Sigils only, by order of the Warden Circle.',
      ],
    },
    {
      // Environmental story: where the carts went.
      x: 18,
      y: 26,
      type: 'sign',
      dialogue: [
        {
          when: 'convergenceStopped',
          pages: ['The overturned cart is still here. Someone has chalked a hollow ring on it — and crossed it out.'],
        },
        {
          pages: [
            'A Hollow Vane cart, on its side in the snow. One axle has snapped clean through.',
            'Its bed is empty, but the boards are scored in rows of round marks — the bases of storage cells.',
            'Whatever it carried went on up the road without it.',
          ],
        },
      ],
    },
    { x: 4, y: 31, type: 'item', item: 'mendersDraught', quantity: 1, flag: 'pickedUpAerieRoadDraught' },
    { x: 25, y: 16, type: 'item', item: 'clearTonic', quantity: 1, flag: 'pickedUpAerieRoadTonic' },
    { x: 24, y: 4, type: 'item', item: 'ultraOrb', quantity: 1, flag: 'pickedUpAerieRoadOrb' },
  ],
};
