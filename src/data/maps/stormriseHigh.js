/**
 * stormriseHigh.js — Route 3, the Stormrise Climb: the Frost Shelf
 * ----------------------------------------------------------------------------
 * The middle of the Climb (Phase 13): a broad shelf of snow and frost scree
 * under the ridge, and the Hollow Vane's next operation — SURVEY 16.
 *
 * THE SHAPE, SOUTH TO NORTH
 *   the slope   rows 23-28  frost scree either side of the road
 *   the ledges  row 22      the shelf's edge: hop down anywhere, climb only
 *                           by the road
 *   the shelf   rows 12-21  snow and scree to the west (a Mountaineer); the
 *                           Vane compound to the east — relay masts, lit wire,
 *                           storage cells, and the relay console
 *   the pass    rows 10-11  a cleft through the ridge, fenced off
 *   the top     rows 1-9    snow, and the road on to the summit
 *
 * THE VANE'S RELAY (the Phase 13 story event)
 * A lightning relay: every bolt that strikes the mountain comes down its
 * masts and into storage cells instead of into the sky — which is why the
 * Climb has had a month of dead, still air. Its wire powers a CHARGED FENCE
 * across the pass, so nobody goes on to Voltspire while it runs.
 *
 * The console (23,13) can only be reached from the tile in front of it
 * (23,14), and the Relay Overseer stands there. Beat the Overseer and they
 * walk off; ground the relay at the console and `stormriseRelayStopped` is set:
 *
 *   - the charged fence across the pass goes dead (a barrier with `openWhen`)
 *   - every lit wire goes dark (a `glows` picture drawn while the flag holds)
 *   - the still mist breaks and the wind comes back (`weather` choices)
 *   - the Vane pack up and leave; Warden Hale comes up to hold the site
 *   - and one `story` autosave records it
 *
 *   5  snow   2  frost scree (wild Aethers)   -  road   L  ledge (hop down)
 *   6  relay mast   <  live wire (d once dead)   m  Vane machinery
 *   l  storage cells   J  Vane board   z  Vane cables   %  rock face
 *   @  boulder   $  sign on rock   !  the charged fence (a barrier)
 */

import { TRAINERS } from '../trainers.js';

export const stormriseHigh = {
  id: 'stormriseHigh',
  name: 'Stormrise Climb — the Frost Shelf',
  music: 'route',
  encounterTable: 'stormriseScree',

  // While the relay runs, the storm is in the cells and the air hangs still
  // and misty. Ground it and the wind comes back.
  weather: [
    { when: 'stormriseRelayStopped', kind: 'wind', amount: 2 },
    { kind: 'mist', amount: 1 },
  ],

  /** The charged fence across the pass. Dead once the relay is grounded. */
  barriers: [
    {
      id: 'relayFence',
      name: 'the charged fence',
      tile: '!',
      tiles: [[14, 11], [15, 11]],
      closed: true,
      openWhen: 'stormriseRelayStopped',
    },
  ],

  /** The relay's wire: lit while it runs, drawn dead once it is grounded. */
  glows: [
    { when: 'stormriseRelayStopped', tile: 'd', tiles: [[16, 12], [17, 12], [18, 12], [19, 12], [20, 12], [21, 12], [22, 12], [24, 12], [25, 12], [26, 12]] },
  ],

  tiles: [
    // 0         1         2
    // 012345678901234567890123456789
    '%%%%%%%%%%%%%%--%%%%%%%%%%%%%%', //  0  north exit to the summit
    '%%%%%555555555--555555555%%%%%', //  1
    '%%%%%522222225--5555@5555%%%%%', //  2  an item at (6,2)
    '%%%%%522222225--552222225%%%%%', //  3
    '%%%%%5222@2225--552222225%%%%%', //  4
    '%%%%%522222225--552222225%%%%%', //  5
    '%%%%%522222225--552222225%%%%%', //  6
    '%%%%%555555555--552222225%%%%%', //  7
    '%%%%%555555555--552222225%%%%%', //  8
    '%%%%%@55555555--55555555@%%%%%', //  9
    '%%%%%%%%%%%%%%--%%%%%%%%%%%%%%', // 10
    '%%%%%%%%%%%%%%--6%%%%%%%%%%%%%', // 11  THE FENCE across the pass (14,11),(15,11); its post (16,11)
    '%%@5555555555$--<<<<<<<6<<<6%%', // 12  warning sign (13,12); the lit relay wire, masts at (23,12),(27,12)
    '%%522222222255--5lll5Jmmmlll%%', // 13  cells; the Vane board (21,13); THE RELAY CONSOLE (23,13)
    '%%52222@222255--555555555555%%', // 14  Overseer at (23,14), on the only tile in front of the console
    '%%522222222255--555555555555%%', // 15  Mountaineer at (11,15)
    '%%522222222255--55zzzzzzzzz5%%', // 16
    '%%522222222255--55z5555555z5%%', // 17
    '%%522222222255--55z5ll5ll5z5%%', // 18
    '%%522222222255--55z5ll5ll5z5%%', // 19  Vane Surveyor at (16,19)
    '%%522222222255--55z5555555z5%%', // 20
    '%%@55555555555--55555555555m%%', // 21
    '%%%LLLLLLLLLL%--%LLLLLLLLLL%%%', // 22  ledges down to the slope
    '%%555555555555--555555555555%%', // 23
    '%%522222222225--522222222225%%', // 24
    '%%522@22222225--522222@22225%%', // 25
    '%%522222222225--522222222225%%', // 26
    '%%522222222225--522222222225%%', // 27  an item at (26,27)
    '%%522222222225--555555555555%%', // 28
    '%%%%%%%%%%%%%%--%%%%%%%%%%%%%%', // 29  south exit to the lower climb
  ],

  spawnPoints: {
    fromLower: { x: 14, y: 28, facing: 'up' },
    default: { x: 14, y: 28, facing: 'up' },
    fromSummit: { x: 14, y: 1, facing: 'down' },
  },

  exits: [
    { x: 14, y: 29, to: 'stormriseLower', spawn: 'fromHigh' },
    { x: 15, y: 29, to: 'stormriseLower', spawn: 'fromHigh' },
    { x: 14, y: 0, to: 'stormriseSummit', spawn: 'fromHigh' },
    { x: 15, y: 0, to: 'stormriseSummit', spawn: 'fromHigh' },
  ],

  npcs: [
    {
      id: 'stormriseMountaineer',
      name: 'Ossian',
      trainer: 'stormriseMountaineer',
      sightRange: 3,
      x: 11,
      y: 15,
      facing: 'right',
      sprite: 'elder',
      movement: 'static',
      dialogue: [
        {
          when: 'stormriseRelayStopped',
          pages: [
            'There it is — the wind off the peak. Forty years, and I have never been so glad to be cold.',
          ],
        },
        {
          when: 'trainer:stormriseMountaineer',
          pages: [
            'Those grey coats strung their wire to that fence across the pass. Nobody goes up while it hums.',
            'East of the road, by the tall masts. That is where it all comes from.',
            'And if you are bound for the Storm Hall, take something off this scree. A Rimelet\'s ice brings down fliers, and a Pebblit\'s hide shrugs off fire.',
          ],
        },
        { action: 'trainer:stormriseMountaineer', pages: TRAINERS.stormriseMountaineer.intro },
      ],
    },
    {
      id: 'vaneMarl',
      name: 'Marl',
      trainer: 'vaneMarl',
      sightRange: 2,
      x: 16,
      y: 19,
      facing: 'left',
      sprite: 'vane',
      movement: 'static',
      // Packs up with the rest of the crew once the relay is grounded.
      absentWhen: 'stormriseRelayStopped',
      leaveBy: { direction: 'up', steps: 8 },
      dialogue: [
        {
          when: 'trainer:vaneMarl',
          pages: ['The Overseer is at the relay console, past the cells. Your funeral.'],
        },
        { action: 'trainer:vaneMarl', pages: TRAINERS.vaneMarl.intro },
      ],
    },
    {
      // THE OPERATION'S CONFRONTATION. On the only tile the console can be
      // reached from; once beaten, walks off for good.
      id: 'vaneOverseer',
      name: 'Crale',
      trainer: 'vaneOverseer',
      sightRange: 3,
      x: 23,
      y: 14,
      facing: 'down',
      sprite: 'vaneForeman',
      movement: 'static',
      absentWhen: 'trainer:vaneOverseer',
      exitAfterDefeat: { direction: 'right', steps: 5 },
      dialogue: [
        { action: 'trainer:vaneOverseer', pages: TRAINERS.vaneOverseer.intro },
      ],
    },
    {
      // Comes up from Tidewatch once the relay is grounded, to hold the site
      // for the Circle — and to read the Vane's board.
      id: 'haleShelf',
      name: 'Warden Hale',
      x: 20,
      y: 14,
      facing: 'up',
      sprite: 'warden',
      movement: 'static',
      presentWhen: 'stormriseRelayStopped',
      dialogue: [
        {
          when: 'badge:stormSigil',
          pages: [
            'Three Sigils. The Circle has sent word to Voltspire: they want to see you, once the gate north is open.',
            'Not yet, though. Nobody goes up to the Aerie until the Circle says so.',
          ],
        },
        {
          pages: [
            'I came up the moment the wind changed. You grounded it yourself? The Circle will want to hear that.',
            'Read the board, if you have not. Survey 14 was the earth\'s current. Survey 15, the sea\'s. This was the storm\'s.',
            'Three currents, all bottled — all sent to the same place. "The Convergence." Whatever that is, it is above Voltspire.',
            'Go on up. Voltspire has a Mender, and a Beacon Hall. I will hold this place until the Circle comes.',
          ],
        },
      ],
    },
  ],

  interactables: [
    {
      // THE OBJECTIVE. Reachable only from (23,14), where the Overseer stands.
      x: 23,
      y: 13,
      type: 'sign',
      dialogue: [
        {
          when: 'stormriseRelayStopped',
          pages: ['The relay console is dead and cold. Somewhere above, thunder rolls along the ridge.'],
        },
        {
          when: 'trainer:vaneOverseer',
          setFlags: ['stormriseRelayStopped'],
          pages: [
            'The relay console. A heavy grounding lever sits in the middle, stamped with a hollow ring. You throw it.',
            'Every mast on the shelf spits blue fire at once — and then the hum stops. The wire goes dark.',
            'A long breath of wind comes down off the peak. Then another. Far above, the first thunder in a month.',
          ],
        },
        {
          pages: ['The relay console hums. The Overseer is not letting anyone near it.'],
        },
      ],
    },
    {
      // The board says why Stormrise mattered — and no more.
      x: 21,
      y: 13,
      type: 'sign',
      dialogue: [
        'A Hollow Vane board. SURVEY 16 — STORM DRAW. Cells filled: 40 of 40.',
        'Pinned beside it, a map of the valley. Three lines are drawn on it — from Mistvault, from the harbour, from this mountain.',
        'All three end at the same mark, high above Voltspire City. It is labelled, in neat capitals: THE CONVERGENCE.',
      ],
    },
    {
      x: 13,
      y: 12,
      type: 'sign',
      dialogue: [
        {
          when: 'stormriseRelayStopped',
          pages: ['DANGER — CHARGED FENCE. Someone has scratched a line through it.'],
        },
        {
          pages: ['DANGER — CHARGED FENCE.  Hollow Vane relay works, Survey 16.  KEEP OUT.'],
        },
      ],
    },
    { x: 6, y: 2, type: 'item', item: 'ultraOrb', quantity: 1, flag: 'pickedUpStormriseShelfOrb' },
    { x: 26, y: 27, type: 'item', item: 'superPotion', quantity: 2, flag: 'pickedUpStormriseSlopePotions' },
  ],
};
