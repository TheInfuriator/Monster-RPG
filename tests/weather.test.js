/**
 * weather.test.js
 * ----------------------------------------------------------------------------
 * Overworld weather (Phase 13): declared by a map, drawn generically, a
 * fixed pool of particles that is recycled rather than re-created.
 */

import { describe, it, expect } from 'vitest';
import {
  WEATHER_KINDS, MAX_WEATHER_PARTICLES, planWeather, findWeatherProblems, WeatherRenderer, chooseWeather,
} from '../src/systems/WeatherRenderer.js';
import { GAME_WIDTH, GAME_HEIGHT } from '../src/config/gameConfig.js';
import { MAPS } from '../src/data/maps/index.js';

/** Just enough of a Phaser scene for the renderer: images that can move. */
function fakeScene() {
  const made = [];
  const image = (x, y, texture) => {
    const sprite = {
      x, y, texture, alpha: 1, destroyed: false,
      setScrollFactor() { return this; },
      setDepth() { return this; },
      setAlpha(a) { this.alpha = a; return this; },
      destroy() { this.destroyed = true; },
    };
    made.push(sprite);
    return sprite;
  };
  return { add: { image }, made };
}

describe('planning the weather', () => {
  it('knows wind, rain, snow and mist, and nothing else', () => {
    expect(Object.keys(WEATHER_KINDS).sort()).toEqual(['mist', 'rain', 'snow', 'wind']);
    expect(planWeather({ kind: 'hail' })).toBeNull();
    expect(planWeather(undefined)).toBeNull();
  });

  it('scales with amount, 1 to 3, and never past the ceiling', () => {
    const light = planWeather({ kind: 'rain', amount: 1 });
    const heavy = planWeather({ kind: 'rain', amount: 3 });
    expect(heavy.count).toBe(light.count * 3);
    for (const kind of Object.keys(WEATHER_KINDS)) {
      expect(planWeather({ kind, amount: 3 }).count).toBeLessThanOrEqual(MAX_WEATHER_PARTICLES);
    }
    expect(planWeather({ kind: 'wind', amount: 9 }).count).toBe(planWeather({ kind: 'wind', amount: 3 }).count);
  });
});

describe('validating a map\'s weather', () => {
  const base = { id: 'test', tiles: ['.'] };
  it('accepts none, or a known kind with an amount of 1-3', () => {
    expect(findWeatherProblems(base)).toEqual([]);
    expect(findWeatherProblems({ ...base, weather: { kind: 'wind', amount: 2 } })).toEqual([]);
  });
  it('rejects an unknown kind, a bad amount, and weather indoors', () => {
    expect(findWeatherProblems({ ...base, weather: { kind: 'fog' } }).join()).toMatch(/unknown kind/);
    expect(findWeatherProblems({ ...base, weather: { kind: 'rain', amount: 4 } }).join()).toMatch(/amount/);
    expect(findWeatherProblems({ ...base, interior: true, weather: { kind: 'rain' } }).join()).toMatch(/indoors/);
  });
  it('checks every choice of a sky the story can change', () => {
    const choices = (weather) => findWeatherProblems({ ...base, weather }).join(' | ');
    expect(choices([{ when: 'calm', kind: 'wind' }, { kind: 'mist' }])).toBe('');
    expect(choices([])).toMatch(/empty/);
    expect(choices([{ when: 'calm', kind: 'hail' }, { kind: 'mist' }])).toMatch(/unknown kind/);
    expect(choices([{ kind: 'mist' }, { when: 'calm', kind: 'wind' }])).toMatch(/never show/);
    expect(choices([{ when: '', kind: 'wind' }])).toMatch(/must name a condition/);
  });

  it('holds for every map in the game', () => {
    for (const map of Object.values(MAPS)) expect(findWeatherProblems(map), map.id).toEqual([]);
  });
});

describe('choosing the sky', () => {
  const relay = [
    { when: 'stormriseRelayStopped', kind: 'wind', amount: 2 },
    { kind: 'mist', amount: 1 },
  ];
  it('is the one sky a map declares, whatever the story', () => {
    expect(chooseWeather({ kind: 'snow' }, {})).toEqual({ kind: 'snow' });
    expect(chooseWeather(undefined, { anything: true })).toBeNull();
  });
  it('is the first choice whose condition holds', () => {
    expect(chooseWeather(relay, {}).kind).toBe('mist');
    expect(chooseWeather(relay, { stormriseRelayStopped: true }).kind).toBe('wind');
  });
  it('can be no sky at all, when no choice holds', () => {
    expect(chooseWeather([{ when: 'never', kind: 'rain' }], {})).toBeNull();
  });
});

describe('drawing it', () => {
  it('names its sky, so a scene can tell when the story changed it', () => {
    expect(new WeatherRenderer(fakeScene(), { kind: 'wind', amount: 2 }).key).toBe('wind:20');
    expect(new WeatherRenderer(fakeScene(), undefined).key).toBe('none');
  });

  it('makes its particles once, and moving them makes nothing new', () => {
    const scene = fakeScene();
    const weather = new WeatherRenderer(scene, { kind: 'snow', amount: 2 });
    const count = planWeather({ kind: 'snow', amount: 2 }).count;
    expect(scene.made.length).toBe(count);
    for (let i = 0; i < 600; i += 1) weather.update(16);
    expect(scene.made.length).toBe(count);
  });

  it('keeps every particle on or just off the screen, however long it runs', () => {
    const scene = fakeScene();
    const weather = new WeatherRenderer(scene, { kind: 'wind', amount: 3 });
    for (let i = 0; i < 2000; i += 1) weather.update(33);
    for (const sprite of scene.made) {
      expect(sprite.x).toBeGreaterThanOrEqual(-48);
      expect(sprite.x).toBeLessThanOrEqual(GAME_WIDTH + 48);
      expect(sprite.y).toBeGreaterThanOrEqual(-48);
      expect(sprite.y).toBeLessThanOrEqual(GAME_HEIGHT + 48);
    }
  });

  it('survives a long frame without flinging particles away', () => {
    const scene = fakeScene();
    const weather = new WeatherRenderer(scene, { kind: 'rain', amount: 1 });
    weather.update(5000);
    for (const sprite of scene.made) expect(Math.abs(sprite.y)).toBeLessThan(GAME_HEIGHT * 2);
  });

  it('cleans up after itself', () => {
    const scene = fakeScene();
    const weather = new WeatherRenderer(scene, { kind: 'mist', amount: 1 });
    weather.destroy();
    expect(scene.made.every((s) => s.destroyed)).toBe(true);
    weather.update(16);   // and is harmless afterwards
  });

  it('draws nothing for no weather', () => {
    const scene = fakeScene();
    const weather = new WeatherRenderer(scene, undefined);
    weather.update(16);
    expect(scene.made.length).toBe(0);
  });
});
