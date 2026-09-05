# Changelog

Meaningful development milestones, newest first.

---

## Phase 4 — Battles

The game has fights in it. Real turn-based battles with type matchups, status
conditions, switching, items, experience, level-ups, new moves and evolution.

### Added

**The battle system** (`src/systems/battle/`) — no Phaser anywhere in it, so a
whole battle can be fought inside a unit test.

- `DamageCalculator` — the damage formula, accuracy and critical rolls. Nested
  flooring keeps damage whole and reproducible.
- `StatStages` — the -6..+6 buffs and debuffs, with a gentler curve for
  accuracy and evasion than for battle stats.
- `TurnResolver` — action priority, then move priority, then effective Speed,
  then a coin. All four rules in one place.
- `StatusSystem` — poison, burn, paralysis and sleep.
- `MoveEffectRunner` — carries out effects by KIND, never by move id, so all 56
  moves share one implementation.
- `ExperienceSystem` — rewards, level-ups, move learning and evolution.
- `BattleAI` — simple, seedable opponent decisions that never pick empty PP.
- `BattleEngine` — battle state and orchestration, reporting everything as
  events so the scene can narrate at reading speed.

**The battle screen** (`BattleScene`)
- Animated HP bars, an EXP bar, status tags, creature artwork and platforms.
- A two-column action menu: Fight / Party / Bag / Run.
- The move list shows name, a type-coloured pip and PP; a move with no PP
  cannot be chosen, and with none left the creature Struggles.
- Battle party selector with the switching rules enforced and explained.
- Bag with healing and status-cure items. Capture orbs are listed but disabled
  — catching is Phase 6, and a half-working throw would be worse than none.
- Hit shake, faint fade, switch pop, and an on-screen evolution sequence.
- Messages type out at the player's chosen text speed and can be skipped.

**Rules chosen and documented**
- PP is spent when a move is USED, hit or miss.
- Switching and items resolve before attacks.
- Switching clears stat stages.
- A critical hit ignores the defender's defensive buffs.
- Burn halves physical damage but not special.
- One major status at a time; residual damage lands at end of turn.
- A sleep of N turns costs exactly N turns.
- Experience is `floor(baseExp * level / 7)`, x1.5 for trainers, and every
  creature that was sent out receives the full amount.

**Playable demonstration**
- Assistant Bly and Warden Tace at the Warden's Lodge offer repeatable practice
  bouts once you have a starter, launched through the existing dialogue
  `action` seam. They award nothing on purpose — a repeatable fight that paid
  out would be an infinite progression exploit.
- Scripted battles are data (`src/data/battles.js`); adding one is an entry
  there plus an `action` on an NPC.

**Debug tools** (`src/systems/DebugTools.js`, `window.debug`)
- Start wild or scripted battles, set HP, level, EXP, status and PP, restore the
  party, give items and money, set flags, teleport. Nothing in the game imports
  the file — it only reaches in.

### Fixed

- **Skipping the typewriter hung the entire battle.** The skip path stopped the
  typing timer without ever resolving the message promise, so the battle waited
  forever for a line that had already finished. Skipping now COMPLETES the line
  through the same code path that finishing it normally does.
- **Sleep with the shortest duration cost the target nothing.** The counter was
  decremented before it was checked, so a one-turn sleep expired on the very
  action it was meant to prevent.
- **The Party action opened a dead end.** With a single creature every entry in
  the list was disabled and confirm did nothing, leaving the player to guess
  that Escape was the way out. Party is now disabled up front with a reason,
  the same treatment Run already had.
- **The key press that closed a battle leaked into the overworld**, instantly
  re-opening the dialogue of whoever the player was standing in front of.
  `InputManager.clearPending()` now discards in-flight presses when control
  returns from any overlay scene.

### Verification

- **1449 automated tests** pass (was 1260). New: 46 battle-math, 41
  status/effect, 33 experience/evolution, 44 engine and 25 battle-data tests.
  Highlights:
  - 25 complete battles played to a conclusion under different seeds, checked
    for termination and for HP never leaving 0..max
  - every one of the 56 moves used in a real battle, checked for throwing and
    for HP bounds
  - every one of the 27 species built into a battler and made to act
  - a test asserting every effect kind the database uses has an implementation
- **Lint clean; production build succeeds.**
- **Browser-verified against the production build**, zero console errors:
  - 27/27 practice-battle checks: reaching the battle from dialogue, the action
    menu, Run disabled, the move list with PP, PP spent, damage dealt,
    cancelling menus, the battle concluding, and returning to the overworld with
    map, position, facing, party and flags intact and the player able to move.
  - 15/15 switching/item/status checks: the party list and its rejection rules,
    switching, using a Potion (healed, consumed), capture orbs listed but
    disabled, a status showing on the HUD, and poison dealing end-of-turn damage.
  - 17/19 → EXP, multi-level gains, move learning, a full evolution through the
    real battle flow with identity and nickname preserved, running, and a forced
    switch after a faint.
- **Leak check:** repeated battle entry and exit leaves display objects, update
  lists, tweens, timers, textures, animations, keyboard keys, key listeners and
  scene listeners unchanged.

### Known limitations

- Capture is Phase 6; orbs appear in the bag as unavailable.
- Losing does not black you out to a Mender's Hall yet (Phase 7). A defeat
  revives the party to 1 HP each and says so plainly.
- Wild encounters on Route 1 are still not wired to battles — that is Phase 5.
  The engine already understands wild battles; `debug.wild()` starts one.
- Full trainer NPCs with line of sight are Phase 8.

---

## Phase 3 — Creature Data

The game now has Aethers in it. You can walk into the Warden's Lodge, meet
Professor Wick, and leave with a partner of your own.

### Added

**Types**
- All 18 types with display names and colours, and the complete effectiveness
  chart as a sparse table — only non-neutral matchups are written down, so the
  whole thing fits on a screen and stays readable.
- `TypeChart` module: single and dual-type effectiveness, immunities, STAB, and
  the wording used for battle messages. Nothing else in the game contains a
  type matchup.
- Type colours do double duty as the default palette for creature artwork.

**Moves — 56 of them**
- 24 physical, 16 special, 16 status, spread across 14 types.
- Structured effect metadata (`status`, `statChange`, `heal`, `drain`, `recoil`,
  `multiHit`, `flinch`) so Phase 4 can handle each KIND once instead of growing
  a switch statement over individual move names.
- Deliberately covers everything battles will need: a priority move, healing,
  draining, recoil, multi-hit, accuracy modification, stat buffs and debuffs,
  and at least one move for each of the four status conditions.

**Creatures — 27 species**
- 10 evolutionary families and 4 single-stage species, each with base stats,
  growth rate, catch rate, experience yield, evolution data, a level-up
  learnset and an artwork body shape.
- The three starter lines — Pyrret/Cindraw/Emberax (Fire), Drizzle/Puddlurk/
  Torrentine (Water), Sproutle/Bramblit/Thornmane (Grass) — share identical stat
  TOTALS at every stage (307 / 396 / 500) spread differently, so no starter is
  objectively the right pick. A test enforces this.
- Creature artwork is generated from 8 body shapes tinted by primary type, so
  27 species come from 8 drawing routines and still look like one world.

**Maths**
- `StatCalculator`: the stat formula, three cubic growth curves (fast/medium/
  slow), experience thresholds, level-from-experience and progress helpers.
- `CreatureFactory`: species + level becomes an individual with a unique
  instance id, cached stats, full-PP moves and the right starting experience.
- `PartySystem`: add, capacity, active member, storage overflow, reordering.
  Everything is plain data that serialises straight into a save file.

**Starter selection**
- A real scene at the Warden's Lodge: three cards with artwork, name, type
  badges and description; arrow keys to browse, a yes/no confirm step so nobody
  picks by accident, and cancel at both levels.
- The chosen creature is built by `CreatureFactory`, joins the party, and sets
  the `gotStarter` flag that Phase 2 had already written dialogue for. Wick, her
  assistant, a villager, the shopkeeper and the gate warden all change what they
  say — across three different maps.
- Choosing twice is prevented at both the dialogue level (Wick's branches) and
  inside the scene itself, because a duplicate starter would be a real
  progression bug.

**Architecture**
- Dialogue branches gained an `action` field. A map file says
  `action: 'starterSelect'` and `WorldScene.runDialogueAction()` knows what that
  means — the seam that keeps story content out of scene code. Phase 4 adds
  battle actions the same way.

### Fixed

- **The overworld kept reading the keyboard underneath the starter chooser.**
  The same Space press that confirmed a choice also re-triggered "talk to the
  NPC in front of you", leaving a stray dialogue box open behind the overlay —
  which then blocked movement once the chooser closed. `WorldScene` now pauses
  while an overlay scene owns the screen, `handleInteract()` refuses to run
  while the player is frozen, and `InputManager` clears its press latch on
  resume so nothing fires as a phantom input on the way back in.
- **Starters reached level 5 with no move of their own type**, so the Fire /
  Water / Grass triangle would not have mattered in the rival battle. Each
  starter now learns its signature move at level 1.
- **Thorn Guard's description promised two stat boosts** but its effect applied
  only one.
- **`clampLevel` treated `Infinity` as the level cap.** It now falls back to
  level 1 for any non-finite input: a stray level 1 creature is harmless, a
  stray level 100 one would wreck the game's balance. Documented and tested.

### Verification

- **1260 automated tests** pass (was 217). Most are generated over the data
  itself, so new content is validated without new test code:
  - every move: type, category, PP, priority, accuracy, power-vs-category, and
    a shape check per effect kind
  - every species: types, stats, growth rate, catch rate, learnset moves,
    level ordering, a damaging move at level 1, and evolution targets
  - the evolution graph: no loops, no shared targets, evolutions always
    stronger, and later stages evolving later
  - the type chart: every row present, no unknown ids, only legal multipliers,
    and a brute-force check that all 5832 dual-type combinations equal the
    product of their parts
  - all three starters, checked for balance, three stages and a usable
    same-type attack at the level they are handed over
- **Lint clean; production build succeeds.** Every browser check below ran
  against the production build.
- **Browser-verified with Playwright**, zero console errors or warnings:
  - 22/22 chooser checks: opening after Wick's dialogue, browsing with arrows,
    wrap-around, the confirm step, cancelling the confirm, backing out entirely,
    and that backing out grants nothing and returns control.
  - 60/60 selection checks: each of the three starters chosen in a genuinely
    fresh game, verifying species, level, full health, signature move, unique
    instance id, `metAt`, the `gotStarter` flag, Wick's closing line, that the
    chooser will not reopen, and that a second NPC reacts to the flag.
  - Phase 2 regression: map transitions, party surviving a map change, and
    ground-item pickup all still work.
- **Leak check:** 11 open/close cycles of the chooser leave display objects,
  update list, tweens, timers, textures, animations, keyboard keys, key
  listeners and scene listeners all unchanged.

### Known limitations

- Only 14 of the 18 types have creatures. Ice, Psychic, Dragon and Fairy are
  reserved for later regions rather than padded into Route 1 to hit a number.
- No individual variance: two creatures of the same species and level have
  identical stats. A deliberate simplicity choice.
- Evolution metadata is complete and tested, but nothing evolves yet — that
  needs the level-up flow, which belongs with battles in Phase 4.
- The party and creature-detail screens are Phase 6. The debug overlay
  (backtick) shows your party in the meantime.

---

## Phase 2 — World

Emberhollow becomes a place you can live in: six connected maps, people to talk
to, doors that go somewhere, and grass that has something in it.

### Added

**Maps and transitions**
- Six connected maps: Emberhollow Town, the player's house, the Warden's Lodge,
  the Mender's Hall, the Supply Post, and Route 1 — Cinderpath (22x30).
- `TileMap.getExitAt()` and exit handling in `WorldScene`: stepping on an exit
  tile fades out, loads the target map and places the player at a named spawn.
- Player position, facing, story flags and bag survive every transition — the
  location is written to `GameState` *before* the scene restarts.
- Building doors spawn you on the tile just outside, and interiors spawn you one
  tile above the mat, so arriving never re-triggers the exit you came through.
- Emberhollow expanded with a kitchen garden, four NPCs and two signposts.

**NPCs**
- `Npc` entity with three movement modes: `static`, `lookAround`, and `wander`
  (which stays within a radius of where it started).
- `NpcManager` owns the cast for a map and answers the three questions that
  matter: who is standing here, is this tile free, and clean everything up.
- NPCs block movement, turn to face you when spoken to, and stand still while
  a conversation is open.
- Eight character looks — player, two villagers, elder, child, researcher,
  mender, shopkeeper — all drawn by one routine from a colour palette, so the
  cast looks like it belongs to one world. Adding a look is one entry in
  `CHARACTER_PALETTES`.

**Dialogue**
- `DialogueBox`: typewriter text at the player's chosen speed, multi-page,
  speaker name plate, blinking advance arrow. Pressing confirm while typing
  skips to the full page rather than making an impatient player wait.
- `DialogueResolver`: dialogue is data. Branches carry `when` / `unless` flag
  conditions and the first match wins, so NPCs say different things as the story
  moves. A branch can `setFlags` when its conversation finishes.
- Talking to Professor Wick sets `metWick`, and NPCs on other maps already react.
- Text speed is a real setting on `GameState` (`slow`/`normal`/`fast`/`instant`);
  the menu to change it arrives in Phase 10.

**Interaction**
- `InteractionSystem`: you interact with whatever is on the tile you face — plus
  one deliberate extra rule, that facing a counter reaches the person behind it.
  That is what lets you talk to the shopkeeper and the Mender across their desks.
- Signs and readable objects on every map.
- Ground items: they block their tile until taken, go into the bag, and stay
  collected via a story flag.

**Encounters (infrastructure)**
- `src/data/encounters.js` — weighted species tables per area.
- `EncounterSystem` — per-step probability, weighted species pick, level roll,
  and a cooldown that makes back-to-back ambushes impossible.
- Wired to tall grass on Route 1 and Emberhollow's northern edge.
- The encounter itself is real; the battle it should open arrives in Phase 4, so
  for now the result is reported on screen and says exactly that.

**Items**
- `src/data/items.js` (7 items) and `InventorySystem` — add, remove, count, list.
  Used by ground items today; the shop and bag screen in Phase 7 read the same data.

**Tooling**
- ESLint added with a deliberately small config: it catches unused variables,
  undefined names and duplicate keys, and stays out of formatting arguments.
  `npm run lint` was already declared in package.json but had nothing behind it.

**Rendering**
- Furniture is now a proper object layer: furniture textures are transparent and
  drawn over whichever floor the map names in `objectBase`. One table texture now
  looks right on floorboards in a house and on tiles in the shop.
- The camera centres maps that are smaller than the screen, instead of pinning
  them to the top-left with a black band down one side.

### Fixed

- **A held key could be silently swallowed.** Phaser's `Key.onUp` clears the flag
  that `JustDown` reads, so a press and release landing inside a single frame
  vanished before anything saw it. `InputManager` now latches the `down` event
  and clears it after the scene updates, so every press is seen exactly once —
  and a press nothing consumed is discarded rather than firing later.
- **An NPC was standing inside a table** in the Mender's Hall. Found by a new
  test that checks every NPC on every map is on a walkable tile.
- **Furniture carried a baked-in pale floor** that clashed once the wooden floor
  was redrawn, leaving light squares under every object. Fixed by the object
  layer above.
- **The wooden floor read as brickwork** — a grid of seams rather than planks.
  Redrawn as long horizontal boards with grain.
- **Small interiors left a black band** down the right of the screen, because
  Phaser clamps an undersized map to the top-left corner.
- **The player's house appeared to contain two beds**; it is one bed now.

### Verification

- **217 automated tests** pass (was 60). New coverage: dialogue resolution and
  flag branching (21), encounter rolling and the anti-ambush cooldown (15),
  inventory operations (15), interaction targeting including counters (13), plus
  per-map integrity checks that now validate NPC placement, duplicate ids and
  tiles, sprite existence, exits pointing at real maps *and* real spawn points,
  ground-item data, tall grass without an encounter table, and that every NPC
  has something to say to a brand new player.
- **Production build** succeeds; every browser check below was run against it.
- **Browser-verified with Playwright**, zero console errors or warnings:
  - 34/34 checks: entering and exiting all four buildings, both edge
    transitions, collision after transitions, NPC dialogue, multi-page paging,
    speaker plates, talking across a counter, sign reading, movement blocked by
    NPCs, and position preserved through every transition.
  - 16/16 checks: ground item pickup (bag, flag, sprite removal, tile freed,
    still collected after leaving and returning), encounter triggering in tall
    grass, cooldown, path tiles never triggering, and dialogue changing once a
    story flag is set — including a different NPC on a different map reacting.
  - **10/10 keyboard-only playthrough** on the production build: walk into the
    house, cross the room, talk to Mum, leave, cross town, walk the full length
    of Route 1, read the signpost, talk to the gate warden, and walk back.
- **Leak check:** 40 map transitions leave display objects, update list, NPC
  count, tweens, textures, animations, keyboard keys, key listeners, player
  event listeners and scene listeners all unchanged; a separate check confirms
  NPC wander timers do not accumulate across 24 map reloads.

### Known limitations

- Thistlewood is deliberately not built yet — see the Decisions section of
  TODO.md. Route 1 ends at a closed gate with a warden who explains why.
- The Mender and the shopkeeper describe their services; performing them needs
  a party (Phase 3) and the bag/money UI (Phase 7).
- Saving is Phase 10, so progress is lost on reload.

---

## Phase 1 — Foundation

The project skeleton and a walkable overworld.

### Added

**Project setup**
- Vite + Phaser 3.90 + Vitest, plain JavaScript ES modules.
- `npm run dev` / `build` / `preview` / `test` all working.
- Phaser split into its own build chunk so game code (~26 kB) caches separately
  from the engine (~1.48 MB).
- `.gitignore` covering `node_modules`, `dist`, caches, and env files.

**Configuration layer** (`src/config/`)
- `gameConfig.js` — 480x320 internal resolution, 32px tiles, full colour palette,
  shared text styles, depth layers.
- `balance.js` — every gameplay tuning number, each with a comment explaining the
  choice.
- `controls.js` — key bindings (arrows/WASD, Shift to run, Space/Enter/E, Esc/X).
- `assets.js` — texture keys and sprite-sheet layout.

**Artwork**
- `TextureFactory.js` generates all 24 textures at runtime with the Canvas 2D API:
  21 tile types, a 12-frame player sprite sheet, and UI pieces.
- No binary assets in the repository, no licensing risk, one shared palette.

**Map system**
- Maps are written as ASCII grids — readable and editable in any text editor.
- `TileMap.js` — pure logic (no Phaser): parsing, collision, encounter flags,
  overhead tiles, spawn-point lookup with safe fallbacks.
- `MapRenderer.js` — batches the whole map into two RenderTextures (ground and
  overhead) instead of hundreds of sprites.
- Map validation rejects ragged rows, missing ids, and empty tile arrays with
  messages naming the exact problem.
- Unknown map characters render as an obvious magenta void tile and warn, rather
  than crashing.
- First map: **Emberhollow Town** (30x24) with houses, a main road, a pond, a
  fenced railing, flowers, signs, and tall grass at the town's edge.

**Player**
- Grid-based movement with smooth tweened steps between tiles.
- Turn-on-the-spot: tapping a new direction turns you before you walk.
- Walk and run speeds, four-direction walk animations.
- Collision against solid tiles and map bounds, with a small bump animation.
- Emits `step` and `turn` events for encounters and map exits to hook into later.

**Scenes**
- `BootScene` — generates artwork and animations.
- `TitleScene` — layered backdrop, keyboard menu, control hints.
- `WorldScene` — loads a map, spawns the player, follows with the camera.
- Shared fade-in/fade-out transition helper with double-trigger protection.

**Other**
- `GameState.js` — one shared object holding the whole playthrough, versioned
  ready for saving.
- `InputManager.js` — maps keys to named actions; logs a clear error for an
  unrecognised key name.
- `DebugOverlay.js` — backtick toggles a readout of map, tile, terrain, facing,
  and fps.
- Boot failures are shown on the page instead of leaving a black screen.

### Fixed

- **Player sprite was invisible.** `MapRenderer` opened `beginDraw()` on two
  RenderTextures at once and interleaved draws between them. Because `beginDraw`
  binds a framebuffer, every tile went into the *overhead* layer, which then
  covered the player. Each layer now gets its own complete draw pass.
- **Debug overlay key never fired.** The backtick was bound as `BACK_QUOTE`;
  Phaser calls it `BACKTICK`. Phaser creates a key for an unknown code that
  simply never fires, so this failed silently. Fixed the binding, made
  `InputManager` log an error for unknown key names, and added a test that checks
  every binding against Phaser's real key list.
- **Tall grass was too similar to normal grass.** Since it is where wild
  creatures will appear, the player must be able to identify it instantly. It now
  has a darker base and a dense blade pattern.
- **Title screen control hints** sat on a light background; added a backing panel.

### Verification

- **60 automated tests** pass (`npm test`): map parsing, collision, bounds,
  spawn fallbacks, map validation, game state, story flags, seeded randomness,
  weighted picking, and data integrity across every registered map.
- **Production build** succeeds and was loaded and played from `npm run preview`.
- **Browser-verified with Playwright** (headless Chromium): title screen renders,
  disabled menu entries are skipped, New Game enters the overworld at the right
  tile, movement in all four directions works, collision stops the player at the
  forest border, the camera follows and stays inside the map, the debug overlay
  toggles, and the game runs at 60 fps with **zero console errors**.
- **Leak check:** re-entering the overworld 7 times leaves display-object,
  update-list, texture, keyboard-key, and event-listener counts unchanged.

### Known limitations

- Map `exits` are defined in data but not yet wired up — that lands in Phase 2 so
  the code ships tested rather than as an unused code path.
- "Continue" on the title screen is intentionally disabled until saving exists.
- No audio yet.
