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
 *
 * Changing maps restarts this same scene with new data. Everything created here
 * is released in `cleanup()`, so that can happen as often as the player likes.
 */

import Phaser from 'phaser';
import {
  SCENES,
  GAME_WIDTH,
  COLORS,
  TEXT_STYLES,
  DEPTHS,
  TILE_SIZE,
  FADE_DURATION,
} from '../config/gameConfig.js';
import { InputManager } from '../core/InputManager.js';
import { TileMap } from '../systems/TileMap.js';
import { MapRenderer } from '../systems/MapRenderer.js';
import { NpcManager } from '../systems/NpcManager.js';
import { EncounterSystem } from '../systems/EncounterSystem.js';
import { findInteractionTarget } from '../systems/InteractionSystem.js';
import { resolveDialogue } from '../systems/DialogueResolver.js';
import { addItem } from '../systems/InventorySystem.js';
import { getItem } from '../data/items.js';
import { getMapDefinition } from '../data/maps/index.js';
import { ASSET_KEYS } from '../config/assets.js';
import { Player } from '../entities/Player.js';
import { DebugOverlay } from '../ui/DebugOverlay.js';
import { DialogueBox } from '../ui/DialogueBox.js';
import { gameState, setLocation, hasFlag, setFlag } from '../core/GameState.js';
import { fadeIn } from '../utils/transitions.js';

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
  }

  create() {
    this.controls = new InputManager(this);

    this.loadMap();
    this.createPlayer();
    this.createNpcs();
    this.createGroundItems();
    this.setupCollision();
    this.setupCamera();
    this.createHud();
    this.dialogueBox = new DialogueBox(this);
    this.createDebugOverlay();

    this.encounters = new EncounterSystem(this.map.encounterTableId);

    // Release everything this scene created when it shuts down. Without this,
    // moving between maps would leak render textures, NPCs and timers.
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.cleanup());

    fadeIn(this);
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
    this.mapRenderer = new MapRenderer(this, this.map);

    this.cameras.main.setBackgroundColor(COLORS.ink);
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
    this.npcManager = new NpcManager(this, this.map, () => ({
      x: this.player.tileX,
      y: this.player.tileY,
    }));
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

    if (hasSavedPosition && this.map.isWalkable(saved.x, saved.y)) {
      return { x: saved.x, y: saved.y, facing: saved.facing || 'down' };
    }

    // A saved position that is now inside a wall (because the map was edited)
    // would trap the player, so fall back to the map's default spawn.
    if (hasSavedPosition) {
      console.warn(
        `[World] Saved position (${saved.x}, ${saved.y}) on "${this.map.id}" is not ` +
          `walkable any more. Using the map's default spawn point instead.`
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
          `   encounters ${this.encounters.isActive ? 'on' : 'off'}` +
          ` (cd ${this.encounters.cooldown})`,
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
  onPlayerStep(x, y) {
    if (this.isTransitioning) return;

    const exit = this.map.getExitAt(x, y);
    if (exit) {
      this.startTransition(exit);
      return;
    }

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
  // Wild encounters
  // -------------------------------------------------------------------------

  checkForEncounter(x, y) {
    const encounter = this.encounters.step(this.map.hasEncounters(x, y));
    if (!encounter) return;

    // PHASE 2 NOTE: the encounter itself is real — species and level come from
    // this map's table in src/data/encounters.js. What is missing is the battle
    // to hand it to, which arrives in Phase 4. Until then we report it on screen
    // so the system is visible and verifiable.
    console.info(
      `[Encounter] ${encounter.species} (level ${encounter.level}) on ${this.map.id}`
    );

    this.startDialogue(
      [
        'The tall grass rustles!',
        `A wild ${encounter.species} (Lv ${encounter.level}) watches you, then slips away.`,
        '(Battles arrive in Phase 4 — the encounter system itself is live.)',
      ],
      { speaker: null }
    );
  }

  // -------------------------------------------------------------------------
  // Interaction
  // -------------------------------------------------------------------------

  handleInteract() {
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
    const resolved = resolveDialogue(dialogue, gameState.flags);
    if (resolved.pages.length === 0) return;

    this.startDialogue(resolved.pages, {
      speaker: resolved.speaker || fallbackSpeaker,
      // Flags are set when the conversation ENDS, so dialogue that depends on
      // them cannot change halfway through being read.
      setFlags: resolved.setFlags,
    });
  }

  /** Open the dialogue box and freeze the world until it closes. */
  startDialogue(pages, options = {}) {
    this.player.inputLocked = true;
    this.player.stopMovement();
    this.npcManager.setAllBusy(true);

    this.dialogueBox.show(pages, {
      speaker: options.speaker || null,
      onComplete: () => {
        for (const flag of options.setFlags || []) setFlag(flag);

        // Do not hand control back mid-transition, or the player could walk
        // away from a doorway they are already going through.
        if (!this.isTransitioning) {
          this.player.inputLocked = false;
          this.npcManager.setAllBusy(false);
        }
      },
    });
  }

  pickUpItem(entry) {
    const item = getItem(entry.item);
    if (!item) return;

    const quantity = entry.quantity || 1;
    addItem(gameState.inventory, entry.item, quantity);
    setFlag(entry.flag);

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

  update() {
    if (this.controls.justPressed('debug')) {
      this.debug.toggle();
    }

    // Dialogue takes priority over everything: while it is open it consumes the
    // input and the player stays put.
    if (this.dialogueBox.update(this.controls)) {
      this.debug.update();
      return;
    }

    if (!this.isTransitioning && this.controls.justPressed('confirm')) {
      this.handleInteract();
    }

    this.player.update(this.controls);
    this.debug.update();
  }

  cleanup() {
    if (this.mapRenderer) {
      this.mapRenderer.destroy();
      this.mapRenderer = null;
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
