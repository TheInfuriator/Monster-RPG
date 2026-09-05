/**
 * Player.js
 * ----------------------------------------------------------------------------
 * The player character.
 *
 * MOVEMENT MODEL: grid-based, like the classic games this is inspired by.
 * The player always occupies exactly one tile. Pressing a direction slides them
 * smoothly to the next tile over a fixed duration; they cannot stop halfway.
 *
 * Why not free physics movement? Because grid movement makes collision, talking
 * to NPCs, standing on doors, and step-based wild encounters all trivially
 * simple and completely reliable. It is far less code and far fewer bugs.
 *
 * The player emits two events other systems can listen to:
 *   'step'  ({ x, y, tile })  finished moving onto a new tile
 *   'turn'  ({ facing })      changed facing without moving
 */

import Phaser from 'phaser';
import { TILE_SIZE, DEPTHS } from '../config/gameConfig.js';
import { ASSET_KEYS, PLAYER_FRAME, PLAYER_FRAMES, PLAYER_ANIMS } from '../config/assets.js';
import { DIRECTION_VECTORS } from '../config/controls.js';
import { MOVEMENT } from '../config/balance.js';

export class Player extends Phaser.GameObjects.Sprite {
  /**
   * @param {Phaser.Scene} scene
   * @param {number} tileX  starting tile column
   * @param {number} tileY  starting tile row
   * @param {string} facing 'up' | 'down' | 'left' | 'right'
   */
  constructor(scene, tileX, tileY, facing = 'down') {
    super(scene, 0, 0, ASSET_KEYS.player, PLAYER_FRAMES[facing].idle);

    this.tileX = tileX;
    this.tileY = tileY;
    this.facing = facing;

    /** True while sliding between two tiles. Blocks new input until finished. */
    this.isMoving = false;
    /** Set while the player is turning on the spot. */
    this.isTurning = false;
    /** Set to true to ignore all input (during dialogue, battles, cutscenes). */
    this.inputLocked = false;

    /**
     * The map we ask about walkability. Assigned by the scene, because the
     * player should not have to know how maps are loaded.
     * @type {import('../systems/TileMap.js').TileMap | null}
     */
    this.map = null;

    // Feet-on-tile alignment: the sprite's bottom edge sits `footPadding`
    // pixels below the bottom of the tile it stands on.
    this.setOrigin(0.5, 1);
    this.setDepth(DEPTHS.entities);
    this.snapToTile();

    scene.add.existing(this);
  }

  // -------------------------------------------------------------------------
  // Position helpers
  // -------------------------------------------------------------------------

  /** Pixel position of the centre-bottom of a given tile. */
  static tileToPixel(tileX, tileY) {
    return {
      x: tileX * TILE_SIZE + TILE_SIZE / 2,
      y: (tileY + 1) * TILE_SIZE + PLAYER_FRAME.footPadding,
    };
  }

  /** Move the sprite instantly to match its tile coordinates. */
  snapToTile() {
    const { x, y } = Player.tileToPixel(this.tileX, this.tileY);
    this.setPosition(x, y);
  }

  /** Teleport to a tile (used by map transitions and debug tools). */
  placeAt(tileX, tileY, facing = this.facing) {
    this.stopMovement();
    this.tileX = tileX;
    this.tileY = tileY;
    this.setFacing(facing);
    this.snapToTile();
  }

  /** The tile directly in front of the player — what they would interact with. */
  getFacingTile() {
    const vector = DIRECTION_VECTORS[this.facing];
    return { x: this.tileX + vector.x, y: this.tileY + vector.y };
  }

  // -------------------------------------------------------------------------
  // Facing and animation
  // -------------------------------------------------------------------------

  setFacing(facing) {
    if (!DIRECTION_VECTORS[facing]) return;
    this.facing = facing;
    this.anims.stop();
    this.setFrame(PLAYER_FRAMES[facing].idle);
  }

  playWalkAnimation(facing, running) {
    const key = PLAYER_ANIMS[facing];
    // `true` = ignore the request if this animation is already playing, so the
    // cycle does not restart on every frame and look like a stutter.
    this.anims.play({ key, timeScale: running ? 1.6 : 1 }, true);
  }

  // -------------------------------------------------------------------------
  // Movement
  // -------------------------------------------------------------------------

  /** True if the player can currently accept a movement command. */
  get canAcceptInput() {
    return !this.isMoving && !this.isTurning && !this.inputLocked;
  }

  /**
   * Ask the player to move or turn in a direction.
   * Turning happens first: if you are not already facing that way, the first
   * press turns you on the spot. This is what lets you face an NPC to talk to
   * them without walking into them.
   *
   * @param {string} direction
   * @param {boolean} running
   * @returns {boolean} true if the request was accepted
   */
  tryMove(direction, running = false) {
    if (!this.canAcceptInput) return false;

    const vector = DIRECTION_VECTORS[direction];
    if (!vector) return false;

    if (this.facing !== direction) {
      this.turnTo(direction);
      return true;
    }

    const targetX = this.tileX + vector.x;
    const targetY = this.tileY + vector.y;

    if (!this.canEnter(targetX, targetY)) {
      // Blocked: keep facing that way and animate briefly so the bump reads as
      // "I tried", rather than the input being silently swallowed.
      this.playWalkAnimation(direction, false);
      this.scene.time.delayedCall(MOVEMENT.turnDelay, () => {
        if (this.active && !this.isMoving) this.setFacing(this.facing);
      });
      return false;
    }

    this.startMove(targetX, targetY, running);
    return true;
  }

  /** Is this tile free to walk onto? */
  canEnter(tileX, tileY) {
    if (!this.map) return false;
    return this.map.isWalkable(tileX, tileY);
  }

  /** Turn on the spot, with a short pause so it does not feel twitchy. */
  turnTo(direction) {
    this.setFacing(direction);
    this.isTurning = true;
    this.emit('turn', { facing: direction });

    this.scene.time.delayedCall(MOVEMENT.turnDelay, () => {
      this.isTurning = false;
    });
  }

  /** Begin the slide to an adjacent tile. */
  startMove(targetX, targetY, running) {
    this.isMoving = true;
    this.playWalkAnimation(this.facing, running);

    const destination = Player.tileToPixel(targetX, targetY);
    const duration = running ? MOVEMENT.runDuration : MOVEMENT.walkDuration;

    this.moveTween = this.scene.tweens.add({
      targets: this,
      x: destination.x,
      y: destination.y,
      duration,
      ease: 'Linear',
      onComplete: () => {
        this.tileX = targetX;
        this.tileY = targetY;
        this.isMoving = false;
        this.moveTween = null;

        this.emit('step', {
          x: this.tileX,
          y: this.tileY,
          tile: this.map ? this.map.getTile(this.tileX, this.tileY) : null,
        });
      },
    });
  }

  /** Cancel any in-progress movement and settle onto the current tile. */
  stopMovement() {
    if (this.moveTween) {
      this.moveTween.stop();
      this.moveTween = null;
    }
    this.isMoving = false;
    this.isTurning = false;
    this.anims.stop();
    this.setFrame(PLAYER_FRAMES[this.facing].idle);
  }

  /**
   * Called every frame by the scene.
   * @param {import('../core/InputManager.js').InputManager} input
   */
  update(input) {
    if (this.inputLocked) {
      if (!this.isMoving) this.stopMovement();
      return;
    }

    if (!this.canAcceptInput) return;

    const direction = input.getHeldDirection();

    if (!direction) {
      // Idle: drop back to the standing frame for the current facing.
      if (this.anims.isPlaying) {
        this.anims.stop();
        this.setFrame(PLAYER_FRAMES[this.facing].idle);
      }
      return;
    }

    this.tryMove(direction, input.isDown('run'));
  }
}

/**
 * Register the four walk animations. Call this once, after the player texture
 * exists (the BootScene does it). Animations are global to the game, not to a
 * scene, so creating them twice would warn — hence the `exists` check.
 *
 * @param {Phaser.Scene} scene
 */
export function createPlayerAnimations(scene) {
  for (const [facing, animKey] of Object.entries(PLAYER_ANIMS)) {
    if (scene.anims.exists(animKey)) continue;

    const frames = PLAYER_FRAMES[facing];
    scene.anims.create({
      key: animKey,
      // idle -> step A -> idle -> step B gives a natural two-beat walk cycle.
      frames: [
        { key: ASSET_KEYS.player, frame: frames.stepA },
        { key: ASSET_KEYS.player, frame: frames.idle },
        { key: ASSET_KEYS.player, frame: frames.stepB },
        { key: ASSET_KEYS.player, frame: frames.idle },
      ],
      frameRate: 8,
      repeat: -1,
    });
  }
}
