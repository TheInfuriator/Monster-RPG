# Aetheria Chronicles — Development Progress

**Legend:** `[x]` done & verified · `[~]` in progress · `[ ]` not started

Current phase: **Phase 4 — Battles** ✅ complete
Next phase: **Phase 5 — Wild Encounters**

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

## Phase 3 — Creature Data ✅
- [x] All 18 types with names and colours
- [x] Complete data-driven effectiveness chart (sparse: only non-neutral entries)
- [x] `TypeChart` module — dual types, immunities, STAB, battle messages
- [x] Move database — **56 moves** (24 physical / 16 special / 16 status)
- [x] Structured move effects: status, statChange, heal, drain, recoil, multiHit, flinch
- [x] Status condition definitions (poison, burn, paralysis, sleep)
- [x] Creature database — **27 species**, 10 evolutionary families, 4 single-stage
- [x] All three starter families, 3 stages each, balanced stat totals per stage
- [x] Base stats, growth rates, catch rates, experience yields
- [x] `StatCalculator` — stat formula, 3 cubic growth curves, experience thresholds
- [x] Level-up learnsets with automatic validation
- [x] Evolution metadata (`{ method, level, to }`) + evolution-graph validation
- [x] `CreatureFactory` — species + level → individual instance
- [x] `PartySystem` — add, capacity, active member, storage overflow, reorder
- [x] Procedural creature artwork: 8 body shapes tinted by primary type
- [x] Starter selection scene at the Warden's Lodge (browse, confirm, cancel)
- [x] `action` field on dialogue branches — data triggers gameplay events
- [x] Duplicate starter prevented at both the dialogue and the scene
- [x] NPC dialogue reacts to `gotStarter` across 3 maps
- [x] 1260 automated tests; browser-verified incl. all three starters

## Phase 4 — Battles ✅
- [x] `DamageCalculator` — STAB, effectiveness, crits, variance, burn, minimum damage
- [x] `StatStages` — -6..+6 for 7 stats, with a gentler accuracy/evasion curve
- [x] `TurnResolver` — action priority, move priority, effective Speed, coin tie-break
- [x] `StatusSystem` — poison, burn, paralysis, sleep; one status at a time
- [x] `MoveEffectRunner` — all 7 effect kinds, generic over kind not move id
- [x] `ExperienceSystem` — rewards, level-ups, move learning, evolution
- [x] `BattleAI` — seedable, avoids empty PP, prefers effective moves
- [x] `BattleEngine` — state and orchestration, reports events for the UI
- [x] Battle types: wild / trainer / practice, one code path
- [x] Battle scene: HP bars, EXP bar, status tags, artwork, message log
- [x] Action menu (Fight / Party / Bag / Run) with 2-column keyboard grid
- [x] Fight menu with name, type pip, PP; 0-PP moves unusable; Struggle fallback
- [x] Battle party selector: switching, rejection rules, forced switch on faint
- [x] Bag: healing and status-cure items; capture orbs shown but disabled
- [x] Run: works in wild battles, refused in trainer/practice
- [x] Fainting, opponent replacement, victory and defeat
- [x] EXP, multi-level gains, move learning with a replace/decline prompt
- [x] Evolution integrated into the post-battle flow, with an on-screen sequence
- [x] Animated HP bars, hit shake, faint fade, switch pop
- [x] Practice battles at the Warden's Lodge via the dialogue `action` seam
- [x] `debug.*` battle tools (wild/trainer battles, HP, status, level, EXP, PP)
- [x] 1451 automated tests; browser-verified end to end

## Phase 5 — Wild Encounters ← NEXT
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

**Phase 4 deferrals:**
- **Capture is not implemented** — it belongs to Phase 6. Capture orbs appear in
  the battle bag but are listed as unavailable, which is honest; a half-working
  throw would be worse than none.
- **Losing does not black you out to a Mender's Hall yet.** That flow needs the
  healing centre, which is Phase 7. For now a defeat revives the party to 1 HP
  each and says so plainly, so the game stays playable.
- **Wild encounters are still not wired to battles** — Phase 5's job. The engine
  already understands wild battles, and `debug.wild()` starts one.
- **No full trainer NPCs or line of sight** (Phase 8). The Lodge practice bouts
  use the same engine and are launched from dialogue data.
- **Practice battles award nothing.** They are repeatable so they can be used
  for testing, and a repeatable fight that paid out would be a progression
  exploit. Real rewards arrive with real trainers in Phase 8.

**Phase 3 deferrals:**
- **Ice, Psychic, Dragon and Fairy have no creatures yet** — only 14 of the 18
  types are represented in the roster. The type CHART covers all 18, and those
  four are reserved for the later regions (Mistvault Cavern onward) rather than
  padded into Route 1 just to tick a box.
- **No individual variance (IVs).** Two creatures of the same species and level
  have identical stats. That is a deliberate simplicity choice; the stat formula
  has an obvious place to add variance later.
- **Party and creature-detail SCREENS are Phase 6.** Phase 3 ships only the
  party data foundation. The debug overlay (backtick) shows the party meanwhile.
- **Evolution is described, not performed.** The metadata and
  `getPendingEvolution()` are complete and tested; actually evolving needs the
  level-up flow, which belongs with battles in Phase 4.

**Still outstanding:**
- Audio is not yet implemented; `AudioSystem` arrives in Phase 10 with silent fallbacks.
- Placeholder art is procedurally generated. Real sprites can be dropped in later by
  changing only `src/systems/TextureFactory.js` + the asset keys in `src/config/assets.js`.
- Saving is Phase 10, so progress is lost on reload. Story flags, the bag and
  position are all already stored on GameState, ready to be serialised.

## Known Issues
- None currently open. Bugs found during Phases 1-2 are listed in CHANGELOG.md,
  each with the test that now covers it.
