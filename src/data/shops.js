/**
 * shops.js
 * ----------------------------------------------------------------------------
 * What each shop sells.
 *
 * A shop is a NAME and a LIST OF ITEM IDS. The prices come from the items
 * themselves (src/data/items.js), so a price is never written down twice, and
 * the buying and selling rules come from ShopSystem — nothing about how a
 * transaction works lives here.
 *
 * WHY STOCK IS SEPARATE FROM THE ITEM DATABASE
 * An item existing is not the same as it being for sale. Great and Ultra Orbs
 * and Super Potions are all real items the player can find or be given, but
 * selling them in the starting town would flatten the first route. Stock is the
 * knob that controls availability, independently of what exists.
 *
 * A STOCK ENTRY
 *   item   the item id
 *   when   optional story flag that must be set before it appears on the shelf
 *
 * TO OPEN A NEW SHOP: add an entry here, then give the shopkeeper
 * `action: 'shop:<id>'` in the map's dialogue. No code changes.
 */

import { getItem } from './items.js';

export const SHOPS = {
  /**
   * Emberhollow's Supply Post. Deliberately modest: enough to keep a Warden
   * going on Route 1, not enough to make the route trivial.
   *
   * At 800 starting coins that is four Potions and change, or two Potions and
   * three Orbs — a real choice rather than "buy one of everything".
   */
  emberhollowSupplyPost: {
    id: 'emberhollowSupplyPost',
    name: 'Supply Post',
    keeper: 'Bram',
    greeting: 'Orbs and potions. What will it be?',
    stock: [
      { item: 'potion' },
      { item: 'antidote' },
      { item: 'soothingBalm' },
      { item: 'burnSalve' },
      { item: 'basicOrb' },
      // Stronger orbs and Super Potions exist, but not on this shelf yet — the
      // first town should not sell the answer to the first route.
    ],
  },

  /**
   * Thistlewood's Supply Post. A real step up, because the player arrives here
   * with Route 1's trainer money in their pocket and a Beacon Hall in front of
   * them.
   *
   * What is new: the SUPER POTION (50 HP, 550) and the GREAT ORB (x1.5, 500),
   * plus the Rouser for sleep — Fern's Puffcap knows Lull Hum, so a sleep cure
   * stops being a luxury the moment you walk into the Hall.
   *
   * What is still held back: the Ultra Orb and the Clear Tonic. A 1200-coin orb
   * on the first Gym's doorstep would flatten every capture decision after it,
   * and the single-status cures already cover everything the Hall inflicts.
   */
  thistlewoodSupplyPost: {
    id: 'thistlewoodSupplyPost',
    name: 'Supply Post',
    keeper: 'Perrin',
    greeting: 'Hall challenger? Then you will want the strong shelf.',
    stock: [
      { item: 'potion' },
      { item: 'superPotion' },
      { item: 'antidote' },
      { item: 'soothingBalm' },
      { item: 'burnSalve' },
      { item: 'rouser' },
      { item: 'basicOrb' },
      { item: 'greatOrb' },
    ],
  },

  /**
   * Tidewatch Harbor's Supply Post (Phase 12). The third town, after a
   * dungeon: the player arrives with the cavern's prize money and a Water
   * Hall ahead.
   *
   * What is new: the ULTRA ORB (x2, 1200) and the CLEAR TONIC (400, cures
   * anything). Both were held back from Thistlewood on purpose; by now the
   * player has paid for them in Vane prize money (see tests/economy.test.js's
   * Phase 12 audit), the wild Aethers are evolving and harder to hold, and the
   * Hall and the cave inflict poison, burns and paralysis from several sides.
   *
   * Still held back: nothing stronger exists yet.
   */
  tidewatchSupplyPost: {
    id: 'tidewatchSupplyPost',
    name: 'Supply Post',
    keeper: 'Morwen',
    greeting: 'Harbour prices, harbour quality. What do you need?',
    stock: [
      { item: 'potion' },
      { item: 'superPotion' },
      { item: 'antidote' },
      { item: 'soothingBalm' },
      { item: 'burnSalve' },
      { item: 'rouser' },
      { item: 'clearTonic' },
      { item: 'basicOrb' },
      { item: 'greatOrb' },
      { item: 'ultraOrb' },
    ],
  },

  /**
   * Voltspire City's Supply Post (Phase 13). The last town before the
   * championship: the player arrives with the Climb's prize money (and the
   * Overseer's, and Kestrel's) and an Electric Hall ahead.
   *
   * What is new: the MENDER'S DRAUGHT (100 HP, 900). By the Storm Hall a
   * team's HP has roughly doubled since Thistlewood, so a 50-HP Super Potion
   * now heals half of what it used to; the Draught is the step up. It is the
   * only new thing: every Orb that exists is already on sale, and the cures
   * cover every status there is.
   */
  voltspireSupplyPost: {
    id: 'voltspireSupplyPost',
    name: 'Supply Post',
    keeper: 'Cassia',
    greeting: 'Storm prices — but you get what you pay for.',
    stock: [
      { item: 'potion' },
      { item: 'superPotion' },
      { item: 'mendersDraught' },
      { item: 'antidote' },
      { item: 'soothingBalm' },
      { item: 'burnSalve' },
      { item: 'rouser' },
      { item: 'clearTonic' },
      { item: 'basicOrb' },
      { item: 'greatOrb' },
      { item: 'ultraOrb' },
    ],
  },

  /**
   * The Aerie Lodge (Phase 14): the last counter before the Circle's Trial.
   * Voltspire's shelf exactly — nothing new to buy at the top of the valley,
   * only the chance to stock up one last time. The Potion and the Basic Orb
   * are left behind on the road up: nobody carries those to the Aerie.
   */
  aerieLodge: {
    id: 'aerieLodge',
    name: 'Aerie Lodge',
    keeper: 'Quill',
    greeting: 'Carried up on my own back. Priced accordingly.',
    stock: [
      { item: 'superPotion' },
      { item: 'mendersDraught' },
      { item: 'antidote' },
      { item: 'soothingBalm' },
      { item: 'burnSalve' },
      { item: 'rouser' },
      { item: 'clearTonic' },
      { item: 'greatOrb' },
      { item: 'ultraOrb' },
    ],
  },
};

/**
 * Look up a shop. Returns null (and warns) for an unknown id rather than
 * throwing, because a typo in a map file should not crash a conversation.
 */
export function getShop(id) {
  if (!id) return null;

  const shop = Object.hasOwn(SHOPS, id) ? SHOPS[id] : undefined;
  if (!shop) {
    console.warn(
      `[shops] Unknown shop "${id}". Known shops: ${Object.keys(SHOPS).join(', ')}.`
    );
    return null;
  }
  return shop;
}

/**
 * What is actually on the shelf right now, as full item definitions.
 * Entries gated behind a story flag are left out until that flag is set.
 *
 * @param {string} shopId
 * @param {object} flags GameState's flags
 * @returns {object[]} item definitions, in the order the shop lists them
 */
export function getShopStock(shopId, flags = {}) {
  const shop = getShop(shopId);
  if (!shop) return [];

  return shop.stock
    .filter((entry) => !entry.when || Boolean(flags[entry.when]))
    .map((entry) => getItem(entry.item))
    .filter(Boolean);
}
