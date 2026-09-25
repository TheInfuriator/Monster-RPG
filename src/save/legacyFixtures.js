/**
 * legacyFixtures.js
 * ----------------------------------------------------------------------------
 * Hand-built saves in OLDER shapes, for proving that migration works.
 *
 * Version 1 was never written to storage by a released build — before Phase
 * 10 the state only ever lived in memory — so there are no real old saves to
 * test against. These are what one WOULD have looked like at the end of each
 * phase, field for field, including the fields a phase did not have yet.
 *
 * The unit tests load every one of them, and `debug.injectLegacySave()` can
 * put one into a slot in the browser to check the whole Continue path.
 *
 * Each export is a FUNCTION returning a fresh copy, so no test can change a
 * fixture another test relies on.
 */

/** A v1 creature, with the stats and maxPp caches v1 carried. */
function v1Creature(overrides) {
  return {
    instanceId: 'c-legacy-1',
    speciesId: 'pyrret',
    nickname: null,
    level: 5,
    experience: 135,
    stats: { hp: 19, attack: 11, defense: 9, spAttack: 10, spDefense: 9, speed: 11 },
    currentHp: 19,
    moves: [
      { id: 'scratch', pp: 35, maxPp: 35 },
      { id: 'ember', pp: 22, maxPp: 30 },
      { id: 'cowerCry', pp: 20, maxPp: 20 },
    ],
    status: null,
    metAt: "Warden's Lodge",
    ...overrides,
  };
}

const v1Settings = () => ({ textSpeed: 'fast', masterVolume: 0.8, musicVolume: 0.7, sfxVolume: 0.8 });

/** Phase 2: a world, flags and a bag — no creatures of any kind yet. */
export function phase2Save() {
  return {
    version: 1,
    playerName: 'Warden',
    location: { mapId: 'emberhollow', x: 12, y: 9, facing: 'up' },
    money: 800,
    party: [],
    inventory: { potion: 1 },
    flags: { metMum: true },
    settings: v1Settings(),
    playTimeMs: 125000,
    createdAt: 1_690_000_000_000,
  };
}

/** Phase 3: a starter, but no storage, Index, recovery point, trainers, puzzles or Sigils. */
export function phase3Save() {
  return {
    ...phase2Save(),
    location: { mapId: 'wardensLodge', x: 5, y: 6, facing: 'down' },
    party: [v1Creature()],
    flags: { metMum: true, gotStarter: true },
  };
}

/** Phase 6: storage and the Index have arrived. */
export function phase6Save() {
  return {
    ...phase3Save(),
    location: { mapId: 'route1', x: 10, y: 20, facing: 'up' },
    party: [
      v1Creature({
        level: 8,
        experience: 512,
        stats: { hp: 25, attack: 14, defense: 11, spAttack: 13, spDefense: 11, speed: 15 },
        currentHp: 14,
      }),
      v1Creature({
        instanceId: 'c-legacy-2',
        speciesId: 'flittle',
        nickname: 'Pip',
        level: 6,
        experience: 216,
        stats: { hp: 20, attack: 10, defense: 9, spAttack: 8, spDefense: 8, speed: 11 },
        currentHp: 20,
        moves: [{ id: 'peck', pp: 30, maxPp: 35 }, { id: 'screech', pp: 20, maxPp: 20 }],
        metAt: 'Route 1 — Cinderpath',
      }),
    ],
    storage: [],
    inventory: { potion: 2, basicOrb: 3 },
    creatureIndex: { seen: { pyrret: true, flittle: true, nibbit: true }, caught: { pyrret: true, flittle: true } },
  };
}

/** Phase 7: the recovery point. */
export function phase7Save() {
  return {
    ...phase6Save(),
    respawn: { mapId: 'mendersHall', spawn: 'default' },
    money: 1240,
  };
}

/** Phase 8: beaten trainers. */
export function phase8Save() {
  return {
    ...phase7Save(),
    defeatedTrainers: { route1Scout: true, route1Treader: true },
  };
}

/** Phase 9: puzzles and Sigils — the complete version 1 shape. */
export function phase9Save() {
  return {
    ...phase8Save(),
    location: { mapId: 'verdantHall', x: 18, y: 9, facing: 'up' },
    respawn: { mapId: 'thistlewoodMendersHall', spawn: 'default' },
    flags: { metMum: true, gotStarter: true, route1GateOpen: true },
    defeatedTrainers: { route1Scout: true, route1Treader: true, verdantGardenerTeal: true },
    puzzles: { verdantHall: { hedgeWest: false, hedgeEast: false, hedgeNorth: true } },
    badges: [],
  };
}

/** Every fixture by name, for tests and `debug.injectLegacySave(name)`. */
export const LEGACY_FIXTURES = {
  phase2: phase2Save,
  phase3: phase3Save,
  phase6: phase6Save,
  phase7: phase7Save,
  phase8: phase8Save,
  phase9: phase9Save,
};
