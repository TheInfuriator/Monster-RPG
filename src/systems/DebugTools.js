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
import { createCreature, fullyHeal, recalculateStats } from './CreatureFactory.js';
import { giveCreature, describeParty } from './PartySystem.js';
import { addItem } from './InventorySystem.js';
import { grantExperience } from './battle/ExperienceSystem.js';
import { experienceForLevel } from './StatCalculator.js';
import { CREATURE_IDS, getSpecies } from '../data/creatures.js';
import { STATUS_IDS } from '../data/statuses.js';
import { SCRIPTED_BATTLES } from '../data/battles.js';
import { MAPS } from '../data/maps/index.js';
import { SCENES } from '../config/gameConfig.js';

/** The currently running overworld scene, or null. */
function world(game) {
  const scene = game.scene.getScene(SCENES.WORLD);
  return scene && game.scene.isActive(SCENES.WORLD) ? scene : null;
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

      const opponent = createCreature(species, level);
      if (!opponent) return null;

      scene.scene.pause();
      scene.scene.launch(SCENES.BATTLE, {
        config: {
          playerParty: gameState.party,
          opponentParty: [opponent],
          battleType: 'wild',
          canRun: true,
        },
        onFinished: (result) => {
          scene.scene.resume();
          scene.onBattleFinished(result);
          console.info('[debug] battle result:', result);
        },
      });
      return opponent;
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
