/**
 * route1.js — Route 1, the Cinderpath
 * ----------------------------------------------------------------------------
 * The first route north out of Emberhollow. Tall grass on both sides of the
 * path, a pond partway up, and a gate at the top that stays shut until you are
 * a registered Warden.
 *
 * Every row is 22 characters: two border trees, eighteen tiles of route, two
 * more border trees. Keeping that shape consistent makes the map easy to edit.
 *
 *   .  grass      "  tall grass (wild Aethers)   -  path     T  tree
 *   ~  water      s  sand                        F  fence    S  sign
 */

export const route1 = {
  id: 'route1',
  name: 'Route 1 — Cinderpath',
  music: 'route',
  encounterTable: 'route1',

  tiles: [
    // 0    5    10   15   20
    'TTTTTTTTTTTTTTTTTTTTTT', //  0
    'TTTTTTTTTTTTTTTTTTTTTT', //  1
    'TTFFFFFFFFFFFFFFFFFFTT', //  2  the north gate — shut for now
    'TT..................TT', //  3
    'TT.......S--........TT', //  4  signpost beside the path
    'TT........--........TT', //  5
    'TT.""""...--....""""TT', //  6
    'TT.""""...--....""""TT', //  7
    'TT.""""...--....""""TT', //  8
    'TT........--........TT', //  9
    'TT........--...s~~~sTT', // 10  pond
    'TT........--...s~~~sTT', // 11
    'TT........--...s~~~sTT', // 12
    'TT........--...sssssTT', // 13
    'TT....------........TT', // 14  the path jogs west
    'TT....--............TT', // 15
    'TT....--..""""......TT', // 16
    'TT....--..""""......TT', // 17
    'TT....--..""""......TT', // 18
    'TT....--............TT', // 19
    'TT....--............TT', // 20
    'TT....------........TT', // 21  and jogs back east
    'TT........--........TT', // 22
    'TT..""""..--..""""..TT', // 23
    'TT..""""..--..""""..TT', // 24
    'TT..""""..--..""""..TT', // 25
    'TT........--........TT', // 26
    'TT........--........TT', // 27
    'TT........--........TT', // 28
    'TTTTTTTTTT--TTTTTTTTTT', // 29  south exit back to Emberhollow
  ],

  spawnPoints: {
    // Arriving from town: just inside the southern treeline, facing north.
    fromEmberhollow: { x: 10, y: 28, facing: 'up' },
    default: { x: 10, y: 28, facing: 'up' },
  },

  exits: [
    { x: 10, y: 29, to: 'emberhollow', spawn: 'fromRoute1' },
    { x: 11, y: 29, to: 'emberhollow', spawn: 'fromRoute1' },
  ],

  npcs: [
    {
      id: 'gateWarden',
      name: 'Gate Warden',
      x: 13,
      y: 3,
      facing: 'down',
      sprite: 'villagerAlt',
      movement: 'static',
      dialogue: [
        {
          when: 'gotStarter',
          pages: [
            'So Wick finally handed one over! Good.',
            'The gate opens for Wardens with a partner. Give me a day to shift the bar and Thistlewood is yours.',
          ],
        },
        {
          pages: [
            'Gate is shut, I am afraid. Beyond here the grass gets bold and the Aethers get bolder.',
            'Come back when you are walking with one of your own. Then we will talk.',
          ],
        },
      ],
    },
    {
      id: 'grassWatcher',
      name: 'Hiker',
      // Beside the path, not on it — an NPC standing in a corridor is a wall.
      x: 5,
      y: 19,
      facing: 'right',
      sprite: 'villager',
      movement: 'lookAround',
      dialogue: [
        {
          pages: [
            'See the tall grass? Step in and something will come out to meet you.',
            'Walk the path if you would rather not be met.',
          ],
        },
      ],
    },
    {
      id: 'pondWatcher',
      name: 'Angler',
      x: 14,
      y: 11,
      facing: 'right',
      sprite: 'elder',
      movement: 'static',
      dialogue: [
        {
          pages: [
            'Aethers come down to drink here at dusk. Whole families of them.',
            'I have watched this pond forty years and it still surprises me.',
          ],
        },
      ],
    },
    // --- Trainers -----------------------------------------------------------
    // Each stands BESIDE the path looking across it, so their sight lane is
    // obvious, the corridor itself is never blocked, and no defeated trainer
    // can ever become a wall. Their teams and money live in src/data/trainers.js.
    {
      id: 'route1Scout',
      name: 'Wren',
      trainer: 'route1Scout',
      sightRange: 4,
      // Low on the route, watching the first stretch of path north of the exit.
      x: 13,
      y: 27,
      facing: 'left',
      sprite: 'villagerAlt',
      movement: 'static',
      dialogue: [
        {
          when: 'trainer:route1Scout',
          pages: [
            'That was a clean round. You have got the measure of it.',
            'Osrin is up past the bend. Mind the grass on the way.',
          ],
        },
        {
          action: 'trainer:route1Scout',
          pages: [
            'You walk like someone with a partner. Let me see it!',
          ],
        },
      ],
    },
    {
      id: 'route1Treader',
      name: 'Osrin',
      trainer: 'route1Treader',
      sightRange: 4,
      // On the western jog, watching the path where it bends.
      x: 9,
      y: 17,
      facing: 'left',
      sprite: 'villager',
      movement: 'static',
      dialogue: [
        {
          when: 'trainer:route1Treader',
          pages: [
            'Two of mine and you still walked away. I am going to sit down.',
            'Halla is up by the gate. She has been there all week.',
          ],
        },
        {
          action: 'trainer:route1Treader',
          pages: [
            'I have been in that grass since dawn. You look fresher than I feel.',
          ],
        },
      ],
    },
    {
      id: 'route1Aspirant',
      name: 'Halla',
      trainer: 'route1Aspirant',
      sightRange: 4,
      // By the gate, watching the last stretch before the warden.
      x: 13,
      y: 5,
      facing: 'left',
      sprite: 'child',
      movement: 'static',
      dialogue: [
        {
          when: 'trainer:route1Aspirant',
          pages: [
            'Well fought. I will be through that gate right behind you.',
            'Thistlewood has a Beacon Hall, you know. That is where I am headed.',
          ],
        },
        {
          action: 'trainer:route1Aspirant',
          pages: [
            'Waiting on the gate too? Everyone is.',
          ],
        },
      ],
    },
    {
      id: 'wanderingKid',
      name: 'Kid',
      x: 16,
      y: 26,
      facing: 'down',
      sprite: 'child',
      movement: 'wander',
      wanderRadius: 3,
      dialogue: [
        {
          pages: [
            'I am not allowed in the tall grass on my own!',
            'When I am a Warden I will go wherever I like.',
          ],
        },
      ],
    },
  ],

  interactables: [
    {
      x: 9,
      y: 4,
      type: 'sign',
      dialogue: [
        'ROUTE 1 — THE CINDERPATH',
        'North: Thistlewood (gate closed).  South: Emberhollow Town.',
      ],
    },
    {
      // A real pickup: it goes into your bag and stays gone once taken.
      x: 13,
      y: 8,
      type: 'item',
      item: 'potion',
      quantity: 1,
      flag: 'pickedUpRoute1Potion',
    },
    {
      x: 4,
      y: 24,
      type: 'item',
      item: 'basicOrb',
      quantity: 2,
      flag: 'pickedUpRoute1Orbs',
    },
  ],
};
