# Aetheria Chronicles

An original browser-based monster-catching RPG. Explore the region of Aetheria,
befriend creatures called **Aethers**, and challenge the region's Beacon Halls.

Built with [Phaser 3](https://phaser.io/) and [Vite](https://vite.dev/) in plain
JavaScript — no framework, no backend, no build magic to learn.

> **Status: Phase 2 (World) complete.**
> You can start a new game, explore Emberhollow Town and its four buildings, talk
> to the people who live there, pick things up, and walk Route 1 through tall
> grass that turns up wild Aethers. Creatures and battles are next — see
> [TODO.md](TODO.md).

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
| `npm run lint` | Check for unused variables, typos and undefined names |

---

## Controls

| Input | Action |
|-------|--------|
| Arrow keys / WASD | Move |
| Shift (hold) | Run |
| Space / Enter / E | Confirm, interact |
| Esc / X | Menu, back |
| `` ` `` (backtick) | Toggle the debug overlay |

In the browser console, `__gs()` returns the current playthrough — your position,
story flags and bag.

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
    items.js           Every item in the game
    encounters.js      Which wild Aethers live where
    maps/              One file per map, plus the map registry
  entities/
    Player.js          The player character and grid movement
    Npc.js             Non-player characters
  scenes/
    BootScene.js       Generates artwork, then hands off
    TitleScene.js      Title screen and main menu
    WorldScene.js      The overworld — connects the systems below
  systems/             Reusable logic
    TileMap.js         Parses map data, answers "can I walk here?"
    MapRenderer.js     Draws a TileMap
    TextureFactory.js  Generates all placeholder artwork
    NpcManager.js      Owns the NPCs on a map
    DialogueResolver.js Picks which lines an NPC says right now
    InteractionSystem.js What the player is pressing the button at
    EncounterSystem.js Whether tall grass turns something up
    InventorySystem.js The bag
  ui/
    Menu.js            Reusable keyboard menu
    DialogueBox.js     The text box at the bottom of the screen
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
                    ├── TileMap            what is walkable, where the exits are
                    ├── MapRenderer        drawing
                    ├── Player             grid movement, facing
                    ├── NpcManager         the people on this map
                    ├── DialogueBox        the text box
                    ├── DialogueResolver   which lines to show
                    ├── InteractionSystem  what you are facing
                    ├── EncounterSystem    wild Aethers in tall grass
                    ├── InputManager       keys → actions
                    └── DebugOverlay
```

Changing maps **restarts WorldScene** with new data. Everything it created is
released in its `cleanup()`, which is why you can walk in and out of buildings
all day without the game slowly filling up with dead objects.

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

### Add an NPC

Add an entry to a map's `npcs` array. No code required:

```js
npcs: [
  {
    id: 'baker',            // unique on this map; used in save data later
    name: 'Baker',          // shown on the dialogue name plate
    x: 8, y: 5,             // must be a walkable tile (a test checks this)
    facing: 'down',
    sprite: 'villager',     // a key from CHARACTER_PALETTES in config/assets.js
    movement: 'wander',     // 'static' | 'lookAround' | 'wander'
    wanderRadius: 2,        // how far from home a wanderer may stray
    dialogue: 'Fresh bread!',
  },
],
```

### Write dialogue that reacts to the story

Dialogue is data, and the **first matching branch wins**:

```js
dialogue: [
  { when: 'gotStarter', pages: ['Look after that Aether!'] },
  { unless: 'metWick',  pages: ['Professor Wick is looking for you.'] },
  { pages: ['Lovely weather.'] },        // no condition = fallback
],
```

- `when` — flag (or array of flags) that must **all** be set
- `unless` — flag(s) that must **all** be unset
- `setFlags` — flag(s) set when this conversation *finishes*
- `speaker` — overrides the NPC's name on the plate
- `pages` — one string per box of text

Always include an unconditional fallback branch, or the NPC will say nothing to a
new player. A test enforces this.

### Add a sign or a ground item

Both go in a map's `interactables` array:

```js
interactables: [
  { x: 9, y: 4, type: 'sign', dialogue: ['ROUTE 1', 'North: Thistlewood.'] },
  { x: 13, y: 8, type: 'item', item: 'potion', quantity: 1,
    flag: 'pickedUpRoute1Potion' },
],
```

A ground item blocks its tile until you face it and take it. The `flag` is what
makes it stay collected, so every ground item needs its own unique one.

### Connect two maps

Add an exit to each map, pointing at a spawn point on the other:

```js
// in emberhollow.js
exits: [{ x: 6, y: 6, to: 'playerHouse', spawn: 'default' }],

// in playerHouse.js
spawnPoints: { default: { x: 5, y: 6, facing: 'down' } },
exits: [{ x: 5, y: 7, to: 'emberhollow', spawn: 'fromPlayerHouse' }],
```

Put the arrival spawn **next to** the doorway rather than on it, so walking
through a door never bounces you straight back. Tests check that every exit
points at a map that exists and a spawn point that map actually defines.

### Add wild Aethers to an area

Add a table to `src/data/encounters.js` and name it on the map:

```js
// encounters.js
route2: [
  { species: 'zaplet', minLevel: 8, maxLevel: 11, weight: 40 },
  { species: 'gustwing', minLevel: 9, maxLevel: 12, weight: 10 },  // rarer
],

// route2.js
encounterTable: 'route2',
```

Weights are relative, not percentages. Any map with tall grass (`"`) must name a
table — a test will tell you if you forget.

### Add a tile type

Add an entry to `TILE_DEFINITIONS` in `src/data/tiles.js`, then add a matching
texture generator in `src/systems/TextureFactory.js`. A test enforces that every
tile has artwork, so you cannot forget the second half.

```js
'^': { id: 'mountain', solid: true, texture: 'tile-mountain' },
```

Supported tile options:

| Option | Meaning |
|--------|---------|
| `solid` | The player cannot walk onto it |
| `encounter` | Standing on it can start a wild encounter |
| `overhead` | Drawn *on top of* the player (tree canopies) |
| `counter` | The player can talk to whoever stands behind it |
| `object` | Furniture: drawn transparently over the map's `objectBase` floor |
| `ledge` | A one-way hop (terrain exists; hopping is not implemented yet) |

**Furniture and floors.** Furniture textures are drawn with a see-through
background, and each interior names the floor beneath them:

```js
export const myShop = {
  interior: true,
  objectBase: 'O',   // furniture is drawn on top of this floor tile
  ...
};
```

That is why one table texture looks right on floorboards in a house *and* on
tiles in the shop.

### Change how the game feels

Almost every tuning number lives in `src/config/balance.js` — walk speed,
encounter rate, damage variance, critical hit chance, starting money. Each one
has a comment explaining why it is set the way it is.

### Add a character look

Add a palette to `CHARACTER_PALETTES` in `src/config/assets.js`:

```js
baker: {
  hair: 0x8a6438, skin: 0xe8b88a, skinShade: 0xc99465,
  tunic: 0xf0ece2, tunicShade: 0xcfc9bb,
  trousers: 0x59606e, boots: 0x33383f, accent: 0xe8a33d,
},
```

The sprite sheet and all four walk animations are generated for you. The key
(`baker`) is what you put in an NPC's `sprite` field.

### Creatures, moves and trainers

These do not exist yet. They arrive in Phases 3–8; see [TODO.md](TODO.md) for the
plan and [GAME_DESIGN.md](GAME_DESIGN.md) for the designs. They will follow the
same pattern as everything above: a data file in `src/data/`, a registry function
that fails loudly on a bad id, and a validation test.

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

217 tests covering map parsing, collision, spawn fallbacks, map validation, game
state, story flags, random helpers, dialogue branching, encounter rolling and its
anti-ambush cooldown, inventory operations, and interaction targeting.

A large block of them are **data integrity** checks that run automatically over
every map you add. They catch, without you writing a line of test code:

- ragged rows and unknown tile characters
- NPCs standing inside walls or furniture, or on top of each other
- duplicate NPC ids, or a sprite that has no palette
- spawn points inside walls, on NPCs, or on exit tiles
- exits pointing at a map that does not exist, or a spawn point it does not define
- ground items that are unreachable or missing their flag
- tall grass on a map with no encounter table
- an NPC with nothing to say to a brand new player
- a tile with no artwork, or a key binding Phaser does not recognise

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
