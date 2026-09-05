# Aetheria Chronicles — Development Progress

**Legend:** `[x]` done & verified · `[~]` in progress · `[ ]` not started

Current phase: **Phase 1 — Foundation** ✅ complete
Next phase: **Phase 2 — World**

---

## Phase 1 — Foundation ✅
- [x] Vite + Phaser 3 project setup, `npm run dev` / `build` / `test`
- [x] Folder structure and architecture
- [x] Central game config (resolution, tile size, colours, controls)
- [x] Central balance config
- [x] Procedural placeholder art (`TextureFactory`) — no binary assets
- [x] Boot scene (asset generation + progress)
- [x] Title screen with keyboard menu
- [x] Scene transition helper (fade in/out)
- [x] Tile map system (ASCII grid → tiles), map registry
- [x] First map: Emberhollow Town
- [x] Player entity: grid movement, facing, run, animation
- [x] Collision (solid tiles + map bounds)
- [x] Camera follow with map-bounds clamp
- [x] Debug overlay (backtick) — coords, tile, fps
- [x] Unit tests for grid/map/collision/config/state (Vitest — 60 passing)
- [x] Production build verified
- [x] Browser-verified with Playwright (render + movement + collision)

## Phase 2 — World
- [ ] Map transition system (doors/edges, preserve state)
- [ ] Emberhollow interiors: player's house, Warden's Lodge, Mender's Hall, Supply Post
- [ ] Route 1 — Cinderpath map
- [ ] Thistlewood town map
- [ ] NPC entity: position, facing, sprite, optional wander
- [ ] Dialogue system: box, multi-page, text speed, flag-conditional lines
- [ ] Signs and interactable objects
- [ ] Ground items

## Phase 3 — Creature Data
- [ ] Type chart data + `TypeChart` module
- [ ] Move database (40+)
- [ ] Creature database (20+ incl. 3 starter families)
- [ ] Stat calculation, growth curves, experience tables
- [ ] `CreatureFactory` (species + level → instance)
- [ ] Starter selection event

## Phase 4 — Battles
- [ ] Battle scene + UI (HP bars, names, levels, message log)
- [ ] Action menu: Fight / Party / Bag / Run
- [ ] `DamageCalculator` (STAB, effectiveness, crits, variance)
- [ ] Turn order (speed + priority), accuracy/misses
- [ ] Status conditions: poison, burn, paralysis, sleep
- [ ] Fainting, switching, victory/defeat flows
- [ ] Experience gain, level-up, move learning

## Phase 5 — Wild Encounters
- [ ] Encounter tables per zone
- [ ] Grass step-based triggering with cooldown
- [ ] Wild battle entry + escape

## Phase 6 — Capture + Party
- [ ] Capture orbs and capture probability
- [ ] Party screen, creature detail screen
- [ ] Storage box for overflow

## Phase 7 — Inventory + Economy
- [ ] Item database, inventory with quantities
- [ ] Money, shop UI
- [ ] Mender's Hall full heal + respawn point

## Phase 8 — Trainers
- [ ] Trainer data + battles, defeated persistence
- [ ] Line of sight detection and approach

## Phase 9 — First Beacon Hall
- [ ] Verdant Hall map + hedge-switch puzzle
- [ ] 2 hall trainers + Leader Fern
- [ ] Sigil award + victory screen + progression flag

## Phase 10 — Polish
- [ ] Save/load (LocalStorage, versioned), autosave
- [ ] Main menu (Party/Inventory/Trainer/Sigils/Save/Settings)
- [ ] Creature index (seen/captured)
- [ ] Settings (volumes, text speed)
- [ ] Audio system with silent fallbacks
- [ ] Battle animations and transitions
- [ ] Debug tools panel (teleport, give, heal, badges, reset)

## Phase 11 — Expansion
- [ ] Route 2, Mistvault Cavern, Tidewatch Harbor
- [ ] Beacon Halls 2 & 3, rival encounters 3+
- [ ] Hollow Vane story arc
- [ ] Champion gauntlet, 30+ creatures, 50+ moves

---

## Known Issues / Notes
- Nothing is currently broken. The two bugs found during Phase 1 (invisible player
  sprite, dead debug key) are fixed and covered by tests — see CHANGELOG.md.
- Map data supports an `exits` field, but exit handling is intentionally **not** wired up
  yet — that lands in Phase 2 so it ships tested rather than as dead code.
- Audio is not yet implemented; `AudioSystem` arrives in Phase 10 with silent fallbacks.
- Placeholder art is procedurally generated. Real sprites can be dropped in later by
  changing only `src/systems/TextureFactory.js` + the asset keys in `src/config/assets.js`.
