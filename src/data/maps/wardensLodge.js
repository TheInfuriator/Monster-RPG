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
          when: 'metWick',
          pages: [
            'The currents run right under this valley, you know.',
            'Everything an Aether is, it owes to them.',
            'Rest up. I will have something for you shortly.',
          ],
        },
        {
          // Talking to Wick the first time is what starts the story.
          setFlags: 'metWick',
          pages: [
            'Ah — there you are! I was beginning to think you had slept through it.',
            'I am Wick. I study Aethers: the creatures born from the currents that run beneath Aetheria.',
            'Most folk never see one up close. Wardens do. Wardens walk with them.',
            'I am going to make you a Warden. But not empty-handed — give me a moment to fetch the cases.',
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
