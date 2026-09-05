/**
 * BootScene.js
 * ----------------------------------------------------------------------------
 * The first scene the game runs. It has one job: make sure everything the rest
 * of the game needs exists, then hand over to the title screen.
 *
 * Today that means generating all placeholder artwork and registering the walk
 * animations. When real image files are added later, this is where they get
 * loaded — and this is the only scene that would change.
 */

import Phaser from 'phaser';
import { SCENES, GAME_WIDTH, GAME_HEIGHT, COLORS, TEXT_STYLES } from '../config/gameConfig.js';
import { generateAllTextures } from '../systems/TextureFactory.js';
import { createCharacterAnimations } from '../entities/Player.js';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: SCENES.BOOT });
  }

  preload() {
    // A minimal loading indicator. There are no files to download yet, but this
    // is where a progress bar belongs once there are.
    const label = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'Loading...', TEXT_STYLES.body)
      .setOrigin(0.5);

    this.load.on(Phaser.Loader.Events.COMPLETE, () => label.destroy());
  }

  create() {
    this.cameras.main.setBackgroundColor(COLORS.ink);

    // Build every texture the game uses. Returns how many were newly created.
    const textures = generateAllTextures(this);
    const animations = createCharacterAnimations(this);

    console.info(
      `[Boot] Generated ${textures} textures and ${animations} character animations.`
    );

    this.scene.start(SCENES.TITLE);
  }
}
