/**
 * saveStorage.test.js
 * ----------------------------------------------------------------------------
 * The one file that talks to the browser's storage, and what happens when
 * the browser will not cooperate: no localStorage at all, a localStorage that
 * throws on touch (privacy modes), and one that is merely full.
 */

import { describe, it, expect, afterEach, vi } from 'vitest';
import {
  STORAGE_KEYS, createMemoryStorage, createBrowserStorage, getStorage, setStorage,
  isStoragePersistent,
} from '../src/save/SaveStorage.js';

const realLocalStorage = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');

afterEach(() => {
  if (realLocalStorage) Object.defineProperty(globalThis, 'localStorage', realLocalStorage);
  else delete globalThis.localStorage;
  setStorage(null);
  vi.restoreAllMocks();
});

/** Install a stand-in localStorage for one test. */
function installLocalStorage(value) {
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, get: () => value });
}

describe('the keys', () => {
  it('are all distinct and share one prefix', () => {
    const keys = Object.values(STORAGE_KEYS);
    expect(new Set(keys).size).toBe(keys.length);
    for (const key of keys) expect(key.startsWith('aetheria-chronicles/')).toBe(true);
  });

  it('are exactly the two save slots and the settings', () => {
    expect(Object.keys(STORAGE_KEYS).sort()).toEqual(['autosave', 'manual', 'settings']);
  });
});

describe('the in-memory store', () => {
  it('behaves like localStorage for the three calls the game uses', () => {
    const store = createMemoryStorage();
    expect(store.getItem('a')).toBeNull();
    store.setItem('a', 5);
    expect(store.getItem('a')).toBe('5');
    store.removeItem('a');
    expect(store.getItem('a')).toBeNull();
  });

  it('can start with contents', () => {
    expect(createMemoryStorage({ x: 'y' }).getItem('x')).toBe('y');
  });

  it('keeps separate stores separate', () => {
    const a = createMemoryStorage();
    const b = createMemoryStorage();
    a.setItem('k', '1');
    expect(b.getItem('k')).toBeNull();
  });
});

describe('the browser store', () => {
  it('is unavailable when there is no localStorage at all', () => {
    installLocalStorage(undefined);
    expect(createBrowserStorage()).toBeNull();
  });

  it('is unavailable when merely touching localStorage throws', () => {
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      get: () => { throw new Error('SecurityError'); },
    });
    expect(createBrowserStorage()).toBeNull();
  });

  it('is unavailable when reading throws', () => {
    installLocalStorage({ getItem() { throw new Error('denied'); } });
    expect(createBrowserStorage()).toBeNull();
  });

  it('is still used when storage is merely FULL — full storage can still be read', () => {
    const data = new Map([[STORAGE_KEYS.manual, 'saved']]);
    installLocalStorage({
      getItem: (k) => (data.has(k) ? data.get(k) : null),
      setItem: () => { throw new Error('QuotaExceededError'); },
      removeItem: (k) => data.delete(k),
    });
    const store = createBrowserStorage();
    expect(store).not.toBeNull();
    expect(store.kind).toBe('localStorage');
    expect(store.getItem(STORAGE_KEYS.manual)).toBe('saved');
  });
});

describe('choosing the store', () => {
  it('uses localStorage when the browser allows it', () => {
    const data = new Map();
    installLocalStorage({
      getItem: (k) => (data.has(k) ? data.get(k) : null),
      setItem: (k, v) => data.set(k, v),
      removeItem: (k) => data.delete(k),
    });
    setStorage(null);
    expect(getStorage().kind).toBe('localStorage');
    expect(isStoragePersistent()).toBe(true);
  });

  it('falls back to memory — and says so — when it does not', () => {
    installLocalStorage(undefined);
    setStorage(null);
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(getStorage().kind).toBe('memory');
    expect(isStoragePersistent()).toBe(false);
    expect(warn).toHaveBeenCalledOnce();
  });

  it('decides once, and keeps the same store after that', () => {
    installLocalStorage(undefined);
    setStorage(null);
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(getStorage()).toBe(getStorage());
  });
});
