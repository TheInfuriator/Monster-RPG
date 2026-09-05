/**
 * NpcManager.js
 * ----------------------------------------------------------------------------
 * Owns every NPC on the current map.
 *
 * It exists so that no single place has to keep a list of NPCs in sync with
 * collision, interaction, and cleanup. The scene creates one manager, and the
 * manager answers three questions:
 *
 *   "who is standing here?"     -> getNpcAt()      (for talking to someone)
 *   "is this tile free?"        -> isTileFree()    (for collision)
 *   "clean everything up"       -> destroy()       (on leaving the map)
 */

import { Npc } from '../entities/Npc.js';

export class NpcManager {
  /**
   * @param {Phaser.Scene} scene
   * @param {import('./TileMap.js').TileMap} map
   * @param {() => {x: number, y: number}} getPlayerTile
   *        so NPCs never wander into the player
   */
  constructor(scene, map, getPlayerTile) {
    this.scene = scene;
    this.map = map;
    this.getPlayerTile = getPlayerTile;

    /** @type {Npc[]} */
    this.npcs = [];

    for (const definition of map.definition.npcs || []) {
      this.spawn(definition);
    }
  }

  spawn(definition) {
    const npc = new Npc(this.scene, definition);

    // Give the NPC a way to ask the world whether it may step somewhere,
    // without it needing to know about maps, the player, or other NPCs.
    npc.canEnterTile = (x, y) => this.isTileFree(x, y, npc);

    this.npcs.push(npc);
    return npc;
  }

  /** The NPC standing on a tile, or null. */
  getNpcAt(x, y) {
    return this.npcs.find((npc) => npc.occupies(x, y)) || null;
  }

  /**
   * Can something move onto this tile?
   * Checks map collision, the player, and every other NPC.
   *
   * @param {number} x
   * @param {number} y
   * @param {Npc} [ignore] an NPC to skip (itself, when checking its own move)
   */
  isTileFree(x, y, ignore = null) {
    if (!this.map.isWalkable(x, y)) return false;

    const player = this.getPlayerTile ? this.getPlayerTile() : null;
    if (player && player.x === x && player.y === y) return false;

    return !this.npcs.some((npc) => npc !== ignore && npc.occupies(x, y));
  }

  /** True if an NPC blocks this tile. Used as the player's extra collision check. */
  isTileBlockedByNpc(x, y) {
    return this.npcs.some((npc) => npc.occupies(x, y));
  }

  /** Stop every NPC in place — used while a conversation or cutscene runs. */
  setAllBusy(busy) {
    for (const npc of this.npcs) {
      npc.isBusy = busy;
      if (busy) npc.halt();
    }
  }

  destroy() {
    for (const npc of this.npcs) npc.destroy();
    this.npcs = [];
  }
}
