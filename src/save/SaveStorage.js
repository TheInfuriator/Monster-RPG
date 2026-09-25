/**
 * SaveStorage.js
 * ----------------------------------------------------------------------------
 * The ONLY file that talks to the browser's storage.
 *
 * Everything else asks for "the storage" and gets an object with three
 * methods — getItem, setItem, removeItem — the same three localStorage has.
 * That one seam is what makes the save system testable: the unit tests hand
 * in a plain in-memory store, or one that deliberately throws, and exercise
 * every rule without a browser.
 *
 * THE KEYS
 * Every key the game writes is listed in STORAGE_KEYS, and nothing else
 * writes any other. They share a prefix so they are easy to find in the
 * browser's devtools (Application → Local Storage) and never collide with
 * another game served from the same address.
 */

export const STORAGE_KEYS = {
  /** The player's own save, written only when they choose Save. */
  manual: 'aetheria-chronicles/save/manual',
  /** Written by the game at safe moments. Never touches the manual save. */
  autosave: 'aetheria-chronicles/save/autosave',
  /** Text speed and volume. Global: not part of any save, kept across New Game. */
  settings: 'aetheria-chronicles/settings',
};

/**
 * A store that lives only in memory. Used by the tests, and by the game
 * itself if the browser will not give it real storage.
 *
 * @param {Record<string, string>} [initial] keys to start with
 */
export function createMemoryStorage(initial = {}) {
  const data = new Map(Object.entries(initial));
  return {
    kind: 'memory',
    getItem: (key) => (data.has(key) ? data.get(key) : null),
    setItem: (key, value) => {
      data.set(key, String(value));
    },
    removeItem: (key) => {
      data.delete(key);
    },
  };
}

/**
 * The browser's localStorage, or null when it cannot be used.
 *
 * Some browsers refuse storage outright — privacy modes, a page opened from
 * disk, storage disabled in settings — and merely touching `localStorage`
 * throws. That must never stop the game starting.
 *
 * Only a READ is attempted here. A test write would fail when storage is
 * full, and falling back to memory then would hide saves that are still
 * perfectly readable.
 */
export function createBrowserStorage() {
  try {
    const store = globalThis.localStorage;
    if (!store) return null;
    store.getItem(STORAGE_KEYS.settings);

    return {
      kind: 'localStorage',
      getItem: (key) => store.getItem(key),
      setItem: (key, value) => store.setItem(key, value),
      removeItem: (key) => store.removeItem(key),
    };
  } catch {
    return null;
  }
}

let activeStorage = null;

/** The store in use: localStorage when the browser allows it, memory otherwise. */
export function getStorage() {
  if (!activeStorage) {
    activeStorage = createBrowserStorage();
    if (!activeStorage) {
      console.warn(
        '[Save] This browser will not let the game use storage, so progress and ' +
          'settings will only last until the page is closed.'
      );
      activeStorage = createMemoryStorage();
    }
  }
  return activeStorage;
}

/** True when saves will survive a reload. */
export function isStoragePersistent() {
  return getStorage().kind === 'localStorage';
}

/** Swap the store. Tests use this; the game never does. Pass null to reset. */
export function setStorage(storage) {
  activeStorage = storage;
}
