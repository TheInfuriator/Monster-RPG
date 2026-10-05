# Aetheria Chronicles — Development Progress

**Legend:** `[x]` done & verified · `[~]` in progress · `[ ]` not started

Current phase: **Phase 14 — the Aerie, the Hollow, the Circle's Trial and the
ending** ✅ complete. **The main story is complete.**
Next: nothing is required. Optional post-release ideas are listed at the end.

**Playable end to end, New Game to the credits:** New Game → starter → Route 1
→ the Verdant Sigil → Kestrel at the Thornway gate → Route 2 → Kestrel again →
the cordon → Mistvault Cavern → the Hollow Vane's Draw Foreman → Tidewatch
Harbor → Kestrel a third time → the Tidal Hall → the Tidal Sigil → Warden Hale
lifts the rockslide → the Stormrise Climb → the Vane's lightning relay grounded
→ Kestrel a fourth time → Voltspire City → the Storm Hall → the Storm Sigil →
**Warden Ashby opens the Aerie Gate → the Aerie Road → the Aerie and its Lodge
→ the Hollow: three banks vented, the Vane's keepers beaten, Director Thale →
the Convergence stopped → Kestrel, the fifth and last time → the Circle's
Trial: three Wardens and Champion Seren → the ending and the credits → free
roam.** It survives closing the tab — even during the credits — and saves
from every earlier phase carry straight over.

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
- [x] 2175 automated tests; browser-verified end to end; balance measured over
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
- ~~**Puzzle state is per-session** until Phase 10 gives it a save file.~~ —
  saved and restored since Phase 10, hedge for hedge. ✅

## Phase 10 — Save/Load + Persistence + Settings ✅
- [x] **Audit first:** every piece of state sorted into canonical (saved),
      derived (rebuilt on load), preferences (own key) and never-saved — see
      GAME_DESIGN.md section 21
- [x] `src/save/` — one owner of persistence: `SaveManager` over a schema,
      a validator, a migration pipeline, a position resolver and a storage
      adapter. Nothing else touches `localStorage`
- [x] Versioned save file (`version: 2`) with metadata the title screen can
      show without loading anything; deterministic, sorted, plain JSON
- [x] Whitelist serialiser: fields picked by name, so no Phaser object, timer,
      dialogue or battle state can ever reach a save
- [x] Derived caches (stats, max PP) left out and rebuilt — one source of truth
- [x] **Two slots:** Manual and Autosave, same format, judged independently
- [x] Atomic writes: built, proved to load, then written in one `setItem`; a
      refused or full write leaves the previous save exactly as it was
- [x] Pause menu **Save** with an overwrite confirmation, offered only when the
      world is in a safe state
- [x] **Autosave** at stable checkpoints — map arrival, battle fully over,
      healing, story progress, shop, starter, item — never mid-battle,
      mid-dialogue, mid-step or mid-approach; one save per checkpoint chain;
      a quiet corner note
- [x] **Title Continue:** disabled without a valid save; one save loads; two
      open a chooser with place, lead, Sigils, catches, play time and save
      time, newest highlighted
- [x] Load pipeline: read → parse → migrate → validate → fresh state → safe tile
      → only then the live game; a failure changes nothing and says why
- [x] Restore order: switch positions → gates and hedges → NPCs → player. The
      saved tile is checked against shut hedges, NPC home tiles and ground items,
      with a fallback chain (map spawn → recovery point → start)
- [x] Creature identity: ids kept forever; loaded ids reserved so new ones can
      never collide; duplicates repaired, never merged
- [x] Migration pipeline (v1 → v2) with legacy fixtures for Phases 2, 3, 6-9
- [x] Newer-version saves refused with the exact player-facing message, never
      migrated down, never overwritten by the autosave
- [x] Corruption handling: refuse vs repair, every repair reported, damaged
      saves never deleted, named on the title screen
- [x] New Game confirmation when anything is saved; it deletes nothing
- [x] **Settings:** text speed and master volume (0-100) in a global
      preferences key, one panel for the title and the pause menu, applied at
      once, surviving New Game; volume drives Phaser's sound manager
- [x] Play time is counted at last (`PlayClock`)
- [x] `debug.saves/save/dumpSave/clearSave/injectLegacySave/corruptSave/
      saveVersion/settings`
- [x] 2476 automated tests; browser-verified with **true page reloads** across
      manual save, autosave, the chooser, damaged and newer saves, legacy saves,
      mid-puzzle, after-Sigil, party/storage, Index, recovery point through a
      real blackout, settings and New Game safety

### Phase 10 deferrals
- **No battle saves.** Closing the page mid-battle returns you to the last
  save, before the battle. Saving a battle would mean serialising the battle
  engine's internals (stat stages, sleep counters, whose turn it is) — a second
  format to keep correct for no real gain in a game whose battles last a minute.
- **No saving mid-dialogue or mid-cutscene.** Save is simply not offered.
- **No player naming.** The name field is saved and validated; there is still
  no text-entry screen, same as nicknames (Phase 6 deferral).
- **No storage-management screen** (export, import, delete a slot). The debug
  tools can do all three; the game itself never deletes a save.
- **No audio.** The master volume setting is stored, shown, and pushed to
  Phaser's sound manager — there is simply nothing to play yet. Per-channel
  music/effects volume waits for there to be music and effects.
- **A trainer who walked over to you is back on their own tile after a load**,
  exactly as after leaving the map (Phase 8 deferral) — and the load checks
  that tile so the player is never restored inside them.
- **Settings from a version 1 save are dropped**, not imported: preferences
  belong to the player now, and no version 1 save was ever written to storage.

## Phase 11 — Kestrel + Route 2 / World Expansion I ✅
- [x] **Audit first:** canon for Kestrel (name, personality, the "strong
      against" rule, the planned appearances), Route 2 (Thornway, branching,
      tougher trainers), Mistvault (next, with the Hollow Vane) and the level
      pacing — and the systems to reuse (trainers, dialogue branches, barriers,
      saves)
- [x] **The rival is an ordinary trainer:** a meeting is one `trainers.js`
      entry with `rival`, `stage`, `requires`, `setFlags`, `victoryLines` and
      a `{ rivalStarter: true, level }` party slot. No rival scene, no rival
      battle code
- [x] **One starter mapping** (`src/data/rivals.js`): Fire → Water,
      Water → Grass, Grass → Fire. `RivalSystem` resolves the slot and evolves
      it by species data (Kestrel's Drizzle is a Puddlurk at 16)
- [x] **Save version 3:** `starter` recorded at the Lodge; the 2 → 3
      migration recovers it from the creature met there. Genuine Phase 10 save
      files (`tests/fixtures/`) load, keep their summary and play on
- [x] **NPC presence** — `presentWhen` / `absentWhen`, read by the map loader
      and the save loader alike; `exitAfterDefeat` and `returnAfterDefeat`
- [x] **Kestrel at the Thornway gate** once the Sigil is held: spotted or
      spoken to, names the right starter, fights; a win sets `thornwayOpen`,
      the gate opens, Kestrel walks off, one `story` autosave; a loss plays
      their line, then the blackout, and records nothing
- [x] **Route 2 — the Thornway** (30x50): cutting, dry spring loop, a thicket
      that forks round a bramble island, the Brow, a scree slope, a gully and
      the landing
- [x] **Two habitats on one map** (`encounters.byTerrain`): thicket and scree
      tables, commons to rares, old faces and new
- [x] **7 new species** (34 in all — Jabbit → Brawnhare, Glimmote →
      Brambelle, Delvit → Ironvole, Burrzap) and **5 new moves** (61 in all),
      on existing effect kinds; 8 new tiles
- [x] **4 trainers** (13-16) and **Kestrel's second meeting** (evolved
      starter 16), who walks back to their post rather than blocking the gully
- [x] Items (existing ones only), signs, the bramble crew, the spring keeper,
      the survey stake — foreshadowing, no Hollow Vane on screen
- [x] **The Phase 12 boundary:** a Warden cordon across Mistvault Cavern
      (`mistvaultOpen`, set by nothing), a Warden and a sign
- [x] **Balance measured, not guessed:** a simulated walk up Route 2 through
      the real engine; every starter wins every fight; the numbers are tests
- [x] **Fixed a Phase 9 test-driver bug:** the balance driver never found a
      damaging move (read `entry.power` off `{ id, pp, maxPp }`), so every
      balance number was measured with a player who always used their first
      move. Re-measured everything
- [x] `debug.rival()`, `debug.starter()`, habitat info in
      `debug.encounterInfo()`; `debug.beatTrainer()` now sets a win's flags
- [x] Browser-verified with normal controls and true reloads — see CHANGELOG.md

### Phase 11 deferrals
- **Kestrel's first two planned appearances** (Emberhollow, Route 1's exit)
  are not built. The first meeting the player has is the plan's third, so
  Kestrel introduces themself there. Retro-fitting a rival into finished,
  saved maps would change what existing players see.
- **No scripted-sequence system.** Nothing Phase 11 needed was beyond the
  trainer pipeline plus NPC presence; a real cutscene system waits for a scene
  that needs one (the Hollow Vane reveal, probably).
- **Kestrel walks off by a fixed line**, not pathfinding. Fine on straight
  roads; a map that needs more should get a small path helper then.
- **Route 2 has no Mender or shop** — deliberately: Thistlewood's are one walk
  south.
- **The Index art for new species** uses the same generated body shapes as
  every other creature; bespoke art for them waits with everyone else's.
- **Fern re-measured:** with the fixed driver, Water + Flittle at level 13
  beats her 43% of the time (the old number was ~67%). Still above the test's
  40% bar and 85% two levels later, but close to the line — revisit if Fern
  is ever touched.

## Phase 12 — Mistvault Cavern + Tidewatch Harbor + the second Sigil ✅
- [x] **Audit first:** canon for Mistvault (Dark/Rock, a puzzle, the Vane
      event), the Hollow Vane (a resource company siphoning currents into
      cells; Poison/Dark/Steel), Tidewatch (Hall 2, Tidal), Kestrel (3+ from
      Phase 12) and the level plan — and every system to reuse
- [x] **The cordon comes down** through real progression: Warden Corran, once
      Kestrel is beaten below Mistvault, sets `mistvaultOpen`; the rope draws
      back (picture and collision together), Kestrel runs in and fades
      (`leaveBy`), one `story` autosave; Phase 11 saves load with it up
- [x] **Levers, currents and signals** in `PuzzleSystem` — generic, not a
      reskin of the root switches: faced levers with two positions stored as
      booleans, valves passing a current along channels, barriers that follow
      a signal (`openWhenSignal` / `closedWhenSignal`) or close on a world
      condition (`closedWhen`), glows, an occupancy guard, full validation
- [x] **Mistvault Cavern, three maps:** the Mouth (Ashby, the Vane's depot),
      the Galleries (two dependent valves, four mist bridges, lit channels, an
      optional east wing, a pocket), the Draw Site (the rig, the breaker, the
      tideward mist, the Grotto's shallows); seven items; Kestrel stuck at the
      chasm
- [x] **Softlock safety proved:** every valve setting x every patch of floor
      the player could stand in (`tests/helpers/leverProof.js`)
- [x] **The Hollow Vane as data** (`src/data/factions.js`) and five Vane
      trainers on the ordinary pipeline (`faction`, `rank`, validated); the
      Draw Foreman at the breaker; `mistvaultSiphonStopped` clears the mist,
      holds every bridge, lights the channels, refills Route 2's spring, and
      autosaves; the Vane stay active (a Surveyor in Tidewatch until the Sigil)
- [x] **5 species** (39 in all — Gloamite, Corrodit, Minnet → Marlance,
      Barnaclaw) and **2 moves** (63 — Riptide, Siphon Fang); three cave
      encounter tables, one on the Grotto's shallows; 23 new tiles
- [x] **Tidewatch Harbor** (36x28): the third Mender's Hall (recovery point),
      a Supply Post with the Ultra Orb and the Clear Tonic (audited against the
      prize money), the Tidewatch light, piers and boats, people who follow the
      story before and after the Sigil
- [x] **Kestrel's third meeting** beside the fenced Hall road (Gustwing 18,
      Grubbit 19, starter 19 — measured)
- [x] **The Tidal Hall:** three tide wheels sharing ONE state; causeways that
      flood and pontoons that float; low, high, low to the dais; proved over
      every tide x every place to stand; a Deckhand and a Diver
- [x] **Leader Ondine** (Barnaclaw 19, Brookel 19, Marlance 21) and the
      **Tidal Sigil**, awarded once after the win; the Sigil screen reads 2 of 3
- [x] **The Phase 13 boundary:** the Stormrise Climb under a rockslide
      (`stormriseOpen`, set by nothing), a Warden and a sign
- [x] **Balance measured** through the real engine from Route 2 to the Sigil
      for every starter; Kestrel 3 and Ondine re-pitched from walls; Ashby
      points Fire players at a Delvit; Fern re-checked and unchanged; the walk
      now keeps a lost battle's experience, as the game does
- [x] **Save version 3, unchanged:** lever positions are booleans in the
      existing puzzle record; a real Phase 11 build's save continued in the
      Phase 12 build at the same address
- [x] `debug.levers()`, `debug.lever()`, `debug.stage()`
- [x] Browser-verified with normal controls and true reloads — see CHANGELOG.md

### Phase 12 deferrals
- **Storage access in Tidewatch** (GAME_DESIGN section 2) is not built: the
  phase excludes a storage manager. A fitter in the Mender's Hall says the
  Circle's storage link is not finished; overflow still goes to storage.
  *(Phase 13 finishes it: a storage terminal in every Mender's Hall.)*
- **No cutscene system.** The Vane confrontation is a trainer fight plus a
  breaker plus a flag — enough, and testable. A scripted reveal waits for the
  Vane's leadership.
- **NPCs are not ADDED mid-visit,** only sent away (`leaveBy`): adding one
  could put them on the player's tile. Kestrel reaching the Draw Site after
  the siphon stops would need it.
- **The Fire starter is the hard path through Phase 12** (rock caves, a Water
  Hall): a never-switching Fire team needs the Delvit Ashby points at, and
  wins 28% of tries against Ondine. That matches Fern for the Water starter;
  revisit if a smarter balance driver (one that switches) is written.
- **Glows are pictures only;** a channel that should block or open uses a
  barrier, as the bridges do.

## Phase 13 — the Stormrise Climb, Voltspire City and the third Sigil ✅
- [x] **One-way ledges** (`L`): a two-tile hop downhill, input locked, one step
      on landing, no encounter roll mid-hop; a generic proof that no map with
      ledges can strand anyone, and that every landing is open ground
- [x] **Overworld weather** declared by a map (wind, rain, snow, mist; amount
      1-3; story-dependent choices): a fixed, recycled particle pool, cleaned
      up on every map change; no frame-rate cost
- [x] **PuzzleSystem coils and circuits:** `toggles` (wired levers) and
      `circuits` (AND-gates over signals), validated; the lever proof updated
- [x] **The rockslide lifts** for a Tidal Sigil-holder (Warden Hale,
      `stormriseOpen`, animated, autosaved); old saves load with it down
- [x] **Route 3 — the Stormrise Climb**, three maps (the Terraces, the Frost
      Shelf, the Saddle): heath, frost scree and stormgrass tables, ledges,
      weather, a cairn landmark, five route trainers, seven items
- [x] **Four species** (Cirrup → Stormcrest, Rimelet — the first Ice —,
      Thundrel — the first Dragon, rare but fair) and **two moves** (Rime
      Shard, Drake Pulse): 43 species, 65 moves
- [x] **The Hollow Vane's Stormrise relay:** Surveyor Marl and Relay Overseer
      Crale (a new rank); grounding the relay drops the charged fence, darkens
      the wire, brings the wind back, sends the Vane off, moves Hale up, and
      reveals Survey 16 and **the Convergence** — not what it is for
- [x] **Kestrel's fourth meeting** on the summit (four Aethers, every starter
      branch), and a character beat: the Sigils are no longer the whole point
- [x] **Voltspire City:** the Mender's Hall (the fourth recovery point), the
      Supply Post (the Mender's Draught), the Voltspire landmark, townsfolk,
      the Storm Hall, the Aerie Gate
- [x] **Storage terminals** in every Mender's Hall: deposit, withdraw, swap;
      full party must swap; the last fighter stays; atomic and lossless
      (`StorageSystem`); keyboard navigation and safe cancel; no save change
- [x] **The Storm Hall:** three chambers of wired coils, each gate on its
      own circuit, proved trap-free over every pattern and place to stand;
      three Stormwrights; **Leader Halcyon**; the **Storm Sigil**, 3 of 3
- [x] **The post-Sigil Vane hook** (a Surveyor watching the Aerie road) and
      **the Phase 14 boundary** (the Aerie Gate: `aerieOpen`, set by nothing)
- [x] **Balance measured** from the Tidal Sigil through the real engine for
      every starter; the Overseer and Kestrel 4 re-pitched from walls; the
      Mountaineer points at the scree's answer; Fern and Ondine re-checked
- [x] **Save version 3, unchanged;** a real Phase 12 build's save continued in
      the Phase 13 build at the same address
- [x] `debug.stage()` for Phase 13 milestones, `debug.weather()`, `debug.terminal()`
- [x] Browser-verified with normal controls and true reloads — see CHANGELOG.md

### Phase 13 deferrals
- **Storage is minimal on purpose:** no boxes, search, sorting, release or
  storage healing. If storage grows past a few dozen Aethers, a box system is
  the natural next step; the terminal's columns already scroll.
- **NPCs are still not ADDED mid-visit.** Hale appears on the Frost Shelf on
  the next visit after the relay is grounded, not while the player watches.
- **Weather is a picture only:** it never changes a battle. Weather in battle
  (rain powering Water moves, say) would be a battle-engine change.
- **One ledge direction is drawn** (`ledge_down`); the engine supports all
  four, and a new tile entry is all another direction needs.
- **The balance driver never switches,** so the Water starter needs the
  Rimelet and the Grass starter the Pebblit the Mountaineer points at. A
  switching driver would likely show both as easier.

## Phase 14 — the Aerie, the Hollow, the Circle's Trial and the ending ✅
- [x] **The Circle opens the Aerie Gate:** Warden Ashby in Voltspire's gate
      square for a holder of three Sigils — nothing else asked; animated,
      autosaved; the gate becomes a real exit. Phase 13's boundary tests
      rewritten, deliberately, to test the opening
- [x] **A real Phase 13 save** (written by the released `d56ca8c` build beside
      the shut gate) kept as a fixture: loads exactly, gate shut, Ashby ready
- [x] **The Aerie Road** (snow, stormgrass, scree, ledges, a lost Vane cart,
      three trainers, three items, one wild table)
- [x] **The Aerie** (the Wellspring landmark — dim, then bright; the Circle
      Hall at the top of a guarded walk; weather that follows the story) and
      **the Aerie Lodge** (Mender, shop, terminal: the pre-Trial rest)
- [x] **The Convergence** defined and told: an engine that would become the
      valley's meeting of currents and sell them back; **Director Thale**, a
      motive that is a trade, not a cackle (GAME_DESIGN.md section 25)
- [x] **The Hollow's Works:** three banks, each a valve held by a Vane boss;
      venting them reuses Mistvault's bridge, the Tidal Hall's floating floor
      and the Storm Hall's wired gate, and the core door is a circuit — no new
      puzzle code; the lever proof over every setting and place to stand
- [x] **The final Vane** (two Surveyors, Vossler and Crale back, a new
      Foreman, the Director — a new rank): ordinary battles, no boosts, no new
      species; `convergenceStopped` once; the engine cold, the Aerie changed
- [x] **Kestrel's last meeting:** a full six on the Circle's Walk, a
      final-form starter for every starter, and the payoff
- [x] **The Circle's Trial:** three Wardens of the Circle and **Champion
      Seren** (a full six), in order, with documented rules (no Mender inside,
      the Bag allowed, the doors never lock, beaten stays beaten, ordinary
      blackout) and no attempt state to corrupt
- [x] **The ending:** `championshipWon` → resume autosave → `storyComplete`
      once → seven illustrated pages → **credits** (honest attribution,
      skippable, never a trap, a held key cannot skip twice) → the Aerie →
      post-story autosave; resumes if the game is closed mid-credits; never
      plays twice
- [x] **World reactions** after the story (Kestrel, Wick, Mum, the Leaders,
      the Aerie's Wardens, Voltspire and more); "Champion" on the save slot
- [x] **Balance measured** from the Storm Sigil to the Champion for every
      starter; an optional **switching policy** in the battle sim, compared
      with the never-switching player; a pre-Trial Lodge stop in the walk;
      Fern, Ondine, Halcyon and Kestrel 1-4 re-checked unchanged
- [x] **Sound:** procedural blips and fanfares under the master volume — no
      files, silent when sound is unavailable
- [x] **UI audit** with a late-game save; the Summary's accuracy and layout,
      the Wellspring and engine tiles, and gates that follow a beaten trainer
      fixed
- [x] **A battle-engine bug from Phase 4 fixed** (found in the play pass): a
      trainer's next Aether, sent out mid-turn, struck with the fainted one's
      move. Every balance guard rail re-run on the fixed engine; Halcyon's
      Burrzap and the Champion's Cragmaw re-measured up a level or three
- [x] **Save version 3, unchanged** (one optional summary field, `champion`)
- [x] `debug.stage()` for every Phase 14 milestone; `debug.ending()`
- [x] Browser-verified: New Game to the credits by keyboard, with deliberate
      losses to the Director, Kestrel and the Champion; the real Phase 13
      upgrade; reloads after the credits — see CHANGELOG.md

### Phase 14 deferrals
- **The never-switching player cannot reliably beat the Champion.** The
  finale is pitched at a player who switches (section 25 of GAME_DESIGN.md
  has the comparison). That is a choice, recorded, not an accident.
- **The Trial does not reset on a loss.** A beaten Warden stays beaten, so
  the Champion can be retried alone. A stricter, Elite-Four-style reset would
  need attempt state, deliberately avoided.
- **NPCs are still not ADDED mid-visit:** the Circle's Wardens appear in the
  Hollow on the next visit after the Director is beaten.
- **Sound is a handful of effects, not music.**

## Post-release (optional — none of this is required)
- [ ] A postgame: Kestrel's "thirteen more surveys" are a ready-made thread
- [ ] Rematches with the Leaders and the Trial
- [ ] A full storage box system, if storage ever grows past a few dozen
- [ ] Music (the sound layer and the master volume are ready for it)
- [ ] Battle animations and transitions
- [ ] Weather that matters in battle
- [ ] A Trainer card screen in the menu
- [ ] More ledge directions (the engine supports all four)

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
- Sound (Phase 14) is procedural and governed by the master volume; there is
  no music.
- Placeholder art is procedurally generated. Real sprites can be dropped in later by
  changing only `src/systems/TextureFactory.js` + the asset keys in `src/config/assets.js`.
- ~~Saving is Phase 10, so progress is lost on reload.~~ — done in Phase 10. ✅

## Known Issues
- None currently open. Bugs found during Phases 1-2 are listed in CHANGELOG.md,
  each with the test that now covers it.
