/**
 * items.js
 * ----------------------------------------------------------------------------
 * Every item in the game.
 *
 * Phase 2 uses this for items found lying on the ground. The shop, the bag
 * screen, and using items in battle arrive in Phase 7 — but they will read this
 * same file, so anything added here is already wired into the world.
 *
 * FIELDS
 *   id          unique key, also used in save data
 *   name        shown to the player
 *   category    'healing' | 'capture' | 'battle' | 'key'
 *   description one line, shown in the bag and the shop
 *   price       what a shop charges. 0 means it cannot be bought.
 *   effect      what using it does
 *
 * EFFECT TYPES
 *   { type: 'heal', amount }             restore HP
 *   { type: 'cureStatus', status }       clear one major status
 *   { type: 'capture', modifier }        an orb; `modifier` multiplies the
 *                                        capture chance (1 = plain, 2 = twice
 *                                        as likely). Nothing in the code names
 *                                        an individual orb — adding a new tier
 *                                        is one entry here with a new modifier.
 */

export const ITEMS = {
  potion: {
    id: 'potion',
    name: 'Potion',
    category: 'healing',
    description: 'Restores 20 HP to one Aether.',
    price: 200,
    effect: { type: 'heal', amount: 20 },
  },
  superPotion: {
    id: 'superPotion',
    name: 'Super Potion',
    category: 'healing',
    description: 'Restores 50 HP to one Aether.',
    price: 550,
    effect: { type: 'heal', amount: 50 },
  },
  antidote: {
    id: 'antidote',
    name: 'Antidote',
    category: 'healing',
    description: 'Cures poison.',
    price: 120,
    effect: { type: 'cureStatus', status: 'poison' },
  },
  soothingBalm: {
    id: 'soothingBalm',
    name: 'Soothing Balm',
    category: 'healing',
    description: 'Cures paralysis.',
    price: 120,
    effect: { type: 'cureStatus', status: 'paralysis' },
  },
  basicOrb: {
    id: 'basicOrb',
    name: 'Basic Orb',
    category: 'capture',
    description: 'A simple orb for catching wild Aethers.',
    price: 150,
    effect: { type: 'capture', modifier: 1 },
  },
  greatOrb: {
    id: 'greatOrb',
    name: 'Great Orb',
    category: 'capture',
    description: 'A better orb. Catches Aethers more reliably.',
    price: 500,
    effect: { type: 'capture', modifier: 1.5 },
  },
  ultraOrb: {
    id: 'ultraOrb',
    name: 'Ultra Orb',
    category: 'capture',
    description: 'The finest orb a Warden can carry. Catches almost anything.',
    price: 1200,
    effect: { type: 'capture', modifier: 2 },
  },
  wardensPass: {
    id: 'wardensPass',
    name: "Warden's Pass",
    category: 'key',
    description: 'Proof that you are a registered Warden.',
    price: 0,
    effect: null,
  },
};

/**
 * Look up an item. Returns null and warns for an unknown id, so a typo in a map
 * file cannot crash the game while the player is walking around.
 */
export function getItem(id) {
  const item = ITEMS[id];
  if (!item) {
    console.warn(
      `[items] Unknown item id "${id}". Known items: ${Object.keys(ITEMS).join(', ')}.`
    );
    return null;
  }
  return item;
}
