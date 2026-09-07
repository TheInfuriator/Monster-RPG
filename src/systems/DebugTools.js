/**
 * DebugTools.js
 * ----------------------------------------------------------------------------
 * Developer conveniences, exposed on `window.debug` in the browser console.
 *
 * DELIBERATELY SEPARATE FROM GAMEPLAY. Nothing in the game imports this file;
 * it is installed once from `main.js` and only ever reaches in. Deleting it
 * would not change how the game plays.
 *
 * Try `debug.help()` in the console.
 */

import { gameState, setFlag } from '../core/GameState.js';
import {
  createCreature, fullyHeal, recalculateStats, getDisplayName,
} from './CreatureFactory.js';
import { createWildBattleConfig } from './WildBattle.js';
import {
  giveCreature, describeParty, listStorage, getStorageCount, swapPartyMembers,
} from './PartySystem.js';
import {
  markSeen, markCaught, isSeen, isCaught, countSeen, countCaught, countSpecies,
} from './CreatureIndex.js';
import { addItem } from './InventorySystem.js';
import { grantExperience } from './battle/ExperienceSystem.js';
import { experienceForLevel } from './StatCalculator.js';
import { CREATURE_IDS, getSpecies } from '../data/creatures.js';
import { STATUS_IDS } from '../data/statuses.js';
import { SCRIPTED_BATTLES } from '../data/battles.js';
import { MAPS } from '../data/maps/index.js';
import { getItem } from '../data/items.js';
import { PARTY } from '../config/balance.js';
import { SCENES } from '../config/gameConfig.js';

/** The currently running overworld scene, or null. */
function world(game) {
  const scene = game.scene.getScene(SCENES.WORLD);
  return scene && game.scene.isActive(SCENES.WORLD) ? scene : null;
}

/** The running overworld's encounter system, or null with a helpful note. */
function encounters(game) {
  const scene = world(game);
  if (!scene) {
    console.warn('[debug] the overworld is not running.');
    return null;
  }
  return scene.encounters;
}

/** The active party creature, or null with a helpful note. */
function active() {
  const creature = gameState.party[0];
  if (!creature) {
    console.warn('[debug] Your party is empty. Try debug.give("pyrret", 5).');
    return null;
  }
  return creature;
}

export function installDebugTools(game) {
  const debug = {
    help() {
      console.info(
        [
          'Aetheria debug tools',
          '  debug.give(species, level)      add a creature to the party',
          '  debug.party()                   show the party',
          '  debug.heal()                    fully heal the party',
          '  debug.hp(value, index=0)        set current HP',
          '  debug.status(id, index=0)       inflict a status, or null to clear',
          '  debug.level(n, index=0)         set a level and recalculate stats',
          '  debug.exp(amount, index=0)      grant experience (levels, moves, evolution)',
          '  debug.pp(index=0)               restore all PP',
          '  debug.item(id, qty=1)           add items to the bag',
          '  debug.money(amount)             add coins',
          '  debug.flag(name, value=true)    set a story flag',
          '  debug.wild(species, level)      start a wild battle',
          '  debug.encounter()               force the next grass step to ambush you',
          '  debug.encountersOff(true/false) turn wild encounters off / on',
          '  debug.encounterRate(0..1)       set the chance per step',
          '  debug.encounterInfo()           table, rate and cooldown for this map',
          '  debug.orbs(id, quantity)        give capture orbs',
          '  debug.fillParty(species, level) fill the party to six',
          '  debug.reorder(a, b)             swap two party slots',
          '  debug.storage()                 list everything in storage',
          '  debug.seen(id) / .caught(id)    record index entries by hand',
          '  debug.index() / .clearIndex()   index progress, or wipe it',
          '  debug.trainer(id)               start a scripted battle',
          '  debug.teleport(mapId, spawn)    change map',
          '  debug.species()                 list every species id',
          '  debug.battles()                 list scripted battles',
          '  debug.maps()                    list map ids',
        ].join('\n')
      );
    },

    // --- Party ---------------------------------------------------------
    give(species = 'pyrret', level = 5) {
      const creature = createCreature(species, level);
      if (!creature) return null;

      markCaught(species);
      const { destination } = giveCreature(gameState, creature);
      console.info(`[debug] ${species} Lv${level} -> ${destination}`);
      return creature;
    },

    party() {
      console.info('[debug] party:', describeParty(gameState));
      return gameState.party;
    },

    heal() {
      for (const creature of gameState.party) fullyHeal(creature);
      const scene = world(game);
      if (scene) scene.debug?.update();
      console.info('[debug] party fully healed');
      return gameState.party;
    },

    hp(value, index = 0) {
      const creature = gameState.party[index];
      if (!creature) return null;
      creature.currentHp = Math.max(0, Math.min(creature.stats.hp, value));
      console.info(`[debug] HP -> ${creature.currentHp}/${creature.stats.hp}`);
      return creature;
    },

    status(id = null, index = 0) {
      const creature = gameState.party[index];
      if (!creature) return null;
      if (id !== null && !STATUS_IDS.includes(id)) {
        console.warn(`[debug] unknown status "${id}". Known: ${STATUS_IDS.join(', ')}`);
        return null;
      }
      creature.status = id;
      console.info(`[debug] status -> ${id ?? 'none'}`);
      return creature;
    },

    level(value, index = 0) {
      const creature = gameState.party[index];
      if (!creature) return null;

      const species = getSpecies(creature.speciesId);
      creature.level = Math.max(1, Math.min(100, Math.floor(value)));
      creature.experience = experienceForLevel(creature.level, species.growthRate);
      recalculateStats(creature);
      fullyHeal(creature);

      console.info(`[debug] level -> ${creature.level}`);
      return creature;
    },

    exp(amount = 100, index = 0) {
      const creature = gameState.party[index];
      if (!creature) return null;
      const result = grantExperience(creature, amount);
      console.info('[debug] experience result:', result);
      return result;
    },

    pp(index = 0) {
      const creature = gameState.party[index];
      if (!creature) return null;
      for (const move of creature.moves) move.pp = move.maxPp;
      console.info('[debug] PP restored');
      return creature;
    },

    // --- Bag and progress ----------------------------------------------
    item(id = 'potion', quantity = 1) {
      const ok = addItem(gameState.inventory, id, quantity);
      console.info(ok ? `[debug] +${quantity} ${id}` : `[debug] unknown item "${id}"`);
      return gameState.inventory;
    },

    money(amount = 1000) {
      gameState.money += amount;
      console.info(`[debug] money -> ${gameState.money}`);
      return gameState.money;
    },

    flag(name, value = true) {
      setFlag(name, value);
      console.info(`[debug] flag ${name} -> ${value}`);
      return gameState.flags;
    },

    // --- Battles -------------------------------------------------------
    wild(species = 'nibbit', level = 5) {
      const scene = world(game);
      if (!scene) {
        console.warn('[debug] the overworld is not running.');
        return null;
      }
      if (!active()) return null;

      // Built through the same pipeline a real ambush uses, so what you test
      // here is what the grass does.
      const config = createWildBattleConfig({ species, level }, gameState.party, {
        metAt: scene.map.name,
      });
      if (!config) return null;

      scene.launchBattle(config);
      return config.opponentParty[0];
    },

    // --- Encounters ----------------------------------------------------
    /** Make the next eligible step in encounter terrain definitely trigger. */
    encounter(on = true) {
      const system = encounters(game);
      if (!system) return null;
      system.forceNext = Boolean(on);
      console.info(`[debug] next eligible step will ${on ? 'ambush you' : 'roll normally'}`);
      return system.forceNext;
    },

    /** Turn wild encounters off (or back on) for this map. */
    encountersOff(off = true) {
      const system = encounters(game);
      if (!system) return null;
      system.disabled = Boolean(off);
      console.info(`[debug] encounters ${system.disabled ? 'disabled' : 'enabled'}`);
      return !system.disabled;
    },

    /** Set the chance per step, 0..1. */
    encounterRate(rate = 1) {
      const system = encounters(game);
      if (!system) return null;
      system.rate = Math.min(1, Math.max(0, Number(rate) || 0));
      console.info(`[debug] encounter rate -> ${system.rate}`);
      return system.rate;
    },

    /** Everything this map's encounters are currently doing. */
    encounterInfo() {
      const system = encounters(game);
      if (!system) return null;

      const info = {
        map: world(game).map.id,
        table: system.tableId,
        active: system.isActive,
        disabled: system.disabled,
        forceNext: system.forceNext,
        rate: system.rate,
        cooldown: system.cooldown,
        cooldownSteps: system.cooldownSteps,
        entries: (system.table || []).map(
          (e) => `${e.species} Lv${e.minLevel}-${e.maxLevel} (weight ${e.weight})`
        ),
      };
      console.info('[debug] encounters:', info);
      return info;
    },

    trainer(id = 'lodgePractice') {
      const scene = world(game);
      if (!scene) {
        console.warn('[debug] the overworld is not running.');
        return null;
      }
      scene.startScriptedBattle(id);
      return id;
    },

    // --- Party, storage and the index -----------------------------------
    /** Fill the party to its maximum with throwaway creatures. */
    fillParty(species = 'nibbit', level = 5) {
      while (gameState.party.length < PARTY.maxSize) {
        const creature = createCreature(species, level);
        if (!creature) break;
        markCaught(species);
        gameState.party.push(creature);
      }
      console.info(`[debug] party -> ${describeParty(gameState)}`);
      return gameState.party.length;
    },

    /** Swap two party slots, the way the party menu does. */
    reorder(a = 0, b = 1) {
      const ok = swapPartyMembers(gameState, a, b);
      console.info(ok ? `[debug] swapped ${a} and ${b}` : '[debug] invalid slots');
      return describeParty(gameState);
    },

    /** Everything waiting in storage. */
    storage() {
      const rows = listStorage(gameState).map(
        (c) => `${getDisplayName(c)} L${c.level} ${c.currentHp}/${c.stats.hp} (${c.instanceId})`
      );
      console.info(`[debug] storage (${getStorageCount(gameState)}):`, rows);
      return rows;
    },

    /** Give orbs. Any capture item id works — see src/data/items.js. */
    orbs(id = 'basicOrb', quantity = 10) {
      const item = getItem(id);
      if (!item || item.category !== 'capture') {
        console.warn(`[debug] "${id}" is not a capture item.`);
        return null;
      }
      addItem(gameState.inventory, id, quantity);
      console.info(`[debug] +${quantity} ${item.name}`);
      return gameState.inventory;
    },

    /** Record a species as seen or caught without meeting it. */
    seen(species) {
      markSeen(species);
      return { seen: isSeen(species), caught: isCaught(species) };
    },

    caught(species) {
      markCaught(species);
      return { seen: isSeen(species), caught: isCaught(species) };
    },

    /** Wipe the index back to a brand-new game. */
    clearIndex() {
      gameState.creatureIndex = { seen: {}, caught: {} };
      console.info('[debug] index cleared');
      return gameState.creatureIndex;
    },

    /** How much of the index is filled in. */
    index() {
      const info = {
        seen: countSeen(),
        caught: countCaught(),
        total: countSpecies(),
      };
      console.info('[debug] index:', info);
      return info;
    },

    // --- World ---------------------------------------------------------
    teleport(mapId = 'emberhollow', spawn = 'default') {
      const scene = world(game);
      if (!scene) return null;
      if (!MAPS[mapId]) {
        console.warn(`[debug] unknown map "${mapId}". Known: ${Object.keys(MAPS).join(', ')}`);
        return null;
      }
      scene.scene.restart({ mapId, spawn });
      return mapId;
    },

    // --- Listings ------------------------------------------------------
    species: () => CREATURE_IDS,
    battles: () => Object.keys(SCRIPTED_BATTLES),
    maps: () => Object.keys(MAPS),
  };

  window.debug = debug;
  console.info('[debug] developer tools ready — type debug.help()');
  return debug;
}
