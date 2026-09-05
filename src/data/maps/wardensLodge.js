/**
 * wardensLodge.js — Professor Wick's research lodge, Emberhollow Town
 * ----------------------------------------------------------------------------
 * Where the story begins. Choosing a starter Aether happens here in Phase 3;
 * for now Wick explains the world and the Aether currents.
 */

export const wardensLodge = {
  id: 'wardensLodge',
  name: "Warden's Lodge",
  interior: true,
  objectBase: 'o',
  music: 'town',

  tiles: [
    // 0    5    10
    '_____________', // 0
    '_I_________I_', // 1
    '|||||||||||||', // 2
    '_BBBoooooBBB_', // 3
    '_ooooooooooo_', // 4
    '_oAAoooooAAo_', // 5
    '_ooooooooooo_', // 6
    '_oPoooooooPo_', // 7
    '_ooooMoooooo_', // 8  door mat at x5
    '_____________', // 9
  ],

  spawnPoints: {
    default: { x: 5, y: 7, facing: 'down' },
  },

  exits: [{ x: 5, y: 8, to: 'emberhollow', spawn: 'fromWardensLodge' }],

  npcs: [
    {
      id: 'professorWick',
      name: 'Prof. Wick',
      x: 6,
      y: 4,
      facing: 'down',
      sprite: 'researcher',
      movement: 'static',
      dialogue: [
        {
          // After the starter is chosen, Wick has nothing left to hand over.
          when: 'gotStarter',
          pages: [
            'How are the two of you getting on?',
            'Head north when you are ready. The Cinderpath is gentle enough for a first walk.',
            'And do come back and tell me what you find. That is half of what a Warden is for.',
          ],
        },
        {
          // Second visit before choosing: straight back to the cases.
          when: 'metWick',
          action: 'starterSelect',
          pages: [
            'Back again — good. The cases are open, so take your time.',
            'Three of them. One is going to suit you better than the others.',
          ],
        },
        {
          // The first conversation: introduction, then the choice.
          setFlags: 'metWick',
          action: 'starterSelect',
          pages: [
            'Ah — there you are! I was beginning to think you had slept through it.',
            'I am Wick. I study Aethers: the creatures born from the currents that run beneath Aetheria.',
            'Most folk never see one up close. Wardens do. Wardens walk with them.',
            'I am going to make you a Warden. And not empty-handed, either.',
            'Three young Aethers have been waiting for someone to walk with. Go on — have a proper look.',
          ],
        },
      ],
    },
    {
      id: 'lodgeAssistant',
      name: 'Assistant',
      x: 10,
      y: 6,
      facing: 'left',
      sprite: 'villager',
      movement: 'lookAround',
      dialogue: [
        {
          when: 'gotStarter',
          pages: [
            'Good pick. They all are, really — that is rather the point.',
            'Feed it, rest it at the Mender\u2019s Hall, and it will not let you down.',
          ],
        },
        {
          when: 'metWick',
          pages: [
            'She has been rehearsing that speech for a week. Do not tell her I said so.',
          ],
        },
        {
          pages: [
            'The Professor is just there. Go on, say hello!',
            'She does not bite. Her research notes might.',
          ],
        },
      ],
    },
  ],

  interactables: [
    {
      x: 2,
      y: 3,
      type: 'sign',
      dialogue: [
        'Field journals, stacked three deep.',
        '"Current density falls sharply north of Thistlewood. Cause unknown."',
      ],
    },
    {
      x: 10,
      y: 3,
      type: 'sign',
      dialogue: 'A map of Aetheria, covered in pins and crossings-out.',
    },
  ],
};
