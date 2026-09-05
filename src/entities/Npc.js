/**
 * Npc.js
 * ----------------------------------------------------------------------------
 * A non-player character.
 *
 * NPCs are DATA. A map file describes them and this class brings them to life —
 * so adding a villager never means writing code. See `src/data/maps/` for the
 * shape, and README.md for the full field list.
 *
 * They use the same grid model as the player: an NPC always occupies exactly one
 * tile, and moving means sliding smoothly to the next one.
 *
 * MOVEMENT MODES
 *   'static'     never moves (the default)
 *   'lookAround' turns on the spot now and then
 *   'wander'     strolls around within `wanderRadius` tiles of where it started
 */

import Phaser from 'phaser';
import { TILE_SIZE, DEPTHS } from '../config/gameConfig.js';
import { PLAYER_FRAME, PLAYER_FRAMES, characterTextureKey, characterAnimKey } from '../config/assets.js';
import { DIRECTION_VECTORS, DIRECTIONS } from '../config/controls.js';
import { MOVEMENT } from '../config/balance.js';
import { randomInt, pickRandom } from '../utils/rng.js';

/** How long an NPC waits between wander/look decisions, in milliseconds. */
const WANDER_MIN_DELAY = 1800;
const WANDER_MAX_DELAY = 4200;

/** NPCs amble rather than march, so they move slower than the player walks. */
const NPC_MOVE_DURATION = Math.round(MOVEMENT.walkDuration * 1.5);

export class Npc extends Phaser.GameObjects.Sprite {
  /**
   * @param {Phaser.Scene} scene
   * @param {object} definition an entry from a map's `npcs` array
   */
  constructor(scene, definition) {
    const spriteName = definition.sprite || 'villager';
    const facing = definition.facing || 'down';

    super(scene, 0, 0, characterTextureKey(spriteName), PLAYER_FRAMES[facing].idle);

    this.definition = definition;
    this.id = definition.id;
    this.npcName = definition.name || null;
    this.spriteName = spriteName;

    this.tileX = definition.x;
    this.tileY = definition.y;
    this.facing = facing;

    /** Where this NPC started. Wandering never strays far from here. */
    this.homeX = definition.x;
    this.homeY = definition.y;

    this.movementMode = definition.movement || 'static';
    this.wanderRadius = definition.wanderRadius ?? 2;

    this.isMoving = false;
    /** Set while the player is talking to this NPC, so it stands still. */
    this.isBusy = false;

    /**
     * Assigned by NpcManager: asks the world whether a tile is free.
     * @type {((x: number, y: number) => boolean) | null}
     */
    this.canEnterTile = null;

    this.setOrigin(0.5, 1);
    this.setDepth(DEPTHS.entities);
    this.snapToTile();

    scene.add.existing(this);

    if (this.movementMode !== 'static') this.scheduleNextMove();
  }

  // -------------------------------------------------------------------------
  // Position
  // -------------------------------------------------------------------------

  snapToTile() {
    this.setPosition(
      this.tileX * TILE_SIZE + TILE_SIZE / 2,
      (this.tileY + 1) * TILE_SIZE + PLAYER_FRAME.footPadding
    );
  }

  /** True if this NPC is standing on (or moving onto) the given tile. */
  occupies(x, y) {
    if (this.tileX === x && this.tileY === y) return true;
    // While moving, the destination counts too, so nothing walks into it.
    return this.targetX === x && this.targetY === y;
  }

  // -------------------------------------------------------------------------
  // Facing
  // -------------------------------------------------------------------------

  setFacing(facing) {
    if (!DIRECTION_VECTORS[facing]) return;
    this.facing = facing;
    this.anims.stop();
    this.setFrame(PLAYER_FRAMES[facing].idle);
  }

  /**
   * Turn to look at a tile — used so an NPC faces the player when spoken to.
   * Picks whichever axis the target is furthest away on.
   */
  faceTowards(x, y) {
    const dx = x - this.tileX;
    const dy = y - this.tileY;
    if (dx === 0 && dy === 0) return;

    if (Math.abs(dx) > Math.abs(dy)) {
      this.setFacing(dx > 0 ? 'right' : 'left');
    } else {
      this.setFacing(dy > 0 ? 'down' : 'up');
    }
  }

  // -------------------------------------------------------------------------
  // Autonomous movement
  // -------------------------------------------------------------------------

  scheduleNextMove() {
    this.moveTimer = this.scene.time.delayedCall(
      randomInt(WANDER_MIN_DELAY, WANDER_MAX_DELAY),
      () => {
        this.takeRandomAction();
        // Only queue the next decision if we are still alive and in a scene.
        if (this.active) this.scheduleNextMove();
      }
    );
  }

  takeRandomAction() {
    if (this.isBusy || this.isMoving || !this.active) return;

    const direction = pickRandom(DIRECTIONS);
    if (!direction) return;

    if (this.movementMode === 'lookAround') {
      this.setFacing(direction);
      return;
    }

    const vector = DIRECTION_VECTORS[direction];
    const targetX = this.tileX + vector.x;
    const targetY = this.tileY + vector.y;

    // Stay near home so an NPC never wanders across the whole map.
    const distance =
      Math.abs(targetX - this.homeX) + Math.abs(targetY - this.homeY);
    if (distance > this.wanderRadius) {
      this.setFacing(direction);
      return;
    }

    if (this.canEnterTile && !this.canEnterTile(targetX, targetY)) {
      this.setFacing(direction);
      return;
    }

    this.startMove(direction, targetX, targetY);
  }

  startMove(direction, targetX, targetY) {
    this.setFacing(direction);
    this.isMoving = true;
    this.targetX = targetX;
    this.targetY = targetY;

    this.anims.play(characterAnimKey(this.spriteName, direction), true);

    this.moveTween = this.scene.tweens.add({
      targets: this,
      x: targetX * TILE_SIZE + TILE_SIZE / 2,
      y: (targetY + 1) * TILE_SIZE + PLAYER_FRAME.footPadding,
      duration: NPC_MOVE_DURATION,
      ease: 'Linear',
      onComplete: () => {
        this.tileX = targetX;
        this.tileY = targetY;
        this.targetX = undefined;
        this.targetY = undefined;
        this.isMoving = false;
        this.moveTween = null;
        this.anims.stop();
        this.setFrame(PLAYER_FRAMES[this.facing].idle);
      },
    });
  }

  /** Stop moving immediately — used when the player starts talking. */
  halt() {
    if (this.moveTween) {
      // Finish the step rather than freezing between tiles, so the NPC always
      // ends up cleanly on a tile.
      this.moveTween.complete();
    }
  }

  destroy(fromScene) {
    if (this.moveTimer) this.moveTimer.remove(false);
    if (this.moveTween) this.moveTween.stop();
    super.destroy(fromScene);
  }
}
