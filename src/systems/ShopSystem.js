/**
 * ShopSystem.js
 * ----------------------------------------------------------------------------
 * Buying and selling.
 *
 * Every transaction is ATOMIC: it either takes the money AND gives the items,
 * or it changes nothing at all. There is no path through this file that can
 * charge a player without handing anything over, or hand something over for
 * free — which is exactly the sort of bug a shop screen written by hand tends
 * to grow.
 *
 * Pure: no Phaser, no scenes. Prices come from the item database, the sell rule
 * from EconomySystem, and the stock list from src/data/shops.js.
 */

import { getItem } from '../data/items.js';
import { getShopStock } from '../data/shops.js';
import { getMoney, canAfford, addMoney, spendMoney, getSellPrice, isSellable } from './EconomySystem.js';
import { addItem, removeItem, getItemCount } from './InventorySystem.js';

/** Why a transaction was refused. */
export const SHOP_REFUSAL = {
  NO_ITEM: 'noItem',
  NOT_STOCKED: 'notStocked',
  BAD_QUANTITY: 'badQuantity',
  CANNOT_AFFORD: 'cannotAfford',
  NOT_OWNED: 'notOwned',
  NOT_SELLABLE: 'notSellable',
};

const refuse = (reason, message) => ({
  success: false, reason, message, quantity: 0, total: 0,
});

/** A whole number of items, at least one. Anything else is not a quantity. */
function isValidQuantity(quantity) {
  return Number.isInteger(quantity) && quantity >= 1;
}

/**
 * What the shop is offering, ready for a menu.
 *
 * @returns {Array<{item, price, owned}>}
 */
export function getBuyList(shopId, state) {
  return getShopStock(shopId, state.flags).map((item) => ({
    item,
    price: item.price,
    owned: getItemCount(state.inventory, item.id),
  }));
}

/**
 * What the player could sell, ready for a menu. Only things they actually have
 * and the shop would actually take.
 *
 * @returns {Array<{item, price, owned}>}
 */
export function getSellList(state) {
  return Object.entries(state.inventory)
    .map(([id, owned]) => ({ item: getItem(id), owned }))
    .filter((entry) => entry.item && entry.owned > 0 && isSellable(entry.item))
    .map((entry) => ({ ...entry, price: getSellPrice(entry.item) }))
    .sort((a, b) => a.item.name.localeCompare(b.item.name));
}

/** How much `quantity` of an item costs to buy. */
export function getBuyTotal(item, quantity) {
  if (!item || !isValidQuantity(quantity)) return 0;
  return item.price * quantity;
}

/** How much `quantity` of an item is worth to sell. */
export function getSellTotal(item, quantity) {
  if (!item || !isValidQuantity(quantity)) return 0;
  return getSellPrice(item) * quantity;
}

/**
 * The largest number the player could buy — what a quantity selector should
 * stop at, so it can never offer a purchase that will be refused.
 */
export function getMaxAffordable(item, state, cap = 99) {
  if (!item || !Number.isFinite(item.price)) return 0;
  if (item.price <= 0) return cap;

  return Math.max(0, Math.min(cap, Math.floor(getMoney(state) / item.price)));
}

/**
 * Buy items.
 *
 * @param {object} state    GameState
 * @param {string} shopId
 * @param {string} itemId
 * @param {number} quantity
 * @returns {{success, reason, message, quantity, total}}
 */
export function buyItem(state, shopId, itemId, quantity = 1) {
  const item = getItem(itemId);
  if (!item) return refuse(SHOP_REFUSAL.NO_ITEM, 'That is not for sale here.');

  // Only what is on the shelf. Knowing an item's id is not the same as the shop
  // having one.
  const stocked = getShopStock(shopId, state.flags).some((entry) => entry.id === itemId);
  if (!stocked) return refuse(SHOP_REFUSAL.NOT_STOCKED, 'That is not for sale here.');

  if (!isValidQuantity(quantity)) {
    return refuse(SHOP_REFUSAL.BAD_QUANTITY, 'How many did you want?');
  }

  const total = getBuyTotal(item, quantity);
  if (!canAfford(state, total)) {
    return refuse(SHOP_REFUSAL.CANNOT_AFFORD, 'You cannot afford that.');
  }

  // Take the money first, and only add the items if that succeeded. If adding
  // them somehow fails, put the money straight back — the player must never end
  // a transaction poorer with nothing to show for it.
  if (!spendMoney(state, total)) {
    return refuse(SHOP_REFUSAL.CANNOT_AFFORD, 'You cannot afford that.');
  }
  if (!addItem(state.inventory, itemId, quantity)) {
    addMoney(state, total);
    return refuse(SHOP_REFUSAL.NO_ITEM, 'That is not for sale here.');
  }

  return {
    success: true,
    reason: null,
    message: `${item.name} x${quantity} — that will be ${total} coins.`,
    quantity,
    total,
  };
}

/**
 * Sell items.
 *
 * @returns {{success, reason, message, quantity, total}}
 */
export function sellItem(state, itemId, quantity = 1) {
  const item = getItem(itemId);
  if (!item) return refuse(SHOP_REFUSAL.NO_ITEM, 'I would not know what to do with that.');

  if (!isSellable(item)) {
    return refuse(SHOP_REFUSAL.NOT_SELLABLE, 'I could not take that off your hands.');
  }
  if (!isValidQuantity(quantity)) {
    return refuse(SHOP_REFUSAL.BAD_QUANTITY, 'How many did you want to part with?');
  }
  if (getItemCount(state.inventory, itemId) < quantity) {
    return refuse(SHOP_REFUSAL.NOT_OWNED, 'You do not have that many.');
  }

  const total = getSellTotal(item, quantity);

  // Take the items first; only pay once they are gone.
  if (!removeItem(state.inventory, itemId, quantity)) {
    return refuse(SHOP_REFUSAL.NOT_OWNED, 'You do not have that many.');
  }
  addMoney(state, total);

  return {
    success: true,
    reason: null,
    message: `${item.name} x${quantity} — here is ${total} coins.`,
    quantity,
    total,
  };
}
