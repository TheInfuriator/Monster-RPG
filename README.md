# Aetheria Chronicles

An original browser-based monster-catching RPG. Explore the region of Aetheria,
befriend creatures called **Aethers**, and challenge the region's Beacon Halls.

Built with [Phaser 3](https://phaser.io/) and [Vite](https://vite.dev/) in plain
JavaScript — no framework, no backend, no build magic to learn.

> **Status: Phase 4 (Battles) complete.**
> Start a new game, explore Emberhollow, choose your first Aether from Professor
> Wick, then **fight a real turn-based battle** at the Warden's Lodge — type
> matchups, status conditions, switching, items, experience, level-ups, new moves
> and evolution all work. Wild encounters are next — see [TODO.md](TODO.md).

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
    types.js           The 18 types and the effectiveness chart
    battles.js         Scripted battles
    moves.js           Every move in the game
    moveEffects.js     The vocabulary of what a move can do
    statuses.js        Poison, burn, paralysis, sleep
    creatures.js       Every Aether species
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
    StarterSelectScene.js  Choosing your first Aether
    BattleScene.js     The battle screen — presentation only
  systems/             Reusable logic
    TileMap.js         Parses map data, answers "can I walk here?"
    MapRenderer.js     Draws a TileMap
    TextureFactory.js  Generates all placeholder artwork
    NpcManager.js      Owns the NPCs on a map
    DialogueResolver.js Picks which lines an NPC says right now
    InteractionSystem.js What the player is pressing the button at
    EncounterSystem.js Whether tall grass turns something up
    InventorySystem.js The bag
    TypeChart.js       How much a move type hurts a creature type
    StatCalculator.js  Stats, growth curves and experience thresholds
    CreatureFactory.js Species + level -> one individual creature
    PartySystem.js     The player's team
    DebugTools.js      Developer console helpers (window.debug)
    battle/            The battle system — no Phaser, fully unit tested
      BattleEngine.js      battle state and orchestration
      DamageCalculator.js  the damage formula, accuracy, crits
      TurnResolver.js      who goes first
      StatusSystem.js      poison, burn, paralysis, sleep
      StatStages.js        the -6..+6 battle buffs and debuffs
      MoveEffectRunner.js  carries out move effects by KIND
      ExperienceSystem.js  rewards, levels, move learning, evolution
      BattleAI.js          opponent decisions
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

### Add a creature

Add an entry to `src/data/creatures.js`:

```js
frostnip: {
  id: 'frostnip', number: 28, name: 'Frostnip',
  description: 'Two full sentences describing what it is and what it does.',
  types: ['ice'],                 // one or two, from src/data/types.js
  baseStats: { hp: 45, attack: 50, defense: 45, spAttack: 60, spDefense: 50, speed: 55 },
  growthRate: 'medium',           // 'fast' | 'medium' | 'slow'
  baseExp: 60,                    // experience awarded for defeating it
  catchRate: 190,                 // 0-255; HIGHER is easier to catch
  evolution: null,                // or { method: 'level', level: 22, to: 'frostbite' }
  appearance: { body: 'blob' },   // one of the 8 body shapes
  learnset: [
    { level: 1, move: 'tackle' },
    { level: 1, move: 'iceShard' },
    { level: 8, move: 'mistGuard' },
  ],
},
```

That is the whole process. The tests then check — with no test code from you —
that the types exist, the stats are sane, the growth rate is real, every move in
the learnset exists, the levels are in order, it has a damaging move at level 1,
its body shape can be drawn, and its evolution target exists and is stronger.

**Learnsets** are `{ level, move }` pairs in ascending level order. Everything at
level 1 is known from the moment the creature exists. A creature only ever
carries four moves, so `getMovesAtLevel()` keeps the four most recently learned.

**Evolutions** are declared on the creature that evolves, pointing forward:

```js
evolution: { method: 'level', level: 16, to: 'cindraw' },
```

`method` is always `'level'` today; the field exists so item and trade evolutions
can be added later without changing the shape. `getPendingEvolution(creature)`
tells you whether a creature is ready.

### Add a move

Add an entry to `src/data/moves.js`:

```js
iceShard: {
  id: 'iceShard', name: 'Ice Shard', type: 'ice', category: 'physical',
  power: 40, accuracy: 100, pp: 30, priority: 1,
  description: 'A splinter of ice thrown fast enough to strike first.',
  effect: { kind: 'statChange', target: 'foe', stat: 'speed', stages: -1, chance: 0.2 },
},
```

- `category` is `'physical'` (Attack vs Defense), `'special'` (Sp. Atk vs Sp. Def)
  or `'status'` (no damage — `power` must be `null`).
- `accuracy: null` means the move never misses.
- `effect` is optional. The available kinds are listed in
  `src/data/moveEffects.js`: `status`, `statChange`, `heal`, `drain`, `recoil`,
  `multiHit`, `flinch`. Each has a required shape that the tests enforce.

Defining effects as KINDS rather than per-move code is what lets the battle
engine handle each behaviour once, instead of growing a switch over move names.

### How type effectiveness works

The chart lives in `src/data/types.js` as a sparse table — only non-neutral
matchups are written down, so anything missing is neutral:

```js
fire: { fire: 0.5, water: 0.5, grass: 2, ice: 2, bug: 2, rock: 0.5, dragon: 0.5, steel: 2 },
```

Ask `TypeChart` rather than reading the table yourself:

```js
getEffectiveness('rock', ['bug', 'flying'])   // 4   — 2 x 2
getEffectiveness('grass', ['fire', 'flying']) // 0.25 — 0.5 x 0.5
getEffectiveness('ground', ['steel', 'flying'])// 0  — one immunity wins
```

Multipliers for each defending type are **multiplied together**, which is why 4x
and 0.25x exist and why a single immunity beats any number of weaknesses.

### How stat calculation works

`src/systems/StatCalculator.js`:

```
HP     = floor(2 * base * level / 100) + level + 10
others = floor(2 * base * level / 100) + 5
```

HP gets the extra `+ level + 10` so low-level battles are not decided by one hit.
Two creatures of the same species and level have identical stats — there is no
hidden individual variance, deliberately.

Experience uses three cubic curves, differing only by a multiplier:

| Rate | Formula | Feel |
|------|---------|------|
| `fast` | `0.8 x level^3` | common route creatures |
| `medium` | `1.0 x level^3` | most species, including starters |
| `slow` | `1.25 x level^3` | heavy hitters like Cragmaw |

### How CreatureFactory builds an individual

A **species** is shared data. An **instance** is one creature you own.

```js
const creature = createCreature('pyrret', 5, { metAt: "Warden's Lodge" });
```

It looks up the species, calculates stats for that level, takes the four most
recently learned moves at full PP, sets experience to that level's threshold on
the species' growth curve, fills HP, and stamps a unique `instanceId`.

`stats` is stored on the instance as a **cache** — it is derived from species and
level, so `recalculateStats(creature)` refreshes it after a level-up or evolution
(and after a balance change, to bring an old save back in line).

### How a battle is put together

Three layers, deliberately separated:

| Layer | Where | Knows about |
|-------|-------|-------------|
| Rules | `src/systems/battle/*` (except BattleEngine) | maths only — no state, no Phaser |
| State | `BattleEngine.js` | who is out, whose turn, what happened |
| Screen | `BattleScene.js` | drawing, animation, input |

`BattleEngine` reports everything as **events** — `{ type: 'message', text }`,
`{ type: 'damage', side, amount }`, `{ type: 'faint', side }` — and the scene
plays them back at reading speed. That is why an entire battle can be fought in
a unit test with no browser.

**The damage formula** (`DamageCalculator.js`):

```
base   = floor(floor(floor(2 * level / 5 + 2) * power * attack / defense) / 50) + 2
damage = floor(base * STAB * effectiveness * critical * burn * variance)
```

Physical moves use Attack vs Defense, special use Sp. Atk vs Sp. Def, status
moves never reach the formula. A move that connects always does at least 1
damage; an immune defender takes exactly 0.

**Turn order** (`TurnResolver.js`), highest wins:

1. **Action** priority — run > switch > item > move
2. **Move** priority — Quick Jab and Shadow Sneak go early
3. **Effective Speed** — stat, times its stage, halved if paralysed
4. A coin, so a true tie is not always won by the same side

**Stat stages** run -6 to +6 and live on the battler, never on the creature, so
they vanish when the battle ends. Switching clears them: buffs belong to the
creature that earned them.

**Status rules:** one major status at a time; poison and burn deal residual
damage at the *end* of the turn, so a creature always gets its turn first; burn
halves physical damage only; paralysis halves Speed and sometimes costs the
turn; sleep of N turns always costs exactly N turns.

**PP is spent when a move is used**, hit or miss. If every move is empty the
creature Struggles, so a battle can never deadlock.

### Create a scripted battle

Add an entry to `src/data/battles.js`:

```js
riverboatDuel: {
  id: 'riverboatDuel',
  battleType: 'trainer',           // 'wild' | 'trainer' | 'practice'
  opponentName: 'Ferryman Coll',
  party: [{ species: 'dampling', level: 12 }],
  canRun: false,
  awardExperience: true,
  rewardMoney: 300,
},
```

Then point an NPC's dialogue at it with the `action` seam and add a case to
`runDialogueAction()` in `WorldScene`. That is the whole wiring.

### Add a new kind of move effect

Effects are handled by KIND, never by move id — that is what lets 56 moves share
one implementation. To add a kind:

1. Add it to `EFFECT_KINDS` in `src/data/moveEffects.js`
2. Add a case to `runEffect()` in `src/systems/battle/MoveEffectRunner.js`
   and list it in `SUPPORTED_EFFECT_KINDS`
3. Add its required shape to the move test

A test asserts every kind the database uses has an implementation, so a new kind
cannot ship half-done.

### Experience, levels, moves and evolution

```
exp = floor(baseExp * defeatedLevel / 7) x (1.5 for a trainer)
```

Every creature that was **sent out** during the battle receives the full amount
— not a split, so switching stays attractive.

On level-up the creature keeps the damage it had taken and gains the extra max
HP as real HP: levelling always feels like a gain, but never silently heals a
badly hurt creature. Several levels can be crossed at once, and every move
learned along the way is offered in order.

With fewer than four moves a new one is learned automatically. With four, the
player picks one to forget or declines — and cancelling counts as declining, so
there is no way to get stuck in the prompt.

Evolution keeps the creature's identity: same `instanceId`, same nickname, same
experience, same moves. Only the species, the stats and the artwork change.

### Debug tools

Open the browser console and type `debug.help()`. Useful ones:

```js
debug.give('drizzle', 15)     // add a creature
debug.wild('zaplet', 8)       // start a wild battle
debug.trainer('lodgePractice')// start a scripted battle
debug.level(16)               // set a level (try 16 to see an evolution)
debug.exp(500)                // grant experience
debug.status('burn')          // inflict a status
debug.hp(5)                   // set current HP
debug.heal()                  // full heal
```

Nothing in the game imports `DebugTools.js` — it only reaches in, so deleting it
would not change how the game plays.

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

### Trainers and battles

These do not exist yet. They arrive in Phases 4 and 8; see [TODO.md](TODO.md) for
the plan. They will follow the same pattern as everything above: a data file in
`src/data/`, a registry function that fails loudly on a bad id, and validation
tests that run over the whole file.

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

1449 tests covering map parsing, collision, spawn fallbacks, map validation, game
state, story flags, random helpers, dialogue branching, encounter rolling and its
anti-ambush cooldown, inventory operations, interaction targeting, type
effectiveness, the move and creature databases, stat and experience maths, the
creature factory, the party, the starter-selection rules, and the whole battle
system — damage, accuracy, crits, turn order, stat stages, status conditions,
every move effect, experience, level-ups, move learning and evolution.

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
- a move with an unknown type, impossible accuracy or malformed effect
- a species with a bad stat, a learnset move that does not exist, or an
  evolution pointing at nothing
- an evolution loop, or an evolved form that is not stronger than its base
- a body shape with no drawing routine (and a routine no species uses)
- dialogue that asks for an `action` the game cannot run
- a move whose effect kind the battle engine cannot run
- an item whose battle effect the scene does not understand
- a scripted battle referencing a species that does not exist

Twenty-five seeded battles are also played to completion in the test suite, and
every one of the 56 moves is used in a real battle to check nothing throws and
HP never leaves its bounds.

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
