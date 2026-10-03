/**
 * MapRenderer.js
 * ----------------------------------------------------------------------------
 * Draws a TileMap into a Phaser scene.
 *
 * This is kept separate from `TileMap.js` on purpose: TileMap knows the RULES
 * (what is walkable, where the spawn points are) and MapRenderer knows how to
 * DRAW it. You can unit test the rules without a browser, and you can change how
 * the game looks without touching gameplay logic.
 *
 * PERFORMANCE NOTE
 * Every ground tile is stamped once into a single RenderTexture rather than
 * created as its own sprite. A 30x24 map is 720 tiles; as sprites that is 720
 * game objects updated every frame, as a RenderTexture it is one. Overhead tiles
 * (tree canopies the player walks behind) get a second RenderTexture on a higher
 * depth layer.
 *
 * BARRIERS ARE THE ONE EXCEPTION. A gate or a hedge that opens and closes
 * cannot be baked into the ground texture, so each of its tiles gets a real
 * sprite drawn just above the ground. Showing and hiding those sprites is
 * driven by exactly the same `TileMap` state that decides whether the tile is
 * walkable, which is what stops the picture and the collision ever disagreeing.
 */

import { getTileByChar } from '../data/tiles.js';
import { TILE_SIZE, DEPTHS } from '../config/gameConfig.js';

export class MapRenderer {
  /**
   * @param {Phaser.Scene} scene
   * @param {import('./TileMap.js').TileMap} map
   */
  constructor(scene, map) {
    this.scene = scene;
    this.map = map;

    this.groundLayer = null;
    this.overheadLayer = null;
    /** One sprite per barrier tile, keyed by barrier id. */
    this.barrierSprites = new Map();
    /** One sprite per lever (its handle), keyed by lever id. Phase 12. */
    this.leverSprites = new Map();
    /** Lit-channel sprites, each with the signal that lights it. Phase 12. */
    this.glowSprites = [];

    this.render();
    this.createBarriers();
    this.createPuzzleSprites();
  }

  /**
   * Levers and glowing channels — created once, then only re-textured or
   * shown and hidden, exactly like barriers, so nothing is allocated when a
   * valve turns.
   */
  createPuzzleSprites() {
    const definition = this.map.definition;
    for (const lever of definition.levers || []) {
      const sprite = this.scene.add
        .image(lever.x * TILE_SIZE, lever.y * TILE_SIZE, `tile-${lever.look}-0`)
        .setOrigin(0, 0)
        .setDepth(DEPTHS.decoration);
      this.leverSprites.set(lever.id, sprite);
    }
    for (const glow of definition.glows || []) {
      const texture = getTileByChar(glow.tile).texture;
      for (const [x, y] of glow.tiles || []) {
        const sprite = this.scene.add
          .image(x * TILE_SIZE, y * TILE_SIZE, texture)
          .setOrigin(0, 0)
          .setDepth(DEPTHS.decoration)
          .setVisible(false);
        this.glowSprites.push({ sprite, signal: glow.signal, when: glow.when });
      }
    }
  }

  /**
   * Show every lever in its position and light every channel the current is
   * running along. Called with what PuzzleSystem says — never decided here.
   * A glow lights on a lever's `signal` or, for one the story switches on
   * for good, a world condition `when`.
   *
   * @param {{ signals: Set<string>, positions: Record<string, string>,
   *           conditions?: Record<string, boolean> }} view
   */
  refreshPuzzle({ signals, positions, conditions = {} }) {
    for (const lever of this.map.definition.levers || []) {
      const sprite = this.leverSprites.get(lever.id);
      const stateId = lever.state || lever.id;
      const index = Math.max(0, lever.positions.indexOf(positions[stateId]));
      if (sprite) sprite.setTexture(`tile-${lever.look}-${index}`);
    }
    for (const { sprite, signal, when } of this.glowSprites) {
      sprite.setVisible(signal ? signals.has(signal) : Boolean(conditions[when]));
    }
  }

  /**
   * Draw a sprite for every tile of every barrier on this map.
   *
   * Created once and then only shown or hidden, so opening and closing a gate
   * never allocates anything and there is nothing to leak.
   */
  createBarriers() {
    for (const barrier of this.map.barriers) {
      const tile = getTileByChar(barrier.tile);
      const sprites = (barrier.tiles || []).map(([x, y]) => this.scene.add
        .image(x * TILE_SIZE, y * TILE_SIZE, tile.texture)
        .setOrigin(0, 0)
        .setDepth(DEPTHS.decoration));

      this.barrierSprites.set(barrier.id, sprites);
    }

    this.refreshBarriers();
  }

  /**
   * Make every barrier LOOK the way the map says it is.
   *
   * One source of truth: `map.isBarrierClosed()` is the same call collision
   * uses, so a hedge that blocks is a hedge you can see and vice versa.
   *
   * @param {object} [options]
   * @param {string[]} [options.animate] barrier ids to animate rather than snap
   */
  refreshBarriers({ animate = [] } = {}) {
    const moving = new Set(animate);

    for (const [id, sprites] of this.barrierSprites) {
      const closed = this.map.isBarrierClosed(id);

      for (const sprite of sprites) {
        if (!moving.has(id)) {
          sprite.setVisible(closed).setAlpha(1).setScale(1);
          continue;
        }

        // Growing across, or drawing back. Short: it is feedback, not a
        // cutscene, and the player is standing on the switch waiting.
        this.scene.tweens.killTweensOf(sprite);
        if (closed) {
          sprite.setVisible(true).setAlpha(0).setScale(1, 0.2);
          this.scene.tweens.add({
            targets: sprite, alpha: 1, scaleY: 1, duration: 220, ease: 'Back.easeOut',
          });
        } else {
          this.scene.tweens.add({
            targets: sprite,
            alpha: 0,
            scaleY: 0.2,
            duration: 200,
            ease: 'Sine.easeIn',
            onComplete: () => sprite.setVisible(false),
          });
        }
      }
    }
  }

  render() {
    const { pixelWidth, pixelHeight } = this.map;

    // --- Ground: everything the player walks on or bumps into ---
    this.groundLayer = this.scene.add
      .renderTexture(0, 0, pixelWidth, pixelHeight)
      .setOrigin(0, 0)
      .setDepth(DEPTHS.ground);

    // --- Overhead: drawn on top of the player (tree canopies, roof overhangs) ---
    this.overheadLayer = this.scene.add
      .renderTexture(0, 0, pixelWidth, pixelHeight)
      .setOrigin(0, 0)
      .setDepth(DEPTHS.overhead);

    // IMPORTANT: each layer gets its OWN complete beginDraw/endDraw pass.
    // `beginDraw` binds that render texture's framebuffer, so two open batches
    // at once would send every stamp to whichever was bound last — which quietly
    // puts the entire map in the overhead layer, on top of the player.
    this.drawLayer(this.groundLayer, (tile) => !tile.overhead);
    this.drawLayer(this.overheadLayer, (tile) => tile.overhead);
  }

  /**
   * Stamp every tile matching `shouldDraw` into one render texture.
   * `beginDraw`/`endDraw` batch the whole pass into a single GPU operation.
   *
   * @param {Phaser.GameObjects.RenderTexture} layer
   * @param {(tile: object) => boolean} shouldDraw
   */
  drawLayer(layer, shouldDraw) {
    // Furniture is drawn with a see-through background so it can sit on any
    // floor. Where a map names a floor for that (`objectBase`), we stamp the
    // floor first and the object on top of it.
    const baseTexture = this.map.objectBaseTexture;

    layer.beginDraw();

    for (let y = 0; y < this.map.height; y += 1) {
      for (let x = 0; x < this.map.width; x += 1) {
        const tile = this.map.getTile(x, y);
        if (!tile || !shouldDraw(tile)) continue;

        const px = x * TILE_SIZE;
        const py = y * TILE_SIZE;

        if (tile.object && baseTexture) layer.batchDraw(baseTexture, px, py);
        layer.batchDraw(tile.texture, px, py);
      }
    }

    layer.endDraw();
  }

  /** Free the textures. Called when the scene changes maps or shuts down. */
  destroy() {
    for (const sprites of this.barrierSprites.values()) {
      for (const sprite of sprites) {
        this.scene.tweens.killTweensOf(sprite);
        sprite.destroy();
      }
    }
    this.barrierSprites.clear();
    for (const sprite of this.leverSprites.values()) sprite.destroy();
    this.leverSprites.clear();
    for (const { sprite } of this.glowSprites) sprite.destroy();
    this.glowSprites = [];

    if (this.groundLayer) {
      this.groundLayer.destroy();
      this.groundLayer = null;
    }
    if (this.overheadLayer) {
      this.overheadLayer.destroy();
      this.overheadLayer = null;
    }
  }
}
