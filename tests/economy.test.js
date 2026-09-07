/**
 * Tests for coins, shops, healing and blacking out.
 *
 * All of it is pure state, so the rules that decide whether a player is charged
 * twice or wakes up in the right place are checked here rather than by playing
 * the game and hoping.
 */

import { describe, it, expect, vi } from 'vitest';
import {
  getMoney, canAfford, addMoney, spendMoney, getSellPrice, isSellable,
  calculateBlackoutLoss,
} from '../src/systems/EconomySystem.js';
import {
  buyItem, sellItem, getBuyList, getSellList, getBuyTotal, getSellTotal,
  getMaxAffordable, SHOP_REFUSAL,
} from '../src/systems/ShopSystem.js';
import {
  healCreatureFully, healParty, reviveParty, needsHealing,
} from '../src/systems/HealingSystem.js';
import { resolveBlackout, getRecoveryMessages } from '../src/systems/BlackoutSystem.js';
import {
  applyItemToCreature, getItemUsage, needsCreatureTarget, ITEM_REFUSAL,
} from '../src/systems/ItemEffects.js';
import {
  getItemCount, addItem, removeItem, listInventory,
} from '../src/systems/InventorySystem.js';
import {
  createNewGameState, getRecoveryPoint, setRecoveryPoint,
} from '../src/core/GameState.js';
import { createCreature } from '../src/systems/CreatureFactory.js';
import { ITEMS, getItem } from '../src/data/items.js';
import { SHOPS, getShop, getShopStock } from '../src/data/shops.js';
import { ECONOMY } from '../src/config/balance.js';
import { STATUS_IDS } from '../src/data/statuses.js';
import { MAPS } from '../src/data/maps/index.js';
import { TileMap } from '../src/systems/TileMap.js';

const freshState = () => createNewGameState();

/** A creature knocked about a bit, for healing tests. */
function hurt(speciesId = 'pyrret', level = 10) {
  const creature = createCreature(speciesId, level);
  creature.currentHp = Math.max(1, Math.floor(creature.stats.hp / 3));
  creature.status = 'poison';
  creature.moves[0].pp = 0;
  return creature;
}

// ---------------------------------------------------------------------------
// Money
// ---------------------------------------------------------------------------

describe('money', () => {
  it('starts at the configured amount', () => {
    expect(getMoney(freshState())).toBe(ECONOMY.startingMoney);
  });

  it('adds and spends whole coins', () => {
    const state = freshState();
    state.money = 100;

    expect(addMoney(state, 50)).toBe(50);
    expect(getMoney(state)).toBe(150);
    expect(spendMoney(state, 30)).toBe(true);
    expect(getMoney(state)).toBe(120);
  });

  it('refuses to spend more than the player has, changing nothing', () => {
    const state = freshState();
    state.money = 40;

    expect(spendMoney(state, 41)).toBe(false);
    expect(getMoney(state)).toBe(40);
  });

  it('never goes negative', () => {
    const state = freshState();
    state.money = 10;
    spendMoney(state, 10);
    expect(getMoney(state)).toBe(0);
    spendMoney(state, 5);
    expect(getMoney(state)).toBe(0);
  });

  it('rejects nonsense amounts', () => {
    const state = freshState();
    state.money = 100;

    for (const bad of [-5, NaN, Infinity, undefined, null, '50']) {
      expect(addMoney(state, bad)).toBe(0);
      expect(spendMoney(state, bad)).toBe(false);
    }
    expect(getMoney(state)).toBe(100);
  });

  it('treats free as always affordable', () => {
    const state = freshState();
    state.money = 0;
    expect(spendMoney(state, 0)).toBe(true);
    expect(getMoney(state)).toBe(0);
  });

  it('rounds fractions down rather than storing them', () => {
    const state = freshState();
    state.money = 0;
    addMoney(state, 10.9);
    expect(getMoney(state)).toBe(10);
    expect(Number.isInteger(getMoney(state))).toBe(true);
  });

  it('reads a corrupt value as zero rather than propagating it', () => {
    expect(getMoney({ money: NaN })).toBe(0);
    expect(getMoney({ money: -50 })).toBe(0);
    expect(getMoney({})).toBe(0);
  });

  it('answers affordability without changing anything', () => {
    const state = freshState();
    state.money = 200;

    expect(canAfford(state, 200)).toBe(true);
    expect(canAfford(state, 201)).toBe(false);
    expect(canAfford(state, -1)).toBe(false);
    expect(getMoney(state)).toBe(200);
  });
});

describe('sell prices', () => {
  it('are a fraction of the buy price by default', () => {
    expect(getSellPrice(ITEMS.potion))
      .toBe(Math.floor(ITEMS.potion.price * ECONOMY.sellPriceFraction));
  });

  it('are zero for anything marked unsellable', () => {
    expect(getSellPrice(ITEMS.wardensPass)).toBe(0);
    expect(isSellable(ITEMS.wardensPass)).toBe(false);
  });

  it('honour an explicit sellPrice when an item names one', () => {
    expect(getSellPrice({ id: 'x', price: 100, sellPrice: 7 })).toBe(7);
  });

  it('are zero for nothing at all', () => {
    expect(getSellPrice(null)).toBe(0);
    expect(getSellPrice({ id: 'x', price: 0 })).toBe(0);
  });

  it('are whole coins', () => {
    for (const item of Object.values(ITEMS)) {
      expect(Number.isInteger(getSellPrice(item)), `${item.id}`).toBe(true);
    }
  });
});

describe('the blackout penalty', () => {
  it('is the configured fraction, rounded down', () => {
    const state = freshState();
    state.money = 1000;
    expect(calculateBlackoutLoss(state))
      .toBe(Math.floor(1000 * ECONOMY.faintMoneyLossFraction));
  });

  it('is nothing when the player has nothing', () => {
    const state = freshState();
    state.money = 0;
    expect(calculateBlackoutLoss(state)).toBe(0);
  });

  it('never exceeds what the player is carrying', () => {
    for (const money of [0, 1, 7, 99, 1000, 999999]) {
      const state = freshState();
      state.money = money;
      expect(calculateBlackoutLoss(state)).toBeLessThanOrEqual(money);
    }
  });
});

// ---------------------------------------------------------------------------
// Inventory
// ---------------------------------------------------------------------------

describe('the bag', () => {
  it('stacks quantities', () => {
    const bag = {};
    addItem(bag, 'potion', 2);
    addItem(bag, 'potion', 3);
    expect(getItemCount(bag, 'potion')).toBe(5);
  });

  it('rejects an unknown item', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const bag = {};
    expect(addItem(bag, 'notanitem', 1)).toBe(false);
    expect(bag).toEqual({});
    warn.mockRestore();
  });

  it('rejects a zero or negative quantity', () => {
    const bag = { potion: 3 };
    expect(addItem(bag, 'potion', 0)).toBe(false);
    expect(addItem(bag, 'potion', -2)).toBe(false);
    expect(removeItem(bag, 'potion', 0)).toBe(false);
    expect(removeItem(bag, 'potion', -1)).toBe(false);
    expect(bag.potion).toBe(3);
  });

  it('never underflows — removing too many changes nothing', () => {
    const bag = { potion: 2 };
    expect(removeItem(bag, 'potion', 3)).toBe(false);
    expect(bag.potion).toBe(2);
  });

  it('drops the key entirely at zero, rather than storing a zero', () => {
    const bag = { potion: 2 };
    removeItem(bag, 'potion', 2);
    expect('potion' in bag).toBe(false);
    expect(getItemCount(bag, 'potion')).toBe(0);
  });

  it('stays plain serialisable data', () => {
    const bag = {};
    addItem(bag, 'potion', 2);
    addItem(bag, 'basicOrb', 5);
    expect(JSON.parse(JSON.stringify(bag))).toEqual(bag);
  });

  it('lists what is held, grouped by category', () => {
    const bag = { basicOrb: 3, potion: 1 };
    const listed = listInventory(bag);
    expect(listed.map((entry) => entry.item.id)).toEqual(['potion', 'basicOrb']);
    expect(listed[0].quantity).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// Item data
// ---------------------------------------------------------------------------

describe('every item is well formed', () => {
  for (const [id, item] of Object.entries(ITEMS)) {
    describe(`item "${id}"`, () => {
      it('has a matching id, a name and a description', () => {
        expect(item.id).toBe(id);
        expect(item.name.length).toBeGreaterThan(0);
        expect(item.description.length).toBeGreaterThan(0);
      });

      it('has a known category', () => {
        expect(['healing', 'capture', 'battle', 'key']).toContain(item.category);
      });

      it('has a price that is a whole number and never negative', () => {
        expect(Number.isInteger(item.price)).toBe(true);
        expect(item.price).toBeGreaterThanOrEqual(0);
      });

      it('has an effect this game knows how to carry out, or none at all', () => {
        if (!item.effect) return;
        expect(['heal', 'cureStatus', 'cureAllStatus', 'capture'])
          .toContain(item.effect.type);

        if (item.effect.type === 'heal') {
          expect(item.effect.amount).toBeGreaterThan(0);
        }
        if (item.effect.type === 'cureStatus') {
          expect(STATUS_IDS).toContain(item.effect.status);
        }
        if (item.effect.type === 'capture') {
          expect(item.effect.modifier).toBeGreaterThan(0);
        }
      });

      it('is usable somewhere, or is a key item', () => {
        const usage = getItemUsage(item);
        if (item.category === 'key') {
          expect(usage.battle || usage.field).toBe(false);
        } else {
          expect(usage.battle || usage.field).toBe(true);
        }
      });
    });
  }

  it('gives every item a unique id', () => {
    const ids = Object.values(ITEMS).map((item) => item.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('covers every major status with a cure', () => {
    const cured = new Set(
      Object.values(ITEMS)
        .filter((item) => item.effect?.type === 'cureStatus')
        .map((item) => item.effect.status)
    );
    const hasCureAll = Object.values(ITEMS).some((i) => i.effect?.type === 'cureAllStatus');

    for (const status of STATUS_IDS) {
      expect(cured.has(status) || hasCureAll, `nothing cures "${status}"`).toBe(true);
    }
  });

  it('keeps orbs out of the field bag and healing in both', () => {
    expect(getItemUsage(ITEMS.basicOrb)).toEqual({ battle: true, field: false });
    expect(getItemUsage(ITEMS.potion)).toEqual({ battle: true, field: true });
    expect(needsCreatureTarget(ITEMS.potion)).toBe(true);
    expect(needsCreatureTarget(ITEMS.basicOrb)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Using items
// ---------------------------------------------------------------------------

describe('using an item on a creature', () => {
  it('restores HP and says how much', () => {
    const creature = createCreature('pyrret', 20);
    creature.currentHp = 5;

    const result = applyItemToCreature(ITEMS.potion, creature);
    expect(result.success).toBe(true);
    expect(result.consumed).toBe(true);
    expect(result.healedHp).toBe(ITEMS.potion.effect.amount);
    expect(creature.currentHp).toBe(5 + ITEMS.potion.effect.amount);
    expect(result.message).toMatch(/recovered/i);
  });

  it('clamps healing to maximum HP', () => {
    const creature = createCreature('pyrret', 5);
    creature.currentHp = creature.stats.hp - 2;

    const result = applyItemToCreature(ITEMS.superPotion, creature);
    expect(creature.currentHp).toBe(creature.stats.hp);
    expect(result.healedHp).toBe(2);
  });

  it('refuses a creature at full HP without consuming anything', () => {
    const creature = createCreature('pyrret', 10);
    const result = applyItemToCreature(ITEMS.potion, creature);

    expect(result.success).toBe(false);
    expect(result.consumed).toBe(false);
    expect(result.reason).toBe(ITEM_REFUSAL.FULL_HP);
    expect(creature.currentHp).toBe(creature.stats.hp);
  });

  it('cures the status the medicine is for', () => {
    const creature = createCreature('pyrret', 10);
    creature.status = 'poison';

    const result = applyItemToCreature(ITEMS.antidote, creature);
    expect(result.success).toBe(true);
    expect(result.curedStatus).toBe('poison');
    expect(creature.status).toBeNull();
  });

  it('refuses the wrong status without consuming anything', () => {
    const creature = createCreature('pyrret', 10);
    creature.status = 'burn';

    const result = applyItemToCreature(ITEMS.antidote, creature);
    expect(result.success).toBe(false);
    expect(result.consumed).toBe(false);
    expect(result.reason).toBe(ITEM_REFUSAL.WRONG_STATUS);
    expect(creature.status).toBe('burn');
  });

  it('has a cure for every status the battle system can inflict', () => {
    for (const status of STATUS_IDS) {
      const creature = createCreature('pyrret', 10);
      creature.status = status;

      const medicine = Object.values(ITEMS).find(
        (item) => item.effect?.type === 'cureStatus' && item.effect.status === status
      ) || Object.values(ITEMS).find((item) => item.effect?.type === 'cureAllStatus');

      expect(medicine, `nothing cures "${status}"`).toBeDefined();
      expect(applyItemToCreature(medicine, creature).success).toBe(true);
      expect(creature.status).toBeNull();
    }
  });

  it('cures whatever is there with a general tonic', () => {
    for (const status of STATUS_IDS) {
      const creature = createCreature('drizzle', 10);
      creature.status = status;
      expect(applyItemToCreature(ITEMS.clearTonic, creature).curedStatus).toBe(status);
      expect(creature.status).toBeNull();
    }
  });

  it('refuses a general tonic on a healthy creature', () => {
    const creature = createCreature('drizzle', 10);
    const result = applyItemToCreature(ITEMS.clearTonic, creature);
    expect(result.consumed).toBe(false);
    expect(result.reason).toBe(ITEM_REFUSAL.NO_STATUS);
  });

  it('refuses a fainted creature', () => {
    const creature = createCreature('pyrret', 10);
    creature.currentHp = 0;

    const result = applyItemToCreature(ITEMS.potion, creature);
    expect(result.consumed).toBe(false);
    expect(result.reason).toBe(ITEM_REFUSAL.FAINTED);
  });

  it('refuses an orb in the field, and an orb on a creature anywhere', () => {
    const creature = createCreature('pyrret', 10);
    creature.currentHp = 1;

    expect(applyItemToCreature(ITEMS.basicOrb, creature, { where: 'field' }).reason)
      .toBe(ITEM_REFUSAL.NOT_HERE);
    expect(applyItemToCreature(ITEMS.basicOrb, creature, { where: 'battle' }).reason)
      .toBe(ITEM_REFUSAL.UNUSABLE);
    expect(creature.currentHp).toBe(1);
  });

  it('refuses nothing at all, and nobody at all', () => {
    expect(applyItemToCreature(null, createCreature('pyrret', 5)).reason)
      .toBe(ITEM_REFUSAL.NO_ITEM);
    expect(applyItemToCreature(ITEMS.potion, null).reason).toBe(ITEM_REFUSAL.NO_TARGET);
  });

  it('leaves the creature otherwise untouched', () => {
    const creature = createCreature('pyrret', 12, { nickname: 'Ash', metAt: 'Route 1' });
    creature.currentHp = 3;
    const before = {
      id: creature.instanceId, level: creature.level, exp: creature.experience,
      nickname: creature.nickname, metAt: creature.metAt,
      moves: creature.moves.map((m) => m.id).join(),
    };

    applyItemToCreature(ITEMS.potion, creature);

    expect(creature.instanceId).toBe(before.id);
    expect(creature.level).toBe(before.level);
    expect(creature.experience).toBe(before.exp);
    expect(creature.nickname).toBe(before.nickname);
    expect(creature.metAt).toBe(before.metAt);
    expect(creature.moves.map((m) => m.id).join()).toBe(before.moves);
  });
});

// ---------------------------------------------------------------------------
// Shops
// ---------------------------------------------------------------------------

describe('shop data', () => {
  it('defines at least one shop', () => {
    expect(Object.keys(SHOPS).length).toBeGreaterThan(0);
  });

  // Auto-generated, so a shop added later is validated without new test code.
  for (const [id, shop] of Object.entries(SHOPS)) {
    describe(`shop "${id}"`, () => {
      it('has a matching id and a name', () => {
        expect(shop.id).toBe(id);
        expect(shop.name.length).toBeGreaterThan(0);
      });

      it('stocks only items that exist and can be priced', () => {
        expect(shop.stock.length).toBeGreaterThan(0);
        for (const entry of shop.stock) {
          const item = getItem(entry.item);
          expect(item, `unknown item "${entry.item}"`).not.toBeNull();
          expect(item.price, `${entry.item} is not for sale`).toBeGreaterThan(0);
        }
      });

      it('lists each item at most once', () => {
        const ids = shop.stock.map((entry) => entry.item);
        expect(new Set(ids).size).toBe(ids.length);
      });
    });
  }

  it('warns and returns null for a shop that does not exist', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(getShop('nowhere')).toBeNull();
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  it('hides stock behind a flag until it is set', () => {
    const gated = { ...SHOPS.emberhollowSupplyPost };
    SHOPS.__test = {
      id: '__test', name: 'Test', stock: [{ item: 'potion' }, { item: 'greatOrb', when: 'later' }],
    };

    expect(getShopStock('__test', {}).map((i) => i.id)).toEqual(['potion']);
    expect(getShopStock('__test', { later: true }).map((i) => i.id))
      .toEqual(['potion', 'greatOrb']);

    delete SHOPS.__test;
    expect(gated.id).toBe('emberhollowSupplyPost');
  });

  it('keeps the strongest orbs out of the starting shop', () => {
    const stocked = getShopStock('emberhollowSupplyPost', {}).map((item) => item.id);
    expect(stocked).toContain('basicOrb');
    expect(stocked).not.toContain('greatOrb');
    expect(stocked).not.toContain('ultraOrb');
    expect(stocked).not.toContain('superPotion');
  });

  it('is affordable enough to matter at the starting money', () => {
    const state = freshState();
    const potion = getItem('potion');
    // A few potions, not a shelf-clearing spree.
    expect(getMaxAffordable(potion, state)).toBeGreaterThanOrEqual(3);
    expect(getMaxAffordable(potion, state)).toBeLessThan(10);
  });
});

describe('buying', () => {
  const shopId = 'emberhollowSupplyPost';

  it('buys one item, taking exactly its price', () => {
    const state = freshState();
    const before = getMoney(state);

    const result = buyItem(state, shopId, 'potion', 1);
    expect(result.success).toBe(true);
    expect(result.total).toBe(ITEMS.potion.price);
    expect(getMoney(state)).toBe(before - ITEMS.potion.price);
    expect(getItemCount(state.inventory, 'potion')).toBe(1);
  });

  it('buys several, charging the exact total', () => {
    const state = freshState();
    const before = getMoney(state);

    const result = buyItem(state, shopId, 'potion', 3);
    expect(result.total).toBe(ITEMS.potion.price * 3);
    expect(getMoney(state)).toBe(before - ITEMS.potion.price * 3);
    expect(getItemCount(state.inventory, 'potion')).toBe(3);
  });

  it('adds to a stack that is already there', () => {
    const state = freshState();
    addItem(state.inventory, 'potion', 2);
    buyItem(state, shopId, 'potion', 2);
    expect(getItemCount(state.inventory, 'potion')).toBe(4);
  });

  it('refuses what the player cannot afford, changing nothing', () => {
    const state = freshState();
    state.money = ITEMS.potion.price - 1;

    const result = buyItem(state, shopId, 'potion', 1);
    expect(result.success).toBe(false);
    expect(result.reason).toBe(SHOP_REFUSAL.CANNOT_AFFORD);
    expect(getMoney(state)).toBe(ITEMS.potion.price - 1);
    expect(getItemCount(state.inventory, 'potion')).toBe(0);
  });

  it('refuses a quantity it cannot quite afford, rather than part of it', () => {
    const state = freshState();
    state.money = ITEMS.potion.price * 2;

    expect(buyItem(state, shopId, 'potion', 3).success).toBe(false);
    expect(getMoney(state)).toBe(ITEMS.potion.price * 2);
    expect(getItemCount(state.inventory, 'potion')).toBe(0);
  });

  it('refuses an item the shop does not stock', () => {
    const state = freshState();
    const before = getMoney(state);

    const result = buyItem(state, shopId, 'ultraOrb', 1);
    expect(result.reason).toBe(SHOP_REFUSAL.NOT_STOCKED);
    expect(getMoney(state)).toBe(before);
    expect(getItemCount(state.inventory, 'ultraOrb')).toBe(0);
  });

  it('refuses an item that does not exist', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const state = freshState();
    expect(buyItem(state, shopId, 'notanitem', 1).success).toBe(false);
    expect(getMoney(state)).toBe(ECONOMY.startingMoney);
    warn.mockRestore();
  });

  it('refuses a nonsense quantity', () => {
    const state = freshState();
    for (const bad of [0, -1, 1.5, NaN, '2', null]) {
      const result = buyItem(state, shopId, 'potion', bad);
      expect(result.success, `quantity ${bad}`).toBe(false);
      expect(result.reason).toBe(SHOP_REFUSAL.BAD_QUANTITY);
    }
    expect(getMoney(state)).toBe(ECONOMY.startingMoney);
    expect(state.inventory).toEqual({});
  });

  it('never charges without delivering, or delivers without charging', () => {
    const state = freshState();
    const before = getMoney(state);

    for (let i = 0; i < 5; i += 1) buyItem(state, shopId, 'potion', 1);

    const spent = before - getMoney(state);
    expect(spent).toBe(ITEMS.potion.price * getItemCount(state.inventory, 'potion'));
  });

  it('offers a buy list with prices and what is already held', () => {
    const state = freshState();
    addItem(state.inventory, 'potion', 2);

    const list = getBuyList(shopId, state);
    const potion = list.find((row) => row.item.id === 'potion');
    expect(potion.price).toBe(ITEMS.potion.price);
    expect(potion.owned).toBe(2);
  });

  it('caps the quantity selector at what can actually be paid for', () => {
    const state = freshState();
    state.money = ITEMS.potion.price * 3 + 10;
    expect(getMaxAffordable(getItem('potion'), state)).toBe(3);

    state.money = 0;
    expect(getMaxAffordable(getItem('potion'), state)).toBe(0);
  });

  it('totals nothing for a nonsense quantity', () => {
    expect(getBuyTotal(ITEMS.potion, 0)).toBe(0);
    expect(getBuyTotal(null, 2)).toBe(0);
  });
});

describe('selling', () => {
  it('sells one, paying the sell price', () => {
    const state = freshState();
    addItem(state.inventory, 'potion', 2);
    const before = getMoney(state);

    const result = sellItem(state, 'potion', 1);
    expect(result.success).toBe(true);
    expect(result.total).toBe(getSellPrice(ITEMS.potion));
    expect(getMoney(state)).toBe(before + getSellPrice(ITEMS.potion));
    expect(getItemCount(state.inventory, 'potion')).toBe(1);
  });

  it('sells several, paying the exact total', () => {
    const state = freshState();
    addItem(state.inventory, 'basicOrb', 5);
    const before = getMoney(state);

    const result = sellItem(state, 'basicOrb', 3);
    expect(result.total).toBe(getSellPrice(ITEMS.basicOrb) * 3);
    expect(getMoney(state)).toBe(before + result.total);
    expect(getItemCount(state.inventory, 'basicOrb')).toBe(2);
  });

  it('refuses to sell more than the player has, changing nothing', () => {
    const state = freshState();
    addItem(state.inventory, 'potion', 2);
    const before = getMoney(state);

    const result = sellItem(state, 'potion', 3);
    expect(result.reason).toBe(SHOP_REFUSAL.NOT_OWNED);
    expect(getMoney(state)).toBe(before);
    expect(getItemCount(state.inventory, 'potion')).toBe(2);
  });

  it('refuses to sell something the player does not have at all', () => {
    const state = freshState();
    expect(sellItem(state, 'potion', 1).reason).toBe(SHOP_REFUSAL.NOT_OWNED);
    expect(getMoney(state)).toBe(ECONOMY.startingMoney);
  });

  it('refuses a key item', () => {
    const state = freshState();
    addItem(state.inventory, 'wardensPass', 1);
    const before = getMoney(state);

    const result = sellItem(state, 'wardensPass', 1);
    expect(result.reason).toBe(SHOP_REFUSAL.NOT_SELLABLE);
    expect(getMoney(state)).toBe(before);
    expect(getItemCount(state.inventory, 'wardensPass')).toBe(1);
  });

  it('refuses a nonsense quantity', () => {
    const state = freshState();
    addItem(state.inventory, 'potion', 3);
    for (const bad of [0, -1, 2.5, NaN]) {
      expect(sellItem(state, 'potion', bad).reason).toBe(SHOP_REFUSAL.BAD_QUANTITY);
    }
    expect(getItemCount(state.inventory, 'potion')).toBe(3);
  });

  it('will take orbs — they are ordinary goods', () => {
    const state = freshState();
    addItem(state.inventory, 'basicOrb', 1);
    expect(sellItem(state, 'basicOrb', 1).success).toBe(true);
  });

  it('offers a sell list of only what is owned and sellable', () => {
    const state = freshState();
    addItem(state.inventory, 'potion', 2);
    addItem(state.inventory, 'wardensPass', 1);

    const list = getSellList(state);
    expect(list.map((row) => row.item.id)).toEqual(['potion']);
    expect(list[0].owned).toBe(2);
    expect(list[0].price).toBe(getSellPrice(ITEMS.potion));
  });

  it('totals nothing for a nonsense quantity', () => {
    expect(getSellTotal(ITEMS.potion, 0)).toBe(0);
    expect(getSellTotal(null, 1)).toBe(0);
  });

  it('never pays without taking, or takes without paying', () => {
    const state = freshState();
    addItem(state.inventory, 'potion', 10);
    const moneyBefore = getMoney(state);

    for (let i = 0; i < 4; i += 1) sellItem(state, 'potion', 1);

    const sold = 10 - getItemCount(state.inventory, 'potion');
    expect(getMoney(state) - moneyBefore).toBe(getSellPrice(ITEMS.potion) * sold);
  });
});

// ---------------------------------------------------------------------------
// Healing
// ---------------------------------------------------------------------------

describe('healing a creature', () => {
  it('restores HP, PP and status all at once', () => {
    const creature = hurt();
    const result = healCreatureFully(creature);

    expect(result.healed).toBe(true);
    expect(creature.currentHp).toBe(creature.stats.hp);
    expect(creature.status).toBeNull();
    for (const move of creature.moves) expect(move.pp).toBe(move.maxPp);
    expect(result.restoredHp).toBeGreaterThan(0);
    expect(result.restoredPp).toBeGreaterThan(0);
    expect(result.clearedStatus).toBe('poison');
  });

  it('says so when there is nothing to do', () => {
    const creature = createCreature('pyrret', 10);
    expect(needsHealing(creature)).toBe(false);
    expect(healCreatureFully(creature).healed).toBe(false);
  });

  it('notices missing PP even at full HP', () => {
    const creature = createCreature('pyrret', 10);
    creature.moves[0].pp -= 1;
    expect(needsHealing(creature)).toBe(true);
  });

  it('keeps the creature the same individual', () => {
    const creature = hurt();
    creature.nickname = 'Ash';
    creature.metAt = 'Route 1';
    const before = {
      id: creature.instanceId, species: creature.speciesId, level: creature.level,
      exp: creature.experience, stats: { ...creature.stats },
      moves: creature.moves.map((m) => m.id).join(),
    };

    healCreatureFully(creature);

    expect(creature.instanceId).toBe(before.id);
    expect(creature.speciesId).toBe(before.species);
    expect(creature.level).toBe(before.level);
    expect(creature.experience).toBe(before.exp);
    expect(creature.stats).toEqual(before.stats);
    expect(creature.moves.map((m) => m.id).join()).toBe(before.moves);
    expect(creature.nickname).toBe('Ash');
    expect(creature.metAt).toBe('Route 1');
  });

  it('revives a fainted creature', () => {
    const creature = createCreature('pyrret', 10);
    creature.currentHp = 0;
    healCreatureFully(creature);
    expect(creature.currentHp).toBe(creature.stats.hp);
  });
});

describe('healing the party', () => {
  it('restores every member', () => {
    const state = freshState();
    state.party = [hurt('pyrret'), hurt('drizzle'), hurt('sproutle')];

    const result = healParty(state);
    expect(result.healed).toBe(3);
    for (const creature of state.party) {
      expect(creature.currentHp).toBe(creature.stats.hp);
      expect(creature.status).toBeNull();
      for (const move of creature.moves) expect(move.pp).toBe(move.maxPp);
    }
  });

  it('reports that nobody needed it', () => {
    const state = freshState();
    state.party = [createCreature('pyrret', 5)];
    expect(healParty(state).healed).toBe(0);
  });

  it('is safe with an empty party', () => {
    const state = freshState();
    expect(healParty(state)).toEqual({ healed: 0, considered: 0, names: [] });
  });

  it('leaves storage alone', () => {
    const state = freshState();
    state.party = [hurt('pyrret')];
    const stored = hurt('drizzle');
    state.storage = [stored];

    healParty(state);
    expect(stored.currentHp).toBeLessThan(stored.stats.hp);
    expect(stored.status).toBe('poison');
  });

  it('revives everyone, fainted included', () => {
    const state = freshState();
    state.party = [hurt('pyrret'), hurt('drizzle')];
    state.party[0].currentHp = 0;

    expect(reviveParty(state).revived).toBe(2);
    for (const creature of state.party) {
      expect(creature.currentHp).toBe(creature.stats.hp);
    }
  });
});

// ---------------------------------------------------------------------------
// Recovery point and blackout
// ---------------------------------------------------------------------------

describe('the recovery point', () => {
  it('starts at a Mender’s Hall that really exists', () => {
    const point = getRecoveryPoint(freshState());
    const map = MAPS[point.mapId];
    expect(map, `no map "${point.mapId}"`).toBeDefined();
    expect(new TileMap(map).getSpawnPoint(point.spawn)).toBeTruthy();
  });

  it('can be moved to another hall', () => {
    const state = freshState();
    expect(setRecoveryPoint('mendersHall', 'default', state)).toBe(true);
    expect(getRecoveryPoint(state)).toEqual({ mapId: 'mendersHall', spawn: 'default' });
  });

  it('refuses an incomplete point, changing nothing', () => {
    const state = freshState();
    const before = getRecoveryPoint(state);

    expect(setRecoveryPoint('', 'default', state)).toBe(false);
    expect(setRecoveryPoint('mendersHall', '', state)).toBe(false);
    expect(setRecoveryPoint(null, null, state)).toBe(false);
    expect(getRecoveryPoint(state)).toEqual(before);
  });

  it('falls back to somewhere safe rather than returning nothing', () => {
    expect(getRecoveryPoint({}).mapId).toBe('mendersHall');
    expect(getRecoveryPoint({ respawn: {} }).spawn).toBe('default');
  });

  it('stays plain serialisable data', () => {
    const state = freshState();
    setRecoveryPoint('mendersHall', 'default', state);
    expect(JSON.parse(JSON.stringify(state)).respawn)
      .toEqual({ mapId: 'mendersHall', spawn: 'default' });
  });
});

describe('blacking out', () => {
  const downedState = () => {
    const state = freshState();
    state.party = [hurt('pyrret'), hurt('drizzle')];
    for (const creature of state.party) creature.currentHp = 0;
    return state;
  };

  it('takes the configured fraction, exactly once', () => {
    const state = downedState();
    state.money = 1000;

    const outcome = resolveBlackout(state);
    const expected = Math.floor(1000 * ECONOMY.faintMoneyLossFraction);

    expect(outcome.lost).toBe(expected);
    expect(outcome.moneyBefore).toBe(1000);
    expect(outcome.moneyAfter).toBe(1000 - expected);
    expect(getMoney(state)).toBe(1000 - expected);
  });

  it('takes nothing from a player with nothing', () => {
    const state = downedState();
    state.money = 0;

    const outcome = resolveBlackout(state);
    expect(outcome.lost).toBe(0);
    expect(getMoney(state)).toBe(0);
    expect(outcome.messages.join(' ')).not.toMatch(/coins/);
  });

  it('restores the whole party', () => {
    const state = downedState();
    const ids = state.party.map((c) => c.instanceId);

    resolveBlackout(state);

    expect(state.party.map((c) => c.instanceId)).toEqual(ids);
    for (const creature of state.party) {
      expect(creature.currentHp).toBe(creature.stats.hp);
      expect(creature.status).toBeNull();
      for (const move of creature.moves) expect(move.pp).toBe(move.maxPp);
    }
  });

  it('sends the player to the current recovery point', () => {
    const state = downedState();
    setRecoveryPoint('mendersHall', 'default', state);
    expect(resolveBlackout(state).recovery).toEqual({ mapId: 'mendersHall', spawn: 'default' });
  });

  it('leaves everything else exactly as it was', () => {
    const state = downedState();
    addItem(state.inventory, 'potion', 3);
    state.flags.gotStarter = true;
    state.storage = [createCreature('nibbit', 4)];
    state.creatureIndex.caught.pyrret = true;
    const storedId = state.storage[0].instanceId;
    const storedHp = state.storage[0].currentHp;

    resolveBlackout(state);

    expect(getItemCount(state.inventory, 'potion')).toBe(3);
    expect(state.flags.gotStarter).toBe(true);
    expect(state.storage[0].instanceId).toBe(storedId);
    expect(state.storage[0].currentHp).toBe(storedHp);
    expect(state.creatureIndex.caught.pyrret).toBe(true);
  });

  it('explains itself in words the player can read', () => {
    const state = downedState();
    state.money = 500;
    const outcome = resolveBlackout(state);

    expect(outcome.messages.length).toBeGreaterThan(0);
    expect(outcome.messages.join(' ')).toMatch(/coins/);
    expect(getRecoveryMessages('Ash').join(' ')).toMatch(/Ash/);
  });

  it('is safe to call with an empty party', () => {
    const state = freshState();
    expect(() => resolveBlackout(state)).not.toThrow();
  });
});
