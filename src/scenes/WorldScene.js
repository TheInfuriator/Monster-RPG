/**
 * WorldScene.js
 * ----------------------------------------------------------------------------
 * The overworld: the scene where the player walks around a map.
 *
 * It loads whichever map GameState points at, spawns the player, and wires up
 * the systems that make the world feel alive. Each of those systems lives in its
 * own file — this scene's job is to connect them, not to contain them:
 *
 *   TileMap            what is walkable, where the exits are
 *   MapRenderer        drawing the tiles
 *   NpcManager         the people on this map
 *   DialogueBox        the text box at the bottom
 *   InteractionSystem  what the player is pressing the button at
 *   EncounterSystem    whether tall grass turns something up
 *   PuzzleSystem       which gates and hedges are open right now
 *
 * Changing maps restarts this same scene with new data. Everything created here
 * is released in `cleanup()`, so that can happen as often as the player likes.
 */

import Phaser from 'phaser';
import { playSfx } from '../systems/SoundEffects.js';
import {
  SCENES,
  GAME_WIDTH,
  COLORS,
  CSS_COLORS,
  TEXT_STYLES,
  DEPTHS,
  TILE_SIZE,
  FADE_DURATION,
} from '../config/gameConfig.js';
import { InputManager } from '../core/InputManager.js';
import { TileMap } from '../systems/TileMap.js';
import { MapRenderer } from '../systems/MapRenderer.js';
import { WeatherRenderer, chooseWeather, planWeather } from '../systems/WeatherRenderer.js';
import { NpcManager } from '../systems/NpcManager.js';
import { isNpcPresent, stepsToLeave, wayHome } from '../systems/NpcPresence.js';
import { EncounterSystem } from '../systems/EncounterSystem.js';
import { findInteractionTarget } from '../systems/InteractionSystem.js';
import { resolveDialogue } from '../systems/DialogueResolver.js';
import { addItem } from '../systems/InventorySystem.js';
import { describeParty } from '../systems/PartySystem.js';
import { getItem } from '../data/items.js';
import { getMapDefinition } from '../data/maps/index.js';
import { ASSET_KEYS } from '../config/assets.js';
import { Player } from '../entities/Player.js';
import { DebugOverlay } from '../ui/DebugOverlay.js';
import { DialogueBox } from '../ui/DialogueBox.js';
import { getSpecies } from '../data/creatures.js';
import { getScriptedBattle } from '../data/battles.js';
import { getShop } from '../data/shops.js';
import { getTrainer, getTrainerDisplayName } from '../data/trainers.js';
import {
  createTrainerBattleConfig, isTrainerDefeated, recordTrainerVictory,
} from '../systems/TrainerSystem.js';
import { findChallenger } from '../systems/SightSystem.js';
import {
  createBarrierState, getSwitchAt, pressSwitch, resetPuzzle, getBarrier,
  pressLever, getPuzzleSignals, getLeverPositions,
} from '../systems/PuzzleSystem.js';
import { getWorldConditions } from '../systems/ProgressionSystem.js';
import { awardBadge } from '../systems/BadgeSystem.js';
import { getBadge } from '../data/badges.js';
import { badgeTextureKey } from '../config/assets.js';
import { createCreature } from '../systems/CreatureFactory.js';
import { createWildBattleConfig } from '../systems/WildBattle.js';
import { STARTER_FLAG } from './StarterSelectScene.js';
import {
  gameState, setLocation, hasFlag, setFlag, setRecoveryPoint,
} from '../core/GameState.js';
import { healParty } from '../systems/HealingSystem.js';
import { resolveBlackout, getRecoveryMessages } from '../systems/BlackoutSystem.js';
import { BATTLE_RESULT } from '../systems/battle/BattleEngine.js';
import { saveToSlot } from '../save/SaveManager.js';
import {
  shouldPlayEnding, beginEnding, buildEndingPages, buildCredits, findPartner, POST_STORY_DESTINATION,
} from '../systems/EndingSystem.js';
import { isSafeStandingTile } from '../save/RestorePosition.js';
import { fadeIn } from '../utils/transitions.js';

/**
 * The wild-encounter cue. Short on purpose: it should read as "something just
 * jumped out", not as a cutscene the player has to sit through.
 */
const ENCOUNTER_FLASH_MS = 160;
const ENCOUNTER_FADE_MS = 260;

/** How long the "!" hangs over a trainer before they start walking. */
const TRAINER_ALERT_MS = 620;

/** How long a switch's "the west hedge draws back" note stays on screen. */
const TOAST_MS = 1500;

/** How long the small "Autosaved" note stays in the corner. */
const AUTOSAVE_NOTE_MS = 1300;

/**
 * Whether the player has already been told this session that the autosave
 * slot holds a newer game's save and is being left alone. Once is enough.
 */
let warnedAutosaveBlocked = false;

export class WorldScene extends Phaser.Scene {
  constructor() {
    super({ key: SCENES.WORLD });
  }

  /**
   * @param {object} data
   * @param {string} [data.mapId]  which map to load; defaults to GameState
   * @param {string} [data.spawn]  which named spawn point to appear at
   */
  init(data) {
    this.startData = data || {};
    // Reset every frame-to-frame flag here rather than in create(), because
    // `init` runs on every restart and guarantees a clean slate.
    this.isTransitioning = false;
    /**
     * True from the moment a battle is decided until the battle scene has
     * finished. It is what stops one step, or one impatient key press, opening
     * two battles.
     */
    this.isEnteringBattle = false;
    /**
     * The NPC currently challenging the player, or null. One at a time: this is
     * what stops a second trainer, or a second step, starting another sequence
     * on top of the first.
     */
    this.trainerChallenge = null;
    this.trainerAlert = null;
    /** The fading note a root switch leaves on screen, or null. */
    this.toast = null;
    /** The Sigil panel shown while its message is read, or null. */
    this.badgePanel = null;
    /** Who spoke the dialogue that is running, so an action can answer as them. */
    this.lastSpeaker = null;
    /**
     * Why an autosave is wanted, or null. Set at a checkpoint and written the
     * first frame the world is safe to save — see `flushAutosave()`. One slot,
     * so several checkpoints in a row still make exactly one save.
     */
    this.autosavePending = null;
    /** The small "Autosaved" note in the corner, or null. */
    this.autosaveNote = null;
    /** Where a blackout is taking the player, while its message is read. */
    this.blackoutRecovery = null;
    /** True from the moment the ending begins until the credits are over. */
    this.endingRunning = false;
  }

  create() {
    this.controls = new InputManager(this);

    // The order matters, most of all when a save is being restored: the
    // hedges and gates are set first (inside loadMap), then everyone who
    // lives on this map is put on their tile, and only then is the player
    // placed — on a tile checked against all of that.
    this.loadMap();
    this.createNpcs();
    this.createPlayer();
    this.createGroundItems();
    this.setupCollision();
    this.setupCamera();
    this.createHud();
    this.dialogueBox = new DialogueBox(this);
    this.createDebugOverlay();

    // Rate, cooldown and terrain all come from the map's own data — see
    // `encounters` in src/data/encounters.js for the shape.
    this.encounters = new EncounterSystem(this.map.encounterConfig);

    // Release everything this scene created when it shuts down. Without this,
    // moving between maps would leak render textures, NPCs and timers.
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.cleanup());

    fadeIn(this);

    // Waking up after a blackout. Said here rather than before the fade so the
    // player reads it in the room they woke up in.
    if (this.startData.arrival === 'blackout') {
      this.startDialogue(getRecoveryMessages(gameState.playerName));
    }

    // Arriving somewhere is a checkpoint — through a door, along a road, or
    // waking at a Mender's Hall. Two arrivals are not: a game that has just
    // been LOADED is already saved, and a brand new game has done nothing
    // worth replacing the previous game's autosave with yet.
    if (this.startData.mapId && this.startData.arrival !== 'continue') {
      const reasons = { blackout: 'blackout', postStory: 'story' };
      this.requestAutosave(reasons[this.startData.arrival] || 'arrival');
    }

    // An ending that is owed (Phase 14): the Champion is beaten but the
    // credits never finished — the game was closed during them. Play it now.
    if (shouldPlayEnding(gameState)) {
      // Frozen from the first frame, so nothing can be done in the moment
      // before it starts.
      this.player.inputLocked = true;
      this.time.delayedCall(FADE_DURATION + 100, () => this.startEnding());
    }
  }

  // -------------------------------------------------------------------------
  // Setup
  // -------------------------------------------------------------------------

  loadMap() {
    const mapId = this.startData.mapId || gameState.location.mapId;

    // A bad map id is a developer mistake, not a player one — fail loudly here
    // rather than rendering an empty screen with no explanation.
    const definition = getMapDefinition(mapId);
    this.map = new TileMap(definition);
    // A new map starts with no sky; syncBarriers() below draws the one it has.
    this.weather = null;

    // Gates and hedges BEFORE anything is drawn or anyone is placed, so the
    // first frame already shows the world as it really is.
    this.syncBarriers();
    this.mapRenderer = new MapRenderer(this, this.map);
    // Now there is a picture: show every lever's position and every lit channel.
    this.syncBarriers();

    this.cameras.main.setBackgroundColor(COLORS.ink);
  }

  // -------------------------------------------------------------------------
  // Gates, hedges and root switches
  // -------------------------------------------------------------------------

  /**
   * Push the saved barrier state into the map, and optionally into the picture.
   *
   * ONE call decides both what blocks and what is drawn. Story flags, beaten
   * trainers and earned Sigils all reach `openWhen` through the same
   * `getWorldConditions()` the dialogue uses, so opening Route 1's gate is a
   * flag and nothing else.
   *
   * @param {object} [options]
   * @param {string[]} [options.animate] barrier ids to animate rather than snap
   */
  syncBarriers({ animate = [] } = {}) {
    const definition = this.map.definition;
    const conditions = getWorldConditions(gameState);

    if (this.map.barriers.length > 0) {
      this.map.setBarrierState(createBarrierState(definition, { conditions, state: gameState }));
    }

    // Levers and glowing channels (Phase 12) follow the same stored state —
    // the handle and the light are never out of step with the collision.
    if (this.mapRenderer) {
      if (this.map.barriers.length > 0) this.mapRenderer.refreshBarriers({ animate });
      this.mapRenderer.refreshPuzzle({
        signals: getPuzzleSignals(definition, { state: gameState, conditions }),
        positions: getLeverPositions(definition, gameState),
        conditions,
      });
    }
    // The sky the map declares (Phase 13) — a picture only, never state —
    // which the story can change too (Stormrise's relay).
    this.refreshWeather(conditions);
  }

  /**
   * Bring every barrier up to date with the story, animating only the ones
   * that actually changed — a gate that was already shut does not flicker.
   */
  syncChangedBarriers() {
    const next = createBarrierState(this.map.definition, {
      conditions: getWorldConditions(gameState), state: gameState,
    });
    const changed = this.map.barriers
      .map((b) => b.id)
      .filter((id) => Boolean(next[id]) !== this.map.isBarrierClosed(id));
    this.syncBarriers({ animate: changed });
  }

  /**
   * Draw the sky this map shows under these conditions. Nothing is rebuilt
   * unless the sky actually changed, so calling it after every flag is free.
   */
  refreshWeather(conditions) {
    const choice = chooseWeather(this.map.definition.weather, conditions);
    const plan = planWeather(choice);
    const key = plan ? `${plan.kind}:${plan.count}` : 'none';
    if (this.weather && this.weather.key === key) return;
    if (!this.weather && key === 'none') return;
    if (this.weather) this.weather.destroy();
    this.weather = plan ? new WeatherRenderer(this, choice) : null;
  }

  /**
   * The player pressed Confirm at a lever — a valve, a tide wheel.
   *
   * PuzzleSystem decides what moves (and refuses if a barrier would close on
   * somebody); this animates the barriers that changed and says what
   * happened, in the lever's own words from the map data.
   */
  useLever(lever) {
    const occupants = [
      { x: this.player.tileX, y: this.player.tileY },
      ...this.npcManager.npcs.map((npc) => ({ x: npc.tileX, y: npc.tileY })),
    ];
    const outcome = pressLever(this.map.definition, lever.id, {
      state: gameState,
      occupants,
      conditions: getWorldConditions(gameState),
    });

    if (!outcome.changed) {
      // Only reachable if somebody stands where a barrier would close — the
      // maps are validated so nobody can. Say something rather than nothing.
      const name = lever.name || 'it';
      this.startDialogue([`${name[0].toUpperCase()}${name.slice(1)} will not move while someone is in the way.`]);
      return;
    }

    this.syncBarriers({ animate: [...outcome.opened, ...outcome.closed] });
    // A valve with no current reaching it says so — the clue that another
    // valve upstream has to be turned first.
    const said = outcome.dry
      ? lever.dry
      : lever.says && lever.says[outcome.position];
    // In the dialogue box rather than a toast: these say what the current
    // did, which is the puzzle's whole feedback, and a toast is one short line.
    this.startDialogue([said || `You turn ${lever.name || 'the lever'}.`]);
  }

  /**
   * The player finished a step on a root switch.
   *
   * PuzzleSystem decides what moves; this reports who is standing where so a
   * hedge can never grow through a person, and then narrates it. The switch
   * CLAIMS the step (see `onPlayerStep`), so pressing one and being spotted can
   * never happen on the same tile.
   *
   * @returns {boolean} true if a switch was pressed
   */
  checkForSwitch(x, y) {
    const entry = getSwitchAt(this.map.definition, x, y);
    if (!entry) return false;

    const occupants = [
      { x: this.player.tileX, y: this.player.tileY },
      ...this.npcManager.npcs.map((npc) => ({ x: npc.tileX, y: npc.tileY })),
    ];

    const outcome = pressSwitch(this.map.definition, entry.id, { state: gameState, occupants });
    if (!outcome.changed) {
      // Only reachable if something is standing where a hedge wants to grow,
      // which the map tests rule out. Say something rather than nothing.
      this.showToast('The roots strain, but nothing moves.');
      return true;
    }

    this.syncBarriers({ animate: [outcome.retracted, outcome.extended].filter(Boolean) });
    this.showToast(this.describeSwitch(outcome));
    return true;
  }

  /** "The east hedge draws back — the west hedge grows across." */
  describeSwitch(outcome) {
    const name = (id) => getBarrier(this.map.definition, id)?.name || 'a hedge';
    const parts = [];
    if (outcome.retracted) parts.push(`${name(outcome.retracted)} draws back`);
    if (outcome.extended) parts.push(`${name(outcome.extended)} grows across`);
    return `${parts.join(' — ')}.`;
  }

  /**
   * A line of text that fades away on its own.
   *
   * Deliberately NOT the dialogue box: pressing a switch should not stop the
   * player walking, and a box that had to be dismissed every time would make
   * experimenting with the puzzle a chore.
   */
  showToast(text) {
    this.clearToast();

    const label = this.add
      .text(GAME_WIDTH / 2, 56, text, { ...TEXT_STYLES.body, fontSize: '12px' })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(DEPTHS.ui);

    const background = this.add
      .rectangle(GAME_WIDTH / 2, 56, label.width + 24, 24, COLORS.ink, 0.85)
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(DEPTHS.ui)
      .setStrokeStyle(2, COLORS.good, 0.9);

    this.toast = this.add.container(0, 0, [background, label]).setDepth(DEPTHS.ui);
    this.tweens.add({
      targets: this.toast,
      alpha: 0,
      delay: TOAST_MS,
      duration: 350,
      onComplete: () => this.clearToast(),
    });
  }

  clearToast() {
    if (this.toast) {
      this.tweens.killTweensOf(this.toast);
      this.toast.destroy();
      this.toast = null;
    }
  }

  createPlayer() {
    const start = this.resolveStartTile();

    this.player = new Player(this, start.x, start.y, start.facing);
    this.player.map = this.map;

    // Record the arrival position immediately, so a save taken before the
    // player takes a single step still puts them back in the right place.
    setLocation(this.map.id, start.x, start.y, start.facing);

    this.player.on('step', ({ x, y }) => {
      setLocation(this.map.id, x, y, this.player.facing);
      this.onPlayerStep(x, y);
    });

    this.player.on('turn', ({ facing }) => {
      setLocation(this.map.id, this.player.tileX, this.player.tileY, facing);
    });
  }

  createNpcs() {
    // The NPCs are placed before the player (see create()), so for that one
    // moment there is no player tile to keep them off.
    // Some NPCs come and go with the story — Kestrel waits at the Thornway
    // only once there is a Sigil to compare — so presence reads the same
    // conditions dialogue does.
    this.npcManager = new NpcManager(this, this.map, () => (this.player
      ? { x: this.player.tileX, y: this.player.tileY }
      : null), { conditions: getWorldConditions(gameState) });
  }

  /**
   * Draw a sprite for every ground item that has not been collected yet.
   * "Collected" is a story flag, so a picked-up item stays picked up across
   * map changes and, later, across saves.
   */
  createGroundItems() {
    this.groundItems = new Map();

    for (const entry of this.map.definition.interactables || []) {
      if (entry.type !== 'item') continue;
      if (hasFlag(entry.flag)) continue;

      const sprite = this.add
        .image(
          entry.x * TILE_SIZE + TILE_SIZE / 2,
          (entry.y + 1) * TILE_SIZE,
          ASSET_KEYS.groundItem
        )
        .setOrigin(0.5, 1)
        .setDepth(DEPTHS.decoration);

      this.groundItems.set(`${entry.x},${entry.y}`, { entry, sprite });
    }
  }

  /**
   * Everything that blocks a tile beyond the map's own walls: people standing
   * in the way, and items still lying on the ground (so you have to face one to
   * pick it up, rather than standing on top of it).
   */
  setupCollision() {
    this.player.extraCollision = (x, y) => {
      if (this.npcManager.isTileBlockedByNpc(x, y)) return true;
      if (this.groundItems.has(`${x},${y}`)) return true;
      return false;
    };
  }

  /**
   * Work out which tile the player should start on.
   * Priority: an explicitly named spawn point > a saved position > the map default.
   */
  resolveStartTile() {
    if (this.startData.spawn) {
      return this.map.getSpawnPoint(this.startData.spawn);
    }

    const saved = gameState.location;
    const hasSavedPosition =
      saved.mapId === this.map.id && saved.x !== null && saved.y !== null;

    // The same test a load already applied (RestorePosition.js), against the
    // world as it now stands: walkable with the hedges as they are, and not
    // an NPC's tile or an item's. A second check costs nothing, and it keeps
    // any other way of arriving here just as safe.
    if (hasSavedPosition && isSafeStandingTile(this.map, saved.x, saved.y, gameState)) {
      return { x: saved.x, y: saved.y, facing: saved.facing || 'down' };
    }

    // A saved position that is now inside a wall (because the map was edited)
    // would trap the player, so fall back to the map's default spawn.
    if (hasSavedPosition) {
      console.warn(
        `[World] Saved position (${saved.x}, ${saved.y}) on "${this.map.id}" cannot be ` +
          `stood on. Using the map's default spawn point instead.`
      );
    }

    return this.map.getSpawnPoint('default');
  }

  setupCamera() {
    const camera = this.cameras.main;
    const mapWidth = this.map.pixelWidth;
    const mapHeight = this.map.pixelHeight;

    // Small maps — a one-room house, say — are narrower or shorter than the
    // screen. Phaser would pin them to the top-left and leave a black band down
    // one side, so we widen the camera bounds AROUND the map instead. The
    // camera then has exactly one valid position on that axis: dead centre.
    const boundsX = mapWidth < camera.width ? -(camera.width - mapWidth) / 2 : 0;
    const boundsY = mapHeight < camera.height ? -(camera.height - mapHeight) / 2 : 0;

    // Stop the camera showing the void beyond the edges of the map.
    camera.setBounds(
      boundsX,
      boundsY,
      Math.max(mapWidth, camera.width),
      Math.max(mapHeight, camera.height)
    );

    // `roundPixels` keeps the camera on whole pixels, which stops the tile art
    // from shimmering as it scrolls.
    camera.roundPixels = true;
    camera.startFollow(this.player, true, 0.15, 0.15);

    // Keep the player away from the very edge of the screen.
    camera.setDeadzone(48, 32);
  }

  /** A small location banner that fades away shortly after arriving on a map. */
  createHud() {
    const banner = this.add
      .container(GAME_WIDTH / 2, 26)
      .setScrollFactor(0)
      .setDepth(DEPTHS.ui);

    const label = this.add
      .text(0, 0, this.map.name, {
        ...TEXT_STYLES.heading,
        fontSize: '15px',
      })
      .setOrigin(0.5);

    const background = this.add
      .rectangle(0, 0, label.width + 28, 26, COLORS.ink, 0.82)
      .setOrigin(0.5)
      .setStrokeStyle(2, COLORS.accent, 0.9);

    banner.add([background, label]);

    this.tweens.add({
      targets: banner,
      alpha: 0,
      delay: 1900,
      duration: 500,
      onComplete: () => banner.destroy(),
    });
  }

  createDebugOverlay() {
    this.debug = new DebugOverlay(this, () => {
      const tile = this.map.getTile(this.player.tileX, this.player.tileY);
      const facingTile = this.player.getFacingTile();
      return [
        `map    ${this.map.id} (${this.map.width}x${this.map.height})`,
        `tile   ${this.player.tileX}, ${this.player.tileY}`,
        `on     ${tile ? tile.id : 'none'}`,
        `facing ${this.player.facing} -> ${facingTile.x},${facingTile.y}` +
          ` (${this.player.canEnter(facingTile.x, facingTile.y) ? 'open' : 'blocked'})`,
        `npcs   ${this.npcManager.npcs.length}` +
          `   encounters ${this.encounters.isActive && !this.encounters.disabled ? 'on' : 'off'}` +
          ` ${this.map.getEncounterTableAt(this.player.tileX, this.player.tileY) || this.encounters.tableId || '-'}` +
          ` rate ${this.encounters.rate}` +
          ` cd ${this.encounters.cooldown}`,
        `party  ${describeParty(gameState)}`,
        ...(this.map.barriers.length > 0
          ? [`gates  ${this.map.barriers
            .map((b) => `${b.id}:${this.map.isBarrierClosed(b.id) ? 'shut' : 'open'}`)
            .join(' ')}`]
          : []),
        `fps    ${Math.round(this.game.loop.actualFps)}`,
      ];
    });
  }

  // -------------------------------------------------------------------------
  // Map transitions
  // -------------------------------------------------------------------------

  /**
   * Called each time the player finishes stepping onto a tile.
   * Exits win over encounters: standing in a doorway should always take you
   * through it, never start a fight.
   */
  /**
   * One completed step, at most one thing happens. The order matters:
   *
   *   1. an exit — standing in a doorway always takes you through it
   *   2. a root switch — the tile you are standing on wins over anything that
   *      might notice you standing there, so pressing a switch and being
   *      challenged can never collide on one step
   *   3. a trainer spotting you — being challenged beats being ambushed, so a
   *      wild Aether can never barge in at the moment someone shouts at you
   *   4. a wild encounter
   *
   * Each returns early, so two of these can never fire from one step.
   */
  onPlayerStep(x, y) {
    if (this.isTransitioning) return;

    const exit = this.map.getExitAt(x, y);
    if (exit) {
      this.startTransition(exit);
      return;
    }

    if (this.checkForSwitch(x, y)) return;

    if (this.checkForTrainers(x, y)) return;

    this.checkForEncounter(x, y);
  }

  /**
   * Fade out and load another map.
   *
   * The player's position is stored in GameState BEFORE the scene restarts, so
   * whatever happens next — a save, a reload — the world agrees on where they are.
   */
  startTransition(exit) {
    if (this.isTransitioning) return;
    this.isTransitioning = true;

    // Freeze the world during the fade so nothing moves or triggers twice.
    this.player.inputLocked = true;
    this.player.stopMovement();
    this.npcManager.setAllBusy(true);

    const spawnName = exit.spawn || 'default';
    const target = getMapDefinition(exit.to);
    const spawn = new TileMap(target).getSpawnPoint(spawnName);

    setLocation(exit.to, spawn.x, spawn.y, spawn.facing);

    this.cameras.main.fadeOut(FADE_DURATION, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.restart({ mapId: exit.to, spawn: spawnName });
    });
  }

  // -------------------------------------------------------------------------
  // Trainers
  // -------------------------------------------------------------------------

  /**
   * Has anyone just spotted the player?
   *
   * SightSystem decides who — this only gathers the facts. A trainer is
   * eligible when they are a trainer at all, have not already been beaten, and
   * are standing still; everything else about the moment (dialogue open, a
   * battle running, mid-transition) is checked once, here, before any of them
   * are considered.
   *
   * @returns {boolean} true if a challenge began, so the caller stops
   */
  checkForTrainers(x, y) {
    if (!this.canBeChallenged()) return false;

    const watchers = this.npcManager.npcs
      .filter((npc) => this.isEligibleTrainer(npc))
      .map((npc) => ({
        id: npc.id,
        x: npc.tileX,
        y: npc.tileY,
        facing: npc.facing,
        sightRange: npc.definition.sightRange ?? 0,
        npc,
      }));

    if (watchers.length === 0) return false;

    // Walls, trees and furniture stop a view; so does another person standing
    // in the way. Ground items deliberately do not — a Potion lying in the
    // grass is not a screen.
    const isBlocked = (tileX, tileY) => (
      !this.map.isWalkable(tileX, tileY) || this.npcManager.isTileBlockedByNpc(tileX, tileY)
    );

    const challenge = findChallenger(watchers, { x, y }, isBlocked);
    if (!challenge) return false;

    this.beginTrainerChallenge(challenge.watcher.npc, challenge.distance);
    return true;
  }

  /** True when the moment allows a trainer to start something. */
  canBeChallenged() {
    if (this.isTransitioning || this.isEnteringBattle) return false;
    if (this.trainerChallenge) return false;
    if (this.player.inputLocked) return false;
    if (this.dialogueBox.isOpen) return false;
    if (this.scene.isActive(SCENES.BATTLE)) return false;
    if (this.scene.isActive(SCENES.MENU)) return false;
    if (this.scene.isActive(SCENES.STARTER_SELECT)) return false;
    return true;
  }

  /** True if this NPC is a trainer who would still want a battle. */
  isEligibleTrainer(npc) {
    const trainerId = npc.definition.trainer;
    if (!trainerId) return false;
    if (!getTrainer(trainerId)) return false;
    if (isTrainerDefeated(trainerId)) return false;
    // Mid-step, their tile and their facing are both unreliable.
    if (npc.isMoving) return false;

    return (npc.definition.sightRange ?? 0) >= 1;
  }

  /**
   * The challenge: a "!" over their head, a walk down the lane, then the fight.
   *
   * `this.trainerChallenge` is claimed FIRST and held until the battle is over,
   * which is what stops a second trainer, a second step or an impatient key
   * press starting any of this twice.
   */
  beginTrainerChallenge(npc, distance) {
    if (this.trainerChallenge) return;
    this.trainerChallenge = npc;

    this.player.inputLocked = true;
    this.player.stopMovement();
    this.npcManager.setAllBusy(true);
    npc.halt();

    this.showTrainerAlert(npc);

    this.time.delayedCall(TRAINER_ALERT_MS, () => {
      if (this.trainerChallenge !== npc) return;   // the scene moved on
      this.clearTrainerAlert();

      // They saw the player down an unobstructed line, so walking back along it
      // needs no pathfinding. Stop one tile short — never onto the player.
      npc.walkLine(npc.facing, Math.max(0, distance - 1), () => {
        if (this.trainerChallenge !== npc) return;

        npc.faceTowards(this.player.tileX, this.player.tileY);
        this.player.faceTowards(npc.tileX, npc.tileY);

        const trainer = getTrainer(npc.definition.trainer);
        // Ordinary dialogue, so a trainer can react to the story — Kestrel
        // names the starter they took against the player's.
        this.startDialogue(this.trainerLines(trainer.intro), {
          speaker: getTrainerDisplayName(trainer),
          action: `trainer:${trainer.id}`,
        });
      });
    });
  }

  /** A "!" above a trainer's head. Destroyed as soon as they start walking. */
  showTrainerAlert(npc) {
    this.clearTrainerAlert();
    playSfx(this, 'alert');

    this.trainerAlert = this.add
      .text(npc.x, npc.y - TILE_SIZE - 6, '!', {
        ...TEXT_STYLES.body, fontSize: '20px', color: CSS_COLORS.accent,
      })
      .setOrigin(0.5, 1)
      .setDepth(DEPTHS.overhead);

    this.tweens.add({
      targets: this.trainerAlert,
      y: this.trainerAlert.y - 6,
      duration: 180,
      yoyo: true,
      repeat: 1,
      ease: 'Sine.easeOut',
    });
  }

  clearTrainerAlert() {
    if (this.trainerAlert) {
      this.trainerAlert.destroy();
      this.trainerAlert = null;
    }
  }

  /**
   * Start a trainer battle. The ONE way in — a challenge down a sight lane and
   * walking up to someone and talking to them both end up here, so there is a
   * single pipeline to get right.
   */
  startTrainerBattle(trainerId) {
    const trainer = getTrainer(trainerId);

    if (!trainer || isTrainerDefeated(trainerId)) {
      this.releasePlayer();
      return;
    }

    if (gameState.party.length === 0) {
      this.startDialogue(['You have no creatures to battle with!']);
      return;
    }

    const config = createTrainerBattleConfig(trainerId, gameState.party);
    if (!config) {
      console.error(`[World] Could not build a battle for trainer "${trainerId}".`);
      this.releasePlayer();
      return;
    }

    this.launchBattle(config);
  }

  /**
   * A trainer battle has finished. Beating them is recorded HERE — after the
   * battle scene has finished narrating experience, level-ups, new moves and
   * evolutions — so a trainer is never marked beaten before the win is
   * completely resolved, and never at all if the player lost.
   */
  onTrainerBattleFinished(result) {
    const trainer = getTrainer(result.trainerId);

    if (!trainer) return false;
    // A LOSS marks nothing and awards nothing: the trainer is still standing
    // there, and the Sigil is still theirs.
    if (result.outcome !== BATTLE_RESULT.WIN) return false;

    // Beaten, and any story flags they carry set — Kestrel's opens the
    // Thornway. One pure call, so the rule is tested without a scene.
    const { flagsSet } = recordTrainerVictory(trainer.id, gameState);
    // Story progress, not just another fight: say so in the autosave. It is
    // still ONE pending autosave, written once everything below has played.
    if (flagsSet.length > 0) this.requestAutosave('story');

    // Their last word, then the gate, their exit and any Sigil — all from
    // trainer DATA. Nothing here names Fern or Kestrel.
    this.startDialogue(this.trainerLines(trainer.outro), {
      speaker: getTrainerDisplayName(trainer),
      onDone: () => this.finishTrainerWin(trainer),
    });
    return true;
  }

  /** A trainer's lines, resolved against the story like any dialogue. */
  trainerLines(lines) {
    return resolveDialogue(lines, getWorldConditions(gameState)).pages;
  }

  /**
   * What happens after a beaten trainer's last word, in order: the world
   * catches up with any flags they set (a gate opens while the player
   * watches), a trainer who is leaving walks off, then any Sigil is awarded
   * and control comes back. The player stays frozen throughout, so none of it
   * can be walked away from or saved half-way.
   */
  finishTrainerWin(trainer) {
    // A win can open a barrier two ways: a story flag the trainer sets (Route
    // 2's cordon), or simply being beaten — the Circle Hall's gates and the
    // Circle's Walk follow `trainer:` conditions (Phase 14). Until Phase 14
    // only the first was synced here, so a gate that followed a beaten
    // trainer stayed drawn shut until the map was next loaded.
    this.syncChangedBarriers();

    const npc = this.npcManager.npcs.find((entry) => entry.definition.trainer === trainer.id);

    // A trainer who holds a narrow spot (Kestrel in Route 2's gully) walks
    // back to it rather than standing in the way for the rest of the visit.
    const home = npc?.definition.returnAfterDefeat ? wayHome(npc) : null;
    if (home) {
      npc.walkLine(home.direction, home.steps, () => {
        npc.setFacing(npc.definition.facing);
        this.concludeTrainerWin(trainer);
      });
      return;
    }

    const exit = npc?.definition.exitAfterDefeat;
    if (!npc || !exit) {
      this.concludeTrainerWin(trainer);
      return;
    }

    // Walk off, then fade: if the player happens to be standing in the way,
    // they simply stop short and fade there rather than walking through them.
    npc.walkLine(exit.direction, stepsToLeave(npc, exit), () => {
      this.tweens.add({
        targets: npc,
        alpha: 0,
        duration: 220,
        onComplete: () => {
          this.npcManager.remove(npc);
          this.concludeTrainerWin(trainer);
        },
      });
    });
  }

  /**
   * The very last step of a win: a Sigil, if the trainer carries one — or,
   * once the Champion is beaten (Phase 14), the ending.
   */
  concludeTrainerWin(trainer) {
    if (shouldPlayEnding(gameState)) {
      this.startEnding();
      return;
    }
    this.awardTrainerBadge(trainer);
  }

  /**
   * Send away anyone the story has just made absent — a flag set while they
   * are standing right there (Kestrel, the moment Mistvault's cordon comes
   * down). They walk off along their map entry's `leaveBy` if it has one,
   * then fade. Presence is derived from the story every time a map loads, so
   * nothing about this is saved: next visit they are simply not there.
   */
  dismissAbsentNpcs() {
    const conditions = getWorldConditions(gameState);
    for (const npc of [...this.npcManager.npcs]) {
      if (npc.leaving || isNpcPresent(npc.definition, conditions)) continue;
      npc.leaving = true;

      const fade = () => this.tweens.add({
        targets: npc,
        alpha: 0,
        duration: 220,
        onComplete: () => this.npcManager.remove(npc),
      });
      const way = npc.definition.leaveBy;
      if (way) npc.walkLine(way.direction, way.steps, fade);
      else fade();
    }
  }

  /**
   * Hand over a Leader's Sigil, once.
   *
   * Called only after a WIN, and only once the outro has finished playing — so
   * experience, level-ups, new moves, evolutions and the Leader's own last word
   * are all resolved before the Sigil is real. `awardBadge()` refuses a
   * duplicate on its own, so even a doubled call cannot produce two.
   */
  awardTrainerBadge(trainer) {
    const badge = getBadge(trainer.badge);
    if (!trainer.badge || !badge) {
      this.releasePlayer();
      return;
    }

    const outcome = awardBadge(badge.id, gameState);
    if (!outcome.awarded) {
      this.releasePlayer();
      return;
    }

    // A Sigil can stand a gate open — the Verdant Hall's hedges rest for good
    // once it is won — so the world catches up before control comes back.
    this.syncBarriers({ animate: this.map.barriers.map((b) => b.id) });
    this.showBadgeAward(badge);
  }

  /**
   * The Sigil itself, held up on screen while the message is read.
   *
   * Short and plain on purpose: it is a milestone, not a cut scene. The
   * ordinary dialogue box drives it, which means the ordinary input handling
   * does too — there is no second place that reads the keyboard.
   */
  showBadgeAward(badge) {
    this.cameras.main.flash(240, 255, 255, 255);
    playSfx(this, 'sigil');

    const panel = this.add.container(GAME_WIDTH / 2, 108)
      .setScrollFactor(0)
      .setDepth(DEPTHS.ui);

    // Fully opaque: the world showing faintly through the player's first Sigil
    // made it look like a mistake rather than a moment.
    const background = this.add.rectangle(0, 0, 210, 92, COLORS.ink, 1)
      .setOrigin(0.5)
      .setStrokeStyle(3, badge.color, 1);
    const icon = this.add.image(0, -18, badgeTextureKey(badge.id)).setOrigin(0.5);
    const label = this.add
      .text(0, 22, badge.name.toUpperCase(), { ...TEXT_STYLES.heading, fontSize: '13px' })
      .setOrigin(0.5);

    panel.add([background, icon, label]);
    this.tweens.add({
      targets: icon, scale: { from: 0.4, to: 1 }, duration: 320, ease: 'Back.easeOut',
    });

    this.badgePanel = panel;
    this.startDialogue(
      [
        `You received the ${badge.name}!`,
        badge.description,
        `Proof that ${badge.hall} could not keep you out.`,
      ],
      {
        onDone: () => {
          this.clearBadgePanel();
          this.releasePlayer();
        },
      }
    );
  }

  clearBadgePanel() {
    if (this.badgePanel) {
      this.tweens.killTweensOf(this.badgePanel.list);
      this.badgePanel.destroy();
      this.badgePanel = null;
    }
  }

  // -------------------------------------------------------------------------
  // Wild encounters
  // -------------------------------------------------------------------------

  /**
   * The ONE place a step is offered to the encounter system.
   *
   * This scene reports facts; `EncounterSystem` applies the rules. Every reason
   * an encounter must not happen — dialogue, a menu, a map change, a battle
   * already running — is checked there, so this stays a single call and each
   * completed step produces at most one roll.
   */
  checkForEncounter(x, y) {
    const encounter = this.encounters.step({
      onEncounterTile: this.map.hasEncounters(x, y),
      // Route 2's scree and its thickets are different habitats.
      tableId: this.map.getEncounterTableAt(x, y),
      dialogueOpen: this.dialogueBox.isOpen,
      transitioning: this.isTransitioning,
      battleActive: this.isEnteringBattle || this.scene.isActive(SCENES.BATTLE),
      overlayActive: this.scene.isActive(SCENES.STARTER_SELECT),
      inputLocked: this.player.inputLocked,
    });

    if (!encounter) return;

    this.startWildBattle(encounter);
  }

  /**
   * Drop into a wild battle.
   *
   * The overworld is PAUSED rather than restarted, which is what preserves the
   * map, the exact tile, the facing and everything else for free — there is no
   * "put the player back" code to get wrong.
   */
  startWildBattle(encounter) {
    if (this.isEnteringBattle || this.scene.isActive(SCENES.BATTLE)) return;

    if (gameState.party.length === 0) {
      // Nothing to fight with. Say so rather than opening a battle with no team.
      this.startDialogue([
        'Something rustles in the grass — but you have nothing to send out.',
        'Best find a partner before wading in any deeper.',
      ]);
      return;
    }

    const config = createWildBattleConfig(encounter, gameState.party, {
      metAt: this.map.name,
    });
    if (!config) {
      console.error(
        `[World] Could not build a wild battle for "${encounter.species}".`
      );
      return;
    }

    console.info(
      `[Encounter] ${encounter.species} (level ${encounter.level}) on ${this.map.id}`
    );

    this.isEnteringBattle = true;
    this.player.inputLocked = true;
    this.player.stopMovement();
    this.npcManager.setAllBusy(true);

    // A short cue so an ambush is felt: the screen flashes, then fades into the
    // fight. Both are camera effects, so nothing is left behind to clean up.
    this.cameras.main.flash(ENCOUNTER_FLASH_MS, 255, 255, 255);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FLASH_COMPLETE, () => {
      this.cameras.main.fadeOut(ENCOUNTER_FADE_MS, 0, 0, 0);
      this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
        this.launchBattle(config, { fadeBackIn: true });
      });
    });
  }

  /**
   * Pause the overworld and hand a battle configuration to BattleScene.
   *
   * Wild, scripted and debug battles all come through here, so there is exactly
   * one place that knows how to enter and leave a fight.
   */
  launchBattle(config, { fadeBackIn = false } = {}) {
    this.isEnteringBattle = true;

    this.scene.pause();
    this.scene.launch(SCENES.BATTLE, {
      config,
      onFinished: (result) => {
        this.scene.resume();
        this.isEnteringBattle = false;

        // Whatever the battle was, the challenge that led to it is over. The
        // alert is destroyed rather than dropped, so nothing is left behind.
        this.clearTrainerAlert();
        this.trainerChallenge = null;

        if (fadeBackIn) fadeIn(this);
        this.onBattleFinished(result);
      },
    });
  }

  // -------------------------------------------------------------------------
  // Interaction
  // -------------------------------------------------------------------------

  handleInteract() {
    // A frozen player is mid-cutscene, mid-dialogue or mid-transition. They
    // should not be able to start a conversation on top of whatever is running.
    if (this.player.inputLocked) return;

    const target = findInteractionTarget({
      map: this.map,
      getNpcAt: (x, y) => this.npcManager.getNpcAt(x, y),
      tileX: this.player.tileX,
      tileY: this.player.tileY,
      facing: this.player.facing,
    });

    if (!target) return;

    if (target.kind === 'npc') {
      this.talkTo(target.npc);
      return;
    }

    if (target.kind === 'lever') {
      this.useLever(target.lever);
      return;
    }

    const entry = target.target;
    if (entry.type === 'item') {
      this.pickUpItem(entry);
      return;
    }

    this.showDialogueFor(entry.dialogue, entry.speaker || null);
  }

  talkTo(npc) {
    // Turn to face the player, so conversations never happen back-to-back.
    npc.halt();
    npc.faceTowards(this.player.tileX, this.player.tileY);

    this.showDialogueFor(npc.definition.dialogue, npc.npcName);
  }

  /** Resolve a dialogue definition against the story flags, then show it. */
  showDialogueFor(dialogue, fallbackSpeaker = null) {
    // Story flags PLUS who has been beaten PLUS which Sigils are held, so
    // `when: 'trainer:route1Scout'` and `when: 'badge:verdantSigil'` are both
    // ordinary conditional dialogue and no scene reads either record itself.
    const resolved = resolveDialogue(dialogue, getWorldConditions(gameState));
    if (resolved.pages.length === 0) return;

    this.startDialogue(resolved.pages, {
      speaker: resolved.speaker || fallbackSpeaker,
      // Flags are set when the conversation ENDS, so dialogue that depends on
      // them cannot change halfway through being read.
      setFlags: resolved.setFlags,
      action: resolved.action,
    });
  }

  /** Open the dialogue box and freeze the world until it closes. */
  startDialogue(pages, options = {}) {
    this.player.inputLocked = true;
    this.player.stopMovement();
    this.npcManager.setAllBusy(true);

    // Remembered so an ACTION can answer in the same voice that triggered it.
    // That is what lets a second Mender's Hall be pure data: `healAtMender()`
    // speaks as whoever the player is talking to, not as a name in the code.
    this.lastSpeaker = options.speaker || null;

    this.dialogueBox.show(pages, {
      speaker: options.speaker || null,
      onComplete: () => {
        const flags = options.setFlags || [];
        for (const flag of flags) setFlag(flag);

        // A flag can open a gate — Route 1's warden sets one — so the world has
        // to catch up before the player is handed back control. Story progress
        // is also worth an autosave.
        if (flags.length > 0) {
          this.syncBarriers({ animate: this.map.barriers.map((b) => b.id) });
          this.dismissAbsentNpcs();
          this.requestAutosave('story');
        }

        // An action runs INSTEAD of handing control back, because it usually
        // opens something of its own (a chooser, a battle) that will return
        // control when it finishes.
        if (options.action) {
          this.runDialogueAction(options.action);
          return;
        }

        if (options.onDone) {
          options.onDone();
          return;
        }

        // Do not hand control back mid-transition, or the player could walk
        // away from a doorway they are already going through.
        if (!this.isTransitioning) {
          this.player.inputLocked = false;
          this.npcManager.setAllBusy(false);
        }
      },
    });
  }

  /**
   * Run an `action` declared in dialogue data.
   *
   * This is the seam between CONTENT and CODE: a map file says
   * `action: 'starterSelect'` and this decides what that means. Phase 4 adds
   * battle actions here in the same way.
   */
  runDialogueAction(action) {
    switch (action) {
      case 'starterSelect':
        this.openStarterSelect();
        break;

      case 'practiceBattle':
        this.startScriptedBattle('lodgePractice');
        break;

      case 'practiceBattleDouble':
        this.startScriptedBattle('lodgePracticeDouble');
        break;

      case 'blackoutTravel':
        this.travelToRecovery();
        break;

      case 'heal':
        this.healAtMender();
        break;

      case 'resetPuzzle':
        this.resetMapPuzzle();
        break;

      case 'storage':
        // A Mender's Hall storage terminal (Phase 13).
        this.openMenu({ mode: 'storage' });
        break;

      default:
        // Parameterised actions look like 'shop:emberhollowSupplyPost', so a
        // new shop is a data change with no code behind it.
        if (action.startsWith('shop:')) {
          this.openShop(action.slice('shop:'.length));
          return;
        }
        if (action.startsWith('trainer:')) {
          this.startTrainerBattle(action.slice('trainer:'.length));
          return;
        }

        console.warn(
          `[World] Dialogue asked for unknown action "${action}". ` +
            `Add it to runDialogueAction() in WorldScene.`
        );
        this.releasePlayer();
    }
  }

  /** Hand control back to the player after a dialogue or event finishes. */
  releasePlayer() {
    if (this.isTransitioning) return;

    // Drop any key press still in flight. Without this, the press that closed
    // a battle or a chooser would immediately count as "interact" and re-open
    // the dialogue of whoever the player happens to be standing in front of.
    this.controls.clearPending();

    this.player.inputLocked = false;
    this.npcManager.setAllBusy(false);
  }

  /**
   * True when a save made right now would capture the game faithfully:
   * nothing half-finished that a load could not put back together.
   *
   * Saves never happen mid-battle, mid-dialogue, mid-map-change, while a
   * trainer is walking over, while a Sigil is being presented, or during a
   * blackout. The pause menu offers Save only when this is true, and the
   * autosave waits for it.
   */
  isSafeToSave() {
    if (this.isTransitioning || this.isEnteringBattle) return false;
    if (this.trainerChallenge || this.trainerAlert) return false;
    if (this.badgePanel || this.blackoutRecovery || this.endingRunning) return false;
    if (!this.dialogueBox || this.dialogueBox.isOpen) return false;
    if (this.scene.isActive(SCENES.BATTLE) || this.scene.isActive(SCENES.STARTER_SELECT)) return false;
    return true;
  }

  // -------------------------------------------------------------------------
  // Autosave
  // -------------------------------------------------------------------------

  /**
   * Ask for an autosave at the next safe moment.
   *
   * Checkpoints call this — arriving on a map, a battle fully over, healing,
   * story progress, a shop visit, a starter, an item picked up. None of them
   * saves on the spot, because at that moment a dialogue or an award is
   * usually still running. `flushAutosave()` waits for the world to settle.
   */
  requestAutosave(reason) {
    this.autosavePending = reason;
  }

  /**
   * Write the pending autosave, if the world is in a state worth saving.
   *
   * Never mid-battle, mid-dialogue, mid-map-change, mid-step, while a trainer
   * is walking over or a Sigil is on screen: `isSafeToSave()` and a free,
   * standing player cover all of those. Called every frame; almost always it
   * has nothing to do.
   */
  flushAutosave() {
    if (!this.autosavePending) return;
    if (!this.isSafeToSave() || this.player.inputLocked || this.player.isMoving) return;

    const reason = this.autosavePending;
    this.autosavePending = null;
    this.writeAutosave(reason);
  }

  /** Write the autosave slot now, and say so — or say why not. */
  writeAutosave(reason) {
    const result = saveToSlot('autosave', gameState);

    // Read-only, for the console and the browser test suite.
    if (typeof window !== 'undefined') {
      window.__autosaves = (window.__autosaves || 0) + (result.ok ? 1 : 0);
      window.__lastAutosave = {
        reason, ok: result.ok, failure: result.reason, bytes: result.bytes,
        durationMs: result.durationMs, mapId: gameState.location.mapId,
      };
    }

    if (result.ok) {
      console.info(`[Save] Autosaved (${reason}, ${result.bytes} bytes, ${result.durationMs.toFixed(1)} ms).`);
      this.showAutosaveNote('Autosaved');
      return;
    }

    console.warn(`[Save] Autosave skipped (${reason}): ${result.message}`);
    if (result.reason === 'newerSave') {
      // Protecting a newer game's save is right, but the player should know
      // their progress is not being kept — once, not on every doorway.
      if (!warnedAutosaveBlocked) {
        warnedAutosaveBlocked = true;
        this.showAutosaveNote('Autosave off: slot holds a newer save');
      }
      return;
    }
    this.showAutosaveNote('Autosave failed');
  }

  /**
   * A small note in the corner that fades away. Deliberately quiet: saving
   * should be reassuring, not an interruption, so it never takes input.
   */
  showAutosaveNote(message) {
    this.clearAutosaveNote();

    const note = this.add
      .text(GAME_WIDTH - 8, 8, message, {
        ...TEXT_STYLES.small,
        fontSize: '10px',
        color: CSS_COLORS.parchment,
        backgroundColor: '#1b2230cc',
        padding: { x: 6, y: 3 },
      })
      .setOrigin(1, 0)
      .setScrollFactor(0)
      .setDepth(DEPTHS.ui)
      .setAlpha(0);

    this.autosaveNote = note;
    this.tweens.add({
      targets: note,
      alpha: { from: 0, to: 1 },
      duration: 160,
      hold: AUTOSAVE_NOTE_MS,
      yoyo: true,
      onComplete: () => this.clearAutosaveNote(),
    });
  }

  clearAutosaveNote() {
    if (this.autosaveNote) {
      this.tweens.killTweensOf(this.autosaveNote);
      this.autosaveNote.destroy();
      this.autosaveNote = null;
    }
  }

  /** True when pressing Cancel should open the pause menu. */
  canOpenMenu() {
    if (this.isTransitioning || this.isEnteringBattle) return false;
    if (this.player.inputLocked) return false;
    if (this.dialogueBox.isOpen) return false;
    return !this.scene.isActive(SCENES.MENU) && !this.scene.isActive(SCENES.BATTLE);
  }

  /**
   * Open the pause menu — party, index and storage — over a paused overworld.
   *
   * Paused rather than restarted, exactly like a battle, so the map, the tile
   * and the facing are untouched. `releasePlayer()` drops the key press that
   * closed the menu, so it cannot also count as "talk to whoever is in front
   * of me".
   */
  openMenu(options = {}) {
    this.player.inputLocked = true;
    this.player.stopMovement();
    this.npcManager.setAllBusy(true);

    this.scene.pause();
    this.scene.launch(SCENES.MENU, {
      ...options,
      onFinished: () => {
        this.scene.resume();
        // Coins and the bag change hands at a shop counter; Aethers move
        // between the party and storage at a terminal.
        if (options.mode === 'shop') this.requestAutosave('shop');
        if (options.mode === 'storage') this.requestAutosave('storage');
        this.releasePlayer();
      },
    });
  }

  /**
   * Open the starter chooser as an overlay scene.
   * The world keeps running underneath but the player stays frozen, so their
   * position and the Lodge behind them are exactly as they left them.
   */
  openStarterSelect() {
    if (hasFlag(STARTER_FLAG)) {
      // Already has one; nothing to choose. Should not happen — Wick's dialogue
      // branches on the same flag — but a duplicate starter would be a real bug.
      this.releasePlayer();
      return;
    }

    // PAUSE the overworld while the chooser is up. Without this the overworld
    // keeps reading the keyboard underneath the overlay, so the same key press
    // that confirms a choice also re-triggers "talk to the NPC in front of you"
    // — leaving a stray dialogue box open behind the chooser.
    this.scene.pause();

    this.scene.launch(SCENES.STARTER_SELECT, {
      onFinished: (speciesId) => {
        this.scene.resume();

        if (speciesId) {
          this.requestAutosave('starter');
          const species = getSpecies(speciesId);
          // Wick's closing line, shown once the chooser has closed.
          this.startDialogue(
            [
              `${species.name} and you are partners now.`,
              'Take good care of each other out there, Warden.',
            ],
            { speaker: 'Prof. Wick' }
          );
          return;
        }
        this.releasePlayer();
      },
    });
  }

  /**
   * Launch a scripted battle described in `src/data/battles.js`.
   *
   * Like the starter chooser, the battle runs as an overlay with the overworld
   * PAUSED underneath, so the player's position, facing and the map behind them
   * are exactly as they left them when it ends.
   */
  startScriptedBattle(battleId) {
    const definition = getScriptedBattle(battleId);

    if (!definition) {
      this.releasePlayer();
      return;
    }

    if (gameState.party.length === 0) {
      this.startDialogue(['You have no creatures to battle with!']);
      return;
    }

    // Build the opponent's team fresh each time, so a repeated practice battle
    // always starts from full health.
    const opponentParty = definition.party
      .map((entry) => createCreature(entry.species, entry.level))
      .filter(Boolean);

    if (opponentParty.length === 0) {
      console.error(`[World] Scripted battle "${battleId}" produced no opponents.`);
      this.releasePlayer();
      return;
    }

    this.launchBattle({
      playerParty: gameState.party,
      opponentParty,
      battleType: definition.battleType,
      opponentName: definition.opponentName,
      canRun: definition.canRun,
      awardExperience: definition.awardExperience,
      rewardMoney: definition.rewardMoney,
      blackoutOnDefeat: definition.blackoutOnDefeat,
    });
  }

  /**
   * Tidy up after a battle.
   *
   * Losing does NOT yet warp the player to a Mender's Hall — that blackout flow
   * belongs with the healing centre in Phase 7. For now the party is revived to
   * one HP each so the game stays playable, and the result is reported plainly.
   */
  onBattleFinished(result) {
    // Every battle ends in something worth keeping — experience, a capture,
    // a beaten trainer, a Sigil, or a blackout. The autosave waits until all
    // of it has been narrated and the player is back in control.
    this.requestAutosave('battle');

    // Renew the safe steps whatever the outcome. The player is usually standing
    // in the same patch of grass they were ambushed in, and walking out of one
    // fight straight into another reads as a bug rather than bad luck. Harmless
    // indoors, where the encounter system is inactive anyway.
    this.encounters.applyCooldown();

    // A trainer win is recorded and narrated here; anything else falls through
    // to the ordinary handling below.
    if (this.onTrainerBattleFinished(result)) return;

    if (result.outcome === BATTLE_RESULT.LOSS) {
      // The BATTLE decides whether losing has consequences, not this scene and
      // not the name of whoever you were fighting.
      if (result.blackoutOnDefeat) {
        // A trainer who has something to say about winning says it first —
        // Kestrel promises to wait for the rematch — then the ordinary
        // blackout runs. Nothing is recorded: they are not beaten.
        const winner = result.trainerId ? getTrainer(result.trainerId) : null;
        if (winner && winner.victoryLines) {
          this.startDialogue(this.trainerLines(winner.victoryLines), {
            speaker: getTrainerDisplayName(winner),
            onDone: () => this.startBlackout(),
          });
          return;
        }
        this.startBlackout();
        return;
      }

      // A consequence-free defeat — a practice bout. Everyone is patched up on
      // the spot, because leaving the player with a fainted party and no
      // penalty would just strand them.
      healParty(gameState);
      this.startDialogue([
        'Bly waves it off and sets your Aethers right again.',
        '"Nothing lost. Come back whenever you want another go."',
      ]);
      return;
    }

    this.releasePlayer();
  }

  // -------------------------------------------------------------------------
  // The ending (Phase 14)
  // -------------------------------------------------------------------------

  /**
   * Play the ending, then the credits, then set the player down on the Aerie.
   *
   * Runs once: EndingSystem refuses to begin it a second time, and
   * `endingRunning` stops a doubled call. The autosave written FIRST, while
   * the ending is still owed, is the resume point — close the game during
   * the credits and Continue comes straight back here and plays them again.
   * Nothing else saves until the player is standing on the Aerie, where
   * arriving writes the post-story autosave.
   */
  startEnding() {
    if (this.endingRunning || !shouldPlayEnding(gameState)) return;
    this.endingRunning = true;

    this.player.inputLocked = true;
    this.player.stopMovement();
    this.npcManager.setAllBusy(true);

    this.autosavePending = null;
    this.writeAutosave('ending');

    const pages = buildEndingPages(gameState);
    const credits = buildCredits(gameState);
    const partner = findPartner(gameState);
    beginEnding(gameState);
    console.info('[Story] The Champion is beaten: the ending begins.');

    this.scene.pause();
    this.scene.launch(SCENES.ENDING, {
      pages,
      partnerSpecies: partner ? partner.speciesId : null,
      onFinished: () => {
        this.scene.launch(SCENES.CREDITS, {
          credits,
          onFinished: () => {
            this.scene.resume();
            this.travelAfterCredits();
          },
        });
      },
    });
  }

  /** Carry the player out onto the Aerie once the credits are over. */
  travelAfterCredits() {
    const { mapId, spawn } = POST_STORY_DESTINATION;
    this.isTransitioning = true;

    const point = new TileMap(getMapDefinition(mapId)).getSpawnPoint(spawn);
    setLocation(mapId, point.x, point.y, point.facing);

    this.cameras.main.fadeOut(FADE_DURATION, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.restart({ mapId, spawn, arrival: 'postStory' });
    });
  }

  /**
   * The Mender restores the party, and this becomes where you wake up.
   *
   * HealingSystem does the healing on the EXISTING creatures — nothing is
   * rebuilt, so instance ids, nicknames, levels, experience, learned moves and
   * met locations all survive untouched. It is free: Wardens look after each
   * other, and the sign in the Hall says so.
   */
  healAtMender() {
    const outcome = healParty(gameState);
    if (gameState.party.length > 0) playSfx(this, 'heal');
    this.requestAutosave('heal');

    // Healing here makes this your recovery point. Every future Mender's Hall
    // does the same, which is all it takes for blackout to send you to the
    // nearest one — the blackout code never learns about individual maps.
    setRecoveryPoint(this.map.id, 'default');

    // Whoever the player is talking to keeps talking. Emberhollow's Ines and
    // Thistlewood's Rell share every line below without either being named
    // here — which is the point: a third Hall needs no code either.
    const speaker = this.lastSpeaker;

    if (gameState.party.length === 0) {
      this.startDialogue([
        '"Bring me an Aether and I will set it right."',
        '"Come back when you have someone walking beside you."',
      ], { speaker });
      return;
    }

    const lines = outcome.healed > 0
      ? [
        '"Let me see them..."',
        'Your Aethers are fully restored — health, energy and all.',
        '"There. Rest here any time, and I will be your way back if things go badly."',
      ]
      : [
        '"Let me see them... ah, they are already in fine shape."',
        '"Rest here any time. I will be your way back if things go badly."',
      ];

    this.startDialogue(lines, { speaker });
  }

  /**
   * Put this map's hedges back to how they were found.
   *
   * The Verdant Hall's reset root. The puzzle cannot get stuck — every switch
   * stands on the walkway, which is always connected to the door — so this is
   * a convenience for a player who has tangled things, not a rescue.
   */
  resetMapPuzzle() {
    const moved = resetPuzzle(this.map.definition, { state: gameState });
    if (moved > 0) {
      this.syncBarriers({ animate: this.map.barriers.map((b) => b.id) });
    }
    this.releasePlayer();
  }

  /** Open a shop, described in src/data/shops.js, over a paused overworld. */
  openShop(shopId) {
    if (!getShop(shopId)) {
      this.releasePlayer();
      return;
    }

    this.openMenu({ mode: 'shop', shopId });
  }

  /**
   * Black out: lose some coins, wake up restored at the recovery point.
   *
   * BlackoutSystem decides everything — how much is lost, who is healed, where
   * you wake up. This method only narrates it and drives the map change, and it
   * runs the rule EXACTLY ONCE, so a retried transition cannot charge twice.
   */
  startBlackout() {
    const outcome = resolveBlackout(gameState);

    console.info(
      `[Blackout] lost ${outcome.lost} coins, waking at ` +
        `${outcome.recovery.mapId}:${outcome.recovery.spawn}`
    );

    this.blackoutRecovery = outcome.recovery;
    this.startDialogue(outcome.messages, { action: 'blackoutTravel' });
  }

  /** Carry the blacked-out player to their recovery point. */
  travelToRecovery() {
    const recovery = this.blackoutRecovery || { mapId: 'mendersHall', spawn: 'default' };
    this.blackoutRecovery = null;

    // Reuse the ordinary door machinery rather than inventing a second way to
    // change maps: fade out, record where we are going, restart the scene.
    this.isTransitioning = true;
    this.player.inputLocked = true;
    this.player.stopMovement();
    this.npcManager.setAllBusy(true);

    const target = getMapDefinition(recovery.mapId);
    const spawn = new TileMap(target).getSpawnPoint(recovery.spawn);
    setLocation(recovery.mapId, spawn.x, spawn.y, spawn.facing);

    this.cameras.main.fadeOut(FADE_DURATION, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.restart({
        mapId: recovery.mapId,
        spawn: recovery.spawn,
        arrival: 'blackout',
      });
    });
  }

  pickUpItem(entry) {
    const item = getItem(entry.item);
    if (!item) return;

    const quantity = entry.quantity || 1;
    addItem(gameState.inventory, entry.item, quantity);
    setFlag(entry.flag);
    this.requestAutosave('item');

    // Remove it from the world: the sprite goes, and so does the collision that
    // stopped the player walking onto the tile.
    const key = `${entry.x},${entry.y}`;
    const placed = this.groundItems.get(key);
    if (placed) {
      placed.sprite.destroy();
      this.groundItems.delete(key);
    }

    const amount = quantity > 1 ? ` x${quantity}` : '';
    this.startDialogue([`You found ${item.name}${amount}!`, item.description]);
  }

  // -------------------------------------------------------------------------
  // Frame loop
  // -------------------------------------------------------------------------

  update(time, delta) {
    // Weather keeps blowing whatever else is happening — it is only a picture.
    if (this.weather) this.weather.update(delta);

    if (this.controls.justPressed('debug')) {
      this.debug.toggle();
    }

    // Dialogue takes priority over everything: while it is open it consumes the
    // input and the player stays put.
    if (this.dialogueBox.update(this.controls)) {
      this.debug.update();
      return;
    }

    // Before the player moves on: a step that has just finished has already
    // recorded where they stand, so this frame is a clean point to save.
    this.flushAutosave();

    if (!this.isTransitioning && this.controls.justPressed('confirm')) {
      this.handleInteract();
    }

    // The pause menu. Only when the player is actually in control — never
    // mid-transition, mid-cutscene or with something else on screen.
    if (this.canOpenMenu() && this.controls.justPressed('cancel')) {
      this.openMenu({ canSave: this.isSafeToSave() });
      return;
    }

    this.player.update(this.controls);
    this.debug.update();
  }

  cleanup() {
    this.clearTrainerAlert();
    this.clearToast();
    this.clearBadgePanel();
    this.clearAutosaveNote();
    this.autosavePending = null;
    this.trainerChallenge = null;

    if (this.mapRenderer) {
      this.mapRenderer.destroy();
      this.mapRenderer = null;
    }
    if (this.weather) {
      this.weather.destroy();
      this.weather = null;
    }
    if (this.npcManager) {
      this.npcManager.destroy();
      this.npcManager = null;
    }
    if (this.dialogueBox) {
      this.dialogueBox.destroy();
      this.dialogueBox = null;
    }
    if (this.groundItems) {
      this.groundItems.clear();
    }
  }
}
