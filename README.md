# Aetheria Chronicles

An original browser-based monster-catching RPG. Explore the region of Aetheria,
befriend creatures called **Aethers**, and challenge the region's Beacon Halls.

Built with [Phaser 3](https://phaser.io/) and [Vite](https://vite.dev/) in plain
JavaScript — no framework, no backend, no build magic to learn.

> **Status: Phase 1 (Foundation) complete.**
> You can start a new game and walk around Emberhollow Town. Battles, creatures,
> NPCs, and everything else are on the roadmap in [TODO.md](TODO.md).

---

## Quick start

```bash
npm install
npm run dev
```

Then open the URL it prints (usually <http://localhost:5173>).

| Command | What it does |
|---------|--------------|
| `npm run dev` | Start the dev server with hot reload |
| `npm run build` | Build a production bundle into `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm test` | Run the test suite once |
| `npm run test:watch` | Re-run tests as you edit |

---

## Controls

| Input | Action |
|-------|--------|
| Arrow keys / WASD | Move |
| Shift (hold) | Run |
| Space / Enter / E | Confirm, interact |
| Esc / X | Menu, back |
| `` ` `` (backtick) | Toggle the debug overlay |

Tapping a direction you are **not** already facing turns you on the spot rather
than moving. That is deliberate — it is how you face something to interact with it.

---

## Project layout

```
src/
  main.js              Creates the Phaser game and registers scenes
  config/              Tuning knobs — start here to change how things feel
    gameConfig.js      Resolution, tile size, colour palette, text styles, depths
    balance.js         Gameplay numbers (encounter rate, damage variance, ...)
    controls.js        Key bindings
    assets.js          Texture keys and sprite-sheet layout
  core/
    GameState.js       Everything about the current playthrough
    InputManager.js    Turns key presses into named actions
  data/                Game CONTENT — no logic, just data
    tiles.js           What each map character means
    maps/              One file per map, plus the map registry
  entities/
    Player.js          The player character and grid movement
  scenes/
    BootScene.js       Generates artwork, then hands off
    TitleScene.js      Title screen and main menu
    WorldScene.js      The overworld
  systems/             Reusable logic
    TileMap.js         Parses map data, answers "can I walk here?"
    MapRenderer.js     Draws a TileMap
    TextureFactory.js  Generates all placeholder artwork
  ui/
    Menu.js            Reusable keyboard menu
    DebugOverlay.js    Developer readout
  utils/
    rng.js             Random helpers (seeded, weighted picks)
    transitions.js     Shared fade-between-scenes helper
tests/                 Vitest tests for logic and data integrity
```

### The two rules that keep this maintainable

1. **Content lives in `src/data/`, logic lives in `src/systems/`.**
   Adding a creature or a map should never mean editing a scene.
2. **Logic modules avoid importing Phaser where they can.**
   `TileMap.js` is plain JavaScript, so it is unit-testable without a browser.
   Anything that draws goes in a `scenes/`, `ui/`, or `*Renderer` file instead.

---

## How the pieces fit together

```
main.js
  └── BootScene      generates every texture, registers animations
        └── TitleScene    menu → starts a new game
              └── WorldScene
                    ├── TileMap        (rules: what is walkable)
                    ├── MapRenderer    (drawing)
                    ├── Player         (grid movement, facing)
                    ├── InputManager   (keys → actions)
                    └── DebugOverlay
```

`GameState` sits beside all of it. Scenes read and write that one shared object,
which is what lets the player's position survive a scene change — and what the
save system will serialise later.

---

## How to add things

### Add a map

1. Create `src/data/maps/yourMap.js`:

   ```js
   export const yourMap = {
     id: 'yourMap',
     name: 'Your Map',
     tiles: [
       'TTTTT',
       'T...T',
       'T."-T',
       'TTTTT',
     ],
     spawnPoints: {
       default: { x: 1, y: 1, facing: 'down' },
     },
     exits: [],
   };
   ```

2. Register it in `src/data/maps/index.js`.

That is the whole process. Every row **must** be the same length; if it is not,
the game refuses to load the map and tells you exactly which row is wrong.

The tests then automatically check your new map for unknown characters, spawn
points inside walls, and holes in the border — you do not have to write a test.

### Add a tile type

Add an entry to `TILE_DEFINITIONS` in `src/data/tiles.js`, then add a matching
texture generator in `src/systems/TextureFactory.js`. A test enforces that every
tile has artwork, so you cannot forget the second half.

```js
'^': { id: 'mountain', solid: true, texture: 'tile-mountain' },
```

Supported tile options: `solid`, `encounter`, `overhead`, `ledge`.

### Change how the game feels

Almost every tuning number lives in `src/config/balance.js` — walk speed,
encounter rate, damage variance, critical hit chance, starting money. Each one
has a comment explaining why it is set the way it is.

### Creatures, moves, trainers, encounters

These systems do not exist yet. They arrive in Phases 3–8; see
[TODO.md](TODO.md) for the plan and [GAME_DESIGN.md](GAME_DESIGN.md) for the
designs they will implement. They will follow the same pattern as maps: a data
file in `src/data/`, a registry, and a validation test.

---

## Artwork

There are **no image files in this repository**. Every sprite and tile is drawn
at runtime by `src/systems/TextureFactory.js` using the Canvas 2D API, from one
shared palette in `src/config/gameConfig.js`.

This keeps the project free of licensing concerns and makes the game look
cohesive. To swap in real artwork later, load images under the existing keys in
`src/config/assets.js` and delete the matching generator — nothing else changes.

---

## Testing

```bash
npm test
```

The suite covers map parsing, collision, spawn-point fallbacks, map validation,
game state, story flags, the random helpers, and data integrity (every map is
checked for typos and unreachable spawns, every tile is checked for artwork,
every key binding is checked against Phaser's real key names).

Gameplay is additionally verified in a real browser with Playwright during
development — see the Verification section of [CHANGELOG.md](CHANGELOG.md).

---

## Documentation

- [GAME_DESIGN.md](GAME_DESIGN.md) — the region, creatures, type chart, gyms, story
- [TODO.md](TODO.md) — the phased roadmap and current progress
- [CHANGELOG.md](CHANGELOG.md) — what changed in each milestone

---

## Licensing and originality

All creatures, names, characters, maps, dialogue, story, and artwork in this
project are original. The game's mechanics are inspired by classic
monster-catching RPGs, but no copyrighted assets from any existing game are used.
