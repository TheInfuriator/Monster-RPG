/**
 * InventorySystem.js
 * ----------------------------------------------------------------------------
 * Adding, removing and counting the items the player is carrying.
 *
 * The bag is stored as a simple `{ itemId: quantity }` object on GameState,
 * which serialises straight into a save file with no conversion.
 *
 * Phase 2 uses this for picking things up off the ground. The bag SCREEN and
 * the shop are Phase 7, and will use these same functions.
 */

import { getItem } from '../data/items.js';

/** How many of an item the player is carrying. Unknown items count as zero. */
export function getItemCount(inventory, itemId) {
  return inventory[itemId] || 0;
}

/**
 * Add items to the bag.
 *
 * @returns {boolean} false if the item id is not real (nothing is added)
 */
export function addItem(inventory, itemId, quantity = 1) {
  if (!getItem(itemId)) return false;
  if (quantity <= 0) return false;

  inventory[itemId] = getItemCount(inventory, itemId) + quantity;
  return true;
}

/**
 * Remove items from the bag.
 *
 * @returns {boolean} false if the player does not have that many (nothing is
 *          removed — a partial removal would be a very confusing bug)
 */
export function removeItem(inventory, itemId, quantity = 1) {
  if (quantity <= 0) return false;

  const owned = getItemCount(inventory, itemId);
  if (owned < quantity) return false;

  if (owned === quantity) {
    // Delete rather than storing a zero, so saves stay tidy and
    // "do I have any?" is a simple truthiness check.
    delete inventory[itemId];
  } else {
    inventory[itemId] = owned - quantity;
  }
  return true;
}

/** True if the player has at least one of an item. */
export function hasItem(inventory, itemId) {
  return getItemCount(inventory, itemId) > 0;
}

/**
 * The bag as a list, ready for a menu: each entry is the full item definition
 * plus how many are held. Sorted by category so the bag reads consistently.
 */
export function listInventory(inventory) {
  const order = ['healing', 'capture', 'battle', 'key'];

  return Object.entries(inventory)
    .map(([id, quantity]) => ({ item: getItem(id), quantity }))
    .filter((entry) => entry.item !== null)
    .sort((a, b) => {
      const byCategory =
        order.indexOf(a.item.category) - order.indexOf(b.item.category);
      return byCategory !== 0 ? byCategory : a.item.name.localeCompare(b.item.name);
    });
}
