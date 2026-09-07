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
import { describeParty } from '../systems/PartySystem.js';
import { getItem } from '../data/items.js';
import { getMapDefinition } from '../data/maps/index.js';
import { ASSET_KEYS } from '../config/assets.js';
import { Player } from '../entities/Player.js';
import { DebugOverlay } from '../ui/DebugOverlay.js';
import { DialogueBox } from '../ui/DialogueBox.js';
import { getSpecies } from '../data/creatures.js';
import { getScriptedBattle } from '../data/battles.js';
import { createCreature } from '../systems/CreatureFactory.js';
import { createWildBattleConfig } from '../systems/WildBattle.js';
import { STARTER_FLAG } from './StarterSelectScene.js';
import { gameState, setLocation, hasFlag, setFlag } from '../core/GameState.js';
import { fadeIn } from '../utils/transitions.js';

/**
 * The wild-encounter cue. Short on purpose: it should read as "something just
 * jumped out", not as a cutscene the player has to sit through.
 */
const ENCOUNTER_FLASH_MS = 160;
const ENCOUNTER_FADE_MS = 260;

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

    // Rate, cooldown and terrain all come from the map's own data — see
    // `encounters` in src/data/encounters.js for the shape.
    this.encounters = new EncounterSystem(this.map.encounterConfig);

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
          `   encounters ${this.encounters.isActive && !this.encounters.disabled ? 'on' : 'off'}` +
          ` ${this.encounters.tableId || '-'}` +
          ` rate ${this.encounters.rate}` +
          ` cd ${this.encounters.cooldown}`,
        `party  ${describeParty(gameState)}`,
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

    const config = createWildBattleConfig(encounter, gameState.party);
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
      action: resolved.action,
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

        // An action runs INSTEAD of handing control back, because it usually
        // opens something of its own (a chooser, a battle) that will return
        // control when it finishes.
        if (options.action) {
          this.runDialogueAction(options.action);
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

      default:
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
  openMenu() {
    this.player.inputLocked = true;
    this.player.stopMovement();
    this.npcManager.setAllBusy(true);

    this.scene.pause();
    this.scene.launch(SCENES.MENU, {
      onFinished: () => {
        this.scene.resume();
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
    // Renew the safe steps whatever the outcome. The player is usually standing
    // in the same patch of grass they were ambushed in, and walking out of one
    // fight straight into another reads as a bug rather than bad luck. Harmless
    // indoors, where the encounter system is inactive anyway.
    this.encounters.applyCooldown();

    const lines = [];

    if (result.outcome === 'loss') {
      for (const creature of gameState.party) {
        if (creature.currentHp <= 0) creature.currentHp = 1;
      }
      lines.push('You scraped your creatures back together.');
      lines.push('(Fainting properly sends you to a Mender\u2019s Hall in a later update.)');
    }

    if (lines.length > 0) {
      this.startDialogue(lines);
      return;
    }

    this.releasePlayer();
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

    // The pause menu. Only when the player is actually in control — never
    // mid-transition, mid-cutscene or with something else on screen.
    if (this.canOpenMenu() && this.controls.justPressed('cancel')) {
      this.openMenu();
      return;
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
