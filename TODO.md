# Aetheria Chronicles — Development Progress

**Legend:** `[x]` done & verified · `[~]` in progress · `[ ]` not started

Current phase: **Phase 9 — Thistlewood + First Gym** ✅ complete
Next phase: **Phase 10 — Save/Load + Persistence**

**The first-badge vertical slice is playable end to end:** New Game → starter →
Route 1 → its trainers → the north gate → Thistlewood → shop and Mender →
the Verdant Hall → its puzzle → its Gardeners → Leader Fern → the Verdant Sigil.

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

## Phase 5 — Wild Encounters ✅
- [x] Encounter tables per zone, validated automatically (species, levels, weights)
- [x] Maps enable encounters with `encounterTable`, or an `encounters` block for
      rate, cooldown and terrain — no scene change needed
- [x] Encounter terrain read from tile data (`encounter: true`), narrowable per map
- [x] Grass step-based triggering: one completed step, at most one roll
- [x] Every suppression rule in one testable place — dialogue, menus, map
      changes, a battle already running, the player not in control
- [x] Movement-step cooldown, renewed whenever a battle ends
- [x] Wild battle entry through the shared `BattleEngine` / `BattleScene`
- [x] Flash-and-fade encounter cue, with no way to open two battles
- [x] Return to the exact overworld state — the world is paused, never restarted
- [x] Run works from real encounters and awards nothing
- [x] Wild wins award EXP, level-ups, new moves and evolutions; never money
- [x] `debug.encounter/encountersOff/encounterRate/encounterInfo`
- [x] 1554 automated tests; browser-verified end to end; leak-tested over
      repeated encounter cycles

## Phase 6 — Capture + Party ✅
- [x] `CaptureCalculator` — an original formula from catch rate, HP, status and orb
- [x] Three orb tiers as data (Basic x1, Great x1.5, Ultra x2); adding a tier is
      one entry in items.js
- [x] Shakes ARE the roll: four checks at `chance**(1/4)`, so what is watched is
      what happened
- [x] Capture is a real engine action — `allowCapture` (wild only by default)
      decides it, the engine spends the orb, a refusal costs nothing
- [x] Failed throw costs the turn; a catch ends the battle at once
- [x] The captured creature is the creature that was fought — never rebuilt
- [x] Party capacity of six, with storage taking the overflow safely
- [x] `CreatureIndex` — seen/caught with one API, validated species ids
- [x] Pause menu (Cancel) with Party, Index, Storage
- [x] Party screen with HP bars, types, status and keyboard reordering
- [x] Creature summary — stats, EXP progress, moves with PP, met location, evolution
- [x] `debug.orbs/fillParty/reorder/storage/seen/caught/index/clearIndex`
- [x] 1645 automated tests; browser-verified end to end; leak-tested over
      repeated capture and menu cycles

## Phase 7 — Inventory + Economy + Healing ✅
- [x] `EconomySystem` — the only thing that changes money; never negative, always whole
- [x] `ItemEffects` — one shared executor for battle AND overworld item use,
      returning structured results so a refusal never consumes anything
- [x] `HealingSystem` — one definition of "put them back together", used by the
      Mender and by blackout recovery
- [x] `ShopSystem` — atomic buying and selling; a deal either completes or does nothing
- [x] `BlackoutSystem` — the defeat rule, with `blackoutOnDefeat` as battle configuration
- [x] Bag screen with category tabs, quantities, descriptions and disabled reasons
- [x] Overworld item use with a party target list, staying open for repeat use
- [x] Supply Post buying and selling, data-driven stock (`src/data/shops.js`)
- [x] Mender's Hall restores HP, PP and status, and sets the recovery point
- [x] Real blackout: configured money loss, full recovery, wake at the recovery point
- [x] Practice defeats stay consequence-free, by configuration not by NPC name
- [x] Burn Salve, Rouser and Clear Tonic complete the status cures
- [x] `debug.orbs/item/money` and the existing party tools cover the new flows
- [x] 1791 automated tests; browser-verified end to end; leak-tested over
      repeated bag, shop and blackout cycles

## Phase 8 — Trainers ✅
- [x] `src/data/trainers.js` — trainer database, validated automatically
- [x] `TrainerSystem` — party construction through CreatureFactory, battle
      configuration, and who has been beaten
- [x] `SightSystem` — pure line-of-sight with tested range and blocker boundaries
- [x] One completed step triggers at most one trainer, chosen deterministically
- [x] "!" alert, straight-line approach stopping one tile short, both turning
      to face each other
- [x] Pre-battle dialogue, then the battle — one pipeline for sight and for
      walking up and talking
- [x] No running, no capture, trainer EXP multiplier, prize money
- [x] Victory marks the trainer beaten; defeat does not
- [x] Post-defeat dialogue through ordinary `when: 'trainer:<id>'` conditions
- [x] A trainer loss uses the Phase 7 blackout; practice bouts stay free
- [x] Precedence: exit, then trainer, then wild encounter
- [x] Three Route 1 trainers with distinct parties, lanes and dialogue
- [x] `debug.trainers/trainerBattle/beatTrainer/resetTrainers/sight`
- [x] 1900 automated tests; browser-verified end to end; leak-tested over
      repeated trainer wins and blackouts

## Phase 9 — Thistlewood + First Gym ✅
- [x] **Barriers** (`PuzzleSystem`): tiles that are solid only some of the time,
      declared as map data. Two kinds — flag-driven (`openWhen`, a pure function
      of a story flag or Sigil) and switch-driven (moved by root switches, saved
      in `gameState.puzzles`). A barrier may be both.
- [x] Barrier state lives in `TileMap`, so the player, NPCs, sight lines and
      interaction all obey it from one place — the picture and the collision
      cannot disagree
- [x] **Route 1's north gate** opens when the warden is asked by a Warden with a
      partner. No errand, no waiting: exactly what his Phase 2 dialogue promised
- [x] **Thistlewood** (30x24): main road, east-west road, Verdant Hall,
      Mender's Hall, Supply Post, Nan Thistle's cottage, pond, hedges, three
      signs, a hidden Great Orb, and a shut Thornway gate
- [x] Five townsfolk plus five more indoors — ten NPCs, all reacting to the Sigil
- [x] **Second Mender's Hall** — no new healing code; it speaks as whoever the
      player is talking to and sets its own map as the recovery point
- [x] **Second Supply Post** — one stock list: Super Potions, Great Orbs and the
      Rouser, none of which Emberhollow sells
- [x] **The Verdant Hall** (21x19): a greenhouse whose walls are hedges, with a
      walkway that meets only along the south so both Gardeners are unavoidable
- [x] **The documented puzzle** — three root switches, each retracting one hedge
      and extending another; reaching Fern needs two of them, in order
- [x] A reset root by the door, and a proof (`tests/puzzle.test.js`) that walks
      every reachable configuration to show the player can never be trapped
- [x] **Gardeners Teal and Bracken** — ordinary Phase 8 trainers, no new pipeline
- [x] **Leader Fern** — the canonical Vinelet 11 / Puffcap 11 / Ivorn 13, 1200
      coins, and one extra field: `badge`
- [x] **Sigils** — `src/data/badges.js`, `BadgeSystem`, a three-slot menu screen,
      awarded once after a win and never on a loss
- [x] Sigils read as `badge:<id>` conditions, so the world reacts through
      ordinary conditional dialogue and no scene reads `gameState.badges`
- [x] `debug.gates/toggle/resetPuzzle/puzzleState/sigils/sigil`
- [x] 2168 automated tests; browser-verified end to end; balance measured over
      hundreds of seeded battles; leak-tested over repeated town, puzzle and
      blackout cycles

### Phase 9 deferrals
- **Route 2 is not built.** Thistlewood's Thornway gate is visibly shut, the road
  behind it is visible, and a keeper and a sign both explain why. The seam for
  opening it is one flag (`thornwayOpen`) that nothing sets yet.
- **No rival.** Kestrel belongs with world expansion, once save/load exists.
- **No Gym rematches.** Fern stays beaten and gives post-victory lines.
- **No leader AI profile.** Fern uses the same `BattleAI` as everyone else;
  reliability mattered more than sophistication for a first Hall.
- **A solo Water starter cannot beat this Hall.** That is the designed shape of a
  type-themed Gym, not an oversight — see the balance note below.
- **Puzzle state is per-session** until Phase 10 gives it a save file. It is
  plain serialisable data and already lives on `GameState`.

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

**First-Gym balance, measured rather than guessed** (`tests/gymBalance.test.js`
plays hundreds of seeded battles against Fern):

| Team at level 13 | Beats Fern |
|------------------|-----------|
| Fire starter + a Route 1 Flittle | ~100% |
| Water starter + a Route 1 Flittle | ~67% |
| Grass starter + a Route 1 Flittle | ~100% |
| Fire starter alone | ~50%, rising to 100% at 15 |
| Water starter alone | 0% at any sensible level |

Every creature Fern fields is Grass or Grass/Poison, so Water is resisted
outright and a solo Drizzle has no answer. That is the point of a type-themed
Hall, and the game says so three times: Mose, Hesper and the Hall's own layout
all point at "something with wings". Flittle is the second most common Aether on
Route 1, knows Peck from level 1, has a catch rate of 255, and the player is
handed two orbs on the way. The answer is cheap, early and signposted — so the
Hall asks for a team rather than a grind.

**Deferred deliberately (not forgotten):**
- **~~Thistlewood town moved to Phase 11~~ — built in Phase 9**, as planned, at
  the same time as the Beacon Hall it exists to host.
- **Ledge hopping is not implemented**, so no ledges were placed on Route 1.
  A `ledge_down` tile exists in the tile set, but placing terrain that looks
  like a one-way hop and does nothing would be worse than leaving it out.
- **Healing and shopping are described, not performed.** The Mender needs a party
  to heal (Phase 3) and the shop needs the bag screen and money UI (Phase 7).
  Both NPCs explain their service rather than pretending to provide it.
- **Encounters were real but had nowhere to go until Phase 5.** The table
  lookup, weighted species pick, level roll and anti-ambush cooldown shipped in
  Phase 2; Phase 5 handed the result to the battle engine. ✅

**Phase 8 deferrals:**
- **Trainers walk in a straight line, not around corners.** They saw the player
  down an unobstructed lane, so walking back along it needs no pathfinding.
  Adding A* for a feature that cannot need it would be cost with no benefit.
- **No AI profiles.** Every trainer uses the existing `BattleAI`, which already
  picks legal moves and never wastes empty PP. Phase 8 needed reliable trainer
  battles, not a competitive opponent; profiles can hang off trainer data later
  without changing anything else.
- **No voluntary switching.** A trainer sends out their next creature when one
  faints, through the existing forced-switch pipeline. Switching for advantage
  mid-battle is a strategy problem, not a Phase 8 one.
- **No rematches.** The trainer data has room for rematch metadata; nothing
  reads it yet.
- **A trainer who walks over to challenge you stays where they stopped** until
  the map is reloaded, when they return to their map-defined tile. Persisting a
  walked-to position would put scene state into the save for no gain.
- **The recurring rival is not implemented.** Phase 8 built the machinery a
  rival would use; the character belongs with the story phases.

**Phase 7 deferrals:**
- **No PP-restoring consumable.** The Mender restores PP, which is what the
  phase needed; an "Ether" item would have been a new item with no shop to sell
  it in yet. The effect model has room for one.
- **No revive item.** A fainted creature is refused by every item with a plain
  message rather than being quietly half-healed. Reviving belongs with the
  items that would sell it.
- **The shop has no confirmation step.** The quantity selector already refuses
  anything the player cannot afford or does not own, the total is on screen
  before Confirm, and one press is one transaction — a Yes/No on top of that
  would be ceremony rather than safety.
- **Selling is at a flat fraction of the buy price.** `ECONOMY.sellPriceFraction`
  is the single knob; per-item `sellPrice` is supported but unused.
- **Only one shop exists.** The Supply Post is the first implementation of a
  system that takes any number: a new shop is an entry in `src/data/shops.js`
  plus `action: 'shop:<id>'` on a shopkeeper.

**Phase 6 deferrals:**
- **Nicknaming is not implemented.** Captured creatures already carry a
  `nickname` field, the summary and every message use it when it is set, and
  `createCreature(id, level, { nickname })` fills it in — but there is no
  on-screen text entry yet. A keyboard text-input widget is a screen's worth of
  work on its own (character grid, cursor, validation, backspace) and would have
  doubled this phase; it belongs with the other UI in a later pass.
- **Storage is a summary, not a manager.** You can see what is waiting and that
  is all: no withdrawing, depositing, releasing or box organising. Nothing is
  ever lost — the list is a plain serialised array — but moving a creature back
  into the party needs a screen that is really Phase 11's job.
- **A capture awards no experience.** The creature is the reward; paying both
  would make catching strictly better than fighting.
- **No capture-rate items or field effects** (repels, lures, status-inflicting
  throws). The formula has one knob per input and `CAPTURE.globalModifier` for
  the whole game, which is where any of those would hang.

**Phase 5 deferrals:**
- **Capture is still Phase 6.** Orbs appear in the wild-battle bag listed as
  unavailable, are never consumed, and no probability is rolled. The rule lives
  in `BattleItems.js` on the item's own category, so Phase 6 can add catching
  without touching the encounter pipeline.
- **Defeat keeps its Phase 4 behaviour**, unchanged: the party is revived to one
  HP each with a plain message. The Mender's Hall blackout is Phase 7, and
  moving it forward quietly would have been worse than leaving it visible.
- **Emberhollow's edge grass is live too**, using the smaller `emberhollowEdge`
  table. It is a two-species taste of the mechanic within sight of home.
- **Encounter modifiers** (repels, weather, time of day) are not implemented.
  The map's `encounters` block is the seam they would hang off, and it takes
  `rate` and `cooldownSteps` overrides today.

**Phase 4 deferrals:**
- **Capture is not implemented** — it belongs to Phase 6. Capture orbs appear in
  the battle bag but are listed as unavailable, which is honest; a half-working
  throw would be worse than none.
- **Losing does not black you out to a Mender's Hall yet.** That flow needs the
  healing centre, which is Phase 7. For now a defeat revives the party to 1 HP
  each and says so plainly, so the game stays playable.
- ~~**Wild encounters are still not wired to battles**~~ — done in Phase 5. ✅
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
