/**
 * route2.js — Route 2, the Thornway
 * ----------------------------------------------------------------------------
 * The road north out of Thistlewood, opened in Phase 11 by beating Kestrel at
 * the Thornway gate. It climbs through bramble cutting and thicket, over the
 * Brow, and up a scree slope to the mouth of Mistvault Cavern — which the
 * Wardens have roped off. That cordon is where Phase 11 ends.
 *
 * THE SHAPE, SOUTH TO NORTH
 *   the cutting   rows 38-49  the road from Thistlewood, the bramble crew, a
 *                             trainer, a grassy pocket to the west, and two
 *                             trails east to the dry spring (a loop).
 *   the thicket   rows 21-37  tall grass everywhere. The road FORKS round a
 *                             bramble island (one gap, one item inside) and
 *                             meets itself again; a trainer watches each fork.
 *   the Brow      row 20      where the trees stop and the rock starts.
 *   the scree     rows 10-19  a gravel road up a scree slope — the route's
 *                             second habitat, with its own wild Aethers — a
 *                             trainer on a spur and items in the far corners.
 *   the gully     rows 4-9    one tile wide, straight up into Kestrel's sight.
 *   the landing   rows 0-3    Mistvault's mouth behind the Wardens' cordon.
 *
 * TWO HABITATS, ONE MAP
 * Tall grass rolls on `route2Thicket`, scree on `route2Scree` — see
 * `encounters.byTerrain` below and src/data/encounters.js.
 *
 *   .  grass       "  tall grass      *  scree        -  road    =  gravel
 *   T  tree        &  bramble        %  rock face    @  boulder
 *   u  dry spring  j  survey stake   X  cave mouth   S  sign   $  sign on rock
 *   +  the cordon (drawn by the barrier at the top, not written in the grid)
 */

import { TRAINERS } from '../trainers.js';

export const route2 = {
  id: 'route2',
  name: 'Route 2 — The Thornway',
  music: 'route',

  // The thickets and the scree turn up different Aethers. The rate and the
  // cooldown are shared: it is one road, walked in one go.
  encounters: {
    table: 'route2Thicket',
    byTerrain: { scree: 'route2Scree' },
  },

  /**
   * The Wardens' cordon across Mistvault Cavern.
   *
   * `mistvaultOpen` is a flag NOTHING sets in Phase 11, so the cordon stays
   * up and the cavern is visible but unreachable — the same honest seam the
   * Thornway gate was before this phase. Phase 12 (the dungeon) opens it with
   * one flag, and adds the cavern's exit tiles behind it.
   */
  barriers: [
    {
      id: 'mistvaultCordon',
      name: 'the Wardens\' cordon',
      tile: '+',
      tiles: [[13, 2], [14, 2], [15, 2], [16, 2]],
      closed: true,
      openWhen: 'mistvaultOpen',
    },
  ],

  tiles: [
    // 0         1         2
    // 012345678901234567890123456789
    '%%%%%%%%%%%%%XXXX%%%%%%%%%%%%%', //  0  Mistvault Cavern — the end of Phase 11
    '%%%%%%%%%%%%%XXXX%%%%%%%%%%%%%', //  1
    '%%%%%%%%%%%@@----@@%%%%%%%%%%%', //  2  the Wardens' cordon at (13..16, 2)
    '%%%%%%%%%%$==========%%%%%%%%%', //  3  the landing: sign (10,3), Warden Corran (20,3)
    '%%%%%%%%%%%%@==@%%%%%%%%%%%%%%', //  4  Kestrel waits at (14,4), looking down the gully
    '%%%%%%%%%%%%@==@%%%%%%%%%%%%%%', //  5
    '%%%%%%%%%%%%%@=@%%%%%%%%%%%%%%', //  6  the gully — one tile wide, in Kestrel's sight
    '%%%%%%%%%%%%%@=@%%%%%%%%%%%%%%', //  7
    '%%%%%%%%%%%%%@=@%%%%%%%%%%%%%%', //  8
    '%%%%%%%%%%%%%@=@%%%%%%%%%%%%%%', //  9
    '%%%%%%%%%%%%@*=**@%%%%%%%%%%%%', // 10
    '%%%%%%%%%%%@**==**@%%%%%%%%%%%', // 11
    '%%%%%%%%%@@***==***@@%%%%%%%%%', // 12  the scree slope (scree = wild Aethers)
    '%%%%%%@@******==******@@%%%%%%', // 13
    '%%%%@****@****==****@*****@%%%', // 14
    '%%%@*****@@***=======***@*@%%%', // 15  Dunmore's gravel spur; great orb at (5,15)
    '%%%@**@*****@*==****@*****@%%%', // 16
    '%%%@*********@==@*********@%%%', // 17  super potion at (25,17)
    '%%%%@@******@@==@@*******@%%%%', // 18
    '%%%%%%@@@@@@@@==@@@@@@@@%%%%%%', // 19
    'TTTTTT%%%%%%%S--%%%%%%%%TTTTTT', // 20  THE BROW — sign at (13,20)
    'TTT""""""&&&..--..&&&""""""TTT', // 21  the thicket (tall grass); rouser at (4,21)
    'TTT""""""&&...--...&&""""""TTT', // 22
    'TTT""&&&&&&&..--..&&&&&&&""TTT', // 23
    'TTT"""------------------"""TTT', // 24  the road forks round the bramble island
    'TTT"""--.&&&&&&&&&&&&.--"""TTT', // 25
    'TTT"""--.&""""""""""&.--"""TTT', // 26
    'TTT"""--.&""""""""""&.--"".TTT', // 27  Tamsin (26,27) watches the east road; potion in the island
    'TTT.""--.&""""""""""&.--"""TTT', // 28  Maren (3,28) watches the west road
    'TTT"""--.&""""""""""&.--"""TTT', // 29
    'TTT"""--.&""""""""""&.--"""TTT', // 30
    'TTT"""--.&&&&&""&&&&&.--"""TTT', // 31  the island's one way in
    'TTT"""------------------"""TTT', // 32  the two roads meet again
    'TTT&&&&&&&&&&.--..&&&&&&&&&TTT', // 33
    'TTT&&"""""""".--..&..uuuu.&TTT', // 34  the dry spring: ultra orb (25,34), survey stake (20,35)
    'TTT&&"""""""".--..&.juuuu.&TTT', // 35
    'TTT&&"""""""".--..&..uuuu.&TTT', // 36  Tobiah at (19,36)
    'TTT&&"""""""".--..&.......&TTT', // 37
    'TTT&&&&&&&&&&.--..&&&&-&&-&TTT', // 38  two trails down from the spring
    'TTT&..........--..&&&&-&&-&TTT', // 39
    'TTT&.&&&&&....--..&"""-""-&TTT', // 40
    'TTT&......&&..--..&"""-""-&TTT', // 41  Hollis (17,41) watches the cutting
    'TTT&......&&..--..&"""-""-&TTT', // 42
    'TTT&""""""....---------""-&TTT', // 43  the spring trail leaves the road
    'TTT&""""""....--""""""&""-&TTT', // 44  Ansel (12,44); burn salve at (4,45)
    'TTT&""""""....--""""""&""-&TTT', // 45
    'TTT&""""""....------------&TTT', // 46  the loop back from the spring
    'TTT&&&&&.....S--..&&&&&&&&&TTT', // 47  sign (13,47)
    'TTT&&&&&......--..&&&&&&&&&TTT', // 48
    'TTTTTTTTTTTTTT--TTTTTTTTTTTTTT', // 49  south exit to Thistlewood
  ],

  spawnPoints: {
    // Arriving from Thistlewood: just inside the southern treeline.
    fromThistlewood: { x: 14, y: 48, facing: 'up' },
    default: { x: 14, y: 48, facing: 'up' },
  },

  exits: [
    { x: 14, y: 49, to: 'thistlewood', spawn: 'fromRoute2' },
    { x: 15, y: 49, to: 'thistlewood', spawn: 'fromRoute2' },
  ],

  npcs: [
    // --- The cutting ---------------------------------------------------------
    {
      id: 'brambleCrew',
      name: 'Ansel',
      x: 12,
      y: 44,
      facing: 'right',
      sprite: 'villager',
      movement: 'lookAround',
      dialogue: [
        {
          when: 'trainer:kestrelRoute2',
          pages: [
            'Back down already? Your friend is still up at the cavern, arguing with a Warden.',
            'Spring is still dry, too. Three hundred years it ran. Now this.',
          ],
        },
        {
          pages: [
            'We cut this road clear at last. Took all winter.',
            'Your friend went tearing up it this morning. Said to tell you to hurry.',
            'Something is off, mind. The spring up the east trail has run dry, and the wild ones are jumpy.',
          ],
        },
      ],
    },
    {
      id: 'route2Cutter',
      name: 'Hollis',
      trainer: 'route2Cutter',
      sightRange: 4,
      // Beside the road, watching both lanes of it.
      x: 17,
      y: 41,
      facing: 'left',
      sprite: 'villagerAlt',
      movement: 'static',
      dialogue: [
        {
          when: 'trainer:route2Cutter',
          pages: [
            'If you are heading up, the thicket forks round a bramble island. Both ways come out at the Brow.',
            'Keep something that bites on hand. The scree past the Brow is all rock and earth.',
          ],
        },
        {
          action: 'trainer:route2Cutter',
          pages: ['The crew said a Warden might come up the cutting. Nobody said I could not test one!'],
        },
      ],
    },

    // --- The dry spring ---------------------------------------------------------
    {
      id: 'springKeeper',
      name: 'Tobiah',
      x: 19,
      y: 36,
      facing: 'right',
      sprite: 'elder',
      movement: 'static',
      dialogue: [
        {
          pages: [
            'This spring has run for three hundred years. Four days ago it stopped. Just stopped.',
            'Then someone drove that stake into the basin. Grey tag, a hollow ring stamped on it. Nobody from round here.',
            'The Wardens say the aether currents under the Thornway are running thin. Running toward Mistvault, if you ask me.',
          ],
        },
      ],
    },

    // --- The thicket ---------------------------------------------------------
    {
      id: 'route2Forager',
      name: 'Maren',
      trainer: 'route2Forager',
      sightRange: 4,
      // West of the west road, looking across it.
      x: 3,
      y: 28,
      facing: 'right',
      sprite: 'villager',
      movement: 'static',
      dialogue: [
        {
          when: 'trainer:route2Forager',
          pages: [
            'If you took the fire one, a Zaplet or a Vinelet from this grass will serve you well against water.',
            'They are both in here somewhere. Keep your eyes open.',
          ],
        },
        {
          action: 'trainer:route2Forager',
          pages: ['Mind where you tread — I have been gathering in this grass since sunrise.'],
        },
      ],
    },
    {
      id: 'route2Lookout',
      name: 'Tamsin',
      trainer: 'route2Lookout',
      sightRange: 4,
      // East of the east road, looking across it.
      x: 26,
      y: 27,
      facing: 'left',
      sprite: 'child',
      movement: 'static',
      dialogue: [
        {
          when: 'trainer:route2Lookout',
          pages: [
            'You can see the whole scree from the Brow. Something is digging up there — the slides never stop.',
            'Delvit and Pebblit. Rock and earth. Good against anything fiery, if you catch one.',
          ],
        },
        {
          action: 'trainer:route2Lookout',
          pages: ['Storm coming off the Brow. My Zaplet can feel it — and it wants a fight first.'],
        },
      ],
    },

    // --- The scree -----------------------------------------------------------
    {
      id: 'route2ScreeWalker',
      name: 'Dunmore',
      trainer: 'route2ScreeWalker',
      sightRange: 5,
      // At the end of a gravel spur, looking back along it to the road.
      x: 20,
      y: 15,
      facing: 'left',
      sprite: 'elder',
      movement: 'static',
      dialogue: [
        {
          when: 'trainer:route2ScreeWalker',
          pages: [
            'Cave-dwellers on the open slope, in daylight. Something in Mistvault is pushing them out.',
            'The gully up to the cavern is narrow. Whoever is waiting at the top will see you coming.',
          ],
        },
        {
          action: 'trainer:route2ScreeWalker',
          pages: ['The whole slope has been shifting all week. Let us see if you keep your footing!'],
        },
      ],
    },

    // --- The landing ---------------------------------------------------------
    {
      // THE RIVAL — second meeting. Not gated by anything the player can miss
      // (you cannot be on Route 2 without beating the first), and unlike the
      // first, Kestrel STAYS afterwards: there is nowhere to go until the
      // cordon comes down.
      id: 'kestrelCordon',
      name: 'Kestrel',
      trainer: 'kestrelRoute2',
      sightRange: 5,
      x: 14,
      y: 4,
      facing: 'down',
      sprite: 'rival',
      movement: 'static',
      presentWhen: 'trainer:kestrelThornway',
      // After a challenge they are standing in the one-tile gully: walk back
      // up to the landing, or nobody gets past until the map reloads.
      returnAfterDefeat: true,
      dialogue: [
        {
          when: 'trainer:kestrelRoute2',
          pages: [
            'Two for two. Do not get used to it.',
            'The Warden says the Circle is sending someone. When that cordon comes down, I will race you through.',
          ],
        },
        ...TRAINERS.kestrelRoute2.intro.map((branch) => ({
          ...branch,
          action: 'trainer:kestrelRoute2',
        })),
      ],
    },
    {
      id: 'cordonWarden',
      name: 'Warden Corran',
      x: 20,
      y: 3,
      facing: 'left',
      sprite: 'villagerAlt',
      movement: 'static',
      dialogue: [
        {
          when: 'trainer:kestrelRoute2',
          pages: [
            'Your friend has been arguing with me for an hour. The answer is still no.',
            'When the Circle sends word, you two will be the first to hear it. Until then the cavern stays shut.',
          ],
        },
        {
          pages: [
            'Mistvault Cavern is closed. Warden Circle orders — no one goes in, Sigil or no Sigil.',
            'Something in there is drawing the aether out of the ground. The dry spring, the restless Aethers on the scree — it all runs back here.',
            'The Circle is sending someone to look. Until then, this is as far as the Thornway goes.',
          ],
        },
      ],
    },
  ],

  interactables: [
    {
      x: 13,
      y: 47,
      type: 'sign',
      dialogue: [
        'ROUTE 2 — THE THORNWAY',
        'North: the Brow, the scree road and Mistvault Cavern.  South: Thistlewood.',
      ],
    },
    {
      x: 13,
      y: 20,
      type: 'sign',
      dialogue: [
        'THE BROW',
        'Scree road beyond. Loose footing, and wild Aethers in the slides.',
      ],
    },
    {
      x: 10,
      y: 3,
      type: 'sign',
      dialogue: [
        'MISTVAULT CAVERN — the cavern road to Tidewatch Harbor',
        'CLOSED by order of the Warden Circle. No entry until further notice.',
      ],
    },
    {
      // The first thread of the story beyond Phase 11. It names no one.
      x: 20,
      y: 35,
      type: 'sign',
      dialogue: [
        'A surveyor\'s stake, driven deep into the dry basin.',
        'Its grey tag is stamped with a hollow ring crossed by a line, like a weathervane with nothing at its heart.',
        'Under it, in small print: SURVEY 14 — CURRENT DRAW. No name.',
      ],
    },

    // Ground items, each worth a detour.
    { x: 4, y: 45, type: 'item', item: 'burnSalve', quantity: 1, flag: 'pickedUpRoute2Salve' },
    { x: 25, y: 34, type: 'item', item: 'ultraOrb', quantity: 1, flag: 'pickedUpRoute2UltraOrb' },
    { x: 14, y: 27, type: 'item', item: 'superPotion', quantity: 2, flag: 'pickedUpRoute2IslandPotion' },
    { x: 4, y: 21, type: 'item', item: 'rouser', quantity: 1, flag: 'pickedUpRoute2Rouser' },
    { x: 5, y: 15, type: 'item', item: 'greatOrb', quantity: 2, flag: 'pickedUpRoute2GreatOrbs' },
    { x: 25, y: 17, type: 'item', item: 'superPotion', quantity: 1, flag: 'pickedUpRoute2ScreePotion' },
  ],
};
