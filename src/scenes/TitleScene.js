/**
 * TitleScene.js
 * ----------------------------------------------------------------------------
 * The title screen: the logo, New Game / Continue / Settings, and the
 * control hints.
 *
 * CONTINUE
 * The two save slots are read (never loaded) as the screen opens, and
 * `getContinueChoice()` decides what Continue does:
 *
 *   no usable save             Continue is shown, greyed out
 *   one save, nothing else     Continue loads it
 *   two saves, or a damaged    Continue opens a chooser showing both slots,
 *   one to explain             the newest highlighted
 *
 * A damaged or newer-version save is named under the menu, so the player is
 * told rather than left wondering why Continue is grey.
 *
 * NEW GAME
 * If anything is saved, New Game asks first, and says plainly what happens:
 * nothing is deleted, and the manual save stays until the player saves over
 * it.
 *
 * Every panel here is a VIEW of this one scene, reading the keyboard through
 * the one InputManager, so there is a single place input can go.
 */

import Phaser from 'phaser';
import {
  SCENES,
  GAME_WIDTH,
  GAME_HEIGHT,
  COLORS,
  CSS_COLORS,
  TEXT_STYLES,
  FONT_FAMILY,
  DEPTHS,
} from '../config/gameConfig.js';
import { CONTROL_HINTS } from '../config/controls.js';
import { InputManager } from '../core/InputManager.js';
import { Menu } from '../ui/Menu.js';
import { SettingsPanel } from '../ui/SettingsPanel.js';
import {
  listSlots, getContinueChoice, loadSlot, hasAnySave, beginNewGame, SLOTS,
} from '../save/SaveManager.js';
import { isStoragePersistent } from '../save/SaveStorage.js';
import { describeSlotTitle, describeSlotLines, describeSlotProblems } from '../ui/saveText.js';
import { fadeToScene, fadeIn } from '../utils/transitions.js';

const MENU_Y = 142;
const MENU_SPACING = 24;

/** The chooser and the confirmation both draw in a panel of this shape. */
const PANEL = { x: 24, y: 30, width: GAME_WIDTH - 48, height: GAME_HEIGHT - 60 };

export class TitleScene extends Phaser.Scene {
  constructor() {
    super({ key: SCENES.TITLE });
  }

  init() {
    /** 'menu' | 'slots' | 'confirmNew' | 'settings' | 'message' | 'leaving' */
    this.view = 'menu';
    this.panel = null;
    this.settingsPanel = null;
  }

  create() {
    // `this.controls` (our action wrapper) is deliberately NOT called `this.input`,
    // because Phaser already owns `scene.input` for its own keyboard/mouse plugin.
    this.controls = new InputManager(this);

    this.buildBackdrop();
    this.buildTitle();
    this.readSaves();
    this.buildMenu();
    this.buildNotice();
    this.buildControlHints();

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.cleanup());

    fadeIn(this);
  }

  /** Read both slots — their summaries only; nothing is loaded. */
  readSaves() {
    this.slots = listSlots();
    this.choice = getContinueChoice(this.slots);
  }

  /** A simple layered backdrop: sky gradient bands and a rolling hill silhouette. */
  buildBackdrop() {
    this.cameras.main.setBackgroundColor(COLORS.ink);

    const bands = [
      { color: 0x243044, height: 0.55 },
      { color: 0x2c3a52, height: 0.62 },
      { color: 0x33455f, height: 0.7 },
    ];
    bands.forEach((band) => {
      this.add
        .rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT * band.height, band.color)
        .setOrigin(0, 0);
    });

    // Distant hills, drawn as overlapping ellipses.
    const hills = this.add.graphics();
    hills.fillStyle(0x2f5c2a, 1);
    hills.fillEllipse(90, 250, 320, 150);
    hills.fillEllipse(330, 262, 380, 160);
    hills.fillStyle(0x234420, 1);
    hills.fillEllipse(220, 292, 460, 130);

    // Foreground ground.
    this.add
      .rectangle(0, GAME_HEIGHT - 34, GAME_WIDTH, 34, COLORS.grassDark)
      .setOrigin(0, 0);

    // A few stars in the upper sky.
    const stars = this.add.graphics();
    stars.fillStyle(COLORS.parchment, 0.7);
    const positions = [
      [40, 30], [98, 58], [160, 24], [225, 46], [300, 28],
      [366, 60], [420, 34], [452, 72], [268, 74], [130, 88],
    ];
    positions.forEach(([x, y], i) => stars.fillRect(x, y, i % 3 === 0 ? 2 : 1, i % 3 === 0 ? 2 : 1));
  }

  buildTitle() {
    const centerX = GAME_WIDTH / 2;

    const title = this.add
      .text(centerX, 60, 'AETHERIA', {
        ...TEXT_STYLES.title,
        fontSize: '44px',
        color: CSS_COLORS.accent,
      })
      .setOrigin(0.5)
      .setDepth(DEPTHS.ui);
    title.setShadow(0, 3, '#000000', 0, true, true);

    this.add
      .text(centerX, 94, 'C H R O N I C L E S', {
        fontFamily: FONT_FAMILY,
        fontSize: '15px',
        color: CSS_COLORS.parchment,
      })
      .setOrigin(0.5)
      .setDepth(DEPTHS.ui);

    // A slow bob, so the screen is not completely static.
    this.tweens.add({
      targets: title,
      y: title.y - 4,
      duration: 2200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  buildMenu() {
    const canContinue = this.choice.canContinue;

    this.menu = new Menu(this, {
      x: GAME_WIDTH / 2 - 44,
      y: MENU_Y,
      spacing: MENU_SPACING,
      items: [
        { label: 'New Game', value: 'new' },
        { label: 'Continue', value: 'continue', enabled: canContinue },
        { label: 'Settings', value: 'settings' },
      ],
      // A returning player most likely wants to carry on.
      initialIndex: canContinue ? 1 : 0,
      onSelect: (item) => this.handleSelect(item),
    });
  }

  /**
   * A line under the menu naming any save that cannot be used, or warning
   * that this browser will not keep saves at all. Silent when all is well.
   */
  buildNotice() {
    let message = '';
    if (!isStoragePersistent()) {
      message = 'This browser will not keep saves — progress lasts until the page closes.';
    } else if (this.choice.problems.length > 0) {
      message = describeSlotProblems(this.choice.problems);
    }

    const style = { fontFamily: FONT_FAMILY, fontSize: '10px', color: CSS_COLORS.danger };
    if (message) Object.assign(style, { backgroundColor: '#1b2230cc', padding: { x: 6, y: 2 } });

    this.notice = this.add
      .text(GAME_WIDTH / 2, MENU_Y + MENU_SPACING * 3 - 2, message, style)
      .setOrigin(0.5, 0)
      .setDepth(DEPTHS.ui);
  }

  buildControlHints() {
    const startY = GAME_HEIGHT - 70;

    // A dark backing panel, so the hints stay readable over the light ground band.
    this.add
      .rectangle(GAME_WIDTH / 2, startY + 22, 250, 80, COLORS.ink, 0.72)
      .setOrigin(0.5)
      .setStrokeStyle(1, COLORS.accentDark, 0.6);

    this.add
      .text(GAME_WIDTH / 2, startY - 8, 'CONTROLS', {
        ...TEXT_STYLES.small,
        color: CSS_COLORS.accentDark,
      })
      .setOrigin(0.5);

    CONTROL_HINTS.forEach(([keys, action], i) => {
      const y = startY + 8 + i * 13;
      this.add.text(GAME_WIDTH / 2 - 112, y, keys, TEXT_STYLES.small).setOrigin(0, 0.5);
      this.add
        .text(GAME_WIDTH / 2 + 112, y, action, {
          ...TEXT_STYLES.small,
          color: CSS_COLORS.parchment,
        })
        .setOrigin(1, 0.5);
    });
  }

  // -------------------------------------------------------------------------
  // The main menu
  // -------------------------------------------------------------------------

  handleSelect(item) {
    if (item.value === 'new') {
      if (hasAnySave()) this.showConfirmNew();
      else this.startNewGame();
      return;
    }

    if (item.value === 'continue') {
      if (!this.choice.canContinue) return;
      if (this.choice.needsChooser) this.showSlots();
      else this.continueFrom(this.choice.preselected);
      return;
    }

    if (item.value === 'settings') this.showSettings();
  }

  startNewGame() {
    // Wipe the in-memory game. Saved games are NOT touched: see beginNewGame().
    beginNewGame();
    this.leave();
  }

  /**
   * Load a slot and go. If loading fails — the save changed since the screen
   * opened, or storage refused — the player is told, and stays here with
   * nothing changed.
   */
  continueFrom(slot) {
    const result = loadSlot(slot);
    if (!result.ok) {
      this.showMessage('Could not load that save', [result.message]);
      return;
    }
    this.leave({ arrival: 'continue' });
  }

  leave(data = {}) {
    this.view = 'leaving';
    this.menu.locked = true;
    fadeToScene(this, SCENES.WORLD, data);
  }

  // -------------------------------------------------------------------------
  // Panels
  // -------------------------------------------------------------------------

  /**
   * Open an empty full-size panel over the title, hiding the menu beneath.
   * Pass no title for a bare backdrop that another panel draws onto.
   */
  openPanel(title = null) {
    this.closePanel();
    this.menu.locked = true;

    // Nearly opaque, so nothing on the title screen — the menu, the control
    // hints — shows through around the edges of a panel.
    this.panel = this.add.container(0, 0).setDepth(DEPTHS.overlay);
    const shade = this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, COLORS.ink, 0.94).setOrigin(0, 0);
    this.panel.add(shade);
    if (title === null) return;

    const frame = this.add
      .rectangle(PANEL.x, PANEL.y, PANEL.width, PANEL.height, COLORS.parchment)
      .setOrigin(0, 0);
    const inner = this.add
      .rectangle(PANEL.x + 3, PANEL.y + 3, PANEL.width - 6, PANEL.height - 6, COLORS.ink)
      .setOrigin(0, 0);
    const heading = this.panelText(PANEL.x + 14, PANEL.y + 12, title, { fontSize: '14px' });
    this.panel.add([frame, inner, heading]);

    /** What the current panel drew and redraws; cleared on every redraw. */
    this.panelBody = this.add.container(0, 0);
    this.panel.add(this.panelBody);
  }

  panelText(x, y, value, style = {}) {
    return this.add.text(x, y, value, {
      fontFamily: FONT_FAMILY, fontSize: '11px', color: CSS_COLORS.parchment, ...style,
    });
  }

  closePanel() {
    if (this.panel) {
      this.panel.destroy(true);
      this.panel = null;
      this.panelBody = null;
    }
  }

  /** Back to the main menu, re-reading the saves in case anything changed. */
  showMenu() {
    this.closePanel();
    this.view = 'menu';
    this.controls.clearPending();

    // Rebuild the menu so Continue reflects the slots as they are now.
    this.readSaves();
    const index = this.menu.index;
    this.menu.destroy();
    this.notice.destroy();
    this.buildMenu();
    this.buildNotice();
    if (this.menu.items[index].enabled !== false) {
      this.menu.index = index;
      this.menu.refresh();
    }
  }

  // --- Continue: the slot chooser ---------------------------------------------

  showSlots() {
    this.view = 'slots';
    this.slotIndex = SLOTS.indexOf(this.choice.preselected);
    this.openPanel('CONTINUE');
    this.drawSlots();
  }

  drawSlots() {
    this.panelBody.removeAll(true);
    const cardHeight = 86;

    SLOTS.forEach((slot, i) => {
      const summary = this.slots[slot];
      const usable = summary.status === 'valid';
      const selected = i === this.slotIndex;
      const top = PANEL.y + 40 + i * (cardHeight + 8);

      const card = this.add
        .rectangle(PANEL.x + 12, top, PANEL.width - 24, cardHeight, selected ? COLORS.inkLight : COLORS.ink)
        .setOrigin(0, 0)
        .setStrokeStyle(1, selected ? COLORS.accent : COLORS.inkLight);
      this.panelBody.add(card);

      const titleColour = !usable
        ? (summary.status === 'empty' ? CSS_COLORS.parchmentDim : CSS_COLORS.danger)
        : selected ? CSS_COLORS.accent : CSS_COLORS.parchment;
      this.panelBody.add(this.panelText(PANEL.x + 24, top + 8, describeSlotTitle(summary), {
        fontSize: '13px', color: titleColour,
      }));

      describeSlotLines(summary).forEach((line, row) => {
        this.panelBody.add(this.panelText(PANEL.x + 24, top + 28 + row * 16, line, {
          color: usable ? CSS_COLORS.parchment : CSS_COLORS.parchmentDim,
          wordWrap: { width: PANEL.width - 60 },
        }));
      });
    });

    this.panelBody.add(this.panelText(
      PANEL.x + 14, PANEL.y + PANEL.height - 18,
      'Up/Down choose      Confirm load      Cancel back',
      { fontSize: '9px', color: CSS_COLORS.parchmentDim }
    ));
  }

  updateSlots() {
    const usable = SLOTS.filter((slot) => this.slots[slot].status === 'valid');

    if (this.controls.justPressed('up') || this.controls.justPressed('down')) {
      // Only usable slots can be highlighted; with two, up and down swap.
      const current = SLOTS[this.slotIndex];
      const next = usable.find((slot) => slot !== current) || current;
      this.slotIndex = SLOTS.indexOf(next);
      this.drawSlots();
    }

    if (this.controls.justPressed('confirm')) {
      const slot = SLOTS[this.slotIndex];
      if (this.slots[slot].status === 'valid') this.continueFrom(slot);
      return;
    }

    if (this.controls.justPressed('cancel')) this.showMenu();
  }

  // --- New Game: confirm when there is something saved ------------------------

  showConfirmNew() {
    this.view = 'confirmNew';
    // "Back" first: a stray double press should never start a new game.
    this.confirmIndex = 1;
    this.openPanel('NEW GAME');
    this.drawConfirmNew();
  }

  drawConfirmNew() {
    this.panelBody.removeAll(true);
    const x = PANEL.x + 20;

    const paragraphs = [
      'Start a new adventure from the beginning?',
      'Nothing is deleted. Your Manual Save stays exactly as it is until you save '
        + 'over it, and Continue can still load it.',
      'The Autosave will follow the new game once it next autosaves.',
    ];
    this.panelBody.add(this.panelText(x, PANEL.y + 44, paragraphs.join('\n\n'), {
      fontSize: '11px', wordWrap: { width: PANEL.width - 40 }, lineSpacing: 3,
    }));

    ['Start new game', 'Back'].forEach((label, i) => {
      const y = PANEL.y + 170 + i * 28;
      const selected = i === this.confirmIndex;
      if (selected) {
        this.panelBody.add(this.add.rectangle(x - 6, y - 4, 180, 24, COLORS.inkLight).setOrigin(0, 0));
      }
      this.panelBody.add(this.panelText(x, y, label, {
        fontSize: '13px', color: selected ? CSS_COLORS.accent : CSS_COLORS.parchment,
      }));
    });
  }

  updateConfirmNew() {
    if (this.controls.justPressed('up') || this.controls.justPressed('down')) {
      this.confirmIndex = 1 - this.confirmIndex;
      this.drawConfirmNew();
    }
    if (this.controls.justPressed('confirm')) {
      if (this.confirmIndex === 0) {
        this.closePanel();
        this.startNewGame();
      } else {
        this.showMenu();
      }
      return;
    }
    if (this.controls.justPressed('cancel')) this.showMenu();
  }

  // --- A message, e.g. a load that failed ------------------------------------

  showMessage(title, lines) {
    this.view = 'message';
    this.openPanel(title.toUpperCase());
    this.panelBody.add(this.panelText(PANEL.x + 20, PANEL.y + 50, lines.join('\n\n'), {
      fontSize: '12px', wordWrap: { width: PANEL.width - 40 },
    }));
    this.panelBody.add(this.panelText(
      PANEL.x + 14, PANEL.y + PANEL.height - 18, 'Confirm or Cancel  back to the title',
      { fontSize: '9px', color: CSS_COLORS.parchmentDim }
    ));
  }

  updateMessage() {
    if (this.controls.justPressed('confirm') || this.controls.justPressed('cancel')) this.showMenu();
  }

  // --- Settings --------------------------------------------------------------

  showSettings() {
    this.view = 'settings';
    this.openPanel();
    this.settingsPanel = new SettingsPanel(this, {
      x: PANEL.x,
      y: PANEL.y,
      width: PANEL.width,
      height: PANEL.height,
      depth: DEPTHS.overlay + 1,
      onClose: () => {
        this.settingsPanel = null;
        this.showMenu();
      },
    });
  }

  // -------------------------------------------------------------------------

  update() {
    switch (this.view) {
      case 'menu': this.menu.update(this.controls); break;
      case 'slots': this.updateSlots(); break;
      case 'confirmNew': this.updateConfirmNew(); break;
      case 'message': this.updateMessage(); break;
      case 'settings': if (this.settingsPanel) this.settingsPanel.update(this.controls); break;
      default: break;
    }
  }

  cleanup() {
    this.closePanel();
    if (this.settingsPanel) {
      this.settingsPanel.destroy();
      this.settingsPanel = null;
    }
    if (this.menu) this.menu.destroy();
  }
}
