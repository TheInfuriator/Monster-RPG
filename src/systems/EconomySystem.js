/**
 * EconomySystem.js
 * ----------------------------------------------------------------------------
 * The player's coins.
 *
 * Money is a plain number on GameState, but nothing outside this file should
 * change it. Every rule about it — never negative, always a whole number, never
 * more than you can afford — lives here once, so a shop, a battle reward and a
 * blackout penalty cannot each get it subtly wrong.
 *
 * Pure: no Phaser, no scenes. Every function takes the state it works on.
 */

import { ECONOMY } from '../config/balance.js';

/** How many coins the player is carrying. Never negative, always whole. */
export function getMoney(state) {
  const value = state.money;
  return Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
}

/** True if the player could pay this. Nonsense amounts are never affordable. */
export function canAfford(state, amount) {
  if (!Number.isFinite(amount) || amount < 0) return false;
  return getMoney(state) >= Math.floor(amount);
}

/**
 * Earn coins.
 *
 * @returns {number} the amount actually added — 0 for a nonsense amount, so a
 *   caller can tell that nothing happened
 */
export function addMoney(state, amount) {
  if (!Number.isFinite(amount) || amount <= 0) return 0;

  const gained = Math.floor(amount);
  state.money = getMoney(state) + gained;
  return gained;
}

/**
 * Pay coins.
 *
 * All or nothing: if the player cannot afford it, NOTHING is taken. A partial
 * payment is the kind of bug that quietly eats a player's savings.
 *
 * @returns {boolean} true if the money was taken
 */
export function spendMoney(state, amount) {
  if (!Number.isFinite(amount) || amount < 0) return false;

  const cost = Math.floor(amount);
  if (cost === 0) return true;            // free is always affordable
  if (!canAfford(state, cost)) return false;

  state.money = getMoney(state) - cost;
  return true;
}

/**
 * What a shop pays for an item.
 *
 * The rule lives here rather than in the shop screen so a price can never
 * disagree with itself: an item may name its own `sellPrice`, otherwise it is
 * `ECONOMY.sellPriceFraction` of what it costs to buy.
 *
 * @returns {number} 0 for anything that cannot be sold
 */
export function getSellPrice(item) {
  if (!item || item.sellable === false) return 0;

  if (Number.isFinite(item.sellPrice)) return Math.max(0, Math.floor(item.sellPrice));
  if (!Number.isFinite(item.price) || item.price <= 0) return 0;

  return Math.max(0, Math.floor(item.price * ECONOMY.sellPriceFraction));
}

/** True if a shop will take this item at all. */
export function isSellable(item) {
  return getSellPrice(item) > 0;
}

/**
 * How many coins a blackout costs.
 *
 *   loss = floor(money * ECONOMY.faintMoneyLossFraction)
 *
 * A player with nothing loses nothing, and the loss can never exceed what they
 * are carrying — the formula cannot produce that, but the clamp says so out
 * loud rather than relying on the arithmetic.
 */
export function calculateBlackoutLoss(state) {
  const money = getMoney(state);
  if (money <= 0) return 0;

  return Math.min(money, Math.floor(money * ECONOMY.faintMoneyLossFraction));
}
