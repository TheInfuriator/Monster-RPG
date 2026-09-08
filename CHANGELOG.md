# Changelog

Meaningful development milestones, newest first.

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
