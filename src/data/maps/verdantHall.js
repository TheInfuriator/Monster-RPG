/**
 * verdantHall.js — The Verdant Hall, Thistlewood
 * ----------------------------------------------------------------------------
 * The region's first Beacon Hall: an overgrown greenhouse where the hedges are
 * the walls, exactly as the design document has always said.
 *
 *   h  hedge (a wall)     g  garden soil      x  root switch
 *   p  planter            M  door mat         _  the greenhouse frame
 *
 * THE SHAPE
 * A walkway runs up the west side, up the east side, and along the south — and
 * the two sides meet ONLY along the south. Everything else is one solid block
 * of hedge with three lanes cut through it, each closed by a hedge gate.
 *
 * THE PUZZLE — three root switches, exactly as documented
 * Stepping on a root switch RETRACTS one hedge and EXTENDS another. Never one
 * without the other, which is what makes the order matter:
 *
 *   rootSouth  by the door      retract hedgeWest   extend hedgeEast
 *   rootWest   past Teal        retract hedgeEast   extend hedgeNorth
 *   rootEast   past Bracken     retract hedgeNorth  extend hedgeWest
 *
 * Everything starts shut. Reaching Fern needs hedgeEast AND hedgeNorth open at
 * once, which is rootWest then rootEast — and getting to either of those means
 * walking through a Gardener's line of sight, so the fights are the puzzle's
 * price rather than an obstacle bolted beside it. rootSouth is the free one by
 * the door: it opens the west pocket and its Super Potion, and it teaches what
 * a switch does before anything is riding on it.
 *
 * WHY THE PLAYER CAN NEVER BE TRAPPED
 * Every switch stands on the WALKWAY, and no barrier is ever on the walkway.
 * So whatever state the hedges are in, the player can always reach the door
 * and can always reach all three switches. `tests/puzzle.test.js` proves it by
 * walking every reachable configuration rather than taking my word for it.
 *
 * The reset root by the door puts everything back to how it was found. It is
 * a convenience, not a rescue — the puzzle cannot get stuck.
 */

export const verdantHall = {
  id: 'verdantHall',
  name: 'The Verdant Hall',
  interior: true,
  objectBase: 'g',
  music: 'town',

  tiles: [
    // 0         1         2
    // 012345678901234567890
    '_____________________', //  0
    '_gghhhhhhhhhhhhhhhgg_', //  1
    '_gghhhhhhhhhhhhhhhgg_', //  2
    '_gghhhhhhhhhhhhhhhgg_', //  3
    '_gghhhhggggggghhhhxg_', //  4  Fern's sanctum;  rootEast at (18,4)
    '_gxhhhhggggggghhhhgg_', //  5  rootWest at (2,5)
    '_gghhhhhhhghhhhhhhgg_', //  6  hedgeNorth stands at (10,6)
    '_gghhhhhhhghhhhhhggg_', //  7  Gardener Bracken's alcove at (17,7)
    '_gghhhhhhhghhhhhhhgg_', //  8
    '_gghhhhhhhghhhhhhhgg_', //  9
    '_ggghhhhhhghhhhhhhgg_', // 10  Gardener Teal's alcove at (3,10)
    '_gghhhhhhhghhhhhhhgg_', // 11
    '_gghhhhhhhgggggggggg_', // 12  the east corridor; hedgeEast at (17,12)
    '_gggggghhhhhhhhhhhgg_', // 13  hedgeWest at (3,13); the west pocket
    '_gghhhhhphhhphhhhhgg_', // 14  the reset root and the Hall's notice
    '_ggggggggggggggggggg_', // 15
    '_ggggxgggggggggggggg_', // 16  rootSouth at (5,16)
    '__________M__________', // 17  the way out
    '_____________________', // 18
  ],

  /**
   * The three hedge gates.
   *
   * `openWhen: 'badge:verdantSigil'` makes every one of them stand open for
   * good once the Sigil has been won — Fern lets the hedges rest. Before that,
   * the switches decide, and what they decide is saved in
   * `gameState.puzzles.verdantHall`.
   */
  barriers: [
    {
      id: 'hedgeWest',
      name: 'the west hedge',
      tile: 'h',
      tiles: [[3, 13]],
      closed: true,
      openWhen: 'badge:verdantSigil',
    },
    {
      id: 'hedgeEast',
      name: 'the east hedge',
      tile: 'h',
      tiles: [[17, 12]],
      closed: true,
      openWhen: 'badge:verdantSigil',
    },
    {
      id: 'hedgeNorth',
      name: 'the north hedge',
      tile: 'h',
      tiles: [[10, 6]],
      closed: true,
      openWhen: 'badge:verdantSigil',
    },
  ],

  switches: [
    {
      id: 'rootSouth',
      name: 'the porch root',
      x: 5,
      y: 16,
      retract: 'hedgeWest',
      extend: 'hedgeEast',
    },
    {
      id: 'rootWest',
      name: 'the west root',
      x: 2,
      y: 5,
      retract: 'hedgeEast',
      extend: 'hedgeNorth',
    },
    {
      id: 'rootEast',
      name: 'the east root',
      x: 18,
      y: 4,
      retract: 'hedgeNorth',
      extend: 'hedgeWest',
    },
  ],

  spawnPoints: {
    default: { x: 10, y: 16, facing: 'up' },
  },

  exits: [{ x: 10, y: 17, to: 'thistlewood', spawn: 'fromVerdantHall' }],

  npcs: [
    {
      id: 'hallKeeper',
      name: 'Hall Keeper Sorrel',
      x: 12,
      y: 16,
      facing: 'left',
      sprite: 'villagerAlt',
      movement: 'static',
      dialogue: [
        {
          when: 'badge:verdantSigil',
          pages: [
            'Sigil-bearer. The hedges know you now — they will not close on you again.',
            'Come back whenever. Fern likes visitors almost as much as she likes winning.',
          ],
        },
        {
          pages: [
            'The Verdant Hall. Leader Fern is at the top, behind three hedges.',
            'Step on a root coil and one hedge draws back while another grows across. Always both — that is the whole trick of it.',
            'Two Gardeners between you and her, and neither of them steps aside.',
          ],
        },
      ],
    },
    // --- The Gardeners ------------------------------------------------------
    // Both stand in dead-end alcoves off the walkway, looking straight across
    // it. That way neither can ever block the way past — an NPC in a corridor
    // is a wall — while their sight lanes still cover both walkway columns, so
    // the way up either side goes through a fight.
    {
      id: 'verdantGardenerTeal',
      name: 'Teal',
      trainer: 'verdantGardenerTeal',
      sightRange: 3,
      x: 3,
      y: 10,
      facing: 'left',
      sprite: 'villager',
      movement: 'static',
      dialogue: [
        {
          when: 'trainer:verdantGardenerTeal',
          pages: [
            'Go on up. The west coil is past me — you will want it.',
            'Remember it CLOSES one as it opens one. Everyone forgets that bit.',
          ],
        },
        {
          action: 'trainer:verdantGardenerTeal',
          pages: [
            'Nobody walks up my side of the Hall without a round first.',
          ],
        },
      ],
    },
    {
      id: 'verdantGardenerBracken',
      name: 'Bracken',
      trainer: 'verdantGardenerBracken',
      sightRange: 3,
      x: 17,
      y: 7,
      facing: 'right',
      sprite: 'villagerAlt',
      movement: 'static',
      dialogue: [
        {
          when: 'trainer:verdantGardenerBracken',
          pages: [
            'Fair. The east coil is behind me — take it.',
            'Then find your way round to the corridor. It is not far once the hedges agree with you.',
          ],
        },
        {
          action: 'trainer:verdantGardenerBracken',
          pages: [
            'Two hedges and one Gardener between you and the Leader. I am the Gardener.',
          ],
        },
      ],
    },
    // --- The Leader ---------------------------------------------------------
    // No sight range: you come to Fern, she does not come to you. Her Sigil is
    // declared on her TRAINER entry, so beating her awards it with no code in
    // this file and none in WorldScene that mentions her by name.
    {
      id: 'verdantLeaderFern',
      name: 'Fern',
      trainer: 'verdantLeaderFern',
      x: 10,
      y: 4,
      facing: 'down',
      sprite: 'researcher',
      movement: 'static',
      dialogue: [
        {
          // Gated on the DEFEAT record, not on the Sigil. Beating her is what
          // must stop her offering another fight; the Sigil is the reward for
          // it, and a reward should never be what closes a rematch.
          when: 'trainer:verdantLeaderFern',
          pages: [
            'The Sigil suits you. Do not let it make you lazy.',
            'Tidewatch next, when the Thornway is cut back. Their Leader is nothing like me.',
          ],
        },
        {
          action: 'trainer:verdantLeaderFern',
          pages: [
            'You found your way through. Most people give up at the second hedge.',
            'I am Fern. I grew every wall in this building, and I have never lost in it.',
          ],
        },
      ],
    },
  ],

  interactables: [
    {
      // The way out of a tangle. The puzzle cannot get stuck, so this is a
      // convenience — but it is here, visible, and it says what it does.
      x: 8,
      y: 14,
      type: 'sign',
      dialogue: [
        {
          action: 'resetPuzzle',
          pages: [
            'A knot of pale dormant roots, thick as an arm.',
            'You take hold and pull. Somewhere in the Hall, hedges shift back to where they started.',
          ],
        },
      ],
    },
    {
      x: 12,
      y: 14,
      type: 'sign',
      dialogue: [
        'HALL RULES',
        '1. The root coils are for challengers. Use them.',
        '2. No cutting. No climbing. No burning — Fern will know.',
        '3. The Leader does not come down. You come up.',
      ],
    },
    {
      // Behind the west hedge: worth opening even though it is not the way on.
      x: 6,
      y: 13,
      type: 'item',
      item: 'superPotion',
      quantity: 1,
      flag: 'pickedUpVerdantPotion',
    },
  ],
};
