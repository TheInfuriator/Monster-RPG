/**
 * SaveValidator.js
 * ----------------------------------------------------------------------------
 * Turns untrusted saved JSON into a fresh, fully valid GameState — or refuses.
 *
 * A save file comes from the player's browser storage, so anything can be in
 * it: an old shape, a hand-edited value, half a write from a crashed tab.
 * Nothing here ever touches the live game. It builds a BRAND NEW state from
 * `createNewGameState()` and copies across only what checks out, so a bad
 * save cannot leave the running game half-loaded.
 *
 * TWO KINDS OF PROBLEM
 *
 * ERRORS refuse the whole save. They are kept for the cases where we can no
 * longer tell what the player actually had:
 *   - the file is not a save at all, or is the wrong version
 *   - a whole collection has the wrong type (the party is not a list, the bag
 *     is not an object, the coins are not a number)
 *   - a creature's species or level cannot be read
 *
 * WARNINGS are repaired, and the save still loads. They cover problems where
 * the intent is obvious and the fix loses nothing real:
 *   - a collection missing entirely (older saves were made before it existed)
 *   - a number out of range (clamped: negative coins become 0)
 *   - an id for content that does not exist (an unknown item is dropped)
 *   - a missing or duplicated creature id (a fresh one is issued)
 *   - a position that is off the map (the player is placed somewhere safe)
 *
 * Every repair is reported, so nothing is ever fixed silently.
 *
 * DERIVED DATA IS REBUILT HERE
 * A creature's stats and each move's maximum PP are not saved; they are worked
 * out again from the species, level and move data. See SaveSchema.js.
 */

import { MAPS } from '../data/maps/index.js';
import { CREATURES, STARTER_IDS, getMovesAtLevel } from '../data/creatures.js';
import { MOVES } from '../data/moves.js';
import { ITEMS } from '../data/items.js';
import { STATUS_CONDITIONS } from '../data/statuses.js';
import { TRAINERS } from '../data/trainers.js';
import { BADGES } from '../data/badges.js';
import { isSwitchDriven } from '../systems/PuzzleSystem.js';
import { calculateStats, experienceForLevel } from '../systems/StatCalculator.js';
import { generateInstanceId } from '../systems/CreatureFactory.js';
import { createNewGameState } from '../core/GameState.js';
import { PARTY, PROGRESSION } from '../config/balance.js';
import { DIRECTIONS } from '../config/controls.js';
import {
  SAVE_VERSION, SAVE_GAME_ID, SAVE_SOURCES, buildSaveMetadata,
} from './SaveSchema.js';

/** Longest name the game will accept from a save. */
export const PLAYER_NAME_MAX_LENGTH = 16;
export const NICKNAME_MAX_LENGTH = 16;
export const MET_AT_MAX_LENGTH = 48;

// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------

/**
 * A table entry by id, or null.
 *
 * Quiet on purpose — the data files' own getters print a warning for an
 * unknown id, and here an unknown id is expected and already reported. And
 * strict on purpose: only the table's OWN keys count, so a save naming a
 * species "constructor" or "__proto__" is an unknown species, not a function.
 */
function lookup(table, id) {
  return typeof id === 'string' && Object.hasOwn(table, id) ? table[id] : null;
}

const getSpecies = (id) => lookup(CREATURES, id);
const getMove = (id) => lookup(MOVES, id);
const getItem = (id) => lookup(ITEMS, id);
const getStatus = (id) => lookup(STATUS_CONDITIONS, id);
const getTrainer = (id) => lookup(TRAINERS, id);
const getBadge = (id) => lookup(BADGES, id);
const getMap = (id) => lookup(MAPS, id);

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isFiniteNumber(value) {
  return typeof value === 'number' && Number.isFinite(value);
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

/** A readable string for messages, whatever the value is. */
function show(value) {
  if (typeof value === 'string') return `"${value}"`;
  try {
    return JSON.stringify(value) ?? String(value);
  } catch {
    return String(value);
  }
}

/** Collects what went wrong. `errors` refuse the save; `warnings` were repaired. */
function createReport() {
  return {
    errors: [],
    warnings: [],
    error(message) { this.errors.push(message); },
    warn(message) { this.warnings.push(message); },
  };
}

// ---------------------------------------------------------------------------
// Creatures
// ---------------------------------------------------------------------------

/**
 * One saved creature, back to a full instance — or null if it cannot be read.
 *
 * @param {*} raw          whatever was in the file
 * @param {string} where   e.g. "party slot 2", for messages
 */
export function validateCreature(raw, where, report) {
  if (!isPlainObject(raw)) {
    report.error(`${where} is not a creature.`);
    return null;
  }

  const species = getSpecies(raw.speciesId);
  if (!species) {
    report.error(`${where} is an unknown species (${show(raw.speciesId)}).`);
    return null;
  }
  const label = `${where} (${species.name})`;

  if (!isFiniteNumber(raw.level)) {
    report.error(`${label} has no readable level.`);
    return null;
  }
  const level = clamp(Math.round(raw.level), 1, PROGRESSION.maxLevel);
  if (level !== raw.level) report.warn(`${label}: level ${raw.level} corrected to ${level}.`);

  // Derived, never trusted from the file.
  const stats = calculateStats(species, level);

  // Experience has to sit inside the band for its level, or the EXP bar and
  // the next level-up would both be wrong. At the level cap it keeps counting
  // up with nowhere to go, so there is no ceiling there.
  const floor = experienceForLevel(level, species.growthRate);
  const ceiling = level >= PROGRESSION.maxLevel
    ? Number.MAX_SAFE_INTEGER
    : experienceForLevel(level + 1, species.growthRate) - 1;
  let experience = floor;
  if (isFiniteNumber(raw.experience)) {
    experience = clamp(Math.floor(raw.experience), floor, ceiling);
    if (experience !== raw.experience) {
      report.warn(`${label}: experience ${raw.experience} corrected to ${experience}.`);
    }
  } else {
    report.warn(`${label}: experience missing, set to the start of level ${level}.`);
  }

  let currentHp = stats.hp;
  if (isFiniteNumber(raw.currentHp)) {
    currentHp = clamp(Math.round(raw.currentHp), 0, stats.hp);
    if (currentHp !== raw.currentHp) {
      report.warn(`${label}: HP ${raw.currentHp} corrected to ${currentHp}.`);
    }
  } else {
    report.warn(`${label}: HP missing, restored to full.`);
  }

  if (!Array.isArray(raw.moves)) {
    report.error(`${label} has no readable move list.`);
    return null;
  }
  const moves = [];
  for (const entry of raw.moves) {
    const move = isPlainObject(entry) ? getMove(entry.id) : null;
    if (!move) {
      report.warn(`${label}: unknown move ${show(isPlainObject(entry) ? entry.id : entry)} removed.`);
      continue;
    }
    if (moves.some((known) => known.id === move.id)) {
      report.warn(`${label}: duplicate ${move.name} removed.`);
      continue;
    }
    if (moves.length >= PARTY.maxMoves) {
      report.warn(`${label}: more than ${PARTY.maxMoves} moves; ${move.name} removed.`);
      continue;
    }

    let pp = move.pp;
    if (isFiniteNumber(entry.pp)) {
      pp = clamp(Math.round(entry.pp), 0, move.pp);
      if (pp !== entry.pp) report.warn(`${label}: ${move.name} PP ${entry.pp} corrected to ${pp}.`);
    } else {
      report.warn(`${label}: ${move.name} PP missing, restored to full.`);
    }
    moves.push({ id: move.id, pp, maxPp: move.pp });
  }

  if (moves.length === 0) {
    // A creature with nothing to use would be stuck on Struggle forever.
    // What it would know naturally at its level is the obvious repair.
    for (const id of getMovesAtLevel(species, level, PARTY.maxMoves)) {
      const move = getMove(id);
      if (move) moves.push({ id: move.id, pp: move.pp, maxPp: move.pp });
    }
    report.warn(`${label}: no usable moves; given its natural moves for level ${level}.`);
  }

  let status = null;
  if (raw.status !== null && raw.status !== undefined) {
    if (typeof raw.status === 'string' && getStatus(raw.status)) status = raw.status;
    else report.warn(`${label}: unknown status ${show(raw.status)} cleared.`);
  }

  let nickname = null;
  if (raw.nickname !== null && raw.nickname !== undefined) {
    const valid = typeof raw.nickname === 'string'
      && raw.nickname.trim().length > 0
      && raw.nickname.length <= NICKNAME_MAX_LENGTH;
    if (valid) nickname = raw.nickname;
    else report.warn(`${label}: nickname ${show(raw.nickname)} removed.`);
  }

  let metAt = null;
  if (raw.metAt !== null && raw.metAt !== undefined) {
    if (typeof raw.metAt === 'string' && raw.metAt.length <= MET_AT_MAX_LENGTH) metAt = raw.metAt;
    else report.warn(`${label}: met location ${show(raw.metAt)} removed.`);
  }

  return {
    // Checked for uniqueness across the whole collection afterwards.
    instanceId: typeof raw.instanceId === 'string' && raw.instanceId.length > 0
      ? raw.instanceId
      : null,
    speciesId: species.id,
    nickname,
    level,
    experience,
    stats,
    currentHp,
    moves,
    status,
    metAt,
  };
}

/**
 * Make every owned creature's id unique.
 *
 * The first creature to hold an id keeps it; a later duplicate, or a creature
 * with no id at all, is issued a fresh one. Both creatures are kept — which
 * one is "real" cannot be known, and deleting either would lose something the
 * player owns.
 */
function ensureUniqueIds(creatures, report) {
  const taken = new Set();
  const needsId = [];

  for (const creature of creatures) {
    if (creature.instanceId && !taken.has(creature.instanceId)) {
      taken.add(creature.instanceId);
    } else {
      report.warn(
        creature.instanceId
          ? `Two creatures shared the id "${creature.instanceId}"; one was given a new id.`
          : `A ${getSpecies(creature.speciesId).name} had no id; it was given one.`
      );
      needsId.push(creature);
    }
  }

  for (const creature of needsId) {
    let id;
    do {
      id = generateInstanceId();
    } while (taken.has(id));
    taken.add(id);
    creature.instanceId = id;
  }
}

function validateCreatureList(raw, name, report) {
  if (raw === undefined) {
    report.warn(`No ${name} in the save; starting with none.`);
    return [];
  }
  if (!Array.isArray(raw)) {
    report.error(`The ${name} is not a list.`);
    return null;
  }

  const slotName = name === 'party' ? 'party slot' : 'storage slot';
  return raw.map((entry, i) => validateCreature(entry, `${slotName} ${i + 1}`, report));
}

// ---------------------------------------------------------------------------
// Where the player is
// ---------------------------------------------------------------------------

function mapSize(definition) {
  return { width: definition.tiles[0].length, height: definition.tiles.length };
}

function validateRespawn(raw, fallback, report) {
  if (raw === undefined) {
    report.warn('No recovery point in the save; using Emberhollow\'s Mender\'s Hall.');
    return { ...fallback };
  }

  const map = isPlainObject(raw) ? getMap(raw.mapId) : null;
  const spawnExists = map && lookup(map.spawnPoints || {}, raw.spawn);
  if (!spawnExists) {
    report.warn(`Recovery point ${show(raw)} does not exist; using the default one.`);
    return { ...fallback };
  }
  return { mapId: raw.mapId, spawn: raw.spawn };
}

/**
 * The saved position, as far as the save itself can vouch for it.
 *
 * This checks what can be checked from the file: the map exists, the tile is
 * on it, the facing is a direction. Whether that tile is actually safe to
 * stand on depends on the hedges, the NPCs and the ground items, which is
 * `RestorePosition.js`'s job at load time.
 */
function validateLocation(raw, respawn, report) {
  const atRecoveryPoint = { mapId: respawn.mapId, x: null, y: null, facing: 'down' };

  if (!isPlainObject(raw)) {
    report.warn('No readable position in the save; waking at the recovery point.');
    return atRecoveryPoint;
  }

  const map = getMap(raw.mapId);
  if (!map) {
    report.warn(`Saved map ${show(raw.mapId)} does not exist; waking at the recovery point.`);
    return atRecoveryPoint;
  }

  let facing = raw.facing;
  if (!DIRECTIONS.includes(facing)) {
    report.warn(`Facing ${show(raw.facing)} is not a direction; facing down.`);
    facing = 'down';
  }

  // null/null is legitimate: it means "the map's own spawn point".
  if (raw.x === null && raw.y === null) return { mapId: raw.mapId, x: null, y: null, facing };

  const { width, height } = mapSize(map);
  const onMap = Number.isInteger(raw.x) && Number.isInteger(raw.y)
    && raw.x >= 0 && raw.y >= 0 && raw.x < width && raw.y < height;
  if (!onMap) {
    report.warn(`Position (${show(raw.x)}, ${show(raw.y)}) is not on ${map.name}; using its spawn point.`);
    return { mapId: raw.mapId, x: null, y: null, facing };
  }

  return { mapId: raw.mapId, x: raw.x, y: raw.y, facing };
}

// ---------------------------------------------------------------------------
// Collections of facts
// ---------------------------------------------------------------------------

/**
 * Shared shape for the "object of facts" fields — flags, the bag, and so on.
 * Missing is repaired to empty; the wrong type refuses the save.
 */
function readObjectField(raw, name, report) {
  if (raw === undefined) {
    report.warn(`No ${name} in the save; starting with none.`);
    return {};
  }
  if (!isPlainObject(raw)) {
    report.error(`The ${name} is not readable.`);
    return null;
  }
  return raw;
}

function validateInventory(raw, report) {
  const source = readObjectField(raw, 'bag', report);
  if (!source) return null;

  const inventory = {};
  for (const [id, quantity] of Object.entries(source)) {
    if (!getItem(id)) {
      report.warn(`Unknown item ${show(id)} removed from the bag.`);
      continue;
    }
    if (!isFiniteNumber(quantity) || quantity < 1) {
      report.warn(`${getItem(id).name} had quantity ${show(quantity)}; removed.`);
      continue;
    }
    inventory[id] = Math.floor(quantity);
    if (inventory[id] !== quantity) {
      report.warn(`${getItem(id).name} quantity ${quantity} corrected to ${inventory[id]}.`);
    }
  }
  return inventory;
}

function validateMoney(raw, fallback, report) {
  if (raw === undefined) {
    report.warn(`No coins in the save; starting with ${fallback}.`);
    return fallback;
  }
  if (!isFiniteNumber(raw)) {
    report.error(`The coin count ${show(raw)} is not a number.`);
    return null;
  }
  const money = clamp(Math.floor(raw), 0, Number.MAX_SAFE_INTEGER);
  if (money !== raw) report.warn(`Coins ${raw} corrected to ${money}.`);
  return money;
}

function validateBadges(raw, report) {
  if (raw === undefined) {
    report.warn('No Sigils in the save; starting with none.');
    return [];
  }
  if (!Array.isArray(raw)) {
    report.error('The Sigils are not a list.');
    return null;
  }

  const badges = [];
  for (const id of raw) {
    if (typeof id !== 'string' || !getBadge(id)) {
      report.warn(`Unknown Sigil ${show(id)} removed.`);
    } else if (badges.includes(id)) {
      report.warn(`Duplicate ${getBadge(id).name} removed.`);
    } else {
      badges.push(id);
    }
  }
  return badges;
}

function validateFlags(raw, report) {
  const source = readObjectField(raw, 'story flags', report);
  if (!source) return null;

  const flags = {};
  for (const [name, value] of Object.entries(source)) {
    // The one name an object cannot hold as an ordinary key.
    if (name === '__proto__') {
      report.warn('A flag named "__proto__" was removed.');
      continue;
    }
    if (typeof value !== 'boolean') {
      report.warn(`Flag "${name}" held ${show(value)}; stored as ${Boolean(value)}.`);
    }
    flags[name] = Boolean(value);
  }
  return flags;
}

function validateDefeatedTrainers(raw, report) {
  const source = readObjectField(raw, 'beaten-trainer record', report);
  if (!source) return null;

  const defeated = {};
  for (const [id, value] of Object.entries(source)) {
    if (!getTrainer(id)) {
      report.warn(`Unknown trainer ${show(id)} removed from the beaten list.`);
    } else if (value !== true) {
      report.warn(`Trainer "${id}" was recorded as ${show(value)}; not counted as beaten.`);
    } else {
      defeated[id] = true;
    }
  }
  return defeated;
}

/**
 * Switch positions, per map. Only barriers that a switch can actually move are
 * kept: a flag-driven gate's state is never stored, so an entry for one could
 * only be a mistake — and trusting it would let a save open a gate by hand.
 */
function validatePuzzles(raw, report) {
  const source = readObjectField(raw, 'puzzle record', report);
  if (!source) return null;

  const puzzles = {};
  for (const [mapId, barriers] of Object.entries(source)) {
    const definition = getMap(mapId);
    if (!definition) {
      report.warn(`Puzzle state for unknown map ${show(mapId)} removed.`);
      continue;
    }
    if (!isPlainObject(barriers)) {
      report.warn(`Puzzle state for ${definition.name} was unreadable; it starts fresh.`);
      continue;
    }

    puzzles[mapId] = {};
    for (const [barrierId, closed] of Object.entries(barriers)) {
      if (!isSwitchDriven(definition, barrierId)) {
        report.warn(`${definition.name}: "${barrierId}" is not a switch-moved barrier; removed.`);
      } else if (typeof closed !== 'boolean') {
        report.warn(`${definition.name}: "${barrierId}" held ${show(closed)}; removed.`);
      } else {
        puzzles[mapId][barrierId] = closed;
      }
    }
  }
  return puzzles;
}

function validateIndex(raw, report) {
  const source = readObjectField(raw, 'Aether Index', report);
  if (!source) return null;

  const readSet = (value, name) => {
    if (value === undefined) {
      report.warn(`The Index had no "${name}" list; starting it empty.`);
      return {};
    }
    if (!isPlainObject(value)) {
      report.error(`The Index "${name}" list is not readable.`);
      return null;
    }
    const result = {};
    for (const [id, flag] of Object.entries(value)) {
      if (!getSpecies(id)) report.warn(`Index: unknown species ${show(id)} removed.`);
      else if (flag) result[id] = true;
    }
    return result;
  };

  const seen = readSet(source.seen, 'seen');
  const caught = readSet(source.caught, 'caught');
  if (!seen || !caught) return null;

  // Catching something means having seen it.
  for (const id of Object.keys(caught)) {
    if (!seen[id]) {
      report.warn(`Index: ${getSpecies(id).name} was caught but not seen; marked seen.`);
      seen[id] = true;
    }
  }
  return { seen, caught };
}

function validatePlayerName(raw, fallback, report) {
  const valid = typeof raw === 'string'
    && raw.trim().length > 0
    && raw.length <= PLAYER_NAME_MAX_LENGTH;
  if (valid) return raw;

  report.warn(`Player name ${show(raw)} is not usable; using "${fallback}".`);
  return fallback;
}

/**
 * Which starter the player took: null before the Lodge, otherwise one of the
 * three. Anything else is dropped with a warning — the rival then works it out
 * from the creature met at the Lodge instead (see RivalSystem).
 */
function validateStarter(raw, report) {
  if (raw === null) return null;
  if (raw === undefined) {
    report.warn('No starter recorded in the save; it will be read from the party.');
    return null;
  }
  if (STARTER_IDS.includes(raw)) return raw;
  report.warn(`Starter ${show(raw)} is not a starter; it will be read from the party.`);
  return null;
}

function validateCount(raw, name, fallback, report) {
  if (isFiniteNumber(raw) && raw >= 0) return Math.floor(raw);
  report.warn(`${name} ${show(raw)} is not usable; using ${fallback}.`);
  return fallback;
}

// ---------------------------------------------------------------------------
// The whole state
// ---------------------------------------------------------------------------

/**
 * Build a fresh GameState from saved data.
 *
 * @param {*} raw  the `gameState` part of a save file
 * @returns {{ ok: boolean, errors: string[], warnings: string[], state: object|null }}
 *          `state` is null whenever `ok` is false
 */
export function validateGameState(raw) {
  const report = createReport();

  if (!isPlainObject(raw)) {
    report.error('The save has no game data.');
    return { ok: false, errors: report.errors, warnings: report.warnings, state: null };
  }

  const state = createNewGameState();

  state.playerName = validatePlayerName(raw.playerName, state.playerName, report);
  state.starter = validateStarter(raw.starter, report);
  state.respawn = validateRespawn(raw.respawn, state.respawn, report);
  state.location = validateLocation(raw.location, state.respawn, report);

  const money = validateMoney(raw.money, state.money, report);
  const party = validateCreatureList(raw.party, 'party', report);
  const storage = validateCreatureList(raw.storage, 'storage', report);
  const inventory = validateInventory(raw.inventory, report);
  const badges = validateBadges(raw.badges, report);
  const flags = validateFlags(raw.flags, report);
  const defeatedTrainers = validateDefeatedTrainers(raw.defeatedTrainers, report);
  const puzzles = validatePuzzles(raw.puzzles, report);
  const creatureIndex = validateIndex(raw.creatureIndex, report);

  state.playTimeMs = validateCount(raw.playTimeMs, 'Play time', 0, report);
  state.createdAt = validateCount(raw.createdAt, 'Start date', state.createdAt, report);

  // A refused creature is reported as an error above and comes back as null.
  const creaturesReadable = party && storage
    && !party.includes(null) && !storage.includes(null);

  if (report.errors.length > 0 || !creaturesReadable) {
    return { ok: false, errors: report.errors, warnings: report.warnings, state: null };
  }

  // A party can only hold so many. Nothing is lost: the extras wait in storage.
  if (party.length > PARTY.maxSize) {
    const extra = party.splice(PARTY.maxSize);
    storage.push(...extra);
    report.warn(`The party held more than ${PARTY.maxSize}; ${extra.length} moved to storage.`);
  }
  ensureUniqueIds([...party, ...storage], report);

  Object.assign(state, {
    money, party, storage, inventory, badges, flags, defeatedTrainers, puzzles, creatureIndex,
  });

  return { ok: true, errors: [], warnings: report.warnings, state };
}

/**
 * The stored summary, if it is sound; otherwise one rebuilt from the state.
 * A garbled summary is no reason to refuse a save whose game data is fine.
 */
function validateMetadata(raw, state, report, { expectMetadata = true } = {}) {
  const lead = raw?.lead;
  const leadOk = lead === null || (isPlainObject(lead)
    && typeof lead.speciesId === 'string'
    && typeof lead.name === 'string'
    && isFiniteNumber(lead.level));

  const sound = isPlainObject(raw)
    && SAVE_SOURCES.includes(raw.source)
    && isFiniteNumber(raw.savedAt)
    && typeof raw.playerName === 'string'
    && typeof raw.mapId === 'string'
    && typeof raw.locationName === 'string'
    && isFiniteNumber(raw.badgeCount)
    && isFiniteNumber(raw.partySize)
    && isFiniteNumber(raw.caughtCount)
    && isFiniteNumber(raw.playTimeMs)
    && leadOk;

  if (sound) return { ...raw, lead: lead ? { ...lead } : null };

  if (expectMetadata || (raw !== null && raw !== undefined)) {
    report.warn('The save summary was unreadable; it was rebuilt from the game data.');
  }
  return buildSaveMetadata(state, {
    source: SAVE_SOURCES.includes(raw?.source) ? raw.source : 'manual',
    // Unknown age sorts as the oldest, so it is never preselected over a
    // save whose time is known.
    savedAt: isFiniteNumber(raw?.savedAt) ? raw.savedAt : 0,
  });
}

/**
 * Check a whole save file at the CURRENT version. Older files go through
 * `migrateSave()` first; this refuses anything that has not.
 *
 * @param {object} [options]
 * @param {boolean} [options.expectMetadata] false for a freshly migrated save,
 *        whose older version never had a summary — so rebuilding one is not
 *        worth a warning
 * @returns {{ ok: boolean, errors: string[], warnings: string[],
 *             state: object|null, metadata: object|null }}
 */
export function validateSaveFile(file, { expectMetadata = true } = {}) {
  if (!isPlainObject(file)) {
    return { ok: false, errors: ['This is not a save file.'], warnings: [], state: null, metadata: null };
  }
  if (file.game !== SAVE_GAME_ID) {
    return {
      ok: false, errors: ['This is not an Aetheria Chronicles save.'], warnings: [], state: null, metadata: null,
    };
  }
  if (file.version !== SAVE_VERSION) {
    return {
      ok: false,
      errors: [`Save version ${show(file.version)} is not version ${SAVE_VERSION}.`],
      warnings: [],
      state: null,
      metadata: null,
    };
  }

  const result = validateGameState(file.gameState);
  if (!result.ok) return { ...result, metadata: null };

  const report = createReport();
  const metadata = validateMetadata(file.metadata, result.state, report, { expectMetadata });

  return {
    ok: true,
    errors: [],
    warnings: [...result.warnings, ...report.warnings],
    state: result.state,
    metadata,
  };
}
