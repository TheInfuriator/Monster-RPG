/**
 * TextureFactory.js
 * ----------------------------------------------------------------------------
 * Draws every placeholder texture the game uses, at runtime, onto canvases.
 *
 * WHY GENERATE ART INSTEAD OF SHIPPING IMAGES?
 *  - No binary files in the repository and no third-party licensing risk.
 *  - Everything shares one palette, so the game looks deliberate rather than
 *    like a pile of unrelated clip art.
 *  - Replacing it later is easy: load real images under the same keys (see
 *    `src/config/assets.js`) and delete the matching generator below.
 *
 * All drawing uses the plain Canvas 2D API, so you do not need to know Phaser to
 * read it. Randomness is seeded, so a grass tile looks identical on every reload.
 */

import { TILE_SIZE, COLORS } from '../config/gameConfig.js';
import {
  ASSET_KEYS,
  PLAYER_FRAME,
  CHARACTER_PALETTES,
  CREATURE_SPRITE_SIZE,
  badgeTextureKey,
  characterTextureKey,
  creatureTextureKey,
} from '../config/assets.js';
import { CREATURES } from '../data/creatures.js';
import { BADGES } from '../data/badges.js';
import { getTypeColor, getTypeDarkColor } from './TypeChart.js';
import { createSeededRandom } from '../utils/rng.js';

/** Convert a 0xRRGGBB number into a '#rrggbb' string the canvas API understands. */
function hex(color) {
  return `#${color.toString(16).padStart(6, '0')}`;
}

/** Create a blank canvas and its 2D drawing context. */
function makeCanvas(width, height) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  return { canvas, ctx };
}

/** Fill a rectangle. A shorthand used constantly below. */
function rect(ctx, x, y, w, h, color) {
  ctx.fillStyle = hex(color);
  ctx.fillRect(x, y, w, h);
}

/**
 * Scatter small square specks across a tile so flat colours get some texture.
 * Seeded, so the pattern is stable between reloads.
 */
function speckle(ctx, color, count, seed, size = 2, area = TILE_SIZE) {
  const random = createSeededRandom(seed);
  ctx.fillStyle = hex(color);
  for (let i = 0; i < count; i += 1) {
    const x = Math.floor(random() * (area - size));
    const y = Math.floor(random() * (area - size));
    ctx.fillRect(x, y, size, size);
  }
}

// ---------------------------------------------------------------------------
// Tile generators. Each returns a finished 32x32 canvas.
// ---------------------------------------------------------------------------

const TILE_GENERATORS = {
  'tile-grass': () => {
    const { canvas, ctx } = makeCanvas(TILE_SIZE, TILE_SIZE);
    rect(ctx, 0, 0, TILE_SIZE, TILE_SIZE, COLORS.grass);
    speckle(ctx, COLORS.grassDark, 14, 1001);
    return canvas;
  },

  'tile-grass-alt': () => {
    const { canvas, ctx } = makeCanvas(TILE_SIZE, TILE_SIZE);
    rect(ctx, 0, 0, TILE_SIZE, TILE_SIZE, COLORS.grass);
    speckle(ctx, COLORS.grassDark, 20, 2002);
    speckle(ctx, COLORS.tallGrass, 5, 2003);
    return canvas;
  },

  // Tall grass must be obvious at a glance: it is where wild creatures appear,
  // so the player has to be able to tell instantly whether they are safe.
  // It gets a darker base AND a dense blade pattern, not just a few tufts.
  'tile-tall-grass': () => {
    const { canvas, ctx } = makeCanvas(TILE_SIZE, TILE_SIZE);
    rect(ctx, 0, 0, TILE_SIZE, TILE_SIZE, COLORS.tallGrassDark);

    // Rows of chunky blades, offset each row so it reads as dense undergrowth.
    for (let row = 0; row < 4; row += 1) {
      const y = row * 8;
      const offset = row % 2 === 0 ? 0 : 4;
      for (let i = 0; i < 4; i += 1) {
        const x = offset + i * 8;
        rect(ctx, x, y + 3, 3, 6, COLORS.tallGrass);
        rect(ctx, x + 1, y, 2, 4, 0x54a047); // bright blade tip
        rect(ctx, x + 4, y + 5, 2, 4, COLORS.tallGrassDark);
      }
    }
    return canvas;
  },

  'tile-path': () => {
    const { canvas, ctx } = makeCanvas(TILE_SIZE, TILE_SIZE);
    rect(ctx, 0, 0, TILE_SIZE, TILE_SIZE, COLORS.path);
    speckle(ctx, COLORS.pathDark, 16, 4004);
    return canvas;
  },

  'tile-path-alt': () => {
    const { canvas, ctx } = makeCanvas(TILE_SIZE, TILE_SIZE);
    rect(ctx, 0, 0, TILE_SIZE, TILE_SIZE, COLORS.path);
    speckle(ctx, COLORS.pathDark, 26, 5005);
    speckle(ctx, COLORS.sand, 8, 5006);
    return canvas;
  },

  'tile-sand': () => {
    const { canvas, ctx } = makeCanvas(TILE_SIZE, TILE_SIZE);
    rect(ctx, 0, 0, TILE_SIZE, TILE_SIZE, COLORS.sand);
    speckle(ctx, COLORS.path, 12, 6006);
    return canvas;
  },

  'tile-flowers': () => {
    const { canvas, ctx } = makeCanvas(TILE_SIZE, TILE_SIZE);
    rect(ctx, 0, 0, TILE_SIZE, TILE_SIZE, COLORS.grass);
    speckle(ctx, COLORS.grassDark, 10, 7007);
    const petals = [COLORS.accent, COLORS.danger, COLORS.parchment];
    const random = createSeededRandom(7008);
    for (let i = 0; i < 5; i += 1) {
      const x = 4 + Math.floor(random() * (TILE_SIZE - 12));
      const y = 4 + Math.floor(random() * (TILE_SIZE - 12));
      const color = petals[i % petals.length];
      rect(ctx, x + 2, y, 2, 2, color);
      rect(ctx, x, y + 2, 6, 2, color);
      rect(ctx, x + 2, y + 4, 2, 2, color);
      rect(ctx, x + 2, y + 2, 2, 2, COLORS.accentDark);
    }
    return canvas;
  },

  'tile-water': () => {
    const { canvas, ctx } = makeCanvas(TILE_SIZE, TILE_SIZE);
    rect(ctx, 0, 0, TILE_SIZE, TILE_SIZE, COLORS.water);
    // Gentle horizontal wave dashes.
    rect(ctx, 4, 8, 10, 2, COLORS.waterDark);
    rect(ctx, 18, 14, 9, 2, COLORS.waterDark);
    rect(ctx, 6, 22, 12, 2, COLORS.waterDark);
    rect(ctx, 21, 4, 7, 2, COLORS.waterDark);
    return canvas;
  },

  'tile-tree': () => {
    const { canvas, ctx } = makeCanvas(TILE_SIZE, TILE_SIZE);
    rect(ctx, 0, 0, TILE_SIZE, TILE_SIZE, COLORS.grass);
    speckle(ctx, COLORS.grassDark, 8, 8008);
    // Trunk, then a chunky blob canopy.
    rect(ctx, 13, 22, 6, 8, COLORS.treeTrunk);
    rect(ctx, 6, 4, 20, 18, COLORS.tree);
    rect(ctx, 4, 8, 24, 10, COLORS.tree);
    rect(ctx, 8, 2, 16, 4, COLORS.tree);
    // Shading on the lower-right, highlight on the upper-left.
    rect(ctx, 16, 14, 10, 8, COLORS.treeDark);
    rect(ctx, 20, 10, 6, 6, COLORS.treeDark);
    rect(ctx, 8, 6, 6, 4, 0x3d7236);
    return canvas;
  },

  'tile-tree-top': () => {
    // Same canopy but with no ground beneath, so it can draw over the player.
    const { canvas, ctx } = makeCanvas(TILE_SIZE, TILE_SIZE);
    rect(ctx, 6, 4, 20, 18, COLORS.tree);
    rect(ctx, 4, 8, 24, 10, COLORS.tree);
    rect(ctx, 8, 2, 16, 4, COLORS.tree);
    rect(ctx, 16, 14, 10, 8, COLORS.treeDark);
    return canvas;
  },

  'tile-stone-wall': () => {
    const { canvas, ctx } = makeCanvas(TILE_SIZE, TILE_SIZE);
    rect(ctx, 0, 0, TILE_SIZE, TILE_SIZE, COLORS.stone);
    // Offset brick courses.
    rect(ctx, 0, 10, TILE_SIZE, 2, COLORS.stoneDark);
    rect(ctx, 0, 21, TILE_SIZE, 2, COLORS.stoneDark);
    rect(ctx, 10, 0, 2, 10, COLORS.stoneDark);
    rect(ctx, 22, 12, 2, 9, COLORS.stoneDark);
    rect(ctx, 6, 23, 2, 9, COLORS.stoneDark);
    return canvas;
  },

  'tile-roof': () => {
    const { canvas, ctx } = makeCanvas(TILE_SIZE, TILE_SIZE);
    rect(ctx, 0, 0, TILE_SIZE, TILE_SIZE, COLORS.roof);
    // Shingle rows.
    for (let y = 0; y < TILE_SIZE; y += 8) {
      rect(ctx, 0, y + 6, TILE_SIZE, 2, COLORS.roofDark);
      rect(ctx, 8, y, 2, 6, COLORS.roofDark);
      rect(ctx, 24, y, 2, 6, COLORS.roofDark);
    }
    return canvas;
  },

  'tile-roof-dark': () => {
    const { canvas, ctx } = makeCanvas(TILE_SIZE, TILE_SIZE);
    rect(ctx, 0, 0, TILE_SIZE, TILE_SIZE, COLORS.roofDark);
    rect(ctx, 0, 0, TILE_SIZE, 6, 0x743428);
    for (let y = 8; y < TILE_SIZE; y += 8) {
      rect(ctx, 0, y, TILE_SIZE, 2, 0x743428);
    }
    return canvas;
  },

  'tile-building-wall': () => {
    const { canvas, ctx } = makeCanvas(TILE_SIZE, TILE_SIZE);
    rect(ctx, 0, 0, TILE_SIZE, TILE_SIZE, COLORS.wall);
    rect(ctx, 0, 0, TILE_SIZE, 3, COLORS.wallDark);
    rect(ctx, 0, 28, TILE_SIZE, 4, COLORS.stoneDark);
    speckle(ctx, COLORS.wallDark, 6, 9009);
    return canvas;
  },

  'tile-window': () => {
    const { canvas, ctx } = makeCanvas(TILE_SIZE, TILE_SIZE);
    rect(ctx, 0, 0, TILE_SIZE, TILE_SIZE, COLORS.wall);
    rect(ctx, 0, 0, TILE_SIZE, 3, COLORS.wallDark);
    rect(ctx, 0, 28, TILE_SIZE, 4, COLORS.stoneDark);
    rect(ctx, 6, 8, 20, 16, COLORS.wallDark);
    rect(ctx, 8, 10, 16, 12, 0x74a7d4);
    rect(ctx, 8, 10, 7, 5, 0x9dc6e8); // glass highlight
    rect(ctx, 15, 10, 2, 12, COLORS.wallDark); // window frame
    return canvas;
  },

  'tile-door': () => {
    const { canvas, ctx } = makeCanvas(TILE_SIZE, TILE_SIZE);
    rect(ctx, 0, 0, TILE_SIZE, TILE_SIZE, COLORS.wall);
    rect(ctx, 0, 0, TILE_SIZE, 3, COLORS.wallDark);
    rect(ctx, 6, 6, 20, 26, 0x4a3320); // frame
    rect(ctx, 8, 8, 16, 24, COLORS.door);
    rect(ctx, 15, 8, 2, 24, 0x4a3320); // centre seam
    rect(ctx, 11, 19, 3, 3, COLORS.accent); // handles
    rect(ctx, 18, 19, 3, 3, COLORS.accent);
    return canvas;
  },

  'tile-sign': () => {
    const { canvas, ctx } = makeCanvas(TILE_SIZE, TILE_SIZE);
    rect(ctx, 0, 0, TILE_SIZE, TILE_SIZE, COLORS.grass);
    speckle(ctx, COLORS.grassDark, 8, 10010);
    rect(ctx, 14, 18, 4, 12, COLORS.treeTrunk); // post
    rect(ctx, 4, 6, 24, 14, 0x8a6438); // board
    rect(ctx, 6, 8, 20, 10, 0xa87f4c);
    rect(ctx, 9, 11, 14, 2, 0x6b4a2c); // "writing"
    rect(ctx, 9, 15, 10, 2, 0x6b4a2c);
    return canvas;
  },

  'tile-fence': () => {
    const { canvas, ctx } = makeCanvas(TILE_SIZE, TILE_SIZE);
    rect(ctx, 0, 0, TILE_SIZE, TILE_SIZE, COLORS.grass);
    speckle(ctx, COLORS.grassDark, 8, 11011);
    rect(ctx, 0, 12, TILE_SIZE, 3, 0x8a6438); // rails
    rect(ctx, 0, 22, TILE_SIZE, 3, 0x8a6438);
    rect(ctx, 4, 8, 4, 22, COLORS.treeTrunk); // posts
    rect(ctx, 24, 8, 4, 22, COLORS.treeTrunk);
    return canvas;
  },

  // Wooden floorboards. Long horizontal planks with a little grain — the
  // earlier grid version read as brickwork, which made rooms look like walls.
  'tile-floor': () => {
    const { canvas, ctx } = makeCanvas(TILE_SIZE, TILE_SIZE);
    rect(ctx, 0, 0, TILE_SIZE, TILE_SIZE, 0xb08a5e);

    // Three boards, each slightly different so a tiled floor is not too regular.
    const boards = [
      { y: 0, h: 10, color: 0xbb9366 },
      { y: 11, h: 10, color: 0xa8814f },
      { y: 22, h: 10, color: 0xb58c5c },
    ];
    for (const board of boards) {
      rect(ctx, 0, board.y, TILE_SIZE, board.h, board.color);
      rect(ctx, 0, board.y + board.h, TILE_SIZE, 1, 0x8a6438); // seam between boards
      // Grain: a couple of faint lengthways streaks.
      rect(ctx, 3, board.y + 3, 12, 1, 0x9c7549);
      rect(ctx, 19, board.y + 6, 9, 1, 0x9c7549);
    }
    return canvas;
  },

  'tile-ledge': () => {
    const { canvas, ctx } = makeCanvas(TILE_SIZE, TILE_SIZE);
    rect(ctx, 0, 0, TILE_SIZE, TILE_SIZE, COLORS.grass);
    speckle(ctx, COLORS.grassDark, 6, 12012);
    rect(ctx, 0, 16, TILE_SIZE, 10, COLORS.ledge); // the drop face
    rect(ctx, 0, 16, TILE_SIZE, 3, 0xb59b6d);
    rect(ctx, 0, 26, TILE_SIZE, 2, 0x7a6440);
    return canvas;
  },

  // ---- Interior tiles -----------------------------------------------------

  'tile-interior-wall': () => {
    const { canvas, ctx } = makeCanvas(TILE_SIZE, TILE_SIZE);
    rect(ctx, 0, 0, TILE_SIZE, TILE_SIZE, 0xd9c9a8);
    rect(ctx, 0, 0, TILE_SIZE, 4, 0xbfae8f);
    // Faint vertical panelling.
    rect(ctx, 10, 4, 1, TILE_SIZE - 4, 0xc8b696);
    rect(ctx, 21, 4, 1, TILE_SIZE - 4, 0xc8b696);
    return canvas;
  },

  'tile-interior-trim': () => {
    const { canvas, ctx } = makeCanvas(TILE_SIZE, TILE_SIZE);
    rect(ctx, 0, 0, TILE_SIZE, TILE_SIZE, 0xd9c9a8);
    rect(ctx, 0, 0, TILE_SIZE, 4, 0xbfae8f);
    // A skirting board along the bottom, used for the wall row above the floor.
    rect(ctx, 0, 24, TILE_SIZE, 8, 0x8a6438);
    rect(ctx, 0, 24, TILE_SIZE, 2, 0xa87f4c);
    return canvas;
  },

  'tile-interior-window': () => {
    const { canvas, ctx } = makeCanvas(TILE_SIZE, TILE_SIZE);
    rect(ctx, 0, 0, TILE_SIZE, TILE_SIZE, 0xd9c9a8);
    rect(ctx, 0, 0, TILE_SIZE, 4, 0xbfae8f);
    rect(ctx, 5, 7, 22, 17, 0x8a6438);
    rect(ctx, 7, 9, 18, 13, 0x8fc4e8);
    rect(ctx, 7, 9, 8, 6, 0xb4dcf5); // glass highlight
    rect(ctx, 15, 9, 2, 13, 0x8a6438); // frame
    rect(ctx, 7, 15, 18, 2, 0x8a6438);
    return canvas;
  },

  'tile-floor-tiled': () => {
    const { canvas, ctx } = makeCanvas(TILE_SIZE, TILE_SIZE);
    rect(ctx, 0, 0, TILE_SIZE, TILE_SIZE, 0xe4dcc8);
    rect(ctx, 0, 0, 16, 16, 0xd3c9b2);
    rect(ctx, 16, 16, 16, 16, 0xd3c9b2);
    rect(ctx, 0, 0, TILE_SIZE, 1, 0xc0b69f);
    rect(ctx, 0, 0, 1, TILE_SIZE, 0xc0b69f);
    return canvas;
  },

  // NOTE: furniture textures below are drawn on a TRANSPARENT background.
  // MapRenderer stamps the map's `objectBase` floor underneath them, so the same
  // table works on floorboards in a house and on tiles in the shop.
  'tile-door-mat': () => {
    const { canvas, ctx } = makeCanvas(TILE_SIZE, TILE_SIZE);
    // The mat itself: this is where you step to leave a building.
    rect(ctx, 4, 6, 24, 20, 0x8a6438);
    rect(ctx, 6, 8, 20, 16, 0xb5533f);
    rect(ctx, 9, 12, 14, 2, 0x8e3f2f);
    rect(ctx, 9, 17, 14, 2, 0x8e3f2f);
    return canvas;
  },

  'tile-counter': () => {
    const { canvas, ctx } = makeCanvas(TILE_SIZE, TILE_SIZE);
    rect(ctx, 0, 4, TILE_SIZE, 24, 0x8a6438);
    rect(ctx, 0, 4, TILE_SIZE, 5, 0xa87f4c);
    rect(ctx, 0, 24, TILE_SIZE, 4, 0x6b4a2c);
    return canvas;
  },

  'tile-bookshelf': () => {
    const { canvas, ctx } = makeCanvas(TILE_SIZE, TILE_SIZE);
    rect(ctx, 1, 0, 30, 30, 0x6b4a2c);
    rect(ctx, 3, 2, 26, 26, 0x8a6438);
    // Two shelves of books in varied colours.
    const books = [0xb5533f, 0x4a6a8f, 0x6fbf73, 0xe8a33d, 0x9c4f6a];
    for (let shelf = 0; shelf < 2; shelf += 1) {
      const y = 4 + shelf * 12;
      for (let i = 0; i < 6; i += 1) {
        rect(ctx, 4 + i * 4, y, 3, 9, books[(i + shelf) % books.length]);
      }
      rect(ctx, 3, y + 9, 26, 2, 0x5a3d24); // shelf board
    }
    return canvas;
  },

  'tile-bed': () => {
    const { canvas, ctx } = makeCanvas(TILE_SIZE, TILE_SIZE);
    rect(ctx, 3, 1, 26, 30, 0x8a6438); // frame
    rect(ctx, 5, 3, 22, 26, 0x4a86c4); // blanket
    rect(ctx, 5, 3, 22, 9, 0xf4ecd8); // pillow end
    rect(ctx, 5, 18, 22, 2, 0x3a6a9c); // blanket fold
    return canvas;
  },

  'tile-table': () => {
    const { canvas, ctx } = makeCanvas(TILE_SIZE, TILE_SIZE);
    rect(ctx, 2, 6, 28, 20, 0x8a6438);
    rect(ctx, 2, 6, 28, 4, 0xa87f4c);
    rect(ctx, 4, 26, 5, 5, 0x6b4a2c); // legs
    rect(ctx, 23, 26, 5, 5, 0x6b4a2c);
    return canvas;
  },

  'tile-plant': () => {
    const { canvas, ctx } = makeCanvas(TILE_SIZE, TILE_SIZE);
    rect(ctx, 10, 22, 12, 9, 0xb5533f); // pot
    rect(ctx, 9, 21, 14, 3, 0x8e3f2f);
    rect(ctx, 14, 12, 4, 11, 0x4a7d3f); // stem
    rect(ctx, 7, 8, 18, 8, COLORS.tree); // foliage
    rect(ctx, 10, 4, 12, 6, COLORS.tree);
    rect(ctx, 16, 10, 8, 5, COLORS.treeDark);
    return canvas;
  },

  'tile-healing-machine': () => {
    const { canvas, ctx } = makeCanvas(TILE_SIZE, TILE_SIZE);
    rect(ctx, 2, 4, 28, 26, 0xb9c0cb); // body
    rect(ctx, 2, 4, 28, 4, 0x8f97a3);
    rect(ctx, 5, 11, 22, 12, 0x2b3240); // screen
    rect(ctx, 7, 13, 18, 8, 0x6fbf73);
    // Three status lamps.
    rect(ctx, 6, 25, 4, 3, COLORS.good);
    rect(ctx, 14, 25, 4, 3, COLORS.accent);
    rect(ctx, 22, 25, 4, 3, COLORS.danger);
    return canvas;
  },

  'tile-shop-shelf': () => {
    const { canvas, ctx } = makeCanvas(TILE_SIZE, TILE_SIZE);
    rect(ctx, 1, 2, 30, 28, 0x8a6438);
    rect(ctx, 3, 4, 26, 24, 0xa87f4c);
    // Stacked goods on two shelves.
    const goods = [0xe6685f, 0x6fbf73, 0x4a86c4, 0xe8a33d];
    for (let shelf = 0; shelf < 2; shelf += 1) {
      const y = 5 + shelf * 12;
      for (let i = 0; i < 4; i += 1) {
        rect(ctx, 5 + i * 6, y, 5, 8, goods[(i + shelf) % goods.length]);
        rect(ctx, 5 + i * 6, y, 5, 2, 0xf4ecd8);
      }
      rect(ctx, 3, y + 8, 26, 2, 0x6b4a2c);
    }
    return canvas;
  },

  // --- Thistlewood and the Verdant Hall ---------------------------------

  'tile-timber-wall': () => {
    const { canvas, ctx } = makeCanvas(TILE_SIZE, TILE_SIZE);
    rect(ctx, 0, 0, TILE_SIZE, TILE_SIZE, 0x9b7c52);
    // Horizontal timbers with darker gaps, so a wall reads as boards.
    for (let y = 0; y < TILE_SIZE; y += 8) rect(ctx, 0, y + 6, TILE_SIZE, 2, 0x6f5637);
    rect(ctx, 0, 0, 2, TILE_SIZE, 0x6f5637);
    // Thistlewood is half-swallowed by hedges — moss on every timber.
    speckle(ctx, 0x5c7a44, 10, 41);
    return canvas;
  },

  'tile-timber-roof': () => {
    const { canvas, ctx } = makeCanvas(TILE_SIZE, TILE_SIZE);
    rect(ctx, 0, 0, TILE_SIZE, TILE_SIZE, 0x6d7f4e);   // turf roof
    rect(ctx, 0, 0, TILE_SIZE, 4, 0x86975f);
    speckle(ctx, 0x54663c, 22, 42);
    speckle(ctx, 0x9aab6f, 10, 43);
    return canvas;
  },

  'tile-garden-soil': () => {
    const { canvas, ctx } = makeCanvas(TILE_SIZE, TILE_SIZE);
    rect(ctx, 0, 0, TILE_SIZE, TILE_SIZE, 0x6b5439);
    speckle(ctx, 0x7d6444, 26, 44);
    speckle(ctx, 0x55412c, 14, 45);
    // A few sprouting shoots, so the greenhouse floor reads as tended.
    speckle(ctx, 0x5c8a45, 5, 46, 2);
    return canvas;
  },

  'tile-hedge': () => {
    const { canvas, ctx } = makeCanvas(TILE_SIZE, TILE_SIZE);
    rect(ctx, 0, 0, TILE_SIZE, TILE_SIZE, COLORS.treeDark);
    rect(ctx, 1, 1, 30, 26, COLORS.tree);
    speckle(ctx, 0x7fae5c, 26, 47, 3);
    speckle(ctx, 0x35542c, 16, 48, 3);
    // A woody base so a hedge does not read as a floating bush.
    rect(ctx, 0, 27, TILE_SIZE, 5, 0x4a3a26);
    return canvas;
  },

  'tile-hedge-gate': () => {
    const { canvas, ctx } = makeCanvas(TILE_SIZE, TILE_SIZE);
    rect(ctx, 0, 0, TILE_SIZE, TILE_SIZE, COLORS.treeDark);
    rect(ctx, 1, 1, 30, 26, COLORS.tree);
    speckle(ctx, 0x7fae5c, 18, 47, 3);
    speckle(ctx, 0x35542c, 12, 48, 3);
    rect(ctx, 0, 27, TILE_SIZE, 5, 0x4a3a26);

    // Pale roots woven through, matching the root switches.
    ctx.strokeStyle = hex(0xc7b083);
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-2, 9);
    ctx.bezierCurveTo(8, 3, 14, 15, 22, 9);
    ctx.bezierCurveTo(27, 6, 30, 10, 34, 8);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-2, 21);
    ctx.bezierCurveTo(9, 26, 15, 14, 23, 21);
    ctx.bezierCurveTo(28, 25, 30, 20, 34, 22);
    ctx.stroke();
    rect(ctx, 14, 13, 5, 5, 0x8f7a52);
    return canvas;
  },

  'tile-gate': () => {
    const { canvas, ctx } = makeCanvas(TILE_SIZE, TILE_SIZE);
    rect(ctx, 0, 0, TILE_SIZE, TILE_SIZE, 0x000000);
    // Posts either side, three bars across, and a visible cross-brace: this is
    // a gate that is SHUT, not a fence.
    rect(ctx, 0, 2, 5, 30, 0x6f5637);
    rect(ctx, 27, 2, 5, 30, 0x6f5637);
    for (const y of [6, 15, 24]) rect(ctx, 3, y, 26, 4, 0x9b7c52);
    ctx.strokeStyle = hex(0x9b7c52);
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(4, 28);
    ctx.lineTo(28, 6);
    ctx.stroke();
    return canvas;
  },

  'tile-root-switch': () => {
    const { canvas, ctx } = makeCanvas(TILE_SIZE, TILE_SIZE);
    // A coil of pale root set into the soil. Drawn on a see-through background
    // so the map's own floor shows around it.
    ctx.strokeStyle = hex(0xc7b083);
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(16, 16, 10, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = hex(0x8f7a52);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(16, 16, 6, 0, Math.PI * 2);
    ctx.stroke();
    rect(ctx, 14, 14, 4, 4, 0x6fbf73);
    return canvas;
  },

  'tile-planter': () => {
    const { canvas, ctx } = makeCanvas(TILE_SIZE, TILE_SIZE);
    rect(ctx, 2, 16, 28, 14, 0x8a6438);   // trough
    rect(ctx, 2, 16, 28, 3, 0xa87f4c);
    rect(ctx, 4, 19, 24, 8, 0x5b4630);    // soil
    // Planting sitting in it.
    rect(ctx, 7, 8, 6, 10, COLORS.tree);
    rect(ctx, 14, 5, 7, 13, COLORS.tree);
    rect(ctx, 21, 9, 5, 9, COLORS.treeDark);
    return canvas;
  },

  // A deliberately hideous magenta/black check, so an unknown map character is
  // impossible to miss on screen.
  'tile-void': () => {
    const { canvas, ctx } = makeCanvas(TILE_SIZE, TILE_SIZE);
    rect(ctx, 0, 0, TILE_SIZE, TILE_SIZE, 0xff00ff);
    rect(ctx, 0, 0, 16, 16, 0x000000);
    rect(ctx, 16, 16, 16, 16, 0x000000);
    return canvas;
  },
};

// ---------------------------------------------------------------------------
// Player sprite sheet
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Sigils
// ---------------------------------------------------------------------------

/** How big a Sigil icon is drawn. Small: it is a badge, not a portrait. */
export const BADGE_SIZE = 28;

/**
 * One Sigil icon: a coloured disc with the Hall's shape cut into it.
 *
 * Drawn from the Sigil's own `icon` and `color`, so a new Hall is an entry in
 * src/data/badges.js and nothing here changes — except a new `icon` shape,
 * which needs a case below and a matching name in SUPPORTED_BADGE_ICONS.
 */
function createBadgeIcon(badge) {
  const size = BADGE_SIZE;
  const { canvas, ctx } = makeCanvas(size, size);
  const middle = size / 2;

  // The disc, with a dark rim so it reads on both the parchment panel and ink.
  ctx.fillStyle = hex(badge.color);
  ctx.beginPath();
  ctx.arc(middle, middle, middle - 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = hex(COLORS.ink);
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = hex(COLORS.ink);
  switch (badge.icon) {
    case 'leaf':
      // A broad pointed leaf with a central vein. Drawn on the diagonal and
      // bellied out well past the middle, or it reads as a thin lens rather
      // than a leaf at this size.
      ctx.beginPath();
      ctx.moveTo(6, size - 6);
      ctx.bezierCurveTo(6, 8, 10, 5, size - 6, 6);
      ctx.bezierCurveTo(size - 7, size - 10, size - 9, size - 6, 6, size - 6);
      ctx.fill();
      ctx.strokeStyle = hex(badge.color);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(8, size - 8);
      ctx.lineTo(size - 9, 8);
      ctx.stroke();
      break;

    case 'wave':
      // Three stacked swells.
      for (let i = 0; i < 3; i += 1) {
        const y = 9 + i * 5;
        ctx.beginPath();
        ctx.moveTo(6, y);
        ctx.quadraticCurveTo(middle, y - 4, size - 6, y);
        ctx.lineTo(size - 6, y + 2);
        ctx.quadraticCurveTo(middle, y - 2, 6, y + 2);
        ctx.fill();
      }
      break;

    case 'bolt':
    default:
      ctx.beginPath();
      ctx.moveTo(middle + 4, 5);
      ctx.lineTo(middle - 6, middle + 2);
      ctx.lineTo(middle - 1, middle + 2);
      ctx.lineTo(middle - 4, size - 5);
      ctx.lineTo(middle + 7, middle - 3);
      ctx.lineTo(middle + 1, middle - 3);
      ctx.closePath();
      ctx.fill();
      break;
  }

  return canvas;
}

/**
 * Draw one character frame using a palette.
 *
 * The SAME code draws the player and every NPC — only the colours differ. That
 * is deliberate: a cast drawn by one function always looks like it belongs to
 * one world. Palettes live in `src/config/assets.js`.
 *
 * @param ctx      canvas context, already translated to the frame's origin
 * @param palette  colours from CHARACTER_PALETTES
 * @param facing   'down' | 'up' | 'left' | 'right'
 * @param step     0 = idle, 1 = left foot forward, 2 = right foot forward
 */
function drawCharacterFrame(ctx, palette, facing, step) {
  const W = PLAYER_FRAME.width;
  const eye = 0x2a2018;

  // Soft shadow on the ground, so the character sits in the world.
  ctx.fillStyle = 'rgba(0,0,0,0.22)';
  ctx.beginPath();
  ctx.ellipse(W / 2, 37, 9, 3, 0, 0, Math.PI * 2);
  ctx.fill();

  // Legs. The two walk steps swap which leg is forward.
  const legOffset = step === 1 ? 2 : step === 2 ? -2 : 0;
  rect(ctx, 11, 28 + Math.max(0, legOffset), 4, 6 - Math.abs(legOffset), palette.trousers);
  rect(ctx, 17, 28 + Math.max(0, -legOffset), 4, 6 - Math.abs(legOffset), palette.trousers);
  rect(ctx, 11, 33, 4, 3, palette.boots);
  rect(ctx, 17, 33, 4, 3, palette.boots);

  // Torso
  rect(ctx, 9, 18, 14, 11, palette.tunic);
  rect(ctx, 9, 25, 14, 4, palette.tunicShade);
  rect(ctx, 9, 16, 14, 3, palette.accent); // collar / scarf

  // Arms swing opposite to the legs.
  const armOffset = step === 1 ? -1 : step === 2 ? 1 : 0;
  rect(ctx, 6, 19 + armOffset, 3, 8, palette.tunic);
  rect(ctx, 23, 19 - armOffset, 3, 8, palette.tunic);
  rect(ctx, 6, 26 + armOffset, 3, 3, palette.skin); // hands
  rect(ctx, 23, 26 - armOffset, 3, 3, palette.skin);

  // Head
  rect(ctx, 9, 5, 14, 12, palette.skin);
  rect(ctx, 9, 14, 14, 3, palette.skinShade); // chin shading

  if (facing === 'down') {
    rect(ctx, 8, 3, 16, 5, palette.hair); // fringe
    rect(ctx, 8, 3, 3, 10, palette.hair); // sideburns
    rect(ctx, 21, 3, 3, 10, palette.hair);
    rect(ctx, 12, 10, 2, 3, eye); // eyes
    rect(ctx, 18, 10, 2, 3, eye);
  } else if (facing === 'up') {
    // Back of the head: all hair, no face.
    rect(ctx, 8, 3, 16, 13, palette.hair);
    rect(ctx, 10, 5, 5, 4, lighten(palette.hair, 0.18)); // highlight
  } else {
    // Profile. Mirroring is handled by the caller for 'left'.
    rect(ctx, 8, 3, 16, 5, palette.hair);
    rect(ctx, 8, 3, 4, 11, palette.hair); // back of the head
    rect(ctx, 19, 10, 2, 3, eye); // single visible eye
    rect(ctx, 22, 11, 2, 2, palette.skinShade); // nose
  }
}

/** Blend a colour towards white by `amount` (0-1). Used for simple highlights. */
function lighten(color, amount) {
  const r = (color >> 16) & 0xff;
  const g = (color >> 8) & 0xff;
  const b = color & 0xff;
  const mix = (channel) => Math.min(255, Math.round(channel + (255 - channel) * amount));
  return (mix(r) << 16) | (mix(g) << 8) | mix(b);
}

/**
 * Build one character's sheet: 3 columns (idle, stepA, stepB) x 4 rows.
 * Row order must match PLAYER_FRAMES in src/config/assets.js.
 */
function createCharacterSheet(palette) {
  const { width: fw, height: fh } = PLAYER_FRAME;
  const { canvas, ctx } = makeCanvas(fw * 3, fh * 4);

  const rows = ['down', 'left', 'right', 'up'];

  rows.forEach((facing, rowIndex) => {
    for (let step = 0; step < 3; step += 1) {
      ctx.save();
      ctx.translate(step * fw, rowIndex * fh);

      if (facing === 'left') {
        // Draw the right-facing profile and flip it horizontally.
        ctx.translate(fw, 0);
        ctx.scale(-1, 1);
        drawCharacterFrame(ctx, palette, 'right', step);
      } else {
        drawCharacterFrame(ctx, palette, facing, step);
      }

      ctx.restore();
    }
  });

  return canvas;
}

/** The orb-shaped bundle that marks an item lying on the ground. */
function createGroundItem() {
  const { canvas, ctx } = makeCanvas(TILE_SIZE, TILE_SIZE);

  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath();
  ctx.ellipse(16, 26, 8, 3, 0, 0, Math.PI * 2);
  ctx.fill();

  rect(ctx, 10, 8, 12, 16, 0x6b4a2c); // satchel body
  rect(ctx, 10, 8, 12, 5, 0x8a6438); // flap
  rect(ctx, 9, 12, 14, 3, COLORS.accent); // strap
  rect(ctx, 14, 16, 4, 4, COLORS.accentDark); // buckle
  rect(ctx, 10, 8, 3, 16, 0x7d5733); // highlight edge

  return canvas;
}

// ---------------------------------------------------------------------------
// Creature artwork
// ---------------------------------------------------------------------------

/**
 * Creatures are drawn from a handful of BODY SHAPES, tinted with the colours of
 * their primary type. Twenty-seven species from eight drawing routines keeps the
 * whole cast looking like it belongs to one world, and means adding a species is
 * a data change rather than an art commission.
 *
 * Every shape receives the same palette object:
 *   main    the type's colour        dark  its shaded version
 *   light   a highlight              eye   near-black
 */

const EYE = 0x241f1a;
const EYE_SHINE = 0xffffff;

/** Two eyes with a highlight dot, used by most bodies. */
function drawEyes(ctx, leftX, rightX, y, size = 5) {
  rect(ctx, leftX, y, size, size + 1, EYE);
  rect(ctx, rightX, y, size, size + 1, EYE);
  rect(ctx, leftX + 1, y + 1, 2, 2, EYE_SHINE);
  rect(ctx, rightX + 1, y + 1, 2, 2, EYE_SHINE);
}

/** A soft contact shadow so a creature sits on the ground rather than floating. */
function drawShadow(ctx, centerX, y, radiusX) {
  ctx.fillStyle = 'rgba(0,0,0,0.20)';
  ctx.beginPath();
  ctx.ellipse(centerX, y, radiusX, radiusX * 0.32, 0, 0, Math.PI * 2);
  ctx.fill();
}

const CREATURE_BODY_DRAWERS = {
  /** Four legs, a snout and a tail: ferrets, rodents, big cats. */
  quadruped: (ctx, p) => {
    drawShadow(ctx, 32, 55, 20);
    rect(ctx, 14, 42, 7, 12, p.dark); // legs
    rect(ctx, 24, 42, 7, 12, p.dark);
    rect(ctx, 36, 42, 7, 12, p.dark);
    rect(ctx, 45, 42, 7, 12, p.dark);
    rect(ctx, 12, 28, 42, 18, p.main); // body
    rect(ctx, 12, 40, 42, 6, p.dark); // underside shading
    rect(ctx, 50, 20, 8, 14, p.light); // tail
    rect(ctx, 52, 14, 7, 10, p.main);
    rect(ctx, 8, 18, 24, 20, p.main); // head
    rect(ctx, 6, 12, 8, 9, p.dark); // ears
    rect(ctx, 20, 12, 8, 9, p.dark);
    rect(ctx, 4, 28, 10, 8, p.light); // snout
    drawEyes(ctx, 12, 23, 24, 4);
    rect(ctx, 5, 30, 4, 3, EYE); // nose
  },

  /** A round, soft body: amphibians, droplets, cheerful lumps. */
  blob: (ctx, p) => {
    drawShadow(ctx, 32, 55, 20);
    rect(ctx, 14, 46, 10, 8, p.dark); // feet
    rect(ctx, 40, 46, 10, 8, p.dark);
    rect(ctx, 12, 18, 40, 32, p.main); // body
    rect(ctx, 8, 24, 48, 20, p.main);
    rect(ctx, 12, 40, 40, 10, p.dark); // underside
    rect(ctx, 16, 20, 16, 10, p.light); // highlight
    rect(ctx, 26, 8, 12, 12, p.light); // the bead it carries
    rect(ctx, 28, 10, 6, 6, EYE_SHINE);
    drawEyes(ctx, 19, 37, 28, 6);
    rect(ctx, 28, 40, 8, 3, p.dark); // mouth
  },

  /** A long coiling body: sea serpents and river spirits. */
  serpent: (ctx, p) => {
    drawShadow(ctx, 32, 56, 22);
    rect(ctx, 10, 44, 44, 10, p.dark); // lower coil
    rect(ctx, 16, 34, 36, 12, p.main); // middle coil
    rect(ctx, 22, 24, 30, 12, p.main);
    rect(ctx, 16, 40, 36, 5, p.dark);
    rect(ctx, 14, 8, 26, 20, p.main); // head
    rect(ctx, 14, 22, 26, 6, p.dark);
    rect(ctx, 8, 4, 10, 10, p.light); // fins
    rect(ctx, 36, 4, 10, 10, p.light);
    drawEyes(ctx, 19, 30, 14, 5);
    rect(ctx, 20, 24, 14, 3, p.dark); // mouth
  },

  /** A seed-pod or bulb with leaves: the growing things. */
  plant: (ctx, p) => {
    drawShadow(ctx, 32, 55, 19);
    rect(ctx, 18, 46, 9, 8, p.dark); // stubby feet
    rect(ctx, 37, 46, 9, 8, p.dark);
    rect(ctx, 14, 20, 36, 30, p.main); // pod
    rect(ctx, 14, 40, 36, 10, p.dark);
    rect(ctx, 18, 23, 12, 9, p.light); // highlight
    rect(ctx, 4, 10, 20, 10, p.dark); // leaves
    rect(ctx, 8, 4, 16, 9, p.main);
    rect(ctx, 40, 10, 20, 10, p.dark);
    rect(ctx, 40, 4, 16, 9, p.main);
    rect(ctx, 29, 2, 6, 20, p.dark); // stem
    drawEyes(ctx, 21, 37, 30, 5);
    rect(ctx, 29, 40, 7, 3, p.dark); // mouth
  },

  /** Wings, beak and tail feathers. */
  bird: (ctx, p) => {
    drawShadow(ctx, 32, 55, 17);
    rect(ctx, 24, 46, 5, 9, p.dark); // legs
    rect(ctx, 35, 46, 5, 9, p.dark);
    rect(ctx, 18, 24, 28, 24, p.main); // body
    rect(ctx, 18, 40, 28, 8, p.dark);
    rect(ctx, 4, 26, 18, 14, p.light); // wing
    rect(ctx, 6, 30, 14, 4, p.dark);
    rect(ctx, 44, 20, 16, 10, p.dark); // tail
    rect(ctx, 48, 14, 14, 9, p.light);
    rect(ctx, 20, 8, 22, 20, p.main); // head
    rect(ctx, 24, 4, 10, 6, p.light); // crest
    rect(ctx, 8, 18, 14, 8, 0xe8a33d); // beak
    rect(ctx, 8, 22, 12, 3, 0xb87c22);
    drawEyes(ctx, 24, 34, 14, 5);
  },

  /** Segments, plating and antennae. */
  bug: (ctx, p) => {
    drawShadow(ctx, 32, 55, 19);
    rect(ctx, 8, 34, 10, 5, p.dark); // legs
    rect(ctx, 46, 34, 10, 5, p.dark);
    rect(ctx, 10, 44, 10, 5, p.dark);
    rect(ctx, 44, 44, 10, 5, p.dark);
    rect(ctx, 16, 22, 32, 30, p.main); // segmented body
    for (let i = 0; i < 3; i += 1) rect(ctx, 16, 30 + i * 8, 32, 3, p.dark);
    rect(ctx, 20, 25, 12, 6, p.light); // shell highlight
    rect(ctx, 18, 6, 28, 20, p.main); // head
    rect(ctx, 18, 20, 28, 6, p.dark);
    rect(ctx, 12, 0, 5, 10, p.dark); // antennae
    rect(ctx, 47, 0, 5, 10, p.dark);
    drawEyes(ctx, 23, 35, 12, 6);
  },

  /** Angular, chipped, and heavier than it looks. */
  rock: (ctx, p) => {
    drawShadow(ctx, 32, 55, 21);
    rect(ctx, 12, 24, 40, 28, p.main); // main mass
    rect(ctx, 18, 16, 28, 12, p.main);
    rect(ctx, 8, 34, 48, 18, p.main);
    rect(ctx, 8, 44, 48, 8, p.dark); // base shading
    rect(ctx, 20, 18, 12, 8, p.light); // facets
    rect(ctx, 40, 28, 10, 8, p.dark);
    rect(ctx, 14, 30, 8, 6, p.dark);
    drawEyes(ctx, 20, 36, 32, 6);
    rect(ctx, 26, 44, 12, 3, p.dark); // mouth crack
  },

  /** A flame or spirit: no legs, and a trailing tail. */
  wisp: (ctx, p) => {
    ctx.fillStyle = 'rgba(0,0,0,0.12)';
    ctx.beginPath();
    ctx.ellipse(32, 58, 14, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    rect(ctx, 24, 44, 16, 10, p.dark); // trailing wisp
    rect(ctx, 28, 50, 8, 8, p.dark);
    rect(ctx, 14, 16, 36, 32, p.main); // body
    rect(ctx, 10, 22, 44, 20, p.main);
    rect(ctx, 20, 8, 24, 12, p.main); // flame tip
    rect(ctx, 26, 2, 12, 10, p.light);
    rect(ctx, 18, 20, 12, 8, p.light); // inner glow
    drawEyes(ctx, 21, 37, 28, 6);
  },
};

/**
 * Build one species' artwork.
 * @param {object} species a species definition from src/data/creatures.js
 */
function createCreatureSprite(species) {
  const size = CREATURE_SPRITE_SIZE;
  const { canvas, ctx } = makeCanvas(size, size);

  const drawer = CREATURE_BODY_DRAWERS[species.appearance.body];
  if (!drawer) {
    console.warn(
      `[TextureFactory] Species "${species.id}" wants body "${species.appearance.body}", ` +
        `which has no drawing routine. Drawing a placeholder blob instead.`
    );
  }

  // Colours come from the primary type unless the species overrides them.
  const primaryType = species.types[0];
  const main = species.appearance.main ?? getTypeColor(primaryType);
  const dark = species.appearance.dark ?? getTypeDarkColor(primaryType);

  (drawer || CREATURE_BODY_DRAWERS.blob)(ctx, {
    main,
    dark,
    light: lighten(main, 0.28),
  });

  return canvas;
}

// ---------------------------------------------------------------------------
// UI textures
// ---------------------------------------------------------------------------

/** A 9-slice style panel: dark fill, light border, drawn at a fixed size. */
function createPanel() {
  const { canvas, ctx } = makeCanvas(48, 48);
  rect(ctx, 0, 0, 48, 48, COLORS.parchment);
  rect(ctx, 2, 2, 44, 44, COLORS.ink);
  rect(ctx, 4, 4, 40, 40, COLORS.inkLight);
  return canvas;
}

/** The little arrow that marks the selected menu entry. */
function createCursor() {
  const { canvas, ctx } = makeCanvas(12, 12);
  ctx.fillStyle = hex(COLORS.accent);
  ctx.beginPath();
  ctx.moveTo(1, 1);
  ctx.lineTo(11, 6);
  ctx.lineTo(1, 11);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = hex(COLORS.accentDark);
  ctx.lineWidth = 1;
  ctx.stroke();
  return canvas;
}

// ---------------------------------------------------------------------------
// Public entry point
// ---------------------------------------------------------------------------

/**
 * Generate and register every texture. Called once from the BootScene.
 *
 * Safe to call more than once: textures that already exist are skipped, so a
 * scene restart never produces "texture key already in use" warnings.
 *
 * @param {Phaser.Scene} scene
 */
export function generateAllTextures(scene) {
  let created = 0;

  // Tiles
  for (const [key, generate] of Object.entries(TILE_GENERATORS)) {
    if (scene.textures.exists(key)) continue;
    scene.textures.addCanvas(key, generate());
    created += 1;
  }

  // One sprite sheet per character look (the player plus every NPC palette).
  for (const [name, palette] of Object.entries(CHARACTER_PALETTES)) {
    const key = characterTextureKey(name);
    if (scene.textures.exists(key)) continue;

    scene.textures.addSpriteSheet(key, createCharacterSheet(palette), {
      frameWidth: PLAYER_FRAME.width,
      frameHeight: PLAYER_FRAME.height,
    });
    created += 1;
  }

  // UI
  if (!scene.textures.exists(ASSET_KEYS.uiPanel)) {
    scene.textures.addCanvas(ASSET_KEYS.uiPanel, createPanel());
    created += 1;
  }
  if (!scene.textures.exists(ASSET_KEYS.uiCursor)) {
    scene.textures.addCanvas(ASSET_KEYS.uiCursor, createCursor());
    created += 1;
  }

  // World objects
  if (!scene.textures.exists(ASSET_KEYS.groundItem)) {
    scene.textures.addCanvas(ASSET_KEYS.groundItem, createGroundItem());
    created += 1;
  }

  // One icon per Sigil, earned or not — the Sigil screen draws locked slots too.
  for (const badge of Object.values(BADGES)) {
    const key = badgeTextureKey(badge.id);
    if (scene.textures.exists(key)) continue;

    scene.textures.addCanvas(key, createBadgeIcon(badge));
    created += 1;
  }

  // One sprite per creature species.
  for (const species of Object.values(CREATURES)) {
    const key = creatureTextureKey(species.id);
    if (scene.textures.exists(key)) continue;

    scene.textures.addCanvas(key, createCreatureSprite(species));
    created += 1;
  }

  return created;
}

/** Exported for tests and for anyone adding a new tile. */
export const TILE_TEXTURE_KEYS = Object.keys(TILE_GENERATORS);

/**
 * Every Sigil icon this file generates.
 * Read by the data tests, so a Sigil added without artwork cannot ship.
 */
export const BADGE_TEXTURE_KEYS = Object.values(BADGES).map((b) => badgeTextureKey(b.id));

/** Exported so tests can check every species' body shape can actually be drawn. */
export const CREATURE_BODY_DRAWER_NAMES = Object.keys(CREATURE_BODY_DRAWERS);
