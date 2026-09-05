/**
 * moves.js
 * ----------------------------------------------------------------------------
 * Every move in the game.
 *
 * FIELDS
 *   id          stable key, also what a learnset and a save file store
 *   name        shown to the player
 *   type        one of TYPES in src/data/types.js
 *   category    'physical' | 'special' | 'status'
 *   power       damage base; null for status moves
 *   accuracy    percent chance to hit; null means it never misses
 *   pp          how many times it can be used
 *   priority    higher goes first regardless of Speed; 0 for almost everything
 *   description one line, shown in the move list
 *   effect      optional structured metadata; see src/data/moveEffects.js
 *
 * PHYSICAL vs SPECIAL: physical moves use Attack against Defense, special moves
 * use Sp. Attack against Sp. Defense. Choose by whether the move is a body blow
 * or a projected force.
 *
 * TO ADD A MOVE: add an entry here, then put it in a creature's learnset in
 * src/data/creatures.js. Tests validate the type, category, effect shape and
 * numeric ranges automatically.
 */

import { EFFECT_KINDS, MOVE_CATEGORIES } from './moveEffects.js';

const { PHYSICAL, SPECIAL, STATUS } = MOVE_CATEGORIES;

export const MOVES = {
  // ---------------------------------------------------------------- Normal
  tackle: {
    id: 'tackle', name: 'Tackle', type: 'normal', category: PHYSICAL,
    power: 40, accuracy: 100, pp: 35, priority: 0,
    description: 'A straightforward full-body charge.',
  },
  scratch: {
    id: 'scratch', name: 'Scratch', type: 'normal', category: PHYSICAL,
    power: 40, accuracy: 100, pp: 35, priority: 0,
    description: 'Rakes the target with claws.',
  },
  quickJab: {
    id: 'quickJab', name: 'Quick Jab', type: 'normal', category: PHYSICAL,
    power: 40, accuracy: 100, pp: 30, priority: 1,
    description: 'A fast strike that almost always lands first.',
  },
  bodySlam: {
    id: 'bodySlam', name: 'Body Slam', type: 'normal', category: PHYSICAL,
    power: 85, accuracy: 100, pp: 15, priority: 0,
    description: 'Drops the full weight of the body onto the target.',
    effect: { kind: EFFECT_KINDS.FLINCH, chance: 0.2 },
  },
  recklessCharge: {
    id: 'recklessCharge', name: 'Reckless Charge', type: 'normal', category: PHYSICAL,
    power: 95, accuracy: 95, pp: 15, priority: 0,
    description: 'A headlong rush. The user is hurt by the impact too.',
    effect: { kind: EFFECT_KINDS.RECOIL, fraction: 0.25 },
  },
  gnaw: {
    id: 'gnaw', name: 'Gnaw', type: 'normal', category: PHYSICAL,
    power: 55, accuracy: 100, pp: 25, priority: 0,
    description: 'Worries at the target with strong front teeth.',
  },
  screech: {
    id: 'screech', name: 'Screech', type: 'normal', category: STATUS,
    power: null, accuracy: 85, pp: 20, priority: 0,
    description: "A grating cry that shakes the target's guard loose.",
    effect: { kind: EFFECT_KINDS.STAT_CHANGE, target: 'foe', stat: 'defense', stages: -2, chance: 1 },
  },
  cowerCry: {
    id: 'cowerCry', name: 'Cower Cry', type: 'normal', category: STATUS,
    power: null, accuracy: 100, pp: 20, priority: 0,
    description: 'A pitiful noise that makes the target hold back.',
    effect: { kind: EFFECT_KINDS.STAT_CHANGE, target: 'foe', stat: 'attack', stages: -1, chance: 1 },
  },
  sharpenClaws: {
    id: 'sharpenClaws', name: 'Sharpen Claws', type: 'normal', category: STATUS,
    power: null, accuracy: null, pp: 25, priority: 0,
    description: 'Hones the claws to a point. Raises Attack.',
    effect: { kind: EFFECT_KINDS.STAT_CHANGE, target: 'self', stat: 'attack', stages: 1, chance: 1 },
  },
  hardenShell: {
    id: 'hardenShell', name: 'Harden Shell', type: 'normal', category: STATUS,
    power: null, accuracy: null, pp: 25, priority: 0,
    description: 'Tenses the body until it turns aside blows. Raises Defense.',
    effect: { kind: EFFECT_KINDS.STAT_CHANGE, target: 'self', stat: 'defense', stages: 1, chance: 1 },
  },
  bask: {
    id: 'bask', name: 'Bask', type: 'normal', category: STATUS,
    power: null, accuracy: null, pp: 10, priority: 0,
    description: 'Soaks up the ambient current and restores half of max HP.',
    effect: { kind: EFFECT_KINDS.HEAL, fraction: 0.5 },
  },
  lullHum: {
    id: 'lullHum', name: 'Lull Hum', type: 'normal', category: STATUS,
    power: null, accuracy: 65, pp: 15, priority: 0,
    description: 'A drowsy drone that sends the target to sleep.',
    effect: { kind: EFFECT_KINDS.STATUS, status: 'sleep', chance: 1 },
  },

  // ------------------------------------------------------------------ Fire
  ember: {
    id: 'ember', name: 'Ember', type: 'fire', category: SPECIAL,
    power: 40, accuracy: 100, pp: 30, priority: 0,
    description: 'Spits a small flame. May leave the target burned.',
    effect: { kind: EFFECT_KINDS.STATUS, status: 'burn', chance: 0.1 },
  },
  cinderSpray: {
    id: 'cinderSpray', name: 'Cinder Spray', type: 'fire', category: SPECIAL,
    power: 65, accuracy: 100, pp: 20, priority: 0,
    description: 'A shower of hot sparks. Often burns.',
    effect: { kind: EFFECT_KINDS.STATUS, status: 'burn', chance: 0.3 },
  },
  flameBurst: {
    id: 'flameBurst', name: 'Flame Burst', type: 'fire', category: SPECIAL,
    power: 90, accuracy: 100, pp: 15, priority: 0,
    description: 'A blast of fire at close range.',
    effect: { kind: EFFECT_KINDS.STATUS, status: 'burn', chance: 0.1 },
  },
  emberFang: {
    id: 'emberFang', name: 'Ember Fang', type: 'fire', category: PHYSICAL,
    power: 70, accuracy: 95, pp: 15, priority: 0,
    description: 'Bites with glowing teeth.',
    effect: { kind: EFFECT_KINDS.STATUS, status: 'burn', chance: 0.1 },
  },
  kindle: {
    id: 'kindle', name: 'Kindle', type: 'fire', category: STATUS,
    power: null, accuracy: null, pp: 20, priority: 0,
    description: 'Stokes the inner seams. Sharply raises Sp. Attack.',
    effect: { kind: EFFECT_KINDS.STAT_CHANGE, target: 'self', stat: 'spAttack', stages: 2, chance: 1 },
  },
  ashCloud: {
    id: 'ashCloud', name: 'Ash Cloud', type: 'fire', category: STATUS,
    power: null, accuracy: 95, pp: 20, priority: 0,
    description: "Throws up grit that stings the target's eyes. Lowers accuracy.",
    effect: { kind: EFFECT_KINDS.STAT_CHANGE, target: 'foe', stat: 'accuracy', stages: -1, chance: 1 },
  },

  // ----------------------------------------------------------------- Water
  waterJet: {
    id: 'waterJet', name: 'Water Jet', type: 'water', category: SPECIAL,
    power: 40, accuracy: 100, pp: 30, priority: 0,
    description: 'A thin, forceful spray of water.',
  },
  bubbleVeil: {
    id: 'bubbleVeil', name: 'Bubble Veil', type: 'water', category: SPECIAL,
    power: 50, accuracy: 100, pp: 25, priority: 0,
    description: 'Bursts a curtain of bubbles. May slow the target.',
    effect: { kind: EFFECT_KINDS.STAT_CHANGE, target: 'foe', stat: 'speed', stages: -1, chance: 0.3 },
  },
  torrentCrash: {
    id: 'torrentCrash', name: 'Torrent Crash', type: 'water', category: SPECIAL,
    power: 90, accuracy: 100, pp: 15, priority: 0,
    description: 'Brings down a column of water.',
  },
  tidePull: {
    id: 'tidePull', name: 'Tide Pull', type: 'water', category: SPECIAL,
    power: 60, accuracy: 100, pp: 15, priority: 0,
    description: 'Drags at the target and draws strength back to the user.',
    effect: { kind: EFFECT_KINDS.DRAIN, fraction: 0.5 },
  },
  mistGuard: {
    id: 'mistGuard', name: 'Mist Guard', type: 'water', category: STATUS,
    power: null, accuracy: null, pp: 20, priority: 0,
    description: 'Wraps the body in cool mist. Raises Sp. Defense.',
    effect: { kind: EFFECT_KINDS.STAT_CHANGE, target: 'self', stat: 'spDefense', stages: 1, chance: 1 },
  },

  // ----------------------------------------------------------------- Grass
  leafDart: {
    id: 'leafDart', name: 'Leaf Dart', type: 'grass', category: PHYSICAL,
    power: 40, accuracy: 100, pp: 30, priority: 0,
    description: 'Flicks a stiffened leaf like a blade.',
  },
  sapDrain: {
    id: 'sapDrain', name: 'Sap Drain', type: 'grass', category: SPECIAL,
    power: 45, accuracy: 100, pp: 20, priority: 0,
    description: "Siphons sap from the target and heals the user.",
    effect: { kind: EFFECT_KINDS.DRAIN, fraction: 0.5 },
  },
  brambleSlam: {
    id: 'brambleSlam', name: 'Bramble Slam', type: 'grass', category: PHYSICAL,
    power: 85, accuracy: 95, pp: 15, priority: 0,
    description: 'Lashes the target with a mane of thorned vines.',
  },
  rootheal: {
    id: 'rootheal', name: 'Rootheal', type: 'grass', category: STATUS,
    power: null, accuracy: null, pp: 10, priority: 0,
    description: 'Sinks roots into the ground and recovers half of max HP.',
    effect: { kind: EFFECT_KINDS.HEAL, fraction: 0.5 },
  },
  sapLegs: {
    id: 'sapLegs', name: 'Sap Legs', type: 'grass', category: STATUS,
    power: null, accuracy: 95, pp: 20, priority: 0,
    description: "Creeping tendrils tangle the target's feet. Lowers Speed.",
    effect: { kind: EFFECT_KINDS.STAT_CHANGE, target: 'foe', stat: 'speed', stages: -1, chance: 1 },
  },
  toxicSpore: {
    id: 'toxicSpore', name: 'Toxic Spore', type: 'grass', category: STATUS,
    power: null, accuracy: 85, pp: 15, priority: 0,
    description: 'Releases a cloud of spores that poisons the target.',
    effect: { kind: EFFECT_KINDS.STATUS, status: 'poison', chance: 1 },
  },

  // -------------------------------------------------------------- Electric
  spark: {
    id: 'spark', name: 'Spark', type: 'electric', category: SPECIAL,
    power: 40, accuracy: 100, pp: 30, priority: 0,
    description: 'A small jolt of static.',
    effect: { kind: EFFECT_KINDS.STATUS, status: 'paralysis', chance: 0.1 },
  },
  shockJolt: {
    id: 'shockJolt', name: 'Shock Jolt', type: 'electric', category: SPECIAL,
    power: 65, accuracy: 100, pp: 20, priority: 0,
    description: 'A sharp discharge that often locks the muscles.',
    effect: { kind: EFFECT_KINDS.STATUS, status: 'paralysis', chance: 0.3 },
  },
  thunderLance: {
    id: 'thunderLance', name: 'Thunder Lance', type: 'electric', category: SPECIAL,
    power: 90, accuracy: 95, pp: 15, priority: 0,
    description: 'Hurls a spear of lightning.',
  },
  staticWeb: {
    id: 'staticWeb', name: 'Static Web', type: 'electric', category: STATUS,
    power: null, accuracy: 90, pp: 20, priority: 0,
    description: 'Lays a charged net that paralyses the target.',
    effect: { kind: EFFECT_KINDS.STATUS, status: 'paralysis', chance: 1 },
  },
  windrush: {
    id: 'windrush', name: 'Windrush', type: 'electric', category: STATUS,
    power: null, accuracy: null, pp: 25, priority: 0,
    description: 'Charges the body until it hums. Sharply raises Speed.',
    effect: { kind: EFFECT_KINDS.STAT_CHANGE, target: 'self', stat: 'speed', stages: 2, chance: 1 },
  },

  // ------------------------------------------------------------------- Bug
  bugBite: {
    id: 'bugBite', name: 'Bug Bite', type: 'bug', category: PHYSICAL,
    power: 45, accuracy: 100, pp: 25, priority: 0,
    description: 'A quick nip from hardened mandibles.',
  },
  venomSting: {
    id: 'venomSting', name: 'Venom Sting', type: 'bug', category: PHYSICAL,
    power: 50, accuracy: 100, pp: 20, priority: 0,
    description: 'A barbed jab that often poisons.',
    effect: { kind: EFFECT_KINDS.STATUS, status: 'poison', chance: 0.3 },
  },
  carapaceRam: {
    id: 'carapaceRam', name: 'Carapace Ram', type: 'bug', category: PHYSICAL,
    power: 80, accuracy: 100, pp: 15, priority: 0,
    description: 'Rolls into a plated disc and slams into the target.',
  },

  // ------------------------------------------------------------------ Rock
  rockToss: {
    id: 'rockToss', name: 'Rock Toss', type: 'rock', category: PHYSICAL,
    power: 50, accuracy: 90, pp: 20, priority: 0,
    description: 'Lobs a loose stone.',
  },
  pebbleVolley: {
    id: 'pebbleVolley', name: 'Pebble Volley', type: 'rock', category: PHYSICAL,
    power: 25, accuracy: 90, pp: 20, priority: 0,
    description: 'Kicks up a spray of grit that strikes two to five times.',
    effect: { kind: EFFECT_KINDS.MULTI_HIT, min: 2, max: 5 },
  },
  stoneHammer: {
    id: 'stoneHammer', name: 'Stone Hammer', type: 'rock', category: PHYSICAL,
    power: 90, accuracy: 85, pp: 10, priority: 0,
    description: 'Brings a slab of rock down on the target.',
  },

  // ---------------------------------------------------------------- Ground
  mudSlap: {
    id: 'mudSlap', name: 'Mud Slap', type: 'ground', category: SPECIAL,
    power: 30, accuracy: 100, pp: 20, priority: 0,
    description: "Flings wet earth into the target's face. Lowers accuracy.",
    effect: { kind: EFFECT_KINDS.STAT_CHANGE, target: 'foe', stat: 'accuracy', stages: -1, chance: 1 },
  },
  quakeStomp: {
    id: 'quakeStomp', name: 'Quake Stomp', type: 'ground', category: PHYSICAL,
    power: 80, accuracy: 100, pp: 15, priority: 0,
    description: 'Stamps hard enough to split the ground underfoot.',
  },

  // ---------------------------------------------------------------- Flying
  peck: {
    id: 'peck', name: 'Peck', type: 'flying', category: PHYSICAL,
    power: 40, accuracy: 100, pp: 35, priority: 0,
    description: 'Jabs with a sharp beak.',
  },
  gust: {
    id: 'gust', name: 'Gust', type: 'flying', category: SPECIAL,
    power: 45, accuracy: 100, pp: 30, priority: 0,
    description: 'Beats the wings to whip up a buffeting wind.',
  },
  aerialDive: {
    id: 'aerialDive', name: 'Aerial Dive', type: 'flying', category: PHYSICAL,
    power: 85, accuracy: 95, pp: 15, priority: 0,
    description: 'Climbs, turns, and drops on the target at speed.',
  },

  // -------------------------------------------------------------- Fighting
  closeJab: {
    id: 'closeJab', name: 'Close Jab', type: 'fighting', category: PHYSICAL,
    power: 60, accuracy: 100, pp: 20, priority: 0,
    description: 'A disciplined strike thrown from close in.',
  },
  thornGuard: {
    id: 'thornGuard', name: 'Thorn Guard', type: 'fighting', category: STATUS,
    power: null, accuracy: null, pp: 20, priority: 0,
    description: 'Sets the thorns outward. Sharply raises Defense.',
    effect: { kind: EFFECT_KINDS.STAT_CHANGE, target: 'self', stat: 'defense', stages: 2, chance: 1 },
  },

  // ---------------------------------------------------------------- Poison
  acidSpit: {
    id: 'acidSpit', name: 'Acid Spit', type: 'poison', category: SPECIAL,
    power: 55, accuracy: 100, pp: 20, priority: 0,
    description: 'Spits bitter sap. May soften the target.',
    effect: { kind: EFFECT_KINDS.STAT_CHANGE, target: 'foe', stat: 'spDefense', stages: -1, chance: 0.2 },
  },
  rustBreath: {
    id: 'rustBreath', name: 'Rust Breath', type: 'poison', category: STATUS,
    power: null, accuracy: 90, pp: 20, priority: 0,
    description: "A corrosive haze that eats at the target's guard. Lowers Defense.",
    effect: { kind: EFFECT_KINDS.STAT_CHANGE, target: 'foe', stat: 'defense', stages: -1, chance: 1 },
  },

  // ----------------------------------------------------------------- Steel
  metalClaw: {
    id: 'metalClaw', name: 'Metal Claw', type: 'steel', category: PHYSICAL,
    power: 50, accuracy: 95, pp: 25, priority: 0,
    description: 'Rakes with hardened plating. May sharpen the user.',
    effect: { kind: EFFECT_KINDS.STAT_CHANGE, target: 'self', stat: 'attack', stages: 1, chance: 0.2 },
  },
  ironSweep: {
    id: 'ironSweep', name: 'Iron Sweep', type: 'steel', category: PHYSICAL,
    power: 80, accuracy: 100, pp: 15, priority: 0,
    description: 'Swings a plated limb in a heavy arc.',
  },

  // ----------------------------------------------------------------- Ghost
  shadowNip: {
    id: 'shadowNip', name: 'Shadow Nip', type: 'ghost', category: SPECIAL,
    power: 45, accuracy: 100, pp: 25, priority: 0,
    description: 'A cold bite from something not quite there.',
  },
  shadowSneak: {
    id: 'shadowSneak', name: 'Shadow Sneak', type: 'ghost', category: PHYSICAL,
    power: 40, accuracy: 100, pp: 30, priority: 1,
    description: "Strikes from the target's own shadow before they can react.",
  },
  lifeSiphon: {
    id: 'lifeSiphon', name: 'Life Siphon', type: 'ghost', category: SPECIAL,
    power: 65, accuracy: 100, pp: 10, priority: 0,
    description: 'Draws warmth out of the target and into the user.',
    effect: { kind: EFFECT_KINDS.DRAIN, fraction: 0.5 },
  },

  // ------------------------------------------------------------------ Dark
  nightRend: {
    id: 'nightRend', name: 'Night Rend', type: 'dark', category: PHYSICAL,
    power: 70, accuracy: 100, pp: 20, priority: 0,
    description: 'A vicious strike thrown from the dark.',
  },
  crunchBite: {
    id: 'crunchBite', name: 'Crunch Bite', type: 'dark', category: PHYSICAL,
    power: 80, accuracy: 100, pp: 15, priority: 0,
    description: 'Bites down hard. May shake the target’s guard.',
    effect: { kind: EFFECT_KINDS.STAT_CHANGE, target: 'foe', stat: 'defense', stages: -1, chance: 0.2 },
  },
};

/** Every move id, handy for tests and debug tools. */
export const MOVE_IDS = Object.keys(MOVES);

/**
 * Look up a move. Returns null and warns for an unknown id, so a typo in a
 * learnset cannot crash the game mid-battle.
 */
export function getMove(id) {
  const move = MOVES[id];
  if (!move) {
    console.warn(`[moves] Unknown move id "${id}".`);
    return null;
  }
  return move;
}
