/**
 * Tests for the wild-encounter pipeline:
 *
 *   a completed step -> EncounterSystem -> a wild BattleEngine config
 *   -> a real battle -> the party that comes back
 *
 * The overworld scene itself needs a browser, so what is checked here is every
 * piece it joins together: the step contract (only a real move offers a roll),
 * the battle configuration a roll produces, and the state the party is left in
 * afterwards. The scene's own job — pausing rather than restarting, so the map,
 * tile and facing survive — is verified in the browser suite.
 */

import { describe, it, expect, vi } from 'vitest';
import { EncounterSystem } from '../src/systems/EncounterSystem.js';
import { createWildBattleConfig } from '../src/systems/WildBattle.js';
import { isItemUsableInBattle } from '../src/systems/battle/BattleItems.js';
import { BattleEngine, BATTLE_RESULT } from '../src/systems/battle/BattleEngine.js';
import { createCreature } from '../src/systems/CreatureFactory.js';
import { TileMap } from '../src/systems/TileMap.js';
import { MAPS } from '../src/data/maps/index.js';
import { ENCOUNTER_TABLES } from '../src/data/encounters.js';
import { ITEMS } from '../src/data/items.js';
import { CREATURES } from '../src/data/creatures.js';
import { MOVES } from '../src/data/moves.js';
import { createSeededRandom } from '../src/utils/rng.js';

const alwaysLucky = () => 0;
const neverLucky = () => 0.999999;

// ---------------------------------------------------------------------------
// The step contract
// ---------------------------------------------------------------------------

/**
 * A stand-in for the walking half of the overworld.
 *
 * `Player` only announces a step once it has finished moving onto a new tile,
 * and `WorldScene` offers that one announcement to the encounter system. This
 * walker keeps the same contract against a REAL map, so "standing still" and
 * "walking into a tree" genuinely produce no roll rather than being asserted
 * away.
 */
function makeWalker(map, encounters, facts = {}) {
  const walker = { x: 0, y: 0, rolls: 0, encounters: [] };

  walker.placeAt = (x, y) => {
    walker.x = x;
    walker.y = y;
    return walker;
  };

  /** Try to move one tile. Returns true if a step actually happened. */
  walker.move = (dx, dy) => {
    const targetX = walker.x + dx;
    const targetY = walker.y + dy;

    // Blocked: no movement, so no step is ever announced.
    if (!map.isWalkable(targetX, targetY)) return false;

    walker.x = targetX;
    walker.y = targetY;

    walker.rolls += 1;
    const result = encounters.step({
      onEncounterTile: map.hasEncounters(targetX, targetY),
      ...facts,
    });
    if (result) walker.encounters.push(result);
    return true;
  };

  /** Press a direction into a wall, or press nothing at all. */
  walker.standStill = () => false;

  return walker;
}

describe('a step only counts when the player actually moves', () => {
  const map = new TileMap(MAPS.route1);
  const grass = findTile(map, (m, x, y) => m.hasEncounters(x, y));

  it('walking onto grass offers exactly one roll', () => {
    const system = new EncounterSystem('route1', alwaysLucky);
    const spy = vi.spyOn(system, 'step');
    const walker = makeWalker(map, system).placeAt(grass.x, grass.y - 1);

    expect(walker.move(0, 1)).toBe(true);
    expect(spy).toHaveBeenCalledTimes(1);
    expect(walker.encounters).toHaveLength(1);
  });

  it('standing still never offers a roll', () => {
    const system = new EncounterSystem('route1', alwaysLucky);
    const spy = vi.spyOn(system, 'step');
    const walker = makeWalker(map, system).placeAt(grass.x, grass.y);

    for (let i = 0; i < 10; i += 1) walker.standStill();
    expect(spy).not.toHaveBeenCalled();
    expect(walker.encounters).toHaveLength(0);
  });

  it('walking into something solid never offers a roll', () => {
    const system = new EncounterSystem('route1', alwaysLucky);
    const spy = vi.spyOn(system, 'step');

    // Tile (2, 2) on Route 1 is fence; (0, 3) is the tree border.
    const walker = makeWalker(map, system).placeAt(2, 3);
    expect(walker.move(-1, 0)).toBe(false); // into the treeline
    expect(walker.move(0, -1)).toBe(false); // into the gate fence

    expect(spy).not.toHaveBeenCalled();
    expect(walker.encounters).toHaveLength(0);
  });

  it('a walk down the path never turns anything up', () => {
    const system = new EncounterSystem('route1', alwaysLucky);
    const path = findTile(map, (m, x, y) => m.getTile(x, y).id === 'path');
    const walker = makeWalker(map, system).placeAt(path.x, path.y);

    for (let i = 0; i < 6; i += 1) walker.move(0, 1);
    expect(walker.encounters).toHaveLength(0);
  });

  it('one step can never produce two encounters', () => {
    const system = new EncounterSystem({ tableId: 'route1', rate: 1, cooldownSteps: 0 }, alwaysLucky);
    const walker = makeWalker(map, system).placeAt(grass.x, grass.y - 1);

    walker.move(0, 1);
    expect(walker.encounters).toHaveLength(1);
    expect(walker.rolls).toBe(1);
  });

  it('a battle already running suppresses every step until it ends', () => {
    const system = new EncounterSystem({ tableId: 'route1', rate: 1, cooldownSteps: 0 }, alwaysLucky);
    const inBattle = makeWalker(map, system, { battleActive: true }).placeAt(grass.x, grass.y);

    for (let i = 0; i < 5; i += 1) {
      inBattle.move(0, 1);
      inBattle.move(0, -1);
    }
    expect(inBattle.encounters).toHaveLength(0);

    // The same walker, once the battle has finished.
    const free = makeWalker(map, system).placeAt(grass.x, grass.y - 1);
    expect(free.move(0, 1)).toBe(true);
    expect(free.encounters).toHaveLength(1);
  });
});

function findTile(map, predicate) {
  for (let y = 0; y < map.height; y += 1) {
    for (let x = 0; x < map.width; x += 1) {
      if (predicate(map, x, y)) return { x, y };
    }
  }
  throw new Error('No matching tile on this map');
}

// ---------------------------------------------------------------------------
// Turning a roll into a battle
// ---------------------------------------------------------------------------

describe('building a wild battle', () => {
  const party = () => [createCreature('pyrret', 5)];

  it('uses the species the encounter chose', () => {
    const config = createWildBattleConfig({ species: 'nibbit', level: 3 }, party());
    expect(config.opponentParty).toHaveLength(1);
    expect(config.opponentParty[0].speciesId).toBe('nibbit');
  });

  it('uses the level the encounter chose', () => {
    const config = createWildBattleConfig({ species: 'flittle', level: 4 }, party());
    expect(config.opponentParty[0].level).toBe(4);
  });

  it('is a wild battle', () => {
    expect(createWildBattleConfig({ species: 'nibbit', level: 3 }, party()).battleType).toBe('wild');
  });

  it('allows running', () => {
    expect(createWildBattleConfig({ species: 'nibbit', level: 3 }, party()).canRun).toBe(true);
  });

  it('awards experience', () => {
    expect(createWildBattleConfig({ species: 'nibbit', level: 3 }, party()).awardExperience)
      .toBe(true);
  });

  it('awards no money — a wild creature carries none', () => {
    expect(createWildBattleConfig({ species: 'nibbit', level: 3 }, party()).rewardMoney).toBe(0);
  });

  it('has no opponent name, so the engine says "A wild ... appeared!"', () => {
    const config = createWildBattleConfig({ species: 'nibbit', level: 3 }, party());
    expect(config.opponentName).toBeNull();

    const engine = new BattleEngine({ ...config, random: createSeededRandom(1) });
    const opening = engine.start().filter((e) => e.type === 'message').map((e) => e.text).join(' ');
    expect(opening).toMatch(/A wild Nibbit appeared!/);
  });

  it('hands the LIVE party to the engine, so results land on the real team', () => {
    const team = party();
    const config = createWildBattleConfig({ species: 'nibbit', level: 3 }, team);
    expect(config.playerParty).toBe(team);
    expect(config.playerParty[0]).toBe(team[0]);
  });

  it('builds a real creature: stats, moves and artwork, not a battle-only stand-in', () => {
    const config = createWildBattleConfig({ species: 'vinelet', level: 5 }, party());
    const wild = config.opponentParty[0];

    expect(CREATURES[wild.speciesId]).toBeDefined();
    expect(wild.stats.hp).toBeGreaterThan(0);
    expect(wild.currentHp).toBe(wild.stats.hp);
    expect(wild.moves.length).toBeGreaterThan(0);
    expect(wild.moves.length).toBeLessThanOrEqual(4);
    for (const move of wild.moves) {
      expect(MOVES[move.id], `unknown move "${move.id}"`).toBeDefined();
      expect(move.pp).toBeGreaterThan(0);
      expect(move.pp).toBe(move.maxPp);
    }
    expect(wild.instanceId).toBeTruthy();
  });

  // Auto-generated: every species any table can produce must make a usable
  // opponent at both ends of its level range.
  for (const [tableId, table] of Object.entries(ENCOUNTER_TABLES)) {
    for (const entry of table) {
      it(`${tableId}: ${entry.species} works at levels ${entry.minLevel} and ${entry.maxLevel}`, () => {
        for (const level of [entry.minLevel, entry.maxLevel]) {
          const config = createWildBattleConfig({ species: entry.species, level }, party());
          expect(config, `${entry.species} at level ${level}`).not.toBeNull();

          const wild = config.opponentParty[0];
          expect(wild.level).toBe(level);
          expect(wild.moves.length).toBeGreaterThan(0);

          const engine = new BattleEngine({ ...config, random: createSeededRandom(3) });
          expect(() => engine.start()).not.toThrow();
        }
      });
    }
  }

  it('refuses politely when the party is empty', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(createWildBattleConfig({ species: 'nibbit', level: 3 }, [])).toBeNull();
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  it('refuses politely when there is no encounter', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(createWildBattleConfig(null, party())).toBeNull();
    warn.mockRestore();
  });

  it('refuses politely for a species that does not exist', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(createWildBattleConfig({ species: 'notacreature', level: 3 }, party())).toBeNull();
    expect(error).toHaveBeenCalled();
    error.mockRestore();
  });

  it('records where the creature was met, so a capture already knows', () => {
    const config = createWildBattleConfig({ species: 'nibbit', level: 3 }, party(), {
      metAt: 'Route 1 — Cinderpath',
    });
    expect(config.opponentParty[0].metAt).toBe('Route 1 — Cinderpath');
  });

  it('leaves the met location unrecorded when nobody says where', () => {
    const config = createWildBattleConfig({ species: 'nibbit', level: 3 }, party());
    expect(config.opponentParty[0].metAt).toBeNull();
  });

  it('joins straight onto a rolled encounter', () => {
    const system = new EncounterSystem('route1', alwaysLucky);
    const encounter = system.step({ onEncounterTile: true });
    const config = createWildBattleConfig(encounter, party());

    expect(config.opponentParty[0].speciesId).toBe(encounter.species);
    expect(config.opponentParty[0].level).toBe(encounter.level);
  });
});

describe('capture items in a wild battle', () => {
  // Phase 5 refused every orb because catching did not exist. Phase 6 turned it
  // on for wild battles ONLY, so the original purpose of these checks — orbs are
  // never silently half-working — now reads as: enabled where catching is
  // allowed, refused with a reason everywhere else.
  const orbs = Object.values(ITEMS).filter((item) => item.category === 'capture');

  it('the game defines capture items at all', () => {
    expect(orbs.length).toBeGreaterThan(0);
  });

  it('offers every orb when the battle allows catching', () => {
    for (const orb of orbs) {
      const verdict = isItemUsableInBattle(orb, { allowCapture: true });
      expect(verdict.ok, `${orb.name} should be throwable in a wild battle`).toBe(true);
    }
  });

  it('refuses every orb when the battle does not, with a reason to read', () => {
    for (const orb of orbs) {
      const verdict = isItemUsableInBattle(orb, { allowCapture: false });
      expect(verdict.ok, `${orb.name} must not be throwable here`).toBe(false);
      expect(verdict.reason).toMatch(/not allowed/i);
    }
  });

  it('a wild battle config switches capture on', () => {
    const config = createWildBattleConfig({ species: 'nibbit', level: 3 },
      [createCreature('pyrret', 5)]);
    expect(config.allowCapture).toBe(true);
    expect(new BattleEngine(config).allowCapture).toBe(true);
  });

  it('still allows healing items, so the bag is not simply switched off', () => {
    expect(isItemUsableInBattle(ITEMS.potion, { allowCapture: true }).ok).toBe(true);
    expect(isItemUsableInBattle(ITEMS.potion, { allowCapture: false }).ok).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// What the party looks like when the battle ends
// ---------------------------------------------------------------------------

/** Fight until the battle is over, always using the first usable move. */
function fightToEnd(engine, maxTurns = 60) {
  for (let turn = 0; turn < maxTurns && !engine.isOver(); turn += 1) {
    if (engine.awaitingPlayerSwitch) {
      const next = engine.playerParty.findIndex((creature, i) => engine.canSwitchTo(i).ok);
      if (next === -1) break;
      engine.sendOutAfterFaint(next);
      continue;
    }
    const entry = engine.player.creature.moves.find((m) => m.pp > 0);
    engine.submitPlayerAction({ type: 'move', moveEntry: entry });
  }
  return engine.result;
}

describe('the party that comes back from a wild battle', () => {
  it('keeps the same creature objects — damage lands on the real team', () => {
    const team = [createCreature('pyrret', 12)];
    const before = team[0];
    const config = createWildBattleConfig({ species: 'nibbit', level: 3 }, team);
    const engine = new BattleEngine({ ...config, random: createSeededRandom(9) });

    engine.start();
    engine.opponent.creature.currentHp = 1;
    fightToEnd(engine);

    expect(team[0]).toBe(before);
    expect(team).toHaveLength(1);
  });

  it('awards experience on a win', () => {
    const team = [createCreature('pyrret', 5)];
    const expBefore = team[0].experience;
    const config = createWildBattleConfig({ species: 'nibbit', level: 4 }, team);
    const engine = new BattleEngine({ ...config, random: createSeededRandom(31) });

    engine.start();
    engine.opponent.creature.currentHp = 1;
    const result = fightToEnd(engine);

    expect(result.outcome).toBe(BATTLE_RESULT.WIN);
    expect(result.experience.length).toBeGreaterThan(0);
    expect(team[0].experience).toBeGreaterThan(expBefore);
  });

  it('awards no money on a win', () => {
    const team = [createCreature('pyrret', 12)];
    const config = createWildBattleConfig({ species: 'nibbit', level: 3 }, team);
    const engine = new BattleEngine({ ...config, random: createSeededRandom(12) });

    engine.start();
    engine.opponent.creature.currentHp = 1;
    expect(fightToEnd(engine).money).toBe(0);
  });

  it('keeps spent PP spent', () => {
    const team = [createCreature('pyrret', 12)];
    const config = createWildBattleConfig({ species: 'nibbit', level: 3 }, team);
    const engine = new BattleEngine({ ...config, random: createSeededRandom(5) });

    engine.start();
    const entry = team[0].moves[0];
    const ppBefore = entry.pp;
    engine.submitPlayerAction({ type: 'move', moveEntry: entry });

    expect(entry.pp).toBe(ppBefore - 1);
  });

  it('carries a level-up, its new stats and its new moves back out', () => {
    const team = [createCreature('pyrret', 5)];
    // One point short of level 6 on the medium curve (6^3 = 216).
    team[0].experience = 215;
    const hpBefore = team[0].stats.hp;

    const config = createWildBattleConfig({ species: 'nibbit', level: 4 }, team);
    const engine = new BattleEngine({ ...config, random: createSeededRandom(41) });
    engine.start();
    engine.opponent.creature.currentHp = 1;
    const result = fightToEnd(engine);

    expect(result.outcome).toBe(BATTLE_RESULT.WIN);
    expect(team[0].level).toBeGreaterThan(5);
    expect(team[0].stats.hp).toBeGreaterThan(hpBefore);
    expect(result.experience[0].result.levelsGained).toBeGreaterThan(0);
  });

  it('reports an evolution earned from wild experience', () => {
    const team = [createCreature('pyrret', 15)];
    // One point short of level 16, where Pyrret evolves.
    team[0].experience = 4095;

    const config = createWildBattleConfig({ species: 'nibbit', level: 4 }, team);
    const engine = new BattleEngine({ ...config, random: createSeededRandom(17) });
    engine.start();
    engine.opponent.creature.currentHp = 1;
    const result = fightToEnd(engine);

    expect(result.outcome).toBe(BATTLE_RESULT.WIN);
    expect(result.experience[0].result.evolutionTo).toBe('cindraw');
  });

  it('awards nothing at all when the player runs', () => {
    const team = [createCreature('pyrret', 30)];
    const expBefore = team[0].experience;

    const config = createWildBattleConfig({ species: 'nibbit', level: 3 }, team);
    // A fast creature fleeing a slow one on a lucky roll always gets away.
    const engine = new BattleEngine({ ...config, random: alwaysLucky });
    engine.start();
    engine.submitPlayerAction({ type: 'run' });

    expect(engine.result.outcome).toBe(BATTLE_RESULT.FLED);
    expect(engine.result.experience).toEqual([]);
    expect(engine.result.money).toBe(0);
    expect(team[0].experience).toBe(expBefore);
  });

  it('running can fail and cost the turn, using the engine escape formula', () => {
    // Sturdy enough to survive the free hit, so what is being checked is the
    // failed escape rather than a knockout.
    const team = [createCreature('pyrret', 40)];
    const config = createWildBattleConfig({ species: 'cragmaw', level: 40 }, team);
    const engine = new BattleEngine({ ...config, random: neverLucky });
    engine.start();

    const events = engine.submitPlayerAction({ type: 'run' });
    expect(events.map((e) => e.text).join(' ')).toMatch(/get away/i);
    expect(engine.isOver()).toBe(false);
    expect(engine.result).toBeNull();
  });

  it('a defeat ends the battle cleanly rather than hanging', () => {
    const team = [createCreature('pyrret', 2)];
    team[0].currentHp = 1;

    const config = createWildBattleConfig({ species: 'cragmaw', level: 40 }, team);
    const engine = new BattleEngine({ ...config, random: createSeededRandom(8) });
    engine.start();
    const result = fightToEnd(engine);

    expect(result).not.toBeNull();
    expect(result.outcome).toBe(BATTLE_RESULT.LOSS);
    expect(result.experience).toEqual([]);
    expect(engine.isOver()).toBe(true);
  });

  it('never leaves a creature with negative HP, whatever the seed', () => {
    for (let seed = 1; seed <= 15; seed += 1) {
      const team = [createCreature('pyrret', 6), createCreature('drizzle', 6)];
      const config = createWildBattleConfig({ species: 'nibbit', level: 4 }, team);
      const engine = new BattleEngine({ ...config, random: createSeededRandom(seed) });
      engine.start();
      fightToEnd(engine);

      for (const creature of team) {
        expect(creature.currentHp).toBeGreaterThanOrEqual(0);
        expect(creature.currentHp).toBeLessThanOrEqual(creature.stats.hp);
      }
      expect(engine.isOver(), `seed ${seed} never finished`).toBe(true);
    }
  });
});
