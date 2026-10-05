# Changelog

Meaningful development milestones, newest first.

---

## Phase 14 — the Aerie, the Hollow, the Circle's Trial and the ending

**The main story is complete.** Holding three Sigils, the Warden Circle's
envoy opens the **Aerie Gate**. The **Aerie Road** climbs to the top of the
valley, where the three currents rise together at the **Wellspring** — and the
Wellspring is failing. Under it, in the **Hollow**, the Hollow Vane have built
the **Convergence**: vent its three banks of stolen current, beat their
keepers and **Director Thale**, and the engine goes cold. Then Kestrel, a fifth
and last time, with a full team of six; then the **Circle's Trial** — three
Wardens of the Circle and **Champion Seren**. Win, and the ending and the
credits roll; afterwards the valley is open to wander. No postgame.

### Added

**The Circle opens the gate.** Warden Ashby waits in Voltspire's gate square
once the Storm Sigil is won; talking to them sets `aerieOpen` — three Sigils
are the whole test, nothing else is asked. The gate swings open, Ashby and the
Vane watcher leave, one `story` autosave; the road behind the gate is a real
exit now. Phase 13's boundary tests were rewritten, deliberately, to test the
opening.

**Six maps:** the **Aerie Road** (30x40: snow, stormgrass and scree on one
wild table, ledges back down, a lost Vane cart, three trainers, three items),
**the Aerie** (36x30: the Wellspring landmark, dim then bright; the Circle
Hall at the top of a guarded walk; mist that turns to snow), **the Aerie
Lodge** (Mender, shop, terminal — the sixth recovery point), **the Hollow's
Works** (36x28), **the Convergence** (24x16) and **the Circle Hall**.

**The Convergence**, defined (GAME_DESIGN.md section 25): an engine that,
primed with all three bottled currents, would become the place the valley's
currents meet, drawing every one of them to the Vane's lines to be metered and
sold, and leaving the Wellspring, the springs and storms it feeds and the wild
Aethers born of them to fade. **Director Thale** (a fourth Vane rank) runs it
for a reason, not a cackle: an engineer from Voltspire who would trade thirty
dark nights for a thousand years of steady light.

**The Works — the game's puzzles, once each, with no new puzzle code.** Three
banks (earth, sea, storm), each a valve held by a Vane boss. Venting the earth
bank holds a mist bridge (Mistvault), the sea bank floats a cistern's
pontoons (the Tidal Hall), the storm bank lifts a wired shutter (the Storm
Hall), and the core door is a circuit over all three. Proved trap-free with
the lever proof over every setting times every place to stand.

**The final Vane:** Surveyors Odile and Rusk, Foremen Vossler (back) and Brack
(new), Overseer Crale (back), and the Director — ordinary trainers, no boosts,
no new species. Beating Thale sets `convergenceStopped` once: the engine goes
cold, Thale walks off, the Works' barriers stand open, the Aerie clears and
the Wellspring runs bright, Kestrel moves to the Walk, the Circle comes in.

**Kestrel's last meeting** on the Circle's Walk: a full six (Gustwing,
Carapex, Voltmane, Cragmaw, Brambelle and the starter at 34 — its final form
for every starter), and the payoff of their arc.

**The Circle's Trial:** Earth Warden Ashby, Sea Warden Isla, Sky Warden Hale
and **Champion Seren** (a full six, Thundrel 38 at its head), each in their
own chamber, in order — each gate opens on the win before it. Rules, said by
the Steward and recorded: no Mender inside, the Bag allowed, the doors never
lock, a beaten Warden stays beaten, an ordinary blackout on a loss. No attempt
state at all.

**The ending** (`EndingSystem`, `EndingScene`, `CreditsScene`): the Champion's
win sets `championshipWon`; a resume autosave; `storyComplete` once; seven
illustrated pages; **the credits** — honest attribution only, skippable,
never a trap, a held key cannot skip twice; the player is set down outside the
Circle Hall and the post-story autosave is written. Closed mid-credits, the
game Continues back into them; once begun, the ending never plays again.

**After the story:** Kestrel, Professor Wick (come up from Emberhollow), Mum,
all three Leaders, the Aerie's Wardens, Voltspire's people and others react;
the save slot says **Champion**.

**Sound** (`SoundEffects`): the game's first sounds, procedural — menu blips,
hits, faints, catches, level-ups, evolution, the trainer "!", healing, the
Sigil and ending fanfares — synthesised into Phaser's master mute and volume,
so the Volume setting governs them all. No files.

**Balance tooling:** an optional **switching player** in the battle sim (test
helper only), `walkToChampion`, and a pre-Trial Lodge stop in the walk.

**Debug:** `debug.stage()` for every Phase 14 milestone; `debug.ending()`.

### Changed

- **Voltspire:** the gate's row is a road off the map; Sorrel, the sign, the
  keeper and the child have new lines; the Vane watcher leaves when the gate
  opens. **Hale** leaves the Frost Shelf once the Circle convenes.
- **Crale's** Phase 13 line no longer says the cells went "down" to the
  Convergence — it is above Voltspire.
- **The Summary screen:** accuracy is shown as stored (it read "Acc 10000"),
  and each move's description has a line of its own instead of running into
  the numbers.
- **Every trainer win re-syncs the map's barriers**, animating only those that
  changed — a gate that follows a beaten trainer opens at once.
- **The save summary** gains an optional `champion` field.
- Tests that counted the game's Mender's Halls (four) count five.

### Balance — measured, not guessed

Walking on from the Storm Sigil through the real engine (`walkToChampion`),
every starter, 40 seeds per fight; the full table is in GAME_DESIGN.md
section 25.

- **What the walk showed first:** every team arrives at the Aerie leaning on
  one Aether (28-34, with a Route 1 catch still at 14). Against six-strong
  teams no level setting made that fair. The measured player now stops at the
  **Lodge** (leaves anything ten levels behind in storage, fills to six from
  the Aerie Road, trains together) — and Old Warden Abner says so in the game.
- **Two players.** A test-only **switching policy** (trade a badly matched
  Aether for a clearly better one, at most once per foe) is compared with the
  never-switching player of every earlier phase. The Aerie Road is no wall for
  either. From the Lodge on, the switcher never needs more than two tries:
  **Director Thale** 95% / 98% / 100% (Fire / Water / Grass), **Kestrel 5**
  63% / 70% / 57%, **Champion Seren** 78% / 45% / 100% — the hardest fight of
  the Trial for every starter. The never-switcher beats Thale and Kestrel with
  tries but not reliably the Champion: the finale asks for switching, as the
  valley's people have advised since Mistvault. All on the fixed engine (see
  Fixed during verification).
- **Measured fixes:** the Summit Guide's Cragmaw walled the Fire walk (now
  Brawnhare and Rimelet); Sea Warden Isla, water-heavy, was harder than the
  Champion for Fire over 40 seeds (55% against 63%) — one level lower; the
  Champion's Cragmaw stands at 38, level with her ace, after the engine fix
  made her the Fire walk's easiest big fight (93%); the Director, Brack and
  the Hopeful's prize money were cut to stay under the reward ceiling.
- **Levels:** the switcher's best Aether meets the Champion at 38-41; the
  Champion's own six are 35-38.
- **Fern, Ondine, Halcyon and Kestrel 1-4:** their guard rails were re-run
  on the fixed engine. All hold but one: with no free hits, the Water and
  Grass walks found Halcyon equally hard (67.5% / 65%), so his Burrzap is a
  level higher (25) — Fire 80%, Water 50%, Grass 60%, hardest for Water again.
  The Frost Shelf's catch is now checked by win rate: without it, 5% against
  Halcyon (Water) and 15% against Kestrel 4 (Grass).

### Saves

**Save version 3, unchanged.** Phase 14's progress is four flags
(`aerieOpen`, `convergenceStopped`, `championshipWon`, `storyComplete`),
beaten trainers and three valve booleans in the existing `puzzles` record.
The save summary gained one optional field, `champion`; a summary without it
reads as "not yet". A real save written by the released Phase 13 build
(commit `d56ca8c`) beside the shut gate, Continued by the Phase 14 build at
the same address, loads exactly and plays on through the gate.

### Fixed during verification

- **A trainer's next Aether struck with the fainted one's move** (found in
  the manual play pass, in the Champion's chamber: her Rimelet used
  Stormcrest's Aerial Dive the moment it was sent out). Since Phase 4, when
  the player's move knocked out a trainer's Aether first, the replacement was
  sent in at once and then carried out the move chosen for the one that had
  fainted — a free hit in every trainer battle, which a fainted player Aether
  never got. Each action now remembers which Aether it was chosen for. Tests
  prove it fails on the old engine; every balance guard rail was re-run (see
  Balance).
- **The battle's Party list overlapped itself with six Aethers** (found in
  the play pass, the Champion's chamber): each entry's level-and-HP line ran
  into the name below it, and the last row's was cut off by the frame — the
  same for any five- or six-line list, such as the move-to-forget prompt.
  Lists too tall for two lines a row now put the detail at the right-hand
  end of the name's own line; the action, move and Bag menus are unchanged.
- **Old Warden Abner stood on the only tile in front of the Lodge's shop
  counter** (found planning the journey): the shop could not be reached. He
  sits by the fire now, and a new test proves every Mender, shopkeeper and
  terminal on the new maps can be spoken to from a reachable tile — which
  also caught a sign behind the mending array, now removed.
- **A gate that follows a beaten trainer stayed drawn shut until the map was
  reloaded** — the Circle Hall's chamber gates and the Circle's Walk: only
  flag-setting wins re-synced barriers. Every win now does, animating only what changed.
- **The Wellspring and the Convergence engine drew as grids of framed tiles**
  (visual pass) — drawn as one seamless landmark each now.
- **The ending's hills ran down into its text panel** (visual pass) — the
  picture is clipped to its frame.
- **The ending's words and picture could name different partners** (code
  review): the words found a starter in storage, the picture looked only in
  the party. Both ask one function now, and only the starter is said to have
  walked out of the Warden's Lodge with the player.
- **Harness, not game:** the journey's walk past Voltspire's Sorrel stalled
  behind them (the greedy walker); the audio suite imported a dev-server path
  that a production build does not serve; and tests compared
  `defeatedTrainers` as a list when it is a map. Each was fixed in the test,
  not the game.

<!-- VERIFICATION -->

---

## Phase 13 — the Stormrise Climb, Voltspire City and the third Sigil

The game now runs to the third and last Beacon Hall. Holding the Tidal Sigil,
talk to Warden Hale and the rockslide rolls aside. **The Stormrise Climb** is
three maps of mountain — terraces with one-way ledges, wind, mist and snow,
wild Aethers on heath, frost scree and stormgrass, and a rare one where the
lightning comes down. On the Frost Shelf the **Hollow Vane** have built a
lightning relay that has stolen the storm for a month; beat their Relay
Overseer, ground it, and learn where all three currents are going: **the
Convergence**. Kestrel waits at the top of the pass. Beyond it, **Voltspire
City** — a fourth Mender, a storage terminal, a better shop, the Voltspire —
and the **Storm Hall**, three chambers of wired coils, where **Leader
Halcyon** holds the **Storm Sigil**. Three of three. The Aerie Gate, at the
top of the city, stays shut: that is where Phase 13 ends.

### Added

**One-way ledges** (`TileMap.getLedgeHop`, `Player.startHop`): a tile with
`ledge: '<direction>'` is solid; walking into it in that direction hops the
player two tiles in one short arc, input locked, ONE step announced on
landing — so the ledge tile never rolls an encounter or trips a trainer.
`tests/ledges.test.js` proves, for every map with ledges, that nobody can be
stranded (barriers as found and all open), that every ledge can be hopped, and
that every landing is open, non-encounter ground nobody stands or wanders on.

**Overworld weather** (`src/systems/WeatherRenderer.js`): a map declares
wind, rain, snow or mist, amount 1-3 — or a list of choices with `when`
conditions, first match drawn. A fixed, seeded particle pool (at most 60),
made once per map, recycled every frame with no allocation, destroyed on
every map change. A picture only.

**Coils and circuits** (`src/systems/PuzzleSystem.js`): `toggles` — a lever
that also flips other lever states — and `circuits` — AND-gates over signals
(`circuit:<id>`), which may need earlier circuits. `nextLeverState()` is the
one place a press is worked out; validation catches a coil that toggles
itself, an unknown state or one twice, and a circuit with no needs, a
duplicate id, or a need on a later circuit. The lever proof understands both.

**The rockslide lifts:** Warden Hale's new branch, for a Tidal Sigil-holder,
sets `stormriseOpen` — the boulders roll aside, one `story` autosave. Old
saves load with it down. Hale moves up to the Frost Shelf once the relay is
grounded.

**Route 3 — the Stormrise Climb**, three maps: **the Terraces** (30x38, five
terraces on a switchback road, heath strips across it, ledges), **the Frost
Shelf** (30x30, frost scree, the Vane compound, the charged fence across the
pass) and **the Saddle** (30x26, stormgrass, the cairn, a plateau reached only
from above). Three encounter tables, one per ground (20-25). Five route
trainers: Climber Tamsin, Herder Bryn, Mountaineer Ossian, Skyherd Linnet,
Stormchaser Vey. Seven ground items, existing items only.

**Four species (43) and two moves (65):** Cirrup → Stormcrest (Electric/
Flying, at 27), Rimelet (the first **Ice** type), Thundrel (Electric/Dragon,
the first **Dragon**, rare but fair on the summit — about one encounter in
23, at 23-24); Rime Shard (the first Ice move) and Drake Pulse (the first
Dragon move). 17 of 18 types are now in the game; only Psychic is held back.

**The Hollow Vane's Stormrise relay:** a third rank, **Relay Overseer**
(Crale), and Surveyor Marl, on the ordinary trainer pipeline. The relay
console stands behind the Overseer's tile. Grounding it sets
`stormriseRelayStopped`: the charged fence goes dead, every live wire is drawn
dark (a `glows` picture), the shelf's mist gives way to wind (`weather`
choices), Marl packs up and leaves, Hale arrives, one `story` autosave. The
board says why Stormrise mattered — Survey 16, the storm's current, and three
lines on a map ending at **THE CONVERGENCE** above Voltspire — and not what
the Convergence is for.

**Kestrel's fourth meeting**, under the pass into Voltspire (Gustwing 21,
Carapex 21, Zaplet 21, starter 23; every starter branch), and a character
beat: "I used to think the Sigils were the whole point."

**Voltspire City** (36x30) with its **Mender's Hall** (the fourth recovery
point) and **Supply Post** (the first to sell the **Mender's Draught**, a new
item: 100 HP for 900), the Voltspire landmark, five townsfolk who remember the
dark month, and the **Storm Hall**.

**Storage terminals** (`src/systems/StorageSystem.js`, `action: 'storage'`):
one in every Mender's Hall. Two columns, keyboard navigation, Deposit /
Withdraw / Swap / Cancel; six travel at most, a full party must swap, the last
Aether able to fight stays; every move atomic and lossless (the same object
moves — id, nickname, level, experience, HP, PP, status, moves untouched);
Cancel before Confirm changes nothing; an autosave on leaving. Tidewatch's
fitter, who said the link was not finished, now says it is.

**The Storm Hall:** three chambers of wired coils (a row of three, a row of
four, a square of four matching a plate's pattern), each gate on its own
chamber's circuit, the dais lit when all three hold; proved trap-free over
every coil pattern times every place to stand, every chamber solved from
where it starts; the gates stay open for a Sigil-holder. Stormwrights Ada,
Fenn and Ines; **Leader Halcyon** (Voltmane 24, Burrzap 24, Stormcrest 26).

**The Storm Sigil**, awarded once after the win; the Sigil screen reads
**3 of 3**. Post-victory lines for Halcyon, Kestrel, the Aerie Warden and the
city; a **Vane Surveyor** appears watching the Aerie road — a hook, no fight.

**The Phase 14 boundary:** the Aerie Gate (`aerieOpen`, set by nothing), a
Warden and a sign; behind it the road ends in rock.

**Debug:** `debug.stage()` gains `stormrise`, `frostShelf`, `summit`,
`voltspire`, `stormHall` and `stormSigil`; `debug.weather()`; `debug.terminal()`.

### Changed

- **Tidewatch:** two road tiles on the top row lead up the Climb, behind the
  rockslide; Hale, the sign and Kestrel have Phase 13 lines; Hale leaves for
  the shelf once the relay is grounded.
- **Every Mender's Hall** has a storage terminal (one tile each).
- **The pause menu's Storage page** stays a summary and now says where to
  move Aethers.
- **The trainer reward ceiling grows with level** (55 coins a level, 80 for
  a Leader) instead of a flat 1,000 / 2,000 — the Overseer and Kestrel 4 pay
  1,240 and 1,200.
- **The Mistvault Vane tests** count the Vane in Mistvault, not every Vane in
  the game; the Stormrise Vane are tested in `tests/stormrise.test.js`.
- **The rockslide tests** now prove the Phase 13 opening (one setter, only for
  a Tidal Sigil-holder, old saves closed) instead of "nothing opens it".
- `badges.js`: the Storm Sigil names Halcyon.

### Balance — measured, not guessed

Walking on from the Tidal Sigil through the real engine (`walkStormrise`,
`walkToStormSigil`), every starter, with and without the optional Stormchaser:

- **Relay Overseer:** the first draft (Corrodit 22, Gloamite 22, Ironvole 24)
  won 7% for the Fire walk and 0% for the Grass walk — an Ironvole hits both
  hard and shrugs off both. Shipped: Umbrat 21, Gloamite 22, Corrodit 23 —
  97% / 100% / 100%.
- **Kestrel 4:** the first draft (Gustwing 22, Carapex 22, Rimelet 22,
  starter 24) won 0% for the Grass walk: all four of its Aethers hit Grass
  super-effectively, and even with a Pebblit caught a Rimelet version stayed
  at 15-33%. The new member is a Zaplet (a threat to Water instead), at
  21/21/21 + starter 23: 97% / 100% / 75%.
- **Halcyon:** at 25/25/27, before the scree catch, the Water and Grass
  walks never won (Fire 63%). Shipped 24/24/26: hardest for Water (47%), 90%
  for Fire, 72% for Grass; harder than Ondine against the very same teams.
- **The Frost Shelf's catch:** the Water walk needs a Rimelet (Ice hits
  Stormcrest and Burrzap) and the Grass walk a Pebblit (Rock shrugs off
  Kestrel's Cindraw) — both common on the scree, both pointed at by the
  Mountaineer. Without them those two fights are walls; with them no fight on
  the Climb or in the Hall takes more than three tries. A test fails if the
  hint stops being needed.
- **Levels:** best creature 24-27 at the top of the Climb, 25-29 at the Storm
  Sigil — the plan's 25-30 for Hall 3 held.
- **Economy:** 7,300 coins of prize money from the foot of the Climb to the
  Hall door: a handful of Draughts and an Ultra Orb, never the shelf.
- **Fern and Ondine, re-checked:** their guard rails pass unchanged; nothing
  on the way to them changed, so they were not rebalanced.

### Saves

**Save version 3, unchanged.** Coil positions are booleans in the existing
puzzle record; the two story flags, the Sigil and beaten trainers are
existing fields; storage moves rearrange the existing `party` and `storage`
arrays. A save written by the released Phase 12 build (commit `3951c59`),
Continued by the Phase 13 build at the same address, loads exactly —
rockslide down — and plays on, through a terminal swap and a true reload.

### Fixed during verification

- **Halcyon and Ines both watched the tile before the dais** (found by the
  Storm Hall browser suite): the Leader's check ran first, so the player
  fought Halcyon instead of the last Stormwright. Halcyon is now spoken to,
  like Fern and Ondine, and a new test checks that no tile on any map is
  watched by two trainers.
- **The terminal's column headings overlapped its title** (found in the
  visual pass) — moved down.
- **The terminal's detail line read a move field that does not exist** (found
  reading the code while writing the balance walk) — it now shows each move's
  name and PP.
- **The Mountaineer's first hint said a Pebblit "shrugs off lightning"** — Rock
  does not resist Electric; the line now says fire only.
- **A harness race, not a game bug:** three Phase 4-8 regression suites
  failed at "a battle started" on the first full run. Phaser queues a scene
  launch to the next frame, so for one frame a battle is being entered but
  not yet active; the old harness looked once and read that frame as "no
  battle". Measured on both builds, the battle becomes active after exactly
  one frame either way — only where the harness's look fell changed. The
  shared harness now waits while a launch is pending (and only then); all
  three suites pass, and the same suite passes on the Phase 12 build either
  way. Tidewatch12's two rockslide checks were updated for the intended
  Phase 13 change (Hale opens the road); the Phase 12 original is kept.

### Verification

- **Unit tests:** 4091 passing (52 files), lint clean, production build clean.
- **Browser, on the production build, with normal controls:**

  | Suite | Result |
  |-------|--------|
  | journey13 — New Game to the third Sigil, keyboard only | 249/249 |
  | stormrise13 — rockslide, ledges, weather, a capture on each ground, the relay, Kestrel 4 lost and won | 65/65 |
  | voltspire13 — landmark, Mender, storage terminal (every move and refusal, scrolling, reload), shop, Aerie Gate | 41/41 |
  | stormhall13 — coils by keys, a mid-puzzle reload, Halcyon lost (blackout) then won, 3 of 3, the Vane hook | 52/52 |
  | upgrade13 — a real Phase 12 build's save continued in the Phase 13 build | 21/21 |
  | persist13 — a true reload at seven milestones, three reloads in a row | 17/17 |
  | leak13 — 40 map changes, 20 sky changes, 20 hops, 20 coil touches, 10 terminal visits | 10/10 |
  | perf13 — loads, frame rate on every new map, the heaviest weather | 6/6 |
  | shots13 — the visual pass | 8/8 |
  | Phase 1-12 regressions — every earlier browser suite, journey12 included | 37 suites, 1,311 checks, all pass |

- **Every Phase 13 suite was run a second time on the final build** (after
  the last fix), the upgrade test included: identical results.
- **Performance:** every new map loads in about 0.7-0.8 s (harness wait
  included) and runs at 59-60 FPS, weather and all; the heaviest sky the game
  allows (54 drops) also holds 60. A full late-game save (ten Aethers, three
  Sigils, every puzzle) is 4.2 KB; the persistence suite's is 3.5 KB.

---

## Phase 12 — Mistvault Cavern, Tidewatch Harbor and the second Sigil

The game now runs to the second Beacon Hall. Beat Kestrel below Mistvault and
Warden Corran takes the cordon down. **Mistvault Cavern** is three maps of
rubble, chasms and mist bridges that only hold where an aether current runs;
two old valves steer it. Deep inside, the **Hollow Vane** — at last, on screen
— are siphoning the current into storage cells. Beat their Draw Foreman, throw
the breaker, and walk out through the Grotto to **Tidewatch Harbor**: a third
Mender, a better shop, a lighthouse, Kestrel a third time, and the **Tidal
Hall**, where three wheels turn one tide. Beat **Leader Ondine** for the
**Tidal Sigil**. The Stormrise Climb, north, is under a rockslide: that is
where Phase 12 ends.

### Added

**Levers, currents and signals** (`src/systems/PuzzleSystem.js`) — a second,
generic way to move barriers, and not a reskin of the root switches.

- A **lever** is FACED (Confirm), has exactly two positions and is stored as
  one boolean in `gameState.puzzles` — the save format did not change. Levers
  may share a state (`state: 'tide'`), so several move together.
- Levers make **signals**: `<state>:<position>`, and — through a **current**
  that flows from `flow.sources` along the outputs valves select —
  `current:<channel>`. `flow.allPoweredWhen` floods every channel at once.
- Barriers can follow a signal (`openWhenSignal`, `closedWhenSignal`) or close
  on a world condition (`closedWhen`, the mirror of `openWhen`). **Glows**
  draw tiles lit by a signal or a condition — the player SEES the current.
- `pressLever()` refuses to close anything on anyone; validation checks every
  reference, refuses a current that runs in a circle and a lever on or beside
  a barrier. The save validator keeps only real lever states, and never a
  value for a barrier that follows a signal.
- `exploreLeverStates()`, and `tests/helpers/leverProof.js`, which walks every
  lever setting TIMES every patch of floor the player could be standing in.

**The cordon comes down.** Corran's new branch (only once Kestrel is beaten
up there) sets `mistvaultOpen`: the rope draws back while the player watches,
one `story` autosave, and Kestrel runs into the cave — `leaveBy`, a new
optional NPC field for someone the story sends away mid-visit. The way in is
two ordinary exits in the cave mouth. Old saves load with it up.

**Mistvault Cavern — three maps** (30x26, 34x30, 30x32): the Mouth (Warden
Ashby and the objective; the Vane's board and cell depot), the Galleries (two
dependent valves, four mist bridges, lit channels, an optional east wing and
a pocket) and the Draw Site (the rig, the breaker, the tideward mist, the
Grotto's shallows). Seven ground items, existing items only.

**The Hollow Vane** as data (`src/data/factions.js`: emblem, types, looks,
ranks), and five Vane trainers on the ordinary pipeline with `faction` and
`rank` (validated). Draw Foreman Vossler stands on the breaker's only face.
Throwing it sets `mistvaultSiphonStopped`: the mist clears, every bridge holds
for good, the channels light, Route 2's dry spring fills again, a dozen people
change their lines, one `story` autosave. The Vane stay active — and their
plan unrevealed beyond "Survey 14", "Survey 15" and cells bound for Stormrise.

**Five species (39) and two moves (63):** Gloamite (Rock/Dark), Corrodit
(Poison/Steel), Minnet → Marlance (Water → Water/Steel, at 26), Barnaclaw
(Water/Rock); Riptide (the first physical Water move) and Siphon Fang (the
Vane's draining Dark bite). Three cave tables, one on the Grotto's shallows.
New looks: `vane`, `vaneForeman` (with the hollow-ring emblem) and `warden`.
Twenty-three new tiles, all drawn at runtime.

**Tidewatch Harbor** (36x28) with its **Mender's Hall** (the third recovery
point) and **Supply Post** (the first to sell the Ultra Orb and the Clear
Tonic), the Tidewatch light, piers, boats, and people who follow the story
before and after the Sigil.

**Kestrel's third meeting**, beside the fenced Hall road (Gustwing 18,
Grubbit 19, starter 19).

**The Tidal Hall:** three tide wheels sharing ONE state; causeways flood and
pontoons float; the climb is low, high, low. A Deckhand and a Diver.

**Leader Ondine** (Barnaclaw 19, Brookel 19, Marlance 21) and the **Tidal
Sigil**, awarded once after the win; the Sigil screen reads 2 of 3. Post-Sigil
lines for Ondine, Kestrel and the town.

**The Phase 13 boundary:** the Stormrise Climb under a rockslide
(`stormriseOpen`, set by nothing), a Warden and a sign.

**Debug:** `debug.levers()`, `debug.lever(id, position)`, `debug.stage(name)`.

### Changed

- **Route 2:** the cave mouth has exits behind the cordon; Corran, the sign,
  Ansel, Tobiah and the stake have Phase 12 lines; Kestrel leaves when the
  cordon comes down; the spring is a `closedWhen` barrier.
- **The lever result is shown in the dialogue box**, not a toast: what the
  current did is the puzzle's whole feedback, and a toast is one short line.
- **The route walk keeps a lost battle's experience**, as the game does (the
  battle runs on the live party). Phase 11's walks barely ever lose; their
  numbers stand.
- `badges.js`: the Tidal Sigil names Ondine; `tiles.js`: `Z` is now the
  lighthouse, so two tests that used `Z` as an "unknown" character use `§`.

### Balance — measured, not guessed

Walking on from the top of Route 2 through the real engine
(`walkMistvault`, `walkToTidalSigil`), every starter, both Route 2 roads:

- **Mistvault:** no Vane fight takes more than two tries; the Foreman is the
  hardest. A never-switching Fire team is walled by Gloamite and Corrodit, so
  Ashby tells Fire players to catch a Delvit in the Mouth's rubble — with one,
  every fight is won first time. A test fails if that hint stops being needed.
- **Kestrel 3:** the first draft (Gustwing 19, Carapex 20, starter 22) won 13%
  for the Fire walk and 0% for the Grass walk. Shipped: 80% / 95% / 75%.
- **Ondine:** like Fern, hard for exactly one starter — the Fire walk wins 28%
  of tries (two in the walk); Water and Grass every time. The first draft
  (20/20/22) walled Fire at 13%.
- **Levels:** starter 17-20 through the cave; best creature 21-22 at the Sigil
  (the plan's 18-22 for Hall 2 held; its 20-25 for Mistvault did not — the
  cave is 15-19 as built).
- **Fern, re-checked** with the corrected driver: unchanged and not a wall
  (Water + Flittle 43% at 13/12, 53% at 14/13, 85% at 15/14). Not changed.
- **Economy:** 6220 coins of prize money from the cordon to the Diver; an
  Ultra Orb and a few Super Potions before Ondine, not the shelf. Catch rates:
  Minnet 180 (a common), Gloamite and Barnaclaw 110, Corrodit 100, Marlance 60.

### Saves

**Save version 3, unchanged.** Lever positions are booleans in the existing
puzzle record; the two story flags, the Sigil and beaten trainers are existing
fields. A save written by the released Phase 11 build, Continued by the Phase
12 build at the same address, loads exactly — cordon up — and plays on.

### Fixed during verification

- **The spring valve's handle pointed the wrong way** (found in the visual
  pass): a lever showed its first picture for its first position, and the
  spring valve's first position is EAST — so its handle pointed left while
  the light ran right. Levers may now say which picture each position shows
  (`art`), and a test checks every valve handle against where its output
  channel really lies.
- **Two dead lines removed:** neither Galleries valve can ever be turned with
  no current reaching it (the far valve stands beyond the bridge only its
  current holds), so their "dry" lines could never be read. The mechanism
  stays, covered by its own unit tests; a test now explains the map.
- **Harness, not game:** `placePlayer` is a test teleport and never recorded
  the player's location, so a save made right after one put the player back
  on the map's arrival tile. The suites now take their last steps with real
  key presses. Two suite bugs (a shop list read before entering "Buy", a test
  party too weak to beat Kestrel) were the suites' own.

### Verification

**Automated:** 3462 tests in 45 files (Phase 11 ended at 2926 in 39),
lint clean, production build 339 kB (gzip 100 kB) plus Phaser. New suites: `levers` (27),
`mistvault` (38), `mistvaultBalance` (17), `tidewatch` (20), `tidalHall` (19),
`tidewatchBalance` (17); `trainers`, `route2`, `npcPresence` and
`saveValidation` grew. Every auto-generated data check — maps, species,
moves, tiles, trainers, Sigils — now covers Phase 12's content too.

**Battles did not change.** The battle engine, the battle scene, the type
chart, the stat maths, the creature factory and `balance.js` are untouched;
species and moves only gained entries.

**In a real browser, against the production build, with normal controls,
seeded battles and TRUE page reloads:**

| Suite | Result | Covers |
|-------|--------|--------|
| journey12 | 156/156 | New Game to the SECOND Sigil on the keyboard: everything journey11 did, then Corran and the cordon (animated, autosaved, Kestrel running in), the Mouth and Ashby, a real capture in the cave, Tallis, both valves (handles, bridges, saved state), Quill, Seld, the Foreman and the breaker, the Grotto, Tidewatch's Mender, Kestrel by the Hall road, the tide wheels, both Gym trainers, Ondine, the Tidal Sigil, the Sigil screen (2 of 3), a save and a true reload |
| mistvault12 | 49/49 | the cordon (picture, collision, Kestrel leaving, autosave, a fresh visit); captures on cave rubble and in the Grotto's shallows from their own tables; all four valve settings — bridges, sprites, handles and lit channels agreeing; both valves by Confirm; a true reload standing ON a mist bridge; a blackout in the cave (to the last Mender, nothing recorded, valves kept); the Foreman, the breaker, the mist, one story autosave, a reload after; every bridge holding for good; Route 2's spring full |
| tidewatch12 | 37/37 | the cave mouth; the Mender and the recovery point; the shop's new stock and an Ultra Orb bought; Kestrel's third fight and their walk back; every wheel showing one tide; a true reload standing on a pontoon at high tide; a LOSS to Ondine (blackout to Tidewatch's Mender, no Sigil, money lost); the WIN (outro, Sigil once, no rematch, 2 of 3); the town after the Sigil; the rockslide |
| persist12 | 14/14 | a true reload at six Phase 12 milestones, each compared field for field and with the world rebuilt to match; three reloads in a row change nothing |
| upgrade12 | 17/17 | the RELEASED Phase 11 build (commit 3991157) served at the game's address: a real save at the cordon; then the Phase 12 build at the same address — the save Continues exactly, cordon CLOSED, save version still 3; Corran opens it; the autosave stays version 3; into the cave through the real exit; a true reload inside it |
| leak12 | 9/9 | forty map changes through the whole cavern and Tidewatch, twenty valve turns, twenty tide turns, four cordon departures — display objects, tweens, timers, textures, keys, listeners and NPCs flat; heap steady |
| perf12 | 4/4 | save size, load time and frame rate on every new map |
| shots12 | 9/9 (+ two inspection passes) | the five new species in battle, a Vane battle, the Vane and the Circle in person, both valve settings, both tides, the Sigil screen — and every zone of all seven new maps, before and after the siphon and at both tides — inspected by eye |

Every Phase 1–11 browser suite was re-run on the final build: playthrough
12/12, phase2 34/34, phase2b 18/18, phase3 22/22, phase3b 60/60, phase4 27/27,
phase4b 15/15, phase4c 33/33, phase5 41/41, phase5b 13/13, phase6 65/65,
phase7 85/85, phase8 59/59, phase9 98/98, phase9b 16/16, phase9c 12/12,
firstbadge 54/54, shopscroll 6/6, debug9 15/15, phase10a 69/69, phase10b 45/45,
phase10c 35/35, shots10b 11/11, persist10 84/84, leak10 9/9, kestrel11 33/33,
route11 39/39, upgrade11 18/18, leak11 8/8, shots11 15/15, and the Phase 1
checks. Zero console errors throughout. Three of route11's checks describe
what Phase 12 changed on purpose — Corran now has word from the Circle once
Kestrel is beaten, and Kestrel then runs into the cave — and say so; journey11
is superseded by journey12, which repeats every one of its checks before going
on.

**Measured:** a full end-of-Phase-12 save (two Sigils, six Aethers, every
Phase 12 flag and lever) is 2.8 KB. Every new map loads in about 0.8 s with
the harness's own wait, and runs at 56-57 fps; 139 textures.

---

## Phase 11 — Kestrel and Route 2 (World Expansion I)

The game now runs past the first badge. Earn the Verdant Sigil and your rival,
**Kestrel**, is waiting at Thistlewood's Thornway gate with the starter that
beats yours. Win and the gate opens onto **Route 2 — the Thornway**: bramble
cutting, a thicket that forks round a bramble island, a scree slope with its
own wild Aethers, four trainers, seven new species, a dry spring nobody can
explain, and Kestrel again at the top — below Mistvault Cavern, which the
Wardens have roped off. That cordon is where Phase 11 ends.

### Added

**Kestrel, on the ordinary trainer pipeline.** No rival scene, no rival battle
code, no rival save field. A meeting is one entry in `trainers.js` with five
optional fields any trainer may use: `rival` + `stage`, `requires`, `setFlags`
(what a win changes — set in the same pure call that marks the trainer beaten,
`recordTrainerVictory`), `victoryLines` (said before the player's blackout),
and a `{ rivalStarter: true, level }` party slot.

- **One starter mapping** (`src/data/rivals.js`) — Fire → Water, Water →
  Grass, Grass → Fire, the canon "strong against" rule. `RivalSystem` resolves
  the slot at battle time and walks the evolution chain as far as the level
  allows, so the species data alone makes Kestrel's Drizzle a Puddlurk at 16.
- **Intro, outro and victory lines may be conditional branches**; Kestrel's
  name the right starter to each player through a new `starter:<id>` world
  condition.
- **Meeting 1 — the Thornway gate.** There once the Verdant Sigil is held
  (Flittle 12, starter 13). Spotted or spoken to, the same intro and fight. A
  win sets `thornwayOpen`: the gate opens while the player watches, Kestrel
  walks back up the lane, through it and away, and there is ONE autosave,
  labelled `story`. A loss: Kestrel's line, then the ordinary blackout;
  nothing recorded, Kestrel still waiting.
- **Meeting 2 — below Mistvault** (Gustwing 14, Grubbit 13, evolved starter
  16). Gates nothing. Kestrel stays by the cordon afterwards with new lines.

**NPC presence** (`src/systems/NpcPresence.js`). `presentWhen` / `absentWhen`
on any NPC, read by the map loader AND the save loader, so a player is never
restored onto the tile of someone who is not there, nor kept off it by someone
who has left. A beaten trainer can `exitAfterDefeat` (walk off and fade —
counted from their own tile, so one who walked over walks back first) or
`returnAfterDefeat` (walk back to their post).

**Route 2 — the Thornway** (30x50, `src/data/maps/route2.js`): the cutting,
the dry-spring loop, the fork round the bramble island, the Brow, the scree,
a one-tile gully in Kestrel's sight, and the landing. Four trainers (13-16),
the bramble crew, the spring keeper, a Warden, four signs, six ground items
(existing items only). Thistlewood's north edge now opens onto it.

**Two habitats on one map.** `encounters.byTerrain` lets a map roll a
different table on particular encounter tiles; tall grass rolls
`route2Thicket`, the new scree tile rolls `route2Scree`. Commons, uncommons and
two rares in each, old faces and new.

**Seven species (34 in all), five moves (61), eight tiles.** Jabbit →
Brawnhare (the first Fighting family), Glimmote → Brambelle (the first Fairy
anything), Delvit → Ironvole (Ground into Ground/Steel), and the rare Burrzap
(Electric/Grass). Hop Kick, Flurry Jabs, Glimmer, Moonpetal and Burrow Strike,
all on existing effect kinds. Scree, rock face, boulder, bramble, a dry spring
bed, a survey stake, the cave mouth, the Wardens' cordon, and a signpost for
rocky ground.

**The story thread**, foreshadowing only: a spring that ran for three hundred
years has stopped; a surveyor's stake in the basin carries a grey tag stamped
with a hollow ring crossed by a line — a weathervane with nothing at its heart
— reading SURVEY 14 — CURRENT DRAW; cave-dwellers are out on the open scree.
Nobody names the Hollow Vane; no grunt is fought.

**The Phase 12 boundary.** A barrier across Mistvault's mouth with
`openWhen: 'mistvaultOpen'`, a flag nothing sets; a Warden who explains; a
sign that says CLOSED; no exit tiles behind it.

**Save version 3.** One new field, `starter`, recorded when the starter is
chosen. The `2 → 3` migration recovers it from the creature met at the
Warden's Lodge (party or storage, evolved or not). Everything else Phase 11
remembers already had a home: beaten rivals in `defeatedTrainers`, the gate
in `flags`. A Phase 10 save keeps its Continue summary through the migration.

**Debug:** `debug.rival()`, `debug.starter(id)`, the habitat underfoot in
`debug.encounterInfo()` and the overlay; `debug.beatTrainer()` now sets the
flags a real win sets.

### Balance — measured through the engine

- `tests/helpers/routeWalk.js` WALKS Route 2 with a post-Fern team — Kestrel,
  wild battles from the route's own tables, every trainer — letting the engine
  award the experience, so "the levels a player has here" is a measurement.
  It found the experience economy slower than the design doc's pacing: players
  top out around 15-17, not 18.
- **Kestrel at the gate** (60 seeds; Fire / Water / Grass): straight after
  Fern 52% / 100% / 70%; one level later 83% / 100% / 100%; with a third
  capture 100% / 100% / 98%; the starter alone 0%. The originally planned
  team (evolved starter 15 + Gustwing 14 + Grubbit 13) won 0% for everyone.
- **Kestrel below Mistvault**: with the Route 2 Aether the road points each
  player at, 87% (Zaplet) or 100% (Vinelet) for Fire, 97% for Water, 97%
  (Delvit) or 100% (Pebblit) for Grass. With nothing new, Fire and Grass are
  0-2% — deliberately, like a lone Water starter at Fern — and people on the
  road say what to catch.
- **Route 2's trainers** fall first time for every starter down either fork,
  except a Fire player with nothing new, who needs about three goes at
  Dunmore. The first draft had two walls (a Gustwing-led Birdwatcher a Grass
  player never beat in 20 tries; a Rock/Ground Scree-Walker that took a Fire
  player 13); both were rebuilt.

### Bugs found and fixed

- **The balance driver never used its best move (test bug, since Phase 9).**
  `bestMove` read `entry.power` off a creature's move entry, which only holds
  `{ id, pp, maxPp }`, so it never found a damaging move and always used the
  FIRST one. Every balance number since Phase 9 was measured with that player.
  The driver now lives in `tests/helpers/battleSim.js`, reads the move
  database, and is shared by the Hall, rival and Route 2 tests. Fern
  re-measured: Fire + Flittle 100%, Water + Flittle 43% (the doc said ~67%),
  Grass + Flittle 100%, a lone Water starter still 0%. Every guard rail held.
- **Kestrel stood in the gully for good.** After a sight challenge down Route
  2's one-tile gully, a beaten Kestrel stayed where they stopped — the only
  way to the landing — until the map was reloaded. Fixed with
  `returnAfterDefeat`; a browser test walks up past them.
- **Kestrel stopped short of the Thornway gate.** Their exit was counted from
  where they stood after walking over to challenge, so they faded half way
  down the lane instead of walking through the gate. The exit is now counted
  from their own tile.
- **A cave of framed windows.** Each cave-mouth tile drew its own arch, so a
  4x2 opening looked like a row of windows; it is now edge-to-edge dark, framed
  by the rock around it. A sign in the rock no longer stands on a square of
  grass.

### Rules chosen and documented

- Kestrel's pronouns are **they/them** — the canon gives none.
- The first meeting is the plan's third appearance; the first two were never
  built and retro-fitting them would change finished, saved maps.
- A rival meeting that gates something sets a flag on the WIN; losing never
  changes the world.
- `presentWhen` on a rival's NPC must equal the trainer's `requires` (tested),
  so they are standing there exactly when the fight is allowed.
- No new shop or Mender on Route 2: Thistlewood's are one walk south.

### Verification

**Automated:** 2926 tests in 39 files (Phase 10 ended at 2476), lint clean,
production build 288 kB (gzip 87 kB) plus Phaser. New suites: `rivals` (86),
`route2` (42), `npcPresence` (21), `rivalBalance` (20); `trainers` grew to 217
and `saveMigrations` to 71 (with two save files written by the real Phase 10
build). Everything the auto-generated data checks cover — maps, species,
moves, tiles, trainers — now covers Route 2 and its content too.

**Battles did not change.** The battle engine, the battle scene, the type
chart, the stat maths, the creature factory and `balance.js` are byte-identical
to Phase 10, and the move and species files only gained entries — so every
existing fight plays exactly as before, by construction.

**In a real browser, against the production build — the exact bundle
shipped — with normal controls, seeded battles and TRUE page reloads:**

| Suite | Result | Covers |
|-------|--------|--------|
| journey11 | 85/85 | New Game to the Mistvault cordon on the keyboard: starter, Route 1, Fern, Kestrel at the gate, Route 2, a real capture, the west fork, the scree, Kestrel again, the Warden, a save and a true reload |
| kestrel11 | 33/33 | no Kestrel before the Sigil; spotted on the gate road; names the right starter; a loss (line, blackout, nothing recorded); a win (gate opens, Kestrel walks off, ONE `story` autosave); a true reload; the talk path for a Grass player |
| route11 | 39/39 | onto Route 2; both habitats rolling their own tables; a trainer and an item; a manual save mid-route and a true reload; Kestrel's second meeting, their walk back up the gully, the story reacting; a reload after; the walk home; a loss |
| upgrade11 | 18/18 | the Phase 10 BUILD served at the game's address: a starter taken for real, a manual save; then the Phase 11 build at the same address — the save Continues exactly, its starter recovered, Kestrel fights with the right counter, the next save is version 3 |
| leak11 | 8/8 | sixteen Route 2 map changes, five full Kestrel fights with gate and exit, eight wild battles in two habitats — display objects, tweens, timers, textures, keys, listeners, NPCs flat; heap and frame rate steady |
| shots11 | 15/15 | screenshots of the gate before and after, every Route 2 zone, the landing, and all seven new species in battle, inspected by eye |

Every Phase 1–10 browser suite was re-run on the final build: playthrough
12/12, phase2 34/34, phase2b 18/18, phase3 22/22, phase3b 60/60, phase4 27/27,
phase4b 15/15, phase4c 33/33, phase5 41/41, phase5b 13/13, phase6 65/65,
phase7 85/85, phase8 59/59, phase9 98/98, phase9b 16/16, phase9c 12/12,
firstbadge 54/54, shopscroll 6/6, debug9 15/15, phase10a 69/69, phase10b 45/45,
phase10c 35/35, shots10b 11/11, persist10 84/84, leak10 9/9, and the Phase 1
checks. Zero console errors throughout.

**Harness bugs found and fixed** (the game was right each time): the title
wait could read `window.game` before its scene manager existed; the upgrade
server let the browser keep the old build's `index.html` (now served
`no-store`, as a deploy would be); Phase 6 read a battle one frame before its
scene started; four checks carried stale expectations (a pre-tuning level, a
recovery point assumed rather than read, a field name, a turn mistaken for a
step); forced habitat encounters were being swallowed by the post-battle
cooldown.

---

## Phase 10 — Save, Load and Settings

The first-badge slice now survives closing the tab. Save from the menu at any
quiet moment, let the game autosave as you go, close the page, and Continue
exactly where you were — the same tile, the same facing, the same hedges, the
same creatures with the same ids.

### Added

**An audit before any code.** Every piece of state was sorted into one of four
boxes — canonical (saved), derived (rebuilt on load), preferences (their own
key) and never-saved (anything on screen). The save system is that table,
enforced. GAME_DESIGN.md section 21 has it in full.

**`src/save/` — one owner of persistence.** `SaveManager` sits over a schema, a
validator, a migration pipeline, a position resolver and a storage adapter.
Scenes ask it to save or load; nothing else in the game touches `localStorage`.

- **`SaveSchema`** — a versioned envelope (`game`, `version: 2`, `metadata`,
  `gameState`). The serialiser picks every field by name, so no Phaser object,
  timer, open dialogue or battle state can reach a save. Keys are sorted, so the
  same facts always give the same text. Derived caches — creature stats and
  maximum PP — are left out and rebuilt on load: one source of truth.
- **`SaveValidator`** — builds a brand new GameState from untrusted JSON.
  It **refuses** when we can no longer tell what the player had (wrong container
  types, an unreadable species or level) and **repairs with a warning** when the
  intent is obvious (missing collections, out-of-range numbers, unknown ids,
  duplicate creature ids, off-map positions). Nothing is fixed silently.
- **`SaveMigrations`** — one pure function per version step. Version 1 (the
  Phases 1-9 in-memory state) migrates to 2. Hand-built version 1 saves for the
  end of Phases 2, 3, 6, 7, 8 and 9 all load. A newer-version save is refused
  with *"This save was created by a newer version of the game and cannot be
  loaded here."* and never migrated down.
- **`RestorePosition`** — the saved tile is checked against the world as it will
  be rebuilt: gates and hedges from flags, Sigils and switches; every NPC back on
  their home tile; ground items still lying there. A failure falls back to the
  map's spawn, then the recovery point, then the start — never into a wall.

**Two slots.** A Manual Save written only by the player, and an Autosave written
only by the game. Each is judged on its own, so a damaged manual save never
hides a good autosave. **Writes are all or nothing:** the save is built, proved
to load, and written in one `setItem`; a full or refused write leaves the
previous save exactly as it was.

**Save in the pause menu.** It shows what is in the slot, says what will be
replaced, and needs a second Confirm. It is offered only when the world is safe
to save — no dialogue, battle, map change, trainer approach or Sigil panel.

**Autosave at stable checkpoints** — arriving on a map, a battle fully over,
healing, story progress, a shop visit, a starter, a picked-up item. A checkpoint
only *asks*; the save is written the first frame the world is safe. One pending
slot means a Leader's battle, outro and Sigil make exactly one autosave. A small
"Autosaved" note fades in the corner. It will not overwrite a newer version's
save, and says so once.

**Continue.** Greyed out without a valid save. One save loads straight away;
two open a chooser showing place, lead, Sigils, catches, play time and save
time, newest highlighted. Damaged and newer-version saves are named under the
menu and cannot be chosen. A failed load says why and changes nothing.

**New Game asks first** when anything is saved, defaults to Back, and deletes
nothing.

**Settings.** Text speed (Slow / Normal / Fast / Instant) and master volume
(0-100). They belong to the player, not a playthrough: stored under their own
key, surviving New Game, never inside a save. One `SettingsPanel` serves the
title screen and the pause menu; a sample line types at the chosen speed. The
volume drives Phaser's sound manager — there is no audio yet, so that is all it
does for now.

**Play time is counted** (`PlayClock`), for the save slots.

**Creature identity.** Ids survive any number of saves and loads. Loaded ids are
reserved, so a creature caught after loading can never be given one that is
taken, even though the id counter restarts with the page.

**Debug** — `debug.saves()`, `save(slot)`, `dumpSave(slot)`, `clearSave(slot,
true)`, `injectLegacySave(name, slot)`, `corruptSave(slot, kind)`,
`saveVersion()`, `settings(changes)`.

### The standing rule

Any future persistent gameplay field added to GameState must be added to
serialization, validation/defaults, migration where required, and round-trip
tests. `tests/saveSchema.test.js` fails until a new GameState field has been
given a fate.

### Bugs found and fixed

- **A held key fired again in the next scene.** Every scene makes its own key
  objects, and a key already held when one starts treated the browser's
  auto-repeat as a brand new press. Holding Confirm through Continue would have
  talked to whoever you loaded in front of; holding Esc for half a second closed
  the menu it had just opened (that one predates Phase 10). `InputManager` now
  ignores auto-repeat keydowns. *Browser test: phase10a N2-N5.*
- **A cut-short step left the player half-way between tiles.**
  `Player.stopMovement()` stopped the slide but not the sprite, so opening the
  menu mid-step froze the picture half a tile from the logical position — the
  position a save records. It now settles on the tile, as its comment always
  said. *Browser test: phase10a C12.*
- **Data getters accepted JavaScript built-ins as ids.** `getSpecies('constructor')`
  returned `Object`'s constructor rather than nothing; the same was true of
  items, moves, trainers, Sigils, statuses, shops, battles, encounters, tiles and
  maps. Harmless while every id came from the game's own code — a real hole the
  moment ids come from a save file. Every lookup now checks the table's own
  keys. *Tests: saveValidation "ids that are really JavaScript built-ins".*
- **Every scene start leaked one event listener.** `InputManager` listened for
  both SHUTDOWN and DESTROY on its scene, but a scene that restarts (every map
  change) or is relaunched (every menu open) only shuts down — so the DESTROY
  listener was left behind each time, for the whole session. It predates
  Phase 10; the new leak test counts listeners per event and caught it
  (WorldScene 13 → 19 over six map changes). *Browser test: leak10.*
- **The recorded facing ignored being turned to face a trainer.** When a
  trainer walks over, the player is turned to face them — but that turn was not
  announced, so the facing the game recorded (and saved) stayed pointing the
  way the player had been walking. Saved after a trainer battle, the player
  came back facing the wrong way. `Player.faceTowards()` now announces the turn
  like any other. Found by the long-form persistence playthrough.
  *Browser test: phase10c T8b, persist10.*
- **A restored player could have stood inside an NPC.** Trainers who walked over
  to challenge, and villagers who wander, go back to their home tiles when a map
  loads; a player saved on one of those tiles would have been restored on top of
  them. The loader, and `WorldScene`'s own start-tile check, now treat NPC home
  tiles and uncollected items as unavailable. *Tests: restorePosition.*

### Rules chosen and documented

- **Two slots**, not profiles: one the player owns, one the game owns.
- **Autosave points** as listed above; not after Continue (it would replace a
  newer autosave with the older save just loaded) and not at the very start of a
  New Game (the first door does it).
- **Volume** is 0-100 in steps of 10, shown and stored as the player sees it.
- **Refuse vs repair** as above; damaged saves are never deleted by the game.
- **A tie in save time** goes to the manual save when choosing what to highlight.

### Verification

**Automated:** 2476 tests in 35 files (Phase 9 ended at 2175), lint clean,
production build 260 kB (gzip 79 kB) plus Phaser. New suites: `saveSchema` (40),
`saveValidation` (88), `saveMigrations` (52), `saveManager` (50),
`restorePosition` (17), `saveText` (10), `saveStorage` (12), `settings` (31).

**In a real browser, against the production build, with TRUE page reloads** —
`page.reload()`, or closing the page and opening a fresh one, over one browser
context so storage persists exactly as it does for a player. The harness proves
each reload really threw the JavaScript world away.

| Suite | Result | Covers |
|-------|--------|--------|
| phase10a | 69/69 | title with no save, manual save mid-route, autosave, the chooser, held keys through Continue, damaged manual + good autosave, newer-version autosave, a version 1 save, New Game with saves, settings |
| phase10b | 45/45 | mid-puzzle save, real Gardener and Leader wins, exactly one autosave for the Fern win, the Sigil across a fresh page, a real evolution, party/storage identity, the Index, a shop purchase after loading |
| phase10c | 35/35 | no saves during a trainer approach, battle or outro; a beaten trainer and his prize across a reload; the Route 1 gate; a ground item; a reload mid-battle; the recovery point through a real blackout |
| persist10 | 84/84 | New Game to the Verdant Sigil on the keyboard, with a save, a real reload and a full state comparison at nine milestones (two on brand-new pages) |
| leak10 | 9/9 | eight rounds of every title panel, eight Save + Settings rounds, sixteen autosaving map changes — display objects, tweens, timers, textures, keys and every listener count flat |
| shots10b | 11/11 | storage full, a newer save in the Save screen, the autosave refusing to overwrite one, a load failing after the title was drawn, a browser with storage disabled |

Every Phase 1–9 browser suite was re-run on the final build: playthrough 12/12,
phase2 34/34, phase2b 18/18, phase3 22/22, phase3b 60/60, phase4 27/27, phase4b
15/15, phase4c 33/33, phase5 41/41, phase5b 13/13, phase6 65/65, phase7 85/85,
phase8 59/59, phase9 98/98, phase9b 16/16, phase9c 12/12 (twice), firstbadge
firstbadge 54/54 (twice, with seeded battles), shopscroll 6/6, debug9 15/15, and the Phase 1 checks.

**Did Phase 10 change how battles play? No — measured.** The same battle was
replayed on the Phase 9 build and the Phase 10 build with the battle engine's
generator seeded identically. For all six seeds the two builds fought the
identical battle, HP change for HP change, with the same result (and the same
build twice agreed with itself, proving the method).

Screens inspected by eye: the title with no save, one save, two saves, a damaged
save and nothing usable; the chooser; the New Game confirmation; Settings from
the title and the menu; the menu; Save with an empty slot, over a save, over a
damaged or newer one, succeeding and failing; a failed load; a browser with no
storage; the Autosaved and Autosave-off notes.

A save with eight creatures is about 3 KB; writing or reading one takes under a
millisecond (0.6 ms median in Node; autosaves in the browser 0.2–1.6 ms).

**Harness defects found and fixed — not game bugs, listed so they are not
mistaken for any:**
- The Phase 1 suite and the shared `newGame()` helper assumed Enter on the
  title meant New Game. With a save, Continue is highlighted and New Game asks
  first; both now choose New Game by name and answer the question.
- **phase9c and firstbadge depended on winning unseeded battles.** Phase 9's
  single passing run was a fortunate draw: this browser driver wins about a
  third of the Water starter's fights against Fern. Both now seed the battle
  engine — phase9c allows three fixed seeds per starter, since its question is
  whether a route exists; firstbadge seeds each fight, since it tests the
  journey, not the odds (tests/gymBalance.test.js measures those).
- The persistence playthrough reloaded while Wick was still speaking — before
  the starter's autosave, which by design waits for the dialogue to close. It
  now finishes what is on screen before reloading, as a player would.
- Leak baselines counted a banner whose fade is (correctly) frozen while the
  menu pauses the world, and a wandering villager caught mid-step; they now wait
  for transients and sample the steady state.
- Walkers aimed straight through tall grass and a trainer's lane, checks read
  values at the wrong moment, and Web Audio's float32 volume needed a tolerance
  (and a key press, since browsers keep audio locked until one).

---

## Phase 9 — Thistlewood and the First Sigil

The vertical slice closes. New Game, a starter, Route 1, its trainers, a gate
that opens because you asked, a second town, a Beacon Hall with a real puzzle,
two Gardeners, a Leader, and the Verdant Sigil.

### Added

**Barriers — one mechanism for the gate and the hedges** (`PuzzleSystem`)

Route 1's shut gate and the Verdant Hall's hedges are the same problem: tiles
that are solid sometimes and not others, where the picture and the collision
must never disagree. A map declares them as data and there is one rule for all
of them. Two kinds, and a barrier may be both:

- **flag-driven** (`openWhen: 'route1GateOpen'`) — its state is a pure function
  of a story flag or a Sigil. Nothing is stored, so nothing can drift, and the
  gate cannot open twice;
- **switch-driven** — moved by root switches, saved in `gameState.puzzles` as
  plain booleans.

**The state lives in `TileMap`,** because everything already asks the map
whether a tile is walkable: the player, every NPC, the trainer sight lines, the
interaction check. One answer serves all of them, and a trainer can no more see
through a closed hedge than the player can walk through it. The sprite is shown
or hidden from the same call that decides collision.

**A hedge never closes on anybody.** `pressSwitch()` is given the player's and
every NPC's position and refuses — changing nothing — if extending would cover
one. The maps are validated so no NPC, spawn or switch ever sits on a barrier
tile, which makes that a safety net rather than a game rule.

**Route 1's north gate is real progression.** The warden has said since Phase 2
that the gate opens for Wardens with a partner. Now it does, in the
conversation, with no errand invented to delay it.

**Thistlewood** — 30x24, an overgrown timber town half-swallowed by hedges. A
road north from Route 1 to the Verdant Hall's door, an east-west road serving
the Mender's Hall and the Supply Post, a cottage, a pond, three signs, a hidden
Great Orb, ten NPCs across the town and four interiors, and a shut Thornway gate
with the road visible behind it.

**A second Mender's Hall with no new healing code.** Mender Rell uses the same
`action: 'heal'`, the same `HealingSystem` and the same `setRecoveryPoint()`
with her own map's id. Healing here makes Thistlewood where you wake up; healing
back in Emberhollow moves it back. Neither Hall knows the other exists. The one
change this needed was that the heal now speaks as **whoever the player is
talking to** rather than as a name written into the scene.

**A second Supply Post that is one stock list.** Super Potions, Great Orbs and
the Rouser — none of which Emberhollow sells. The Ultra Orb and the Clear Tonic
are still held back.

**The Verdant Hall** — a greenhouse whose walls are hedges. The walkway runs up
the west side, up the east side and along the south, and the two sides meet
**only** along the south, which is what makes both Gardeners unavoidable.

**The puzzle the design document has always described:** three root switches,
each retracting one hedge and extending another. Everything starts shut;
reaching Fern needs the east and north hedges open together, which is the west
root then the east root — and each sits past a Gardener's sight lane, so the
fights are the puzzle's price rather than an obstacle beside it. The porch root
is free: it opens a side pocket with a Super Potion and teaches what a switch
does before anything is riding on it.

Pressing a switch does not open a dialogue box. A hedge animates and a short
note fades in, so experimenting stays cheap.

**The player can never be trapped, and it is proved.** Every switch is on the
walkway and no barrier ever is. `tests/puzzle.test.js` walks **every
configuration any order of presses can reach** and asserts the door and all
three switches are reachable from each one. The reset root in the porch is a
convenience, not a rescue.

**Gardeners Teal and Bracken** are ordinary Phase 8 trainers — data and two NPC
fields, no second battle pipeline. Both stand in dead-end alcoves looking across
the walkway, so neither can ever become a wall while their lanes still cover it.

**Leader Fern** is an ordinary trainer with one extra field, `badge`. The
canonical team: Vinelet 11, Puffcap 11 and Ivorn 13 as the ace, for 1200 coins.
Nothing in `BattleScene` or `WorldScene` names her.

**Sigils** — `src/data/badges.js`, `BadgeSystem`, and a three-slot menu screen
that shows all three planned Halls from the first game, the unearned ones as
visible blanks. Winning marks the Leader defeated, plays her outro, and *then*
awards the Sigil — after experience, level-ups, new moves and evolutions have
all resolved. Losing awards nothing. `awardBadge()` refuses a duplicate.

**A Sigil needs no story flag beside it.** It reads as a condition,
`badge:verdantSigil`, exactly the way a beaten trainer reads as `trainer:<id>`.
`ProgressionSystem` folds flags, beaten trainers and Sigils into one set that
dialogue, barriers and the menu all read — so eight NPCs react to the Sigil,
and Fern to having been beaten, through ordinary conditional dialogue, and no
scene reads `gameState.badges`.

**Debug** — `debug.gates()`, `debug.toggle(id)`, `debug.resetPuzzle()`,
`debug.puzzleState(map)`, `debug.sigils()`, `debug.sigil(id, earned)`.

### Rules chosen and documented

- **Gate condition:** having a starter, and asking. Nothing else.
- **Step precedence:** exit → root switch → trainer → wild encounter. The
  switch claims the step, so pressing one and being spotted cannot collide.
- **Puzzle persistence:** per map on `GameState`. Leaving the Hall, or blacking
  out inside it, finds the hedges exactly as they were left.
- **After the Sigil:** all three hedges stand open for good.
- **Thistlewood shop:** Super Potion 550 and Great Orb 500 are the new options;
  Ultra Orb stays out, because a 1200-coin orb on the first Gym's doorstep would
  flatten every capture decision after it.
- **Clearing the Hall pays 2200 coins** — four Super Potions and a Great Orb.

### First-Gym balance, measured

`tests/gymBalance.test.js` plays hundreds of seeded battles against Fern, driven
by a stand-in for a reasonable player (best move by type, next creature when one
faints, a potion when badly hurt):

| Team at level 13 | Beats Fern |
|------------------|-----------|
| Fire starter + a Route 1 Flittle | ~100% |
| Water starter + a Route 1 Flittle | ~67% |
| Grass starter + a Route 1 Flittle | ~100% |
| Fire starter alone | ~50%, 100% by level 15 |
| Water starter alone | **0%**, at any sensible level |

Every creature Fern fields is Grass or Grass/Poison. A solo Water starter cannot
win — deliberately, because that is what a type-themed Hall is for. Three NPCs
say to bring something with wings; Flittle is the second most common Aether on
Route 1, knows Peck from level 1, has a catch rate of 255, and the player is
handed two orbs on the way north. The answer is cheap, early and signposted, so
the Hall asks for a team and never for a grind. These numbers are a test rather
than a note, because balance rots silently.

### Changed

- The heal action, and any future action, now answers in the voice of whoever
  triggered it — which is what let the second Mender's Hall be pure data.
- `startDialogue()` gained an `onDone` hook, so a conversation can be followed
  by something that is not another conversation.
- The debug overlay lists this map's barriers and whether each is shut.

### Verification

- **2175 automated tests** pass (was 1900). New: 75 on barriers, switches and
  the no-trap proof; 45 on Sigils and the Leader-victory chain; 18 on first-Gym
  balance; plus the map, shop, Mender and Sigil checks that now run
  automatically over every map and every Sigil.
- **Lint clean; production build succeeds.**
- **Browser suites against the production build, all zero console errors:**
  Phase 9 features 98/98, Gym blackout and retry 16/16, all three starters vs
  Fern 12/12, the full keyboard playthrough 54/54, shop scrolling 6/6, debug
  commands 15/15, and the Phase 9 leak test 14/14.
- **Browser-verified against the production build**, zero console errors: the
  gate refusing and then opening, the walk to Thistlewood with party, money,
  bag and flags intact, the Thornway staying shut, the second Mender and the
  recovery point moving both ways, the second shop's new stock, every hedge and
  every switch with the picture checked against the collision, the reset root,
  both Gardeners, Fern, the Sigil awarded exactly once, the Sigil screen, and
  nine NPCs reacting.
- **A full New Game to first Sigil playthrough on the keyboard**, with no
  teleporting: house to Lodge to starter, shop, Route 1, all three route
  trainers, the warden, Thistlewood, both town services, the Hall, both
  Gardeners, both roots, the solved corridor, Fern, and the Sigil.
- **Losing verified too:** a Gym defeat blacks out for exactly 5%, wakes the
  player at the Thistlewood Mender's Hall with a restored party, leaves the
  Gardener undefeated and the hedges exactly as they were, and the fight can be
  retried and won.
- **All three starters** verified against Fern in the browser and over hundreds
  of seeded battles in the test suite.
- **Stress test:** four full cycles of town services, the Gym puzzle with a
  trainer battle, and a blackout, leaving display objects, update lists, tweens,
  timers, textures, animations, keyboard keys, listeners, scene instances, NPCs,
  barrier sprites and step listeners unchanged — then the puzzle, a Leader
  battle, the Sigil, the Sigil screen and map transitions all still working.
- **Phases 1–8 re-verified** on the same build: playthrough 12/12, world
  34/34, items and flags 18/18, starter chooser 22/22, starters 60/60,
  practice battles 27/27, switching and status 15/15, progression 33/33,
  encounters 41/41, controlled encounters 13/13, capture and menus 65/65,
  economy 85/85, trainers 59/59, and every earlier leak check.

### Fixed

- **A shop shelf longer than seven items hid the rest.** The buy and sell lists
  drew `rows.slice(0, 7)` and stopped, so Thistlewood's eighth item — the Great
  Orb — could not be seen, selected or bought. The list now scrolls, the way the
  Aether Index already did. Found by the browser suite reading the shop off the
  screen rather than trusting the data.
- **A barrier that was both switch-driven and Sigil-opened discarded its switch
  state on every read**, which would have reset the puzzle constantly. Caught by
  this phase's own tests before it ever ran in a browser.
- A stray misindented block left inside `WorldScene.launchBattle` by Phase 8 —
  harmless, but it nulled the trainer alert instead of destroying it.

### Known limitations

- Route 2 is not built. The Thornway gate is visibly shut with a keeper and a
  sign that explain why; opening it later is one flag and no code.
- No rival, no Gym rematches, and no leader AI profile.
- A solo Water starter cannot beat this Hall. Recorded above and in a test.
- Puzzle state is per session until Phase 10 gives it a save file; it is already
  plain serialisable data on `GameState`.
- Storage is still the Phase 6 summary, and there is still no nickname UI.

---

## Phase 8 — Trainers

The route stops being empty. Three people on Route 1 look up when you walk into
their line, march over, and make you fight them.

### Added

**Trainers are data** (`src/data/trainers.js`) — id, name, title, party,
prize money, and the lines they say before and after. A trainer NPC on a map
carries only a REFERENCE (`trainer: 'route1Scout'`) and a `sightRange`, so a
trainer can be rebalanced without touching a map and moved without touching
their party. Adding one is an entry here plus an NPC anywhere; no code either
way. `findTrainerProblems()` is exported so the tests validate every trainer
that will ever exist, not the three that exist today.

**Line of sight is pure geometry** (`SightSystem`) — no Phaser, no game state.
It is handed a position, a facing, a range and a way to ask "does this tile
block a view", and it answers. That is what makes every boundary a unit test
instead of a walk around the map hoping to notice:

- A trainer sees only along the **one direction they face**. No diagonals, no
  peripheral vision, nothing behind them.
- `sightRange: 4` means distances 1, 2, 3 and 4 are seen and 5 is not.
  Distance 0 is never a sighting.
- Anything **solid between** the two blocks it — walls, trees, furniture, and
  another person standing in the lane. The tile the player is standing on is
  never tested; they are standing on it. Ground items do not block: a Potion
  lying in the grass is not a screen.

**Exactly one trainer challenges per step**, chosen with nothing random:
`findChallenger()` takes the **nearest**, and on a tie the one whose id sorts
first. Everyone else simply waits until the player walks into their lane. The
same step always produces the same challenger, so a test can rely on it.

**The challenge** — a "!" pops over their head, then they walk down the lane
they saw you along and stop **one tile short**, never onto the player. No
pathfinding is needed, because the line was established as unobstructed by the
sighting itself. Both then turn to face each other and their intro plays with
their full title on the plate.

**`this.trainerChallenge` is claimed before anything is drawn** and held until
the battle is over. That one field is what stops a second trainer, a second
step, or an impatient key press starting any of it twice — and every delayed
step re-checks it, so a map change mid-approach cancels the whole sequence
rather than firing into a dead scene.

**One pipeline, two ways in.** Being spotted and walking up and talking to
someone both end at `startTrainerBattle()`, because the map file's challenge
dialogue uses the ordinary `action: 'trainer:<id>'` seam. There is one path to
get right rather than two that can drift.

**What a trainer battle is, is configuration** (`TrainerSystem`), not a
question about which NPC you fought: `canRun: false`, `allowCapture: false`,
`awardExperience: true`, `rewardMoney`, `blackoutOnDefeat: true`. Nothing
downstream checks a name to work any of that out, and the party is built fresh
through `CreatureFactory` every time — so a trainer's Aethers have the ordinary
stats, learnsets and PP, and a rematch after a blackout starts at full health.

**Beating one is remembered by id** (`defeatedTrainers`), never by position or
map, so a trainer who is moved in a later update stays beaten. It is marked
**only after a win** and only once `BattleScene` has finished narrating
experience, level-ups, new moves and evolutions — never before the win is fully
resolved, and never at all on a loss.

**Post-defeat dialogue is ordinary conditional dialogue.**
`getDialogueConditions()` folds every beaten trainer into the flags as
`trainer:<id>`, so a map file writes
`{ when: 'trainer:route1Scout', pages: [...] }` and no scene anywhere contains
`if (defeatedTrainers[id])`.

**Losing to a trainer is the Phase 7 blackout**, unchanged and unforked: 5% of
your coins, a full heal, and waking at the last Mender's Hall. The trainer is
*not* marked beaten, so they are still standing there when you come back.

**Route 1 is populated** — Pathfinder Wren (one Lv 6), Grass-Treader Osrin (two
at Lv 7) and Warden Aspirant Halla (Lv 8 and 9, by the gate), for 240 / 320 /
420 coins. Levels sit just above the route's wild 2-6, and clearing all three
funds four or five Potions: useful, not a shopping spree.

**Debug commands** — `debug.trainers()` lists every trainer with their party and
whether they are beaten, `debug.trainerBattle(id)` starts one anywhere,
`debug.beatTrainer(id, true|false)` sets the flag, `debug.resetTrainers()`
clears them all, and `debug.sight()` prints what every trainer on this map can
currently see.

### Changed

- `Npc` gained `walkLine(direction, steps, onComplete)`, which steps one tile at
  a time through the ordinary movement code and refuses a blocked tile — an
  approach is real walking, not a teleport with a tween on it.
- `Npc.startMove()` and `Player` gained an arrival callback and `faceTowards()`
  respectively.
- `BattleEngine` carries `trainerId` from the config into its result, which is
  how the win handler knows who to mark without the scene remembering.
- `BattleScene` now pays prize money through `addMoney()` rather than assigning
  to `gameState.money`, so the Phase 7 rule ("never negative, always whole")
  covers trainer rewards too.
- A completed step is offered to **exits, then trainers, then wild encounters**,
  and the first one to claim it stops the others. A trainer standing in tall
  grass therefore always wins over the grass.

### Verification

- **1900 automated tests** pass (was 1791). New: 109 covering sight geometry and
  every boundary, blockers and corners, challenger selection and its
  determinism, the trainer database (auto-generated over every trainer), trainer
  NPC metadata on every map, battle configuration, multi-creature progression,
  defeated state and prize money.
- **Lint clean; production build succeeds.**
- **Browser-verified against the production build**, 59/59 checks, zero console
  errors: being spotted at range and one tile beyond it, a blocked lane, walking
  behind a trainer, the alert and the approach, the intro plate, Run refused,
  orbs refused, both creatures of a two-creature trainer, experience and exactly
  the right prize money, the defeated flag, the post-defeat lines, a manual
  challenge, a beaten trainer never re-challenging, and losing on purpose to
  confirm the blackout leaves the trainer unbeaten.
- **Screens inspected:** the "!" sits above the right NPC, the approach ends
  adjacent with the correct speaker name, the battle shows the trainer's first
  creature with Run greyed out, and the route is walkable end to end afterwards.
- **Stress test:** five win cycles and five loss/blackout cycles leave display
  objects, update lists, tweens, timers, textures, animations, keyboard keys,
  listeners and scene instances unchanged, NPCs stable at 7, no stray alert
  objects and no lingering approach tweens, at ~31 fps, still able to be
  challenged, talk and meet wild Aethers afterwards.
- **Phases 1–7 re-verified** on the same build: playthrough 10/10, world 34/34,
  items and flags 18/18, starter chooser 22/22, starters 60/60, practice battles
  27/27, switching and status 15/15, progression 33/33, encounters 41/41,
  controlled encounters 13/13, capture and menus 65/65, economy 85/85, and every
  earlier leak check.

### Fixed

- The dialogue-action data test rejected the new `trainer:` actions and was
  taught about them properly — it now validates that `trainer:<id>` names a
  trainer that really exists, in the same shape as the Phase 7 `shop:<id>` check.

### Known limitations

- The approach walks a straight line, because sight only ever produces one.
  A trainer who needs to come round a corner would need pathfinding.
- No AI profiles yet: every trainer uses the same `BattleAI` as a wild Aether,
  and never switches voluntarily.
- No rematches. A beaten trainer stays beaten for the playthrough.
- A trainer mid-approach when the map changes goes back to their map-defined
  tile, since nothing persists an NPC's position yet.
- Save/load remains Phase 10; `defeatedTrainers` is plain serialisable data.

---

## Phase 7 — Inventory, Economy and Healing

Money means something, the bag opens, the shop trades, the Mender heals, and
losing finally has a consequence.

### Added

**Coins** (`EconomySystem`) — the only thing that changes money. "Never
negative, always a whole number, never more than you can afford" is one rule
instead of four copies in four screens. It also owns the sell price
(`ECONOMY.sellPriceFraction` of the buy price unless an item names its own) and
the blackout loss.

**One item-effect executor** (`ItemEffects`) — the healing formula used to live
inside BattleScene, which meant the overworld bag would have needed a second
copy. Both now call the same function, so they cannot disagree about how much a
Potion heals or when one would be wasted. It returns structured results —
`{ success, consumed, message, reason, healedHp, curedStatus }` — so a caller
never guesses from mutated state, and **a refusal is never consumed**.

**One healing implementation** (`HealingSystem`) — used by the Mender and by
blackout recovery, working on the EXISTING creatures. Instance ids, nicknames,
levels, experience, moves and met locations all survive a full heal. Storage is
deliberately left alone.

**Shops** (`ShopSystem` + `src/data/shops.js`) — every transaction is atomic: it
takes the money AND gives the goods, or changes nothing. There is no path that
charges without delivering. Stock is data and prices come from the items, so a
price is never written down twice.

**The bag** (pause menu → Bag) — category tabs with counts, quantities,
descriptions, and *why* something cannot be used rather than a silent no-op. An
orb reads "in battle only" and refusing it costs nothing. Healing items open a
target list built in the same shape as the party screen, and it stays open after
a use so patching up a party is not one trip per Potion.

**The Supply Post** — Buy and Sell, each showing name, price and how many are
held, with a quantity selector that stops at what can actually be afforded or
sold. An offer the shop would refuse is never presented. One press is one
transaction, and the quantity resets after a deal, so holding Confirm cannot buy
a shelf-full.

**The Mender's Hall is real** — `action: 'heal'` restores the whole party's HP,
every move's PP and any status, and makes the Hall the player's recovery point.
Free, as its own sign has said since Phase 2. A second Hall in a later town
needs no code.

**Blackout** replaces the Phase 4 placeholder. Losing a battle that carries
consequences takes the configured fraction of the player's coins exactly once,
restores the party, and fades to the recovery point through the ordinary door
machinery — so waking up cannot land inside a wall or on top of an exit.

**Whether a defeat has consequences is battle configuration**, not a question
about which NPC you fought: `blackoutOnDefeat`, defaulting to true for
everything but practice. The Lodge bouts set it false and patch the party up on
the spot instead, so testing the battle system still costs nothing and never
strands the player with a fainted team. Phase 8's trainers turn it on by setting
a flag.

**New items** — Burn Salve, Rouser and Clear Tonic complete the cures for all
four statuses the battle system inflicts. Key items are marked unsellable.

### Rules chosen and documented

- **Sell price:** half the buy price (`ECONOMY.sellPriceFraction`).
- **Blackout loss:** `floor(money * 0.05)`, capped at what the player has, taken
  exactly once. A player with nothing loses nothing.
- **Healing is free** at the starting town's Mender's Hall.
- **Starting money is 800**, a Potion is 200 and a Basic Orb 150 — four potions
  and change, or two potions and three orbs. A real choice, not a shopping
  spree.
- **The starting shelf excludes** Super Potions and the stronger orbs. Stock is
  the knob that controls availability, independently of what exists.
- **A fainted creature is refused by every item**, plainly, rather than being
  quietly half-healed.

### Changed

- `isItemUsableInBattle` and the battle bag now go through `ItemEffects`;
  behaviour is unchanged.
- The pause menu's root gained **Bag**, so it now reads Party / Bag / Index /
  Storage / Close.
- `GameState.respawn` became a real recovery point: a map id and a NAMED spawn
  point rather than raw coordinates.

### Verification

- **1791 automated tests** pass (was 1645). New: 146 covering money, sell
  prices, the blackout penalty, the bag, every item's data, item use and its
  refusals, shop data, buying, selling, healing, the recovery point and blacking
  out.
- **Lint clean; production build succeeds.**
- **Browser-verified against the production build**, 85/85 checks, zero console
  errors: buying one and several with exact totals, unaffordable purchases
  changing nothing, selling and the sell cap, the bag's categories and refusals,
  healing for exactly the right amount, a wasted heal consuming nothing, curing
  status, the Mender restoring HP/PP/status while keeping the same individual,
  the recovery point moving, a practice defeat costing nothing, a wild defeat
  blacking out for exactly 5% with party, bag and flags intact, and the battle
  bag and overworld bag agreeing on one orb count.
- **Screens inspected:** buy, sell, bag, target list, Mender and the blackout
  arrival all render correctly — readable, nothing clipped, nothing at the world
  origin, small interiors still centred.
- **Stress test:** five bag cycles, five shop cycles and five blackout cycles,
  plus twelve menu open/close cycles, leave display objects, update lists,
  tweens, timers, textures, animations, keyboard keys, key and camera listeners,
  player step listeners and scene instances unchanged, at ~42 fps, still able to
  shop and use the bag afterwards.
- **Phases 1–6 re-verified** on the same build: playthrough 10/10, world 34/34,
  items and flags 18/18, starter chooser 22/22, starters 60/60, practice battles
  27/27, switching and status 15/15, progression 33/33, encounters 41/41,
  controlled encounters 13/13, capture and menus 65/65, and every earlier leak
  check.

### Fixed

- Two data-integrity tests needed the Phase 7 additions and were made stronger
  rather than merely widened: the item-effect check now reads the
  implementation's own `SUPPORTED_ITEM_EFFECTS` instead of a list copied into
  the test, and the dialogue-action check now validates that `shop:<id>` names a
  shop that really exists.

### Known limitations

- No PP-restoring consumable and no revive item; the Mender covers PP, and a
  fainted creature is refused plainly.
- The shop has no separate Yes/No step — the total is on screen before Confirm,
  and the selector already refuses anything unaffordable.
- Storage is still the Phase 6 summary.
- Save/load remains Phase 10; all new state is plain serialisable data.

---

## Phase 6 — Capture and Party Management

The loop closes. Leave town, find something in the grass, wear it down, throw an
orb, keep it, look it over, and put it at the front of your team.

### Added

**Catching things** (`src/systems/battle/CaptureCalculator.js`)

Our own formula, documented at the top of the file:

    chance = catchRate/255              how catchable the species is
           * (1 - hpFraction * 0.7)     how hurt it is
           * statusBonus                whether it can struggle
           * orbModifier                what you threw
           * globalModifier             one knob for the whole game

clamped to 1%..95% — nothing is hopeless, nothing is certain. Full health is
caught at 30% of a species' base chance, half health 65%, and one point of HP
left at ~100%, so weakening something first is the biggest lever the player has.
Sleep doubles the odds, paralysis x1.5, poison and burn x1.3.

**The shakes are the roll.** A throw performs four checks at `chance**(1/4)`;
passing all four IS the capture. The overall odds come out exactly `chance` and
the number of wobbles watched is genuinely how close it came — the animation is
never decided separately from the result. A test throws 6000 orbs and confirms
the observed rate matches the stated one.

**Orbs as data** — Basic (x1), Great (x1.5) and the new Ultra (x2). Nothing in
the code names an individual orb; a new tier is one entry in `items.js` with a
new modifier.

**Capture is a battle action, not a menu trick.** `allowCapture` on the battle
config decides whether orbs may be thrown — wild battles by default, and a
scripted battle can turn it off — and nothing checks an NPC, a map or a scene
name. The engine spends the orb itself, because whether a throw was legitimate
is a battle rule:

- a legitimate throw is the player's action for the turn
- catch it and the battle ends at once; the opponent never answers
- miss and the opponent attacks, exactly like a failed escape
- a refusal (wrong battle, empty bag, fainted target, not an orb) costs neither
  the item nor the turn

The creature received is the creature fought — same object, same level, HP, PP,
moves, status, nickname field, met location and instance id. Nothing rebuilds
it. Wild creatures now record the route they were met on, so a caught one
already knows where it came from.

**Party, storage and the index**

- `PartySystem` gains `movePartyMember`, `removeFromParty`, `isValidPartyIndex`
  and the storage reads. Every reorder is all-or-nothing; an invalid index
  changes nothing rather than half-applying.
- Storage takes the overflow. A seventh capture goes there rather than being
  dropped, refused, or trading places with something the player would have to
  choose. Plain data, so it serialises with the save, and repeated captures
  never overwrite one another.
- `CreatureIndex` is the new single home for seen/caught:
  **SEEN** anything that stands on the battlefield, in any battle type;
  **CAUGHT** capture, or being given one — your starter counts. Caught implies
  seen, so "caught but not seen" cannot happen. Unknown species ids are refused
  with a warning instead of quietly creating an entry.

**The pause menu** (`MenuScene`, opened with Cancel)

All four views are ONE scene with a `view` state machine rather than four scenes
launching each other — one owner of the keyboard, one place that hands control
back.

- **Party** — artwork, name, level, HP bar and numbers, types, status tag, and
  the lead slot labelled. Shift picks a creature up, arrows choose a slot,
  Confirm swaps. Cancelling a move changes nothing, because nothing has changed
  until it is confirmed.
- **Summary** — species, nickname, number, level, types, HP, status, EXP with
  the distance to the next level as a bar, all five stats, every move with type,
  category, power, accuracy, PP and description, where it was met, and what it
  evolves into. The instance id is deliberately absent: plumbing, not
  information.
- **Index** — every species in number order. Unmet ones keep their number and
  show "-----"; seen ones show name and types; caught ones add the write-up.
- **Storage** — a plain list of what is waiting, and a line explaining how
  creatures get there.

**Debug** — `orbs()`, `fillParty()`, `reorder()`, `storage()`, `seen()`,
`caught()`, `index()`, `clearIndex()`.

### Changed

- `isItemUsableInBattle(item, { allowCapture })` now takes the battle's own
  answer rather than assuming. Healing items are unaffected.
- The Phase 5 test asserting orbs were always refused, and the browser check
  that expected them greyed out in a wild battle, both now verify the Phase 6
  intent: enabled where catching is allowed, refused with a reason everywhere
  else. Their original purpose — orbs are never silently half-working — is
  unchanged.

### Verification

- **1645 automated tests** pass (was 1554). New: 45 capture tests (odds, shakes,
  orb spending, battle flow, what comes out of the orb) and 42 party/storage/
  index tests.
- **Lint clean; production build succeeds.**
- **Browser-verified against the production build**, 62/62 checks, zero console
  errors: a practice battle listing orbs disabled and consuming none, a failed
  throw spending an orb and giving the opponent its turn, a successful capture
  ending the battle and returning to the exact tile and facing, the caught
  creature keeping its species, level, HP and met location, the index marking
  seen on the encounter and caught on the capture, the whole menu (party,
  summary with every field, index, storage), reordering being respected by the
  next battle, and a seventh capture going to storage with its identity intact.
- **Stress test:** seven full encounter → failed throw → capture → menu → summary
  → index → overworld cycles, plus twelve menu open/close cycles, leave display
  objects, update lists, tweens, timers, textures, animations, keyboard keys,
  key and camera listeners, player step listeners and scene instances unchanged,
  at ~38 fps, still able to catch afterwards.
- **Phases 1–5 re-verified** on the same build: playthrough 10/10, world 34/34,
  items and flags 18/18, starter chooser 22/22, starters for real 60/60,
  practice battles 27/27, switching and status 15/15, progression 33/33,
  encounters 41/41, controlled encounters 13/13, and every earlier leak check.

### Known limitations

- **Nicknaming is not implemented.** The field exists and is used everywhere it
  would appear; there is no on-screen text entry yet.
- **Storage is a summary, not a manager** — no withdrawing or depositing.
  Nothing is lost, but moving a creature back into the party is a later screen.
- A capture awards no experience: the creature is the reward.
- Losing still revives the party to 1 HP with a message; the Mender's Hall
  blackout remains Phase 7.

---

## Phase 5 — Wild Encounters

The grass bites back. Walking through tall grass on Route 1 now drops you into a
real battle, and walking out of it puts you back exactly where you were.

### Added

**The encounter pipeline**

    a completed step -> EncounterSystem -> createWildBattleConfig
    -> BattleScene -> the overworld, exactly as it was

- `EncounterSystem` is now the ONE place every encounter rule lives: the
  terrain result, the rate, the cooldown, and every situation where an
  encounter must not happen. `WorldScene` reports facts — "dialogue is open",
  "the map is changing", "a battle is running", "the player is not in control" —
  and the system decides. `findEncounterBlocker()` is exported and pure, so each
  rule is one test rather than a scene walkthrough.
- A step is offered exactly once. The player only announces a step after
  actually finishing a move onto a new tile, so standing still and walking into
  a tree produce no roll at all rather than a roll that is thrown away.
- `WildBattle.createWildBattleConfig()` is the only thing that knows what a wild
  fight is: running allowed, experience awarded, no money. It hands the LIVE
  party to the engine, so damage, spent PP, levels, new moves and evolutions
  land on the real team.

**Maps decide their own encounters, without touching any scene**

```js
encounterTable: 'route1',              // the short form

encounters: {                          // ...or the long form
  table: 'route1',
  rate: 0.11,                          // optional, defaults to balance.js
  cooldownSteps: 3,                    // optional
  terrain: ['tall_grass'],             // optional: narrow the eligible tiles
}
```

- Encounter terrain comes from tile data (`encounter: true`), which a map may
  narrow further. A future cave can have wild creatures in its floor but not
  its puddles without a line of scene code changing.
- `findEncounterTableProblems()` validates a table — species exists, levels are
  whole numbers in range and the right way round, weights positive, table not
  empty. The data tests run it over every table AND every encounter-enabled map
  automatically, so a new area is checked the moment it is added.

**Route 1 is a complete encounter area**

| Species  | Levels | Weight | Roughly |
|----------|--------|--------|---------|
| Nibbit   | 2–4    | 30     | 30%     |
| Flittle  | 2–4    | 25     | 25%     |
| Vinelet  | 3–5    | 20     | 20%     |
| Grubbit  | 2–4    | 15     | 15%     |
| Puffcap  | 3–5    | 7      | 7%      |
| Emberfly | 4–6    | 3      | 3%      |

Balanced around a level 5 starter: nothing here can flatten you, everything is
worth beating, and Emberfly is rare enough that finding one is a small event.

**Presentation**
- A short flash-and-fade cue when something jumps out — camera effects only, so
  there is nothing left behind to clean up.
- The battle uses the real creature: species, level, stats, moves, HP and
  artwork, straight from `CreatureFactory`. The engine's own opening line does
  the announcing ("A wild Nibbit appeared!").

**Debug** — `debug.encounter()` arms the next grass step, `debug.encountersOff()`
switches encounters off, `debug.encounterRate()` sets the chance per step, and
`debug.encounterInfo()` prints the table, rate and cooldown. Normal play never
reads any of them.

### Changed

- **Wild, trainer and practice battles now enter and leave through one
  function.** `WorldScene.launchBattle()` pauses the overworld, launches the
  battle and hands control back; `debug.wild()` goes through it too, so what you
  test from the console is what the grass does.
- **The battle bag rule moved to `BattleItems.js`** so it can be tested without
  a browser. Behaviour is unchanged.
- **The encounter cooldown is renewed whenever a battle ends**, not only when
  one starts. Returning to the overworld standing in the same patch of grass can
  never drop you straight into another fight.

### Rules chosen and documented

- **Rate:** 11% per step on encounter terrain, from `balance.js`; a map may
  override it. Nothing else in the codebase holds an encounter constant.
- **Cooldown is counted in STEPS, not seconds** — deterministic, easy to test
  and impossible to desync from the frame rate. Three safe steps after an
  encounter, three more when any battle ends, and safe ground burns the
  cooldown down too, so crossing a path between two patches does not carry a
  stale grace period.
- **A step that happens while something else owns the screen does not count at
  all** — not for an encounter, and not against the cooldown.
- **Exits beat encounters.** Standing in a doorway always takes you through it.
- **Escape** uses the Phase 4 engine formula unchanged: a speed-based roll that
  gets easier with each attempt, and a failed escape costs the turn.
- **A wild win pays no money.** Coins come from trainers.
- **An encounter with no party is refused with a message**, not with an empty
  battle.

### Fixed

- **Two suites were pinned to the dev server** rather than the URL they were
  given, so they could not run against a production build.

### Verification

- **1554 automated tests** pass (was 1451). New: 78 encounter tests and 40
  wild-encounter pipeline tests, including a walker driven over the real Route 1
  map so "standing still" and "walking into a tree" genuinely produce no roll.
- **Lint clean; production build succeeds.**
- **Browser-verified against the production build**, zero console errors:
  - 41/41 encounter checks: reaching Route 1, the path staying safe, a real
    ambush in tall grass, exactly one battle scene, the creature and level
    coming from the table, capture orbs disabled, PP spent, EXP awarded, no
    money, returning to the exact tile and facing with inventory and flags
    intact, the cooldown protecting the return, movement resuming, a second
    encounter after the cooldown, Run escaping and awarding nothing, no
    encounter while dialogue owns the input, and encounters switchable off.
  - 13/13 controlled-state checks: both ends of every level range, all six
    species reachable, the rare Emberfly met and fought for real, a level-up
    earned from wild experience, and an evolution earned from wild experience
    with the individual preserved.
- **Stress test:** eight overworld → wild battle → overworld cycles leave
  display objects, update lists, tweens, timers, textures, animations, keyboard
  keys, key listeners, camera fade/flash listeners, player step listeners and
  scene instances unchanged, at ~35 fps, still able to be ambushed afterwards.
- **Phases 1–4 re-verified** on the same build: keyboard playthrough (10/10),
  world and NPC systems (34/34), items, encounters and flags (18/18), the
  map-transition leak check, the starter chooser (22/22), choosing each starter
  (60/60), practice battles (27/27), switching, items and status (15/15),
  progression, evolution and forced switches (33/33), and the battle leak check.

### Known limitations

- Capture is Phase 6. Orbs are listed in the wild-battle bag as unavailable,
  are never consumed, and no probability is rolled.
- Defeat keeps its Phase 4 behaviour: the party is revived to 1 HP each with a
  plain message. The Mender's Hall blackout belongs to Phase 7.
- No encounter modifiers yet (repels, weather, time of day). The map's
  `encounters` block is the seam they would hang off.
- Full trainer NPCs with line of sight are Phase 8.

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
- **The action menu was drawn behind the message box** and could not be seen.
  Depth is now `DEPTHS.dialogue + 10` rather than `DEPTHS.ui + 5`.
- **The HP label floated in the corner of the screen.** It was created but never
  added to the panel's container, so it was positioned in world coordinates
  instead of relative to the panel.
- **A replacement was asked for twice after a faint.** The end of a turn
  re-checks who is standing, and the second check pushed another
  `requestSwitch`: on screen the prompt reopened on top of itself and swallowed
  the key press the player had just made on the first one, so the game looked
  frozen at "Choose your next creature!". The engine now asks once per faint.
- **A hidden menu still reacted to key presses.** The scene's phase can still
  say `party` or `learnMove` for a moment after the list has been put away while
  the outcome is narrated, and a stray press could re-run a choice that had
  already been made. `BattleMenu.update()` now ignores input while invisible,
  and the prompts hand the phase back as soon as they close.
- **Declining to learn a move left the shared list menu rewired.** Cancelling
  the prompt skipped `restoreListHandlers()`, so the next party or bag list
  still carried the learn-move handlers. Both exits now go through one `close()`.
- **A creature that evolved from the bench hijacked the battlefield.**
  Experience is shared, so the creature that evolves is not always the one
  standing there; the sprite and HP bar are only redrawn when it is.

### Verification

- **1451 automated tests** pass (was 1260). New: 46 battle-math, 41
  status/effect, 33 experience/evolution, 46 engine and 25 battle-data tests.
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
  - 33/33 progression checks: experience awarded and shared, a reward crossing
    thirteen levels at once, the "forget which move?" prompt with all four moves
    and a way out, the replacement actually taking the chosen slot, a full
    evolution through the real battle flow with identity and nickname preserved,
    running away, and a forced switch after a faint bringing out a healthy
    creature.
- **Leak check:** eight battles entered and left in a row leave display objects,
  update lists, tweens, timers, textures, animations, keyboard keys, key
  listeners and scene listeners unchanged, with the game still at ~36 fps and
  still able to start another battle.
- **Phases 1-3 re-verified** against the same build: the keyboard playthrough
  (10/10), world and NPC systems (34/34), items, encounters and flags (16/16),
  the map-transition leak check, the starter chooser (22/22) and choosing each
  starter for real (60/60).

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
