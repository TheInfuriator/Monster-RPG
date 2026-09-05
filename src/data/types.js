/**
 * types.js
 * ----------------------------------------------------------------------------
 * The 18 elemental types and the complete effectiveness chart.
 *
 * THIS IS THE ONLY PLACE TYPE MATCHUPS ARE DEFINED. Nothing else in the game
 * should ever contain a line like `if (type === 'fire' && other === 'grass')`.
 * Battle code asks `TypeChart.getEffectiveness()` and gets a number back.
 *
 * HOW TO READ THE CHART
 * `TYPE_CHART[attacker][defender]` is the damage multiplier. Anything NOT listed
 * is 1 (neutral), which keeps the table small enough to actually read — only the
 * interesting matchups appear.
 *
 *   0     the attack has no effect at all
 *   0.5   not very effective
 *   2     super effective
 *
 * Against a creature with TWO types the multipliers are combined, so 4x and
 * 0.25x are both possible.
 */

/** Every type id in the game. Creature and move data must use one of these. */
export const TYPES = [
  'normal',
  'fire',
  'water',
  'grass',
  'electric',
  'ice',
  'fighting',
  'poison',
  'ground',
  'flying',
  'psychic',
  'bug',
  'rock',
  'ghost',
  'dragon',
  'dark',
  'steel',
  'fairy',
];

/** A set for fast validity checks. */
export const TYPE_SET = new Set(TYPES);

/**
 * Display names and colours for each type.
 * The colours do double duty: they tint the type badges in menus AND provide the
 * default palette for a creature's generated artwork, so a Fire creature always
 * looks like a Fire creature.
 */
export const TYPE_INFO = {
  normal:   { name: 'Normal',   color: 0xa8a292, dark: 0x847f72 },
  fire:     { name: 'Fire',     color: 0xe2703a, dark: 0xa84f26 },
  water:    { name: 'Water',    color: 0x4a86c4, dark: 0x33608f },
  grass:    { name: 'Grass',    color: 0x5d9a4e, dark: 0x416e37 },
  electric: { name: 'Electric', color: 0xe0be3c, dark: 0xa88c25 },
  ice:      { name: 'Ice',      color: 0x7fc4d4, dark: 0x58929f },
  fighting: { name: 'Fighting', color: 0xb14b3f, dark: 0x82342b },
  poison:   { name: 'Poison',   color: 0x9257a8, dark: 0x6a3d7c },
  ground:   { name: 'Ground',   color: 0xc4a35c, dark: 0x8f7540 },
  flying:   { name: 'Flying',   color: 0x8aa2d8, dark: 0x6377a3 },
  psychic:  { name: 'Psychic',  color: 0xdd6b8e, dark: 0xa64c66 },
  bug:      { name: 'Bug',      color: 0x8fa63a, dark: 0x677827 },
  rock:     { name: 'Rock',     color: 0xa89660, dark: 0x7c6e45 },
  ghost:    { name: 'Ghost',    color: 0x6d5f9c, dark: 0x4c4172 },
  dragon:   { name: 'Dragon',   color: 0x6a52c4, dark: 0x4a398f },
  dark:     { name: 'Dark',     color: 0x5f5148, dark: 0x413832 },
  steel:    { name: 'Steel',    color: 0xa3aab5, dark: 0x767d87 },
  fairy:    { name: 'Fairy',    color: 0xdf8fc0, dark: 0xa8668f },
};

/**
 * The effectiveness chart. Only non-neutral matchups are listed.
 * Read as: "when a <key> move hits a <inner key> creature, multiply by <value>".
 */
export const TYPE_CHART = {
  normal: { rock: 0.5, ghost: 0, steel: 0.5 },

  fire: {
    fire: 0.5, water: 0.5, grass: 2, ice: 2,
    bug: 2, rock: 0.5, dragon: 0.5, steel: 2,
  },

  water: {
    fire: 2, water: 0.5, grass: 0.5,
    ground: 2, rock: 2, dragon: 0.5,
  },

  grass: {
    fire: 0.5, water: 2, grass: 0.5, poison: 0.5, ground: 2,
    flying: 0.5, bug: 0.5, rock: 2, dragon: 0.5, steel: 0.5,
  },

  electric: {
    water: 2, grass: 0.5, electric: 0.5,
    ground: 0, flying: 2, dragon: 0.5,
  },

  ice: {
    fire: 0.5, water: 0.5, grass: 2, ice: 0.5,
    ground: 2, flying: 2, dragon: 2, steel: 0.5,
  },

  fighting: {
    normal: 2, ice: 2, poison: 0.5, flying: 0.5, psychic: 0.5,
    bug: 0.5, rock: 2, ghost: 0, dark: 2, steel: 2, fairy: 0.5,
  },

  poison: {
    grass: 2, poison: 0.5, ground: 0.5,
    rock: 0.5, ghost: 0.5, steel: 0, fairy: 2,
  },

  ground: {
    fire: 2, grass: 0.5, electric: 2, poison: 2,
    flying: 0, bug: 0.5, rock: 2, steel: 2,
  },

  flying: {
    grass: 2, electric: 0.5, fighting: 2,
    bug: 2, rock: 0.5, steel: 0.5,
  },

  psychic: { fighting: 2, poison: 2, psychic: 0.5, dark: 0, steel: 0.5 },

  bug: {
    fire: 0.5, grass: 2, fighting: 0.5, poison: 0.5, flying: 0.5,
    psychic: 2, ghost: 0.5, dark: 2, steel: 0.5, fairy: 0.5,
  },

  rock: {
    fire: 2, ice: 2, fighting: 0.5, ground: 0.5,
    flying: 2, bug: 2, steel: 0.5,
  },

  ghost: { normal: 0, psychic: 2, ghost: 2, dark: 0.5 },

  dragon: { dragon: 2, steel: 0.5, fairy: 0 },

  dark: { fighting: 0.5, psychic: 2, ghost: 2, dark: 0.5, fairy: 0.5 },

  steel: {
    fire: 0.5, water: 0.5, electric: 0.5, ice: 2,
    rock: 2, steel: 0.5, fairy: 2,
  },

  fairy: { fire: 0.5, fighting: 2, poison: 0.5, dragon: 2, dark: 2, steel: 0.5 },
};

/** True if a string is a real type id. */
export function isValidType(type) {
  return TYPE_SET.has(type);
}

/** Display name for a type, e.g. 'fire' -> 'Fire'. */
export function getTypeName(type) {
  return TYPE_INFO[type] ? TYPE_INFO[type].name : 'Unknown';
}
