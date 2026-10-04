/**
 * assets.js
 * ----------------------------------------------------------------------------
 * Every texture in the game is referenced by a KEY, never by a file path.
 *
 * Right now all art is generated at runtime by `src/systems/TextureFactory.js`
 * (coloured shapes — no image files, no licensing worries). When real artwork
 * arrives, you only have to load the images under these same keys and delete the
 * matching generator; nothing else in the game changes.
 */

export const ASSET_KEYS = {
  // Characters. The player is a sprite sheet; see PLAYER_FRAMES below.
  player: 'player',

  // World objects
  groundItem: 'object-ground-item',

  // UI
  uiPanel: 'ui-panel',
  uiCursor: 'ui-cursor',
  logo: 'ui-logo',
};

/**
 * Every character in the game — the player and all NPCs — is drawn by the SAME
 * code in TextureFactory, just with different colours. That is what keeps a
 * crowd of NPCs looking like they belong to one world instead of one art pack
 * per person.
 *
 * TO ADD A NEW CHARACTER LOOK: add an entry here. Its key becomes the value you
 * put in an NPC's `sprite` field in a map file. Nothing else needs changing —
 * the texture, the sprite sheet, and the four walk animations are all generated
 * for you, and a test checks that every NPC's sprite actually exists.
 */
export const CHARACTER_PALETTES = {
  // The player: blue traveller's tunic, brown hair, orange scarf.
  player: {
    hair: 0x4a3728,
    skin: 0xe8b88a,
    skinShade: 0xc99465,
    tunic: 0x3f7fbf,
    tunicShade: 0x2f5f8f,
    trousers: 0x3a4152,
    boots: 0x2a2018,
    accent: 0xe8a33d,
  },
  villager: {
    hair: 0x6b4a2c,
    skin: 0xd9a074,
    skinShade: 0xb87f57,
    tunic: 0x7a9e5c,
    tunicShade: 0x5d7d45,
    trousers: 0x4a4238,
    boots: 0x322a20,
    accent: 0xd8c48d,
  },
  villagerAlt: {
    hair: 0x2f2a26,
    skin: 0x8d5f42,
    skinShade: 0x70492f,
    tunic: 0xb5533f,
    tunicShade: 0x8e3f2f,
    trousers: 0x3d3a44,
    boots: 0x241f1a,
    accent: 0xf4ecd8,
  },
  elder: {
    hair: 0xd6d2c8,
    skin: 0xe0b48e,
    skinShade: 0xbd9068,
    tunic: 0x6a5f7c,
    tunicShade: 0x4f4760,
    trousers: 0x413b4c,
    boots: 0x2b2630,
    accent: 0xd6d2c8,
  },
  child: {
    hair: 0xc9863a,
    skin: 0xefc79c,
    skinShade: 0xcda478,
    tunic: 0xdcae3c,
    tunicShade: 0xb08a26,
    trousers: 0x4a6a8f,
    boots: 0x2a2018,
    accent: 0xffffff,
  },
  // Kestrel, the rival: a sharp teal travelling coat and a red scarf, dark
  // hair — nothing like the player's blue tunic, and nobody else wears teal.
  rival: {
    hair: 0x1f1c22,
    skin: 0xd4a27c,
    skinShade: 0xb3825c,
    tunic: 0x2a8f86,
    tunicShade: 0x1d6a63,
    trousers: 0x2e2a36,
    boots: 0x1a171c,
    accent: 0xd8423a,
  },
  // Professor Wick and the Mender both wear the Warden Order's white coat.
  researcher: {
    hair: 0x5c5148,
    skin: 0xe3b891,
    skinShade: 0xc0956e,
    tunic: 0xf0ece2,
    tunicShade: 0xcfc9bb,
    trousers: 0x59606e,
    boots: 0x33383f,
    accent: 0x6fbf73,
  },
  mender: {
    hair: 0x9c4f6a,
    skin: 0xe8b88a,
    skinShade: 0xc99465,
    tunic: 0xf0ece2,
    tunicShade: 0xcfc9bb,
    trousers: 0xd96a86,
    boots: 0x8d4257,
    accent: 0xe6685f,
  },
  shopkeeper: {
    hair: 0x3b2f26,
    skin: 0xcf9a6e,
    skinShade: 0xab7a53,
    tunic: 0x4a6a8f,
    tunicShade: 0x36506e,
    trousers: 0x3a3a3a,
    boots: 0x262626,
    accent: 0xe8a33d,
  },
  // The Hollow Vane (Phase 12): a plain grey survey coat with a dark collar
  // and a pale hollow ring on the chest — the stamp on the stake by Route 2's
  // dry spring. `emblem` is optional; only the Vane wear one.
  vane: {
    hair: 0x3a3a40,
    skin: 0xd8ad86,
    skinShade: 0xb78b65,
    tunic: 0x7d8088,
    tunicShade: 0x5e6169,
    trousers: 0x34363c,
    boots: 0x1f2024,
    accent: 0x2b2d33,
    emblem: 0xdfe5ea,
  },
  // A Vane foreman: the same coat in charcoal, with a silver collar.
  vaneForeman: {
    hair: 0x9a9690,
    skin: 0xc79670,
    skinShade: 0xa57652,
    tunic: 0x45474f,
    tunicShade: 0x33353b,
    trousers: 0x26272c,
    boots: 0x17181b,
    accent: 0xb9c2c9,
    emblem: 0xe6ecef,
  },
  // A Warden of the Circle: an olive field cloak with a gold clasp.
  warden: {
    hair: 0x5a3b26,
    skin: 0xe0b48e,
    skinShade: 0xbd9068,
    tunic: 0x56704c,
    tunicShade: 0x40553a,
    trousers: 0x3d3a33,
    boots: 0x2a241c,
    accent: 0xd8b84a,
  },
  // The Vane's Director (Phase 14): the survey coat again, but in pale
  // engineer's canvas, with a black collar and the ring in steel.
  vaneDirector: {
    hair: 0x2b2622,
    skin: 0xc58f68,
    skinShade: 0xa3714e,
    tunic: 0xcfc8b6,
    tunicShade: 0xa9a291,
    trousers: 0x2a2b30,
    boots: 0x151518,
    accent: 0x1c1d21,
    emblem: 0x5c636d,
  },
  // The Champion of the Warden Circle (Phase 14): the Circle's olive cloak
  // dyed the deep blue of the Aerie sky, with a silver clasp.
  champion: {
    hair: 0xe6e1d6,
    skin: 0xd9a57e,
    skinShade: 0xb6825b,
    tunic: 0x2c4f8f,
    tunicShade: 0x1f3a6b,
    trousers: 0x2a2d3a,
    boots: 0x1b1d26,
    accent: 0xdfe5ea,
  },
};

/**
 * Creature artwork.
 *
 * Every species is drawn from one of a handful of BODY SHAPES, tinted with its
 * primary type's colours (see TYPE_INFO in src/data/types.js). That is what lets
 * 27 creatures — and the 30+ planned — look like they belong to one world
 * without hand-drawing each one.
 *
 * A species picks its shape with `appearance: { body: 'quadruped' }`.
 */
export const CREATURE_SPRITE_SIZE = 64;

export const CREATURE_BODIES = [
  'quadruped',
  'blob',
  'serpent',
  'plant',
  'bird',
  'bug',
  'rock',
  'wisp',
];

export const CREATURE_BODY_SET = new Set(CREATURE_BODIES);

/** Texture key for one species' artwork. */
export function creatureTextureKey(speciesId) {
  return `creature-${speciesId}`;
}

/** Texture key for one Sigil's icon. */
export function badgeTextureKey(badgeId) {
  return `badge-${badgeId}`;
}

/** Texture key for a character look. `player` keeps its short historical key. */
export function characterTextureKey(name) {
  return name === 'player' ? ASSET_KEYS.player : `char-${name}`;
}

/** Animation key for one character look walking in one direction. */
export function characterAnimKey(name, direction) {
  return `${characterTextureKey(name)}-walk-${direction}`;
}

/** Player sprite sheet geometry. Frames are taller than a tile so the character reads clearly. */
export const PLAYER_FRAME = {
  width: 32,
  height: 40,
  /**
   * Blank pixels below the character's feet inside each frame. The sprite is
   * drawn with its bottom edge this far below the tile's bottom edge, which puts
   * the feet exactly on the tile the player occupies.
   */
  footPadding: 4,
};

/**
 * Which sprite-sheet frame index belongs to which direction.
 * The sheet is laid out as 3 columns (idle, step A, step B) x 4 rows.
 */
export const PLAYER_FRAMES = {
  down: { idle: 0, stepA: 1, stepB: 2 },
  left: { idle: 3, stepA: 4, stepB: 5 },
  right: { idle: 6, stepA: 7, stepB: 8 },
  up: { idle: 9, stepA: 10, stepB: 11 },
};

/**
 * Animation keys for the player, one walk cycle per facing direction.
 * NPCs use `characterAnimKey(spriteName, direction)` to get theirs.
 */
export const PLAYER_ANIMS = {
  down: characterAnimKey('player', 'down'),
  left: characterAnimKey('player', 'left'),
  right: characterAnimKey('player', 'right'),
  up: characterAnimKey('player', 'up'),
};
