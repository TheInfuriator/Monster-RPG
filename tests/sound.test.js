/**
 * sound.test.js
 * ----------------------------------------------------------------------------
 * The game's sounds (Phase 14): procedural, governed by the master volume, and
 * never in the way — a browser without Web Audio, a locked context, a muted
 * game or a volume of 0 simply plays nothing.
 */

import { describe, it, expect } from 'vitest';
import { SOUNDS, MAX_NOTE_GAIN, playSfx, soundLength, attachMenuSounds } from '../src/systems/SoundEffects.js';
import { KEY_BINDINGS } from '../src/config/controls.js';

/** A stand-in for Phaser's Web Audio sound manager, recording what is built. */
function fakeSound({ volume = 0.8, locked = false, mute = false } = {}) {
  const built = { oscillators: [], gains: [], connections: [] };
  const param = () => ({ setValueAtTime() {}, linearRampToValueAtTime() {} });
  const destination = { name: 'masterMuteNode' };
  const context = {
    currentTime: 10,
    createOscillator() {
      const node = {
        type: null, frequency: param(), started: null, stopped: null,
        connect: (to) => built.connections.push(['osc', to]), disconnect() {},
        start(t) { this.started = t; }, stop(t) { this.stopped = t; },
      };
      built.oscillators.push(node);
      return node;
    },
    createGain() {
      const node = { gain: param(), connect: (to) => built.connections.push(['gain', to]), disconnect() {} };
      built.gains.push(node);
      return node;
    },
  };
  return { sound: { context, destination, volume, locked, mute }, built, destination };
}

describe('the sounds themselves', () => {
  it('are all made in code: plain notes, no files', () => {
    expect(Object.keys(SOUNDS).length).toBeGreaterThanOrEqual(10);
    for (const [name, notes] of Object.entries(SOUNDS)) {
      expect(notes.length, name).toBeGreaterThan(0);
      for (const n of notes) {
        expect(['square', 'sawtooth', 'triangle', 'sine']).toContain(n.wave);
        expect(n.from).toBeGreaterThan(20);
        expect(n.to).toBeGreaterThan(20);
        expect(n.length).toBeGreaterThan(0);
        expect(n.start).toBeGreaterThanOrEqual(0);
        expect(n.gain).toBeGreaterThan(0);
        expect(n.gain).toBeLessThanOrEqual(MAX_NOTE_GAIN);
      }
    }
  });

  it('are short — a blip under a tenth of a second, the ending\'s fanfare under three', () => {
    expect(soundLength('cursor')).toBeLessThan(0.1);
    expect(soundLength('fanfare')).toBeLessThan(3);
    for (const name of Object.keys(SOUNDS)) expect(soundLength(name), name).toBeLessThan(3);
  });
});

describe('playing a sound', () => {
  it('goes through Phaser\'s master mute and volume, so the Volume setting rules it', () => {
    const { sound, built, destination } = fakeSound();
    expect(playSfx({ sound }, 'levelUp')).toBe(true);
    expect(built.oscillators).toHaveLength(SOUNDS.levelUp.length);
    // Every gain node feeds the manager's master chain, and nothing else.
    const outward = built.connections.filter(([from]) => from === 'gain').map(([, to]) => to);
    expect(outward).toHaveLength(SOUNDS.levelUp.length);
    for (const to of outward) expect(to).toBe(destination);
    for (const osc of built.oscillators) expect(osc.stopped).toBeGreaterThan(osc.started);
  });

  it('plays nothing at volume 0, muted, or before the browser allows sound', () => {
    for (const options of [{ volume: 0 }, { mute: true }, { locked: true }]) {
      const { sound, built } = fakeSound(options);
      expect(playSfx({ sound }, 'confirm'), JSON.stringify(options)).toBe(false);
      expect(built.oscillators).toHaveLength(0);
    }
  });

  it('plays nothing — and never throws — without Web Audio, or for a sound that does not exist', () => {
    expect(playSfx({ sound: { volume: 1 } }, 'confirm')).toBe(false);   // Phaser's NoAudio manager
    expect(playSfx({}, 'confirm')).toBe(false);
    expect(playSfx(null, 'confirm')).toBe(false);
    const { sound } = fakeSound();
    expect(playSfx({ sound }, 'noSuchSound')).toBe(false);
    const broken = fakeSound();
    broken.sound.context.createOscillator = () => { throw new Error('no audio here'); };
    expect(playSfx({ sound: broken.sound }, 'confirm')).toBe(false);
  });
});

describe('menu blips', () => {
  it('tick on a fresh press of a menu key, and ignore a held one', () => {
    const { sound, built } = fakeSound();
    const handlers = {};
    const scene = {
      sound,
      input: { keyboard: { on: (event, fn) => { handlers[event] = fn; }, off: () => {} } },
      events: { once() {} },
    };
    attachMenuSounds(scene, KEY_BINDINGS);
    handlers.keydown({ key: 'ArrowDown', repeat: false });
    expect(built.oscillators).toHaveLength(SOUNDS.cursor.length);
    handlers.keydown({ key: 'ArrowDown', repeat: true });
    expect(built.oscillators).toHaveLength(SOUNDS.cursor.length);
    handlers.keydown({ key: 'Enter', repeat: false });
    expect(built.oscillators).toHaveLength(SOUNDS.cursor.length + SOUNDS.confirm.length);
    handlers.keydown({ key: 'q', repeat: false });   // not a menu key
    expect(built.oscillators).toHaveLength(SOUNDS.cursor.length + SOUNDS.confirm.length);
  });
});
