/**
 * saveMigrations.test.js
 * ----------------------------------------------------------------------------
 * Older saves come forward; newer saves are refused, never mangled.
 *
 * Every legacy fixture — a save shaped the way it would have been at the end
 * of each earlier phase, missing whatever that phase had not built yet — must
 * migrate, validate and load with its contents intact.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  migrateSave, migrateV1toV2, detectSaveVersion, MIGRATIONS, FUTURE_VERSION_MESSAGE,
} from '../src/save/SaveMigrations.js';
import { SAVE_VERSION, SAVE_GAME_ID, createSaveFile } from '../src/save/SaveSchema.js';
import { validateSaveFile } from '../src/save/SaveValidator.js';
import { LEGACY_FIXTURES, phase2Save, phase3Save, phase6Save, phase9Save } from '../src/save/legacyFixtures.js';
import { createNewGameState } from '../src/core/GameState.js';
import { clearReservedInstanceIds } from '../src/systems/CreatureFactory.js';
import { calculateStats } from '../src/systems/StatCalculator.js';
import { getSpecies } from '../src/data/creatures.js';
import { buildRichState } from './helpers/richState.js';

/** Migrate and validate, the way a load does. */
function loadLegacy(raw) {
  const migration = migrateSave(raw);
  expect(migration.ok, migration.error).toBe(true);
  return validateSaveFile(migration.file, { expectMetadata: false });
}

beforeEach(() => clearReservedInstanceIds());

describe('the migration table', () => {
  it('has a step from every older version up to the current one', () => {
    for (let version = 1; version < SAVE_VERSION; version += 1) {
      expect(typeof MIGRATIONS[version], `no migration from version ${version}`).toBe('function');
    }
  });

  it('has no step for a version that does not exist yet', () => {
    expect(MIGRATIONS[SAVE_VERSION]).toBeUndefined();
  });
});

describe('recognising a save', () => {
  it('reads the version off the envelope', () => {
    expect(detectSaveVersion(createSaveFile(createNewGameState()))).toBe(SAVE_VERSION);
  });

  it('recognises a bare version 1 state', () => {
    expect(detectSaveVersion(phase9Save())).toBe(1);
  });

  it.each([
    ['null', null],
    ['an array', [1, 2]],
    ['a string', 'save'],
    ['an object with no version', { location: {} }],
    ['a bare state with no location', { version: 1 }],
    ['another program\'s file', { game: 'other', version: 2 }],
    ['an envelope with a text version', { game: SAVE_GAME_ID, version: 'two' }],
    ['an envelope with a fractional version', { game: SAVE_GAME_ID, version: 1.5 }],
  ])('does not mistake %s for a save', (_label, raw) => {
    expect(detectSaveVersion(raw)).toBeNull();
    const result = migrateSave(raw);
    expect(result.ok).toBe(false);
    expect(result.status).toBe('unrecognised');
  });
});

describe('newer saves', () => {
  it('are refused with the player-facing message', () => {
    const file = createSaveFile(buildRichState());
    file.version = SAVE_VERSION + 1;
    const result = migrateSave(file);
    expect(result.ok).toBe(false);
    expect(result.status).toBe('future');
    expect(result.error).toBe(FUTURE_VERSION_MESSAGE);
    expect(FUTURE_VERSION_MESSAGE).toBe(
      'This save was created by a newer version of the game and cannot be loaded here.'
    );
  });

  it('are refused however far ahead they are', () => {
    const file = createSaveFile(buildRichState());
    file.version = 99;
    expect(migrateSave(file).status).toBe('future');
  });
});

describe('current saves', () => {
  it('pass straight through untouched', () => {
    const file = createSaveFile(buildRichState());
    const result = migrateSave(file);
    expect(result.status).toBe('current');
    expect(result.applied).toEqual([]);
    expect(result.file).toBe(file);
  });
});

describe('version 1 → 2', () => {
  it('is pure: the input is left exactly as it was', () => {
    const v1 = phase9Save();
    const before = JSON.parse(JSON.stringify(v1));
    migrateV1toV2(v1);
    expect(v1).toEqual(before);
  });

  it('wraps the state in the save envelope', () => {
    const v2 = migrateV1toV2(phase9Save());
    expect(v2.game).toBe(SAVE_GAME_ID);
    expect(v2.version).toBe(2);
    expect(v2.metadata).toBeNull();
    expect(v2.gameState.version).toBeUndefined();
  });

  it('moves settings out: a v1 save cannot override the player\'s preferences', () => {
    expect(migrateV1toV2(phase9Save()).gameState.settings).toBeUndefined();
  });

  it('drops the derived caches v1 carried', () => {
    const v2 = migrateV1toV2(phase6Save());
    for (const creature of v2.gameState.party) {
      expect(creature.stats).toBeUndefined();
      for (const move of creature.moves) expect(move.maxPp).toBeUndefined();
    }
  });

  it('keeps everything else', () => {
    const v1 = phase9Save();
    const v2 = migrateV1toV2(v1);
    expect(v2.gameState.location).toEqual(v1.location);
    expect(v2.gameState.money).toBe(v1.money);
    expect(v2.gameState.puzzles).toEqual(v1.puzzles);
    expect(v2.gameState.defeatedTrainers).toEqual(v1.defeatedTrainers);
    expect(v2.gameState.party.map((c) => c.instanceId)).toEqual(v1.party.map((c) => c.instanceId));
  });

  it('fills in everything an early save predates', () => {
    const v2 = migrateV1toV2(phase2Save());
    expect(v2.gameState.storage).toEqual([]);
    expect(v2.gameState.creatureIndex).toEqual({ seen: {}, caught: {} });
    expect(v2.gameState.respawn).toEqual({ mapId: 'mendersHall', spawn: 'default' });
    expect(v2.gameState.defeatedTrainers).toEqual({});
    expect(v2.gameState.puzzles).toEqual({});
    expect(v2.gameState.badges).toEqual([]);
  });

  it('never overwrites a field that WAS saved with a default', () => {
    const v1 = phase9Save();
    v1.respawn = { mapId: 'thistlewoodMendersHall', spawn: 'default' };
    expect(migrateV1toV2(v1).gameState.respawn).toEqual(v1.respawn);
  });

  it('leaves damage for the validator to judge, rather than hiding it', () => {
    const v1 = phase9Save();
    v1.party = 'broken';
    const v2 = migrateV1toV2(v1);
    expect(v2.gameState.party).toBe('broken');
    expect(validateSaveFile(v2).ok).toBe(false);
  });

  it('reports which steps it ran', () => {
    const result = migrateSave(phase9Save());
    expect(result.status).toBe('migrated');
    expect(result.fromVersion).toBe(1);
    expect(result.applied).toEqual(['1→2']);
  });
});

describe('every legacy fixture loads', () => {
  for (const [name, build] of Object.entries(LEGACY_FIXTURES)) {
    it(`${name}: migrates, validates, and needs no repairs`, () => {
      const result = loadLegacy(build());
      expect(result.errors).toEqual([]);
      expect(result.warnings).toEqual([]);
      expect(result.ok).toBe(true);
    });

    it(`${name}: keeps its position, coins, bag and flags`, () => {
      const raw = build();
      const { state } = loadLegacy(raw);
      expect(state.location).toEqual(raw.location);
      expect(state.money).toBe(raw.money);
      expect(state.inventory).toEqual(raw.inventory);
      expect(state.flags).toEqual(raw.flags);
      expect(state.playerName).toBe(raw.playerName);
      expect(state.playTimeMs).toBe(raw.playTimeMs);
    });

    it(`${name}: keeps every creature, with its identity and progress`, () => {
      const raw = build();
      const { state } = loadLegacy(raw);
      expect(state.party.map((c) => c.instanceId)).toEqual(raw.party.map((c) => c.instanceId));
      state.party.forEach((creature, i) => {
        const before = raw.party[i];
        expect(creature.speciesId).toBe(before.speciesId);
        expect(creature.level).toBe(before.level);
        expect(creature.experience).toBe(before.experience);
        expect(creature.currentHp).toBe(before.currentHp);
        expect(creature.nickname).toBe(before.nickname);
        expect(creature.moves.map((m) => [m.id, m.pp])).toEqual(before.moves.map((m) => [m.id, m.pp]));
      });
    });

    it(`${name}: rebuilds stats rather than trusting v1's cache`, () => {
      const { state } = loadLegacy(build());
      for (const creature of state.party) {
        expect(creature.stats).toEqual(calculateStats(getSpecies(creature.speciesId), creature.level));
      }
    });
  }

  it('a Phase 3 save has a starter and nothing else yet', () => {
    const { state } = loadLegacy(phase3Save());
    expect(state.party).toHaveLength(1);
    expect(state.storage).toEqual([]);
    expect(state.creatureIndex).toEqual({ seen: {}, caught: {} });
    expect(state.respawn).toEqual({ mapId: 'mendersHall', spawn: 'default' });
  });

  it('a Phase 9 save keeps its puzzle, its trainers and its recovery point', () => {
    const { state } = loadLegacy(phase9Save());
    expect(state.puzzles.verdantHall).toEqual({ hedgeWest: false, hedgeEast: false, hedgeNorth: true });
    expect(state.defeatedTrainers.verdantGardenerTeal).toBe(true);
    expect(state.respawn.mapId).toBe('thistlewoodMendersHall');
  });

  it('a stale v1 stats cache is ignored, not believed', () => {
    const raw = phase3Save();
    raw.party[0].stats = { hp: 999, attack: 999, defense: 999, spAttack: 999, spDefense: 999, speed: 999 };
    const { state } = loadLegacy(raw);
    expect(state.party[0].stats.hp).toBeLessThan(100);
  });

  it('a migrated save saves back out as a current-version file', () => {
    const { state } = loadLegacy(phase9Save());
    const again = createSaveFile(state);
    expect(again.version).toBe(SAVE_VERSION);
    expect(validateSaveFile(JSON.parse(JSON.stringify(again))).warnings).toEqual([]);
  });
});
