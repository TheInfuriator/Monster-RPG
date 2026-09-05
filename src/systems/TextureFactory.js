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
  characterTextureKey,
} from '../config/assets.js';
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

  return created;
}

/** Exported for tests and for anyone adding a new tile. */
export const TILE_TEXTURE_KEYS = Object.keys(TILE_GENERATORS);
