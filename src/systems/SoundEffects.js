/**
 * SoundEffects.js
 * ----------------------------------------------------------------------------
 * The game's sounds (Phase 14): a handful of short blips and fanfares,
 * synthesised in the browser as they play. There are no audio files — like
 * the art, every sound is made in code.
 *
 * MASTER VOLUME RULES EVERYTHING. Each note is an oscillator wired into
 * Phaser's own sound manager, through its master mute and master volume
 * (`sound.destination`), so the Volume setting — which already drives that
 * manager (BootScene) — turns every sound here up, down or off. At volume 0
 * nothing is even built.
 *
 * NEVER IN THE WAY. If the browser has no Web Audio, has not yet been allowed
 * to play sound (no key pressed yet), or anything about it fails, a sound is
 * simply not played: `playSfx` returns false and the game goes on.
 *
 * A sound is plain data — a list of notes — so it can be checked without a
 * browser: { wave, from, to, start, length, gain }, times in seconds,
 * frequencies in hertz (`to` slides the pitch over the note).
 */

/** The loudest any one note may be, before the master volume. */
export const MAX_NOTE_GAIN = 0.25;

const note = (from, start, length, { to = from, wave = 'square', gain = 0.08 } = {}) => ({
  wave, from, to, start, length, gain,
});

/** Every sound in the game. */
export const SOUNDS = {
  // Menus: soft, short, never tiring.
  cursor: [note(880, 0, 0.035, { gain: 0.04 })],
  confirm: [note(660, 0, 0.05, { gain: 0.06 }), note(990, 0.05, 0.07, { gain: 0.06 })],
  cancel: [note(520, 0, 0.05, { gain: 0.05 }), note(390, 0.05, 0.07, { gain: 0.05 })],

  // Battle.
  hit: [note(240, 0, 0.09, { to: 90, wave: 'sawtooth', gain: 0.09 })],
  faint: [note(420, 0, 0.45, { to: 70, wave: 'triangle', gain: 0.12 })],
  caught: [note(784, 0, 0.08), note(988, 0.09, 0.08), note(1319, 0.18, 0.2)],
  levelUp: [note(523, 0, 0.08), note(659, 0.08, 0.08), note(784, 0.16, 0.08), note(1047, 0.24, 0.22)],
  evolve: [note(392, 0, 0.6, { to: 784, wave: 'triangle', gain: 0.1 }), note(1047, 0.6, 0.35, { wave: 'triangle', gain: 0.1 })],

  // The world.
  alert: [note(1175, 0, 0.06, { gain: 0.07 }), note(1568, 0.07, 0.1, { gain: 0.07 })],
  heal: [note(523, 0, 0.12, { wave: 'triangle' }), note(784, 0.12, 0.12, { wave: 'triangle' }), note(1047, 0.24, 0.3, { wave: 'triangle' })],
  sigil: [
    note(523, 0, 0.14, { wave: 'triangle', gain: 0.12 }), note(659, 0.14, 0.14, { wave: 'triangle', gain: 0.12 }),
    note(784, 0.28, 0.14, { wave: 'triangle', gain: 0.12 }), note(1047, 0.42, 0.5, { wave: 'triangle', gain: 0.14 }),
  ],
  // The ending: the Sigil's phrase, slower, with a rising close.
  fanfare: [
    note(392, 0, 0.25, { wave: 'triangle', gain: 0.12 }), note(523, 0.25, 0.25, { wave: 'triangle', gain: 0.12 }),
    note(659, 0.5, 0.25, { wave: 'triangle', gain: 0.12 }), note(784, 0.75, 0.4, { wave: 'triangle', gain: 0.13 }),
    note(659, 1.15, 0.2, { wave: 'triangle', gain: 0.12 }), note(1047, 1.35, 0.9, { wave: 'triangle', gain: 0.15 }),
  ],
};

/** How long a sound lasts, in seconds. */
export function soundLength(name) {
  const notes = SOUNDS[name] || [];
  return notes.reduce((end, n) => Math.max(end, n.start + n.length), 0);
}

/**
 * Play one sound through a scene's sound manager.
 *
 * @param {object} scene  any Phaser scene (only `scene.sound` is used)
 * @param {string} name   a key of SOUNDS
 * @returns {boolean} true if it was scheduled
 */
export function playSfx(scene, name) {
  const notes = SOUNDS[name];
  const sound = scene && scene.sound;
  const context = sound && sound.context;
  if (!notes || !context || !sound.destination) return false;
  if (sound.locked || sound.mute || !(sound.volume > 0)) return false;

  try {
    const now = context.currentTime;
    for (const n of notes) {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = n.wave;
      oscillator.frequency.setValueAtTime(n.from, now + n.start);
      if (n.to !== n.from) oscillator.frequency.linearRampToValueAtTime(n.to, now + n.start + n.length);
      // A quick rise and a fall to silence, so no note clicks.
      gain.gain.setValueAtTime(0, now + n.start);
      gain.gain.linearRampToValueAtTime(Math.min(n.gain, MAX_NOTE_GAIN), now + n.start + 0.01);
      gain.gain.linearRampToValueAtTime(0, now + n.start + n.length);
      oscillator.connect(gain);
      gain.connect(sound.destination);
      oscillator.start(now + n.start);
      oscillator.stop(now + n.start + n.length + 0.02);
      // Let the nodes go once the note is over.
      oscillator.onended = () => {
        oscillator.disconnect();
        gain.disconnect();
      };
    }
    return true;
  } catch (error) {
    console.warn('[Sound] could not play', name, error?.message || error);
    return false;
  }
}

/**
 * Menu blips for a scene: a soft tick when the cursor moves, a chirp on
 * Confirm and a lower one on Cancel. Listens to the keyboard directly, so it
 * never takes a press away from the scene's own handling, and ignores a key
 * that is only being held. Removed with the scene.
 *
 * @param {object} scene
 * @param {Record<string, string[]>} bindings  action -> key names (controls.js)
 */
export function attachMenuSounds(scene, bindings) {
  const sounds = new Map();
  for (const [action, name] of [['up', 'cursor'], ['down', 'cursor'], ['left', 'cursor'], ['right', 'cursor'],
    ['confirm', 'confirm'], ['cancel', 'cancel']]) {
    for (const key of bindings[action] || []) sounds.set(key, name);
  }
  const onKey = (event) => {
    if (event.repeat) return;
    const name = sounds.get(keyName(event));
    if (name) playSfx(scene, name);
  };
  const keyboard = scene.input && scene.input.keyboard;
  if (!keyboard) return;
  keyboard.on('keydown', onKey);
  scene.events.once('shutdown', () => keyboard.off('keydown', onKey));
}

/** A DOM key event as a Phaser key name: 'ArrowUp' -> 'UP', 'w' -> 'W', ' ' -> 'SPACE'. */
function keyName(event) {
  const map = {
    ArrowUp: 'UP', ArrowDown: 'DOWN', ArrowLeft: 'LEFT', ArrowRight: 'RIGHT',
    ' ': 'SPACE', Enter: 'ENTER', Escape: 'ESC', Shift: 'SHIFT', Backspace: 'BACKSPACE',
  };
  return map[event.key] || String(event.key || '').toUpperCase();
}
