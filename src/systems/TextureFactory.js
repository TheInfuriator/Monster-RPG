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
import { ASSET_KEYS, PLAYER_FRAME } from '../config/assets.js';
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

  'tile-floor': () => {
    const { canvas, ctx } = makeCanvas(TILE_SIZE, TILE_SIZE);
    rect(ctx, 0, 0, TILE_SIZE, TILE_SIZE, COLORS.floor);
    rect(ctx, 0, 15, TILE_SIZE, 2, COLORS.pathDark); // floorboard seams
    rect(ctx, 0, 31, TILE_SIZE, 1, COLORS.pathDark);
    rect(ctx, 15, 0, 2, 15, COLORS.pathDark);
    rect(ctx, 7, 17, 2, 15, COLORS.pathDark);
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

const SKIN = 0xe8b88a;
const SKIN_SHADE = 0xc99465;
const HAIR = 0x4a3728;
const TUNIC = 0x3f7fbf;
const TUNIC_SHADE = 0x2f5f8f;
const TROUSERS = 0x3a4152;
const BOOTS = 0x2a2018;
const SCARF = 0xe8a33d;

/**
 * Draw one player frame.
 * @param ctx      canvas context, already translated to the frame's origin
 * @param facing   'down' | 'up' | 'left' | 'right'
 * @param step     0 = idle, 1 = left foot forward, 2 = right foot forward
 */
function drawPlayerFrame(ctx, facing, step) {
  const W = PLAYER_FRAME.width;

  // Soft shadow on the ground, so the character sits in the world.
  ctx.fillStyle = 'rgba(0,0,0,0.22)';
  ctx.beginPath();
  ctx.ellipse(W / 2, 37, 9, 3, 0, 0, Math.PI * 2);
  ctx.fill();

  // Legs. The two walk steps swap which leg is forward.
  const legOffset = step === 1 ? 2 : step === 2 ? -2 : 0;
  rect(ctx, 11, 28 + Math.max(0, legOffset), 4, 6 - Math.abs(legOffset), TROUSERS);
  rect(ctx, 17, 28 + Math.max(0, -legOffset), 4, 6 - Math.abs(legOffset), TROUSERS);
  rect(ctx, 11, 33, 4, 3, BOOTS);
  rect(ctx, 17, 33, 4, 3, BOOTS);

  // Torso
  rect(ctx, 9, 18, 14, 11, TUNIC);
  rect(ctx, 9, 25, 14, 4, TUNIC_SHADE);
  rect(ctx, 9, 16, 14, 3, SCARF); // collar / scarf

  // Arms swing opposite to the legs.
  const armOffset = step === 1 ? -1 : step === 2 ? 1 : 0;
  rect(ctx, 6, 19 + armOffset, 3, 8, TUNIC);
  rect(ctx, 23, 19 - armOffset, 3, 8, TUNIC);
  rect(ctx, 6, 26 + armOffset, 3, 3, SKIN); // hands
  rect(ctx, 23, 26 - armOffset, 3, 3, SKIN);

  // Head
  rect(ctx, 9, 5, 14, 12, SKIN);
  rect(ctx, 9, 14, 14, 3, SKIN_SHADE); // chin shading

  if (facing === 'down') {
    rect(ctx, 8, 3, 16, 5, HAIR); // fringe
    rect(ctx, 8, 3, 3, 10, HAIR); // sideburns
    rect(ctx, 21, 3, 3, 10, HAIR);
    rect(ctx, 12, 10, 2, 3, 0x2a2018); // eyes
    rect(ctx, 18, 10, 2, 3, 0x2a2018);
  } else if (facing === 'up') {
    // Back of the head: all hair, no face.
    rect(ctx, 8, 3, 16, 13, HAIR);
    rect(ctx, 10, 5, 5, 4, 0x5c4634); // highlight
  } else {
    // Profile. Mirroring is handled by the caller for 'left'.
    rect(ctx, 8, 3, 16, 5, HAIR);
    rect(ctx, 8, 3, 4, 11, HAIR); // back of the head
    rect(ctx, 19, 10, 2, 3, 0x2a2018); // single visible eye
    rect(ctx, 22, 11, 2, 2, SKIN_SHADE); // nose
  }
}

/** Build the whole player sheet: 3 columns (idle, stepA, stepB) x 4 rows. */
function createPlayerSheet() {
  const { width: fw, height: fh } = PLAYER_FRAME;
  const { canvas, ctx } = makeCanvas(fw * 3, fh * 4);

  // Row order must match PLAYER_FRAMES in src/config/assets.js.
  const rows = ['down', 'left', 'right', 'up'];

  rows.forEach((facing, rowIndex) => {
    for (let step = 0; step < 3; step += 1) {
      ctx.save();
      ctx.translate(step * fw, rowIndex * fh);

      if (facing === 'left') {
        // Draw the right-facing profile and flip it horizontally.
        ctx.translate(fw, 0);
        ctx.scale(-1, 1);
        drawPlayerFrame(ctx, 'right', step);
      } else {
        drawPlayerFrame(ctx, facing, step);
      }

      ctx.restore();
    }
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

  // Player sprite sheet
  if (!scene.textures.exists(ASSET_KEYS.player)) {
    scene.textures.addSpriteSheet(ASSET_KEYS.player, createPlayerSheet(), {
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

  return created;
}

/** Exported for tests and for anyone adding a new tile. */
export const TILE_TEXTURE_KEYS = Object.keys(TILE_GENERATORS);
