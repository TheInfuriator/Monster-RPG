# Aetheria Chronicles — Development Progress

**Legend:** `[x]` done & verified · `[~]` in progress · `[ ]` not started

Current phase: **Phase 2 — World** ✅ complete
Next phase: **Phase 3 — Creature Data**

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

## Phase 2 — World ✅
- [x] Map transition system (doors + map edges, player state preserved)
- [x] Emberhollow interiors: player's house, Warden's Lodge, Mender's Hall, Supply Post
- [x] Route 1 — Cinderpath map (22x30, tall grass, pond, gated north end)
- [x] Emberhollow expanded: 4 NPCs, 2 signs, kitchen garden, encounter edge
- [x] NPC entity: position, facing, sprite palette, static / lookAround / wander
- [x] NpcManager: occupancy, collision, lookup, cleanup
- [x] Dialogue system: typewriter box, multi-page, name plate, text speed setting
- [x] Flag-conditional dialogue (`when` / `unless` branches, `setFlags` on finish)
- [x] Talking across counters (shopkeeper / Mender)
- [x] Signs and interactable objects
- [x] Ground items (block their tile, go into the bag, stay collected)
- [x] Encounter-zone infrastructure: tables, weighted rolls, anti-ambush cooldown
- [x] Furniture object layer (transparent furniture over a per-map floor)
- [x] Camera centres maps smaller than the screen
- [x] 8 character sprite palettes generated from one drawing routine
- [x] 217 automated tests; browser-verified incl. keyboard-only playthrough
- [ ] Thistlewood town map — **moved to Phase 11** (see Decisions below)

## Phase 3 — Creature Data ← NEXT
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

## Decisions / Notes

**Deferred deliberately (not forgotten):**
- **Thistlewood town moved to Phase 11.** It exists to host Beacon Hall 1, which is
  Phase 9 work. Building the town now would mean shipping an empty shell. Instead
  Route 1 ends at a **closed gate** with a warden who explains why — a real,
  story-appropriate block rather than an invisible wall.
- **Ledge hopping is not implemented**, so no ledges were placed on Route 1.
  A `ledge_down` tile exists in the tile set, but placing terrain that looks
  like a one-way hop and does nothing would be worse than leaving it out.
- **Healing and shopping are described, not performed.** The Mender needs a party
  to heal (Phase 3) and the shop needs the bag screen and money UI (Phase 7).
  Both NPCs explain their service rather than pretending to provide it.
- **Encounters are real but have nowhere to go yet.** The table lookup, weighted
  species pick, level roll and anti-ambush cooldown are all implemented and
  tested. Until battles land in Phase 4, a triggered encounter reports the
  species and level on screen and says so plainly.

**Still outstanding:**
- Audio is not yet implemented; `AudioSystem` arrives in Phase 10 with silent fallbacks.
- Placeholder art is procedurally generated. Real sprites can be dropped in later by
  changing only `src/systems/TextureFactory.js` + the asset keys in `src/config/assets.js`.
- Saving is Phase 10, so progress is lost on reload. Story flags, the bag and
  position are all already stored on GameState, ready to be serialised.

## Known Issues
- None currently open. Bugs found during Phases 1-2 are listed in CHANGELOG.md,
  each with the test that now covers it.
