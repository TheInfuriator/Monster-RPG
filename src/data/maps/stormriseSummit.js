/**
 * stormriseSummit.js — Route 3, the Stormrise Climb: the Saddle
 * ----------------------------------------------------------------------------
 * The top of the Climb (Phase 13): a wide, windswept saddle under the peak,
 * where the lightning comes down — stormgrass, the route's rarest Aether,
 * the old cairn, and the pass down into Voltspire City.
 *
 * THE SHAPE, SOUTH TO NORTH
 *   the lower saddle  rows 13-23  stormgrass either side of the road; the
 *                                 cairn (the Climb's landmark) to the west; a
 *                                 Skyherd on the road
 *   the ridge         row 12      broken by the road — and by one gap at the
 *                                 east end, down onto a little plateau
 *   the plateau       rows 13-15  reachable only from above; ledges drop
 *                                 off its south edge, back to the lower
 *                                 saddle (an item for the curious)
 *   the upper saddle  rows 6-11   more stormgrass, a Stormchaser, and Kestrel
 *                                 at the top of the road
 *   the pass          rows 0-5    a cleft one road wide, on to Voltspire
 *
 * Kestrel stands beside the road just below the pass, so nobody reaches
 * Voltspire without meeting them (the fourth rival battle).
 *
 * WEATHER: snow on the wind — the storm is back.
 *
 *   5  snow   3  stormgrass (wild Aethers)   -  road   L  ledge (hop down)
 *   %  rock face   @  boulder   $  the cairn's marker stone
 */

import { TRAINERS } from '../trainers.js';

export const stormriseSummit = {
  id: 'stormriseSummit',
  name: 'Stormrise Climb — the Saddle',
  music: 'route',
  encounterTable: 'stormriseSummit',
  weather: { kind: 'snow', amount: 2 },

  tiles: [
    // 0         1         2
    // 012345678901234567890123456789
    '%%%%%%%%%%%%%%--%%%%%%%%%%%%%%', //  0  north exit to Voltspire City
    '%%%%%%%%%%%555--555%%%%%%%%%%%', //  1
    '%%%%%%%%%%%555--555%%%%%%%%%%%', //  2
    '%%%%%%%%%%%555--555%%%%%%%%%%%', //  3  the pass: rock either side
    '%%%%%%%%%%%55%--%55%%%%%%%%%%%', //  4
    '%%%%%%%%%%%%%%--%%%%%%%%%%%%%%', //  5
    '%%%5@555555555--55555555555%%%', //  6  Kestrel at (16,6), in a niche off the road
    '%%%53333333555--55533333335%%%', //  7
    '%%%53333333555--55533333@35%%%', //  8  Stormchaser at (11,8)
    '%%%53333333555--55533333335%%%', //  9
    '%%%53333333555--55533333335%%%', // 10
    '%%%55555555555--55555555555%%%', // 11
    '%%%%%%%%%%%%%%--%%%%%%%%%5%%%%', // 12  the ridge: the road, and a gap down onto the plateau (25,12)
    '%%5@555@@@5555--555%5555555%%%', // 13  the cairn (7..9, 13..14); its marker stone (8,14); the east plateau
    '%%55555@$@5555--555%5555555%%%', // 14  an item on the plateau (26,13)
    '%%533355555355--555%5555555%%%', // 15
    '%%533333333355--555%LLLLLLL%%%', // 16  ledges off the plateau
    '%%533333333355--553355555555%%', // 17
    '%%533333333355--553333333335%%', // 18
    '%%533333333355--553333333335%%', // 19  Skyherd at (17,19)
    '%%533333333355--5533333333@5%%', // 20
    '%%533333333355--553333333335%%', // 21
    '%%533@33333355--553333333335%%', // 22  an item in the stormgrass (3,22)
    '%%555555555555--555555555555%%', // 23
    '%%%%%%%%%%%%%%--%%%%%%%%%%%%%%', // 24
    '%%%%%%%%%%%%%%--%%%%%%%%%%%%%%', // 25  south exit to the Frost Shelf
  ],

  spawnPoints: {
    fromHigh: { x: 14, y: 24, facing: 'up' },
    default: { x: 14, y: 24, facing: 'up' },
    fromVoltspire: { x: 14, y: 1, facing: 'down' },
  },

  exits: [
    { x: 14, y: 25, to: 'stormriseHigh', spawn: 'fromSummit' },
    { x: 15, y: 25, to: 'stormriseHigh', spawn: 'fromSummit' },
    { x: 14, y: 0, to: 'voltspire', spawn: 'fromStormrise' },
    { x: 15, y: 0, to: 'voltspire', spawn: 'fromStormrise' },
  ],

  npcs: [
    {
      // THE RIVAL — fourth meeting. Beside the road under the pass, so
      // nobody reaches Voltspire without walking into Kestrel's sight.
      // Steps back to this spot afterwards, out of the road.
      id: 'kestrelSummit',
      name: 'Kestrel',
      trainer: 'kestrelStormrise',
      sightRange: 2,
      x: 16,
      y: 6,
      facing: 'left',
      sprite: 'rival',
      movement: 'static',
      presentWhen: 'trainer:kestrelTidewatch',
      returnAfterDefeat: true,
      dialogue: [
        {
          when: 'badge:stormSigil',
          pages: [
            'Three Sigils. You know what that means — the Circle opens the north gate for three.',
            'I followed the cable tracks down the far side. They go up, not down. Toward the Aerie.',
            'Whatever the Convergence is, it is up there. I will be ready when the gate opens. Be ready too.',
          ],
        },
        {
          when: 'trainer:kestrelStormrise',
          pages: [
            'Voltspire is straight through the pass. The Storm Hall is the tall copper one — you cannot miss it.',
            'I am staying up here a while. I want to see where the Vane took those cells.',
          ],
        },
        ...TRAINERS.kestrelStormrise.intro.map((branch) => ({
          ...branch,
          action: 'trainer:kestrelStormrise',
        })),
      ],
    },
    {
      id: 'stormriseStormchaser',
      name: 'Vey',
      trainer: 'stormriseStormchaser',
      sightRange: 3,
      x: 11,
      y: 8,
      facing: 'right',
      sprite: 'villager',
      movement: 'static',
      dialogue: [
        {
          when: 'trainer:stormriseStormchaser',
          pages: [
            'The stormgrass grows only where lightning strikes. Sometimes a Thundrel comes down with the bolt — I have seen one. Once.',
          ],
        },
        { action: 'trainer:stormriseStormchaser', pages: TRAINERS.stormriseStormchaser.intro },
      ],
    },
    {
      id: 'stormriseSkyherd',
      name: 'Linnet',
      trainer: 'stormriseSkyherd',
      sightRange: 2,
      x: 17,
      y: 19,
      facing: 'left',
      sprite: 'villagerAlt',
      movement: 'static',
      dialogue: [
        {
          when: 'trainer:stormriseSkyherd',
          pages: [
            'Cirrup ride the updraughts in flocks. Raise one long enough and it grows into a Stormcrest — the Storm Hall\'s Leader swears by them.',
          ],
        },
        { action: 'trainer:stormriseSkyherd', pages: TRAINERS.stormriseSkyherd.intro },
      ],
    },
  ],

  interactables: [
    {
      // THE LANDMARK.
      x: 8,
      y: 14,
      type: 'sign',
      dialogue: [
        'The Stormrise cairn: a ring of stones older than Voltspire, each one scorched black on top.',
        'Words are cut into the marker stone: WHERE THE THREE CURRENTS RISE, THE SKY ANSWERS.',
      ],
    },
    { x: 26, y: 13, type: 'item', item: 'ultraOrb', quantity: 1, flag: 'pickedUpStormrisePlateauOrb' },
    { x: 3, y: 22, type: 'item', item: 'clearTonic', quantity: 1, flag: 'pickedUpStormriseSaddleTonic' },
  ],
};
