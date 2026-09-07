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
};

/**
 * Look up a shop. Returns null (and warns) for an unknown id rather than
 * throwing, because a typo in a map file should not crash a conversation.
 */
export function getShop(id) {
  if (!id) return null;

  const shop = SHOPS[id];
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
