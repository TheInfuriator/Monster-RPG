/**
 * richState.js — test helper
 * ----------------------------------------------------------------------------
 * A playthrough with something in every corner of GameState, built through the
 * REAL systems rather than by writing objects by hand. A round-trip test is
 * only as good as the state it round-trips: this one has an evolved starter,
 * a nicknamed capture, a creature that is poisoned and short of PP, a full
 * party with an overflow in storage, a bag, spent coins, story flags, beaten
 * trainers, a Sigil, a half-solved Verdant Hall and a moved recovery point.
 */

import { createNewGameState } from '../../src/core/GameState.js';
import { createCreature } from '../../src/systems/CreatureFactory.js';
import { receiveCapturedCreature } from '../../src/systems/WildBattle.js';
import { grantExperience, evolveCreature } from '../../src/systems/battle/ExperienceSystem.js';
import { experienceForLevel } from '../../src/systems/StatCalculator.js';
import { getSpecies } from '../../src/data/creatures.js';
import { addItem, removeItem } from '../../src/systems/InventorySystem.js';
import { spendMoney, addMoney } from '../../src/systems/EconomySystem.js';
import { markTrainerDefeated } from '../../src/systems/TrainerSystem.js';
import { awardBadge } from '../../src/systems/BadgeSystem.js';
import { pressSwitch } from '../../src/systems/PuzzleSystem.js';
import { markSeen, markCaught } from '../../src/systems/CreatureIndex.js';
import { setRecoveryPoint } from '../../src/core/GameState.js';
import { MAPS } from '../../src/data/maps/index.js';

export function buildRichState() {
  const state = createNewGameState();
  state.playerName = 'Robin';
  state.starter = 'pyrret';

  // The starter, levelled past its evolution and evolved for real.
  const starter = createCreature('pyrret', 5, { metAt: "Warden's Lodge" });
  receiveCapturedCreature(starter, state);
  const species = getSpecies('pyrret');
  grantExperience(starter, experienceForLevel(species.evolution.level, species.growthRate));
  evolveCreature(starter, species.evolution.to);
  starter.currentHp -= 7;

  // A nicknamed capture, poisoned and short of PP.
  const flittle = createCreature('flittle', 8, { nickname: 'Pip', metAt: 'Route 1 — Cinderpath' });
  flittle.status = 'poison';
  flittle.moves[0].pp -= 3;
  flittle.currentHp = 1;
  receiveCapturedCreature(flittle, state);

  // A fainted one.
  const nibbit = createCreature('nibbit', 6, { metAt: 'Route 1 — Cinderpath' });
  nibbit.currentHp = 0;
  receiveCapturedCreature(nibbit, state);

  // Fill the party and overflow into storage.
  for (const [id, level] of [['vinelet', 7], ['puffcap', 7], ['grubbit', 9], ['sproutle', 5], ['drizzle', 6]]) {
    receiveCapturedCreature(createCreature(id, level, { metAt: 'Thistlewood' }), state);
  }

  // Seen but never caught.
  markSeen('ivorn', state);
  markCaught('flittle', state);

  // The bag and the coins.
  addItem(state.inventory, 'potion', 3);
  addItem(state.inventory, 'superPotion', 2);
  addItem(state.inventory, 'basicOrb', 5);
  addItem(state.inventory, 'antidote', 1);
  removeItem(state.inventory, 'basicOrb', 2);
  addMoney(state, 2200);
  spendMoney(state, 550);

  // Story, trainers, Sigils, puzzles, recovery.
  state.flags.gotStarter = true;
  state.flags.route1GateOpen = true;
  state.flags.pickedUpThistlewoodOrb = true;
  markTrainerDefeated('route1Scout', state);
  markTrainerDefeated('verdantGardenerTeal', state);
  awardBadge('verdantSigil', state);
  pressSwitch(MAPS.verdantHall, 'rootSouth', { state });
  pressSwitch(MAPS.verdantHall, 'rootWest', { state });
  setRecoveryPoint('thistlewoodMendersHall', 'default', state);

  state.location = { mapId: 'verdantHall', x: 18, y: 10, facing: 'left' };
  state.playTimeMs = 3 * 60 * 60 * 1000 + 17 * 60 * 1000 + 4321;
  state.createdAt = 1_700_000_000_000;

  return state;
}
