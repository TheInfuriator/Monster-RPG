# Aetheria Chronicles — Game Design Document

> An original monster-catching RPG. Mechanically inspired by classic creature-collector
> RPGs; **all** creatures, names, characters, maps, story, and art are original to this
> project. No copyrighted third-party assets are used.

---

## 1. High Concept

You are a new **Warden** — a person who bonds with **Aethers**, creatures born from the
elemental currents that flow beneath the Aetheria region. Wardens travel the region,
befriend Aethers, and test themselves against the **Beacon Halls** (this world's gyms)
to earn **Sigils**. A group called the **Hollow Vane** is draining the elemental currents
for their own ends, and the wild Aethers are growing restless because of it.

**Tone:** adventurous, warm, lightly comedic. Story stays out of the way of gameplay.

---

## 2. The Region: Aetheria

The region sits in a broad valley fed by glowing "aether currents" that surface as
springs, storms, and mineral veins. Full planned region (built incrementally):

| # | Location | Type | Purpose |
|---|----------|------|---------|
| 1 | **Emberhollow Town** | Starting town | Home, Warden's Lodge (lab), Mender's Hall, Supply Post |
| 2 | **Route 1 — Cinderpath** | Route | First tall grass, first trainers, first wild Aethers |
| 3 | **Thistlewood** | Town | First Beacon Hall (Verdant), shop, mender |
| 4 | **Route 2 — Thornway** | Route | Tougher trainers, branching path |
| 5 | **Mistvault Cavern** | Dungeon | Dark/Rock creatures, puzzle, Hollow Vane event |
| 6 | **Tidewatch Harbor** | Town | Second Beacon Hall (Tidal), storage access |
| 7 | **Route 3 — Stormrise Climb** | Route | Elevation, weather flavour, rare Aethers |
| 8 | **Voltspire City** | City | Third Beacon Hall (Storm), championship gateway |
| 9 | **The Aerie** | Final challenge | Champion gauntlet |

**Vertical slice (first playable build) = locations 1, 2, and 3.**

**Built so far (Phase 9):** Emberhollow Town and its four interiors, Route 1, and
Thistlewood with its Mender's Hall, Supply Post, a cottage and the Verdant Hall.
That is the whole vertical slice: locations 1, 2 and 3.

Route 2 is held back the same way Thistlewood was — Thistlewood's Thornway gate
is visibly shut, with a keeper and a sign that explain the bramble clearance,
rather than an invisible wall or an empty route.

### Region flavour notes
- Emberhollow: warm ochre + slate, a small quarry town built on a dormant ember vent.
- Cinderpath: ash-grey soil, hardy green grass, low stone walls.
- Thistlewood: overgrown timber town, everything half-swallowed by hedges.

### Emberhollow Town — as built
30x24. A crossroads town: the main road runs east-west, the north road becomes the
Cinderpath. Four buildings, each with an interior:

| Building | Who is inside | Role |
|----------|---------------|------|
| The player's house | Mum | Opening nudge toward the Lodge |
| Warden's Lodge | Prof. Wick, an assistant | Starter selection (Phase 3) |
| Mender's Hall | Mender Ines, a traveller | Free healing (Phase 3+) |
| Supply Post | Bram | Shop (Phase 7) |

Also: a kitchen garden, two signposts, a pond, and a patch of tall grass on the
northern edge — a safe first taste of wild encounters within sight of home.

### Thistlewood — as built
30x24, reached through Route 1's north gate. A main road runs north from the
route to the Verdant Hall's door and crosses an east-west road serving the
Mender's Hall and the Supply Post. A third road climbs north-east to the shut
Thornway gate. Nan Thistle's cottage sits in the south-west, a pond in the
south-east, hedges everywhere, three signs, a hidden Great Orb, and ten NPCs
across the town and its four interiors.

| Building | Who is inside | Role |
|----------|---------------|------|
| The Verdant Hall | Sorrel, Teal, Bracken, Fern | Beacon Hall 1 |
| Mender's Hall | Mender Rell, a challenger | Free healing, second recovery point |
| Supply Post | Perrin | The strong shelf |
| Thistle Cottage | Nan Thistle, Cob | Flavour, and the puzzle hint |

### Route 1 — Cinderpath — as built
22x30, running north from Emberhollow. The path jogs twice so the route is not a
straight corridor. Tall grass sits on both sides of the path throughout, so the
player always chooses between the safe route and the interesting one. A pond
partway up, two ground items, seven NPCs — four travellers and three trainers —
a signpost, and a gate at the top that the warden opens once you are walking
with a partner.

---

## 3. Starter Aethers

The player chooses one of three at the Warden's Lodge. Classic Fire / Water / Grass triangle,
each with a distinct stat identity and a 3-stage evolution line.

### Fire — **Pyrret** → **Cindraw** → **Emberax**
- **Concept:** a ferret-like creature with a coal-black coat and glowing seams along its spine.
- **Identity:** fast physical attacker. High Speed / Attack, low Defense.
- **Evolves:** Pyrret → Cindraw (L16) → Emberax (L34)
- **Built:** base stats 45/62/40/50/42/68. Learns Ember at level 1.

### Water — **Drizzle** → **Puddlurk** → **Torrentine**
- **Concept:** a round amphibian that carries a bead of water on its head like a lantern.
- **Identity:** bulky special attacker. High Sp. Def / HP, low Speed.
- **Evolves:** Drizzle → Puddlurk (L16) → Torrentine (L34)
- **Built:** base stats 55/44/52/60/62/34. Learns Water Jet at level 1.

### Grass — **Sproutle** → **Bramblit** → **Thornmane** *(Grass/Fighting at final stage)*
- **Concept:** a stout seed-pod creature that grows a mane of thorned vines.
- **Identity:** balanced bruiser. High Attack / Defense, average Speed.
- **Evolves:** Sproutle → Bramblit (L16) → Thornmane (L34)
- **Built:** base stats 50/58/58/44/48/49. Learns Leaf Dart at level 1.

### The balance rule
All three lines share **identical stat totals at every stage** — 307 at stage 1,
396 at stage 2, 500 at stage 3 — spread differently. No starter is objectively
the right pick; they simply play differently. A test enforces this, so the rule
cannot quietly rot as stats are retuned.

Each starter is handed over at **level 5** knowing three moves, including a
damaging move of its own type — otherwise the Fire/Water/Grass triangle would
not matter in the first rival battle.

**Rival's choice:** the rival always picks the starter **strong against** the player's,
guaranteeing an interesting first fight.

---

## 4. First 12 Creature Concepts (vertical slice roster)

Beyond the starters, the slice ships these wild Aethers. IDs are lowercase slugs.

| # | Name | Type(s) | Concept | Where |
|---|------|---------|---------|-------|
| 010 | **Nibbit** | Normal | Twitchy field rodent, huge front teeth. Evolves → Chompkin (L18) | Route 1 |
| 011 | **Chompkin** | Normal | Nibbit grown bold; gnaws stone. | Route 1 (rare) |
| 012 | **Flittle** | Normal/Flying | Scruffy dawn-bird, always molting. Evolves → Gustwing (L20) | Route 1 |
| 013 | **Gustwing** | Normal/Flying | Sleek courier bird used to carry Warden mail. | Route 2 |
| 014 | **Bramblit** *(see starters)* | Grass | — | — |
| 015 | **Vinelet** | Grass | A curling tendril with a single stubborn leaf. Evolves → Ivorn (L22) | Route 1 grass |
| 016 | **Ivorn** | Grass/Poison | Vinelet matured; leaks a bitter sap. | Thistlewood Hall |
| 017 | **Puffcap** | Grass/Poison | Nervous mushroom that vents spores when startled. | Route 1 (rare) |
| 018 | **Grubbit** | Bug | Armoured grub, rolls into a disc. Evolves → Carapex (L20) | Route 1 |
| 019 | **Carapex** | Bug/Steel | Grubbit's plated adult form. | Route 2 |
| 020 | **Pebblit** | Rock | A fist-sized rock with two bright eyes. Evolves → Cragmaw (L24) | Route 1 ledges |
| 021 | **Emberfly** | Fire/Bug | Moth whose wingbeats leave sparks. | Route 1 (rare, night flavour) |
| 022 | **Dampling** | Water | A droplet with a shy face; clings to reeds. | Route 1 pond edge |
| 023 | **Zaplet** | Electric | A static-charged tuft of fur. | Route 2 |

### Built roster (Phase 3): 27 species

10 evolutionary families plus 4 single-stage species.

| Family | Line | Types |
|--------|------|-------|
| Fire starter | Pyrret → Cindraw (16) → Emberax (34) | Fire |
| Water starter | Drizzle → Puddlurk (16) → Torrentine (34) | Water |
| Grass starter | Sproutle → Bramblit (16) → Thornmane (34) | Grass, then Grass/Fighting |
| Rodent | Nibbit → Chompkin (18) | Normal |
| Bird | Flittle → Gustwing (20) | Normal/Flying |
| Vine | Vinelet → Ivorn (22) | Grass, then Grass/Poison |
| Grub | Grubbit → Carapex (20) | Bug, then Bug/Steel |
| Stone | Pebblit → Cragmaw (24) | Rock, then Rock/Ground |
| Water pond | Dampling → Brookel (20) | Water |
| Static | Zaplet → Voltmane (24) | Electric |
| *(single)* | Puffcap | Grass/Poison |
| *(single)* | Emberfly | Fire/Bug |
| *(single)* | Wispel | Ghost |
| *(single)* | Umbrat | Dark |

**Types represented: 14 of 18.** Ice, Psychic, Dragon and Fairy are deliberately
held back for the later regions rather than padded into Route 1 to hit a number.
The type CHART covers all 18 regardless.

Full game target: **30+** creatures across ~12 evolutionary families.

---

## 4b. Moves — 56 built

24 physical, 16 special, 16 status, across 14 types. Effects are declared as
KINDS (`status`, `statChange`, `heal`, `drain`, `recoil`, `multiHit`, `flinch`)
rather than per-move code, so the battle engine handles each behaviour once.

The set deliberately covers everything a battle system needs on day one: weak
and strong attacks, a priority move, healing, draining, recoil, multi-hit,
accuracy modification, stat buffs and debuffs, and at least one move that
inflicts each of the four status conditions.

---

## 4d. Battle rules (Phase 4)

### Damage
```
base   = floor(floor(floor(2 * level / 5 + 2) * power * attack / defense) / 50) + 2
damage = floor(base * STAB * effectiveness * critical * burn * variance)
```
Physical uses Attack vs Defense, special uses Sp. Atk vs Sp. Def. A connecting
move always does at least 1; an immune defender takes exactly 0.

| Knob | Value | Why |
|------|-------|-----|
| STAB | 1.5x | rewards building around a type |
| Variance | 85-100% | alive, but never ruins a plan |
| Critical | 1/16 at 1.5x | a pleasant surprise, not a coin flip |
| Crit vs buffs | ignores the defender's defensive stages | stops a Harden Shell wall making luck worthless |

### Turn order
1. Action priority — run > switch > item > move
2. Move priority — Quick Jab, Shadow Sneak
3. Effective Speed — stat x stage, halved by paralysis
4. A coin

Switching before attacks is deliberate: committing to a swap should be a real
tactical option, not a wasted turn.

### Stat stages
-6 to +6 on Attack, Defense, Sp. Atk, Sp. Def, Speed, accuracy and evasion.
Battle stats use a steeper curve than accuracy/evasion — a miss is far more
frustrating than a weak hit. Stages live on the battler, never on the creature,
and **switching clears them**: buffs belong to whoever earned them.

### Status
One major status at a time; a second fails cleanly rather than replacing the
first. Poison and burn deal residual damage at the **end** of the turn, so a
creature always gets its turn before the poison that might finish it. A sleep of
N turns costs exactly N turns.

### PP and Struggle
PP is spent when a move is **used**, hit or miss — that is what makes accuracy
matter. With every move empty the creature Struggles (40 power, 25% recoil), so
a battle can never deadlock.

### Experience
```
exp = floor(baseExp * defeatedLevel / 7) x (1.5 for a trainer)
```
Every creature that was **sent out** gets the full amount rather than a share,
so switching stays attractive. On level-up a creature keeps the damage it had
taken and gains the extra max HP as real HP.

---

## 4c. Stats, levels and experience

```
HP     = floor(2 * base * level / 100) + level + 10
others = floor(2 * base * level / 100) + 5
```

Three cubic experience curves — `fast` (0.8 x n³), `medium` (n³) and
`slow` (1.25 x n³). Three curves rather than six makes balance far easier to
reason about.

**No individual variance.** Two creatures of the same species and level have
identical stats. Hidden per-creature values are a lot of complexity for a player
to reason about; the formula has an obvious place to add them later.

---

## 5. Type Chart

18 types: Normal, Fire, Water, Grass, Electric, Ice, Fighting, Poison, Ground, Flying,
Psychic, Bug, Rock, Ghost, Dragon, Dark, Steel, Fairy.

Effectiveness multipliers: `0` (no effect), `0.5` (not very effective), `1` (neutral),
`2` (super effective). Dual types **multiply** (so 4x and 0.25x are possible).

The chart lives in **one data file** (`src/data/types.js`) as a sparse map of
`attackingType -> { defendingType: multiplier }`. Anything not listed is `1`.
Battle code never hardcodes matchups — it always asks `TypeChart.getMultiplier()`.

---

## 6. Core Progression

```
Wake up in Emberhollow
  → Warden's Lodge: meet Professor Wick, choose starter
  → Rival battle #1 (in town, 1 creature each)
  → Receive Capture Orbs
  → Route 1 (Cinderpath): wild Aethers, 3 trainers
  → Thistlewood: shop, mender, Beacon Hall #1
  → Verdant Beacon Hall: 2 trainers + puzzle + Leader Fern
  → Earn the Verdant Sigil  ← END OF VERTICAL SLICE
  → Route 2, Mistvault Cavern, Hollow Vane event
  → Tidewatch Harbor: Beacon Hall #2 (Tidal)
  → Route 3, Voltspire City: Beacon Hall #3 (Storm)
  → The Aerie: Champion gauntlet
```

### Level pacing
| Milestone | Expected player level |
|-----------|----------------------|
| Route 1 wild Aethers | 3–6 |
| Route 1 trainers | 5–7 |
| Rival battle #1 | 5 |
| **Beacon Hall 1 (Fern)** | **10–13** |
| Route 2 | 14–18 |
| **Beacon Hall 2** | **18–22** |
| Mistvault Cavern | 20–25 |
| **Beacon Hall 3** | **25–30** |
| Champion | 33–38 |

---

## 7. Beacon Hall 1 — The Verdant Hall (Thistlewood) — BUILT (Phase 9)

Built exactly as planned below. Section 20 documents what it became: the map,
the barrier architecture, the measured balance and the Sigil.

- **Theme:** an overgrown greenhouse. Hedges form the walls.
- **Puzzle:** three **root switches**. Stepping on a switch retracts one hedge wall and
  extends another. The player must reach the Leader by toggling switches in the right
  order. Simple, readable, no timers.
- **Trainers:** 2 Gardeners (2 creatures each, L8–10). Ordinary Phase 8
  trainers — entries in `trainers.js` and NPCs with `trainer:` and `sightRange`,
  no new code.
- **Leader:** **Fern**, calm and rather smug about her hedges.
  - Vinelet L11, Puffcap L11, **Ivorn L13** (ace, Grass/Poison)
- **Reward:** **Verdant Sigil**, 1200 coins, and the Hall's TM-equivalent later.
- **Progress recorded as:** the Sigil itself, readable in dialogue as
  `badge:verdantSigil`. The old plan called for a separate `sigil_verdant` flag;
  that would have been two records of one fact, free to disagree. See section 20.
- **Unlocks:** the Thornway gate to Route 2 — a barrier waiting on a
  `thornwayOpen` flag that nothing sets until Route 2 is built.

---

## 8. The Rival

**Name:** Kestrel. Confident, competitive, never actually mean — treats the player as
the one person worth beating.

| Appearance | Where | Team |
|-----------|-------|------|
| 1 | Emberhollow (after starter) | Starter only, L5 |
| 2 | Route 1 exit | Starter L9 + Flittle L8 |
| 3 | After Beacon Hall 1 | Evolved starter L15 + Gustwing L14 + Grubbit L13 |
| 4+ | Later routes / The Aerie | Grows to a full 6 |

---

## 9. Antagonists — The Hollow Vane

A "resource company" siphoning aether currents into storage cells. Grunts use Poison,
Dark, and Steel Aethers. They appear from Mistvault Cavern onward. Deliberately kept out
of the vertical slice so the opening stays about exploration.

---

## 10. Balance Decisions (log)

These are the deliberate knobs. All live in `src/config/balance.js`.

1. **Encounter rate:** ~11% per step on encounter terrain, with a **3-step
   cooldown** after an encounter and **3 more when any battle ends**, so the
   player can never be chain-ambushed on consecutive tiles or walk out of one
   fight into the next. A map may override both. The cooldown is counted in
   STEPS rather than seconds: deterministic, easy to test, and impossible to
   desync from the frame rate.
2. **Damage variance:** 85%–100% (a 15% band) — enough to feel alive, not enough to
   make a plan fail.
3. **Critical hit rate:** 1/16, dealing 1.5x. No crit-stage system in v1 (kept simple).
4. **STAB (same-type attack bonus):** 1.5x.
5. **Growth rates:** three curves only — `fast`, `medium`, `slow`. Fewer curves is easier
   to reason about and to balance than the six used by the games that inspired this.
6. **Loss penalty:** lose 5% of carried coins (`floor`, never more than you
   have), warp to the last Mender's Hall, full heal. Never a game over — this
   game does not punish learning. Implemented in Phase 7; whether a defeat
   carries the penalty at all is `blackoutOnDefeat` on the battle config, so a
   practice bout costs nothing.
7. **Wild levels track the player**, staying inside each route's own band, so no route
   ever becomes trivially safe or brutally unfair.
8. **Gym leaders are ~2 levels above the local trainers** and always have a coherent
   type plan, so they read as a real step up.
9. **Ground items block their tile.** You have to face one to take it. This is
   why an item is never something you accidentally walk over and miss.
10. **NPCs never wander more than a couple of tiles from home**, so a wandering
    villager can never end up somewhere that makes a corridor impassable, and you
    can always find someone again where you left them.
11. **A trainer's sight is a straight line along their facing only** — four tiles
    on Route 1 — and anything solid in between stops it. One axis, no cones and
    no diagonals: the player can always tell by looking whether they are about to
    be seen, and every boundary is a unit test rather than a feeling.
12. **Exactly one trainer challenges per step**, the nearest, ties broken by id.
    Nothing random picks it, so the same step always has the same consequence.
13. **Trainers beat wild encounters** on the same step, and exits beat both.
    A trainer standing in tall grass is never lost to a random Aether.
14. **Route 1's trainers sit just above its wild band** (L6, then two at L7, then
    L8-9 against wild 2-6 and a L5 starter), and the three together pay 980
    coins — four or five Potions. Enough to matter, not enough to skip the route
    economy.

---

## 11. Art Direction

Placeholder art is **generated procedurally at runtime** (`src/systems/TextureFactory.js`)
— coloured shapes with consistent outlines and a shared 4-colour-per-creature scheme keyed
off the creature's primary type. This means:

- zero binary assets in the repository, zero licensing risk;
- the game looks cohesive rather than like unrelated clip art;
- swapping in real PNG art later means changing **one file** (the asset registry),
  because every sprite is referenced by a logical key, never a file path.

**Palette:** slate/ink UI (`#1b2028`), parchment text (`#f4ecd8`), per-type accent colours.
**Tile size:** 32px. **Internal resolution:** 480x320, integer-scaled up (crisp pixels).

---

## 12. Story Flags

Progression is tracked with named flags on `GameState`. NPC dialogue branches on
them, and later phases will gate areas with them.

| Flag | Set by | Effect so far |
|------|--------|---------------|
| `metWick` | Talking to Professor Wick | Mum, the town villager and the Lodge assistant all change what they say |
| `gotStarter` | Choosing a starter at the Lodge | Wick, her assistant, Mum, Bram and the gate warden all react — across three maps |
| `pickedUpRoute1Potion` | Taking the Route 1 potion | The item stays taken |
| `pickedUpRoute1Orbs` | Taking the Route 1 orbs | The item stays taken |
| `route1GateOpen` | Asking the Gate Warden once you have a starter | Route 1's north gate opens, for good |
| `pickedUpThistlewoodOrb` | Taking the Great Orb in Thistlewood | The item stays taken |
| `pickedUpVerdantPotion` | Taking the Super Potion behind the west hedge | The item stays taken |
| `thornwayOpen` | *nothing yet* | Would open the Thornway gate. Reserved for Route 2 |

Beaten trainers are not flags — they live in `GameState.defeatedTrainers`, keyed
by trainer id — but they are *readable* as flags. `getDialogueConditions()` folds
each one in as `trainer:<id>`, so dialogue branches on a beaten trainer exactly
the way it branches on a story flag. See section 19.

### Practice battles
Assistant Bly and Warden Tace at the Warden's Lodge offer repeatable practice
bouts once you have a starter. They award **no experience and no money** on
purpose: a repeatable fight that paid out would be an infinite progression
exploit. Real, once-only trainer battles with real rewards arrived in Phase 8 —
see section 19.

Flags are plain strings — add one by using it in a dialogue branch's `setFlags`
and checking it with `when` / `unless` somewhere else.

---

## 13. Controls

| Input | Action |
|-------|--------|
| Arrow keys / WASD | Move |
| Space / Enter / E | Interact, confirm, advance dialogue |
| Escape / X | Menu, cancel, back |
| Shift (held) | Run |
| ` (backtick) | Toggle debug overlay (dev builds only) |

---

## 15. Battle architecture at a glance

```
BattleScene            draws, animates, reads the keyboard
     |  events                          ^  player choices
     v                                  |
BattleEngine           battle state, turn orchestration
     |
     +-- TurnResolver        who goes first
     +-- DamageCalculator    how much it hurts
     +-- StatStages          temporary buffs and debuffs
     +-- StatusSystem        poison, burn, paralysis, sleep
     +-- MoveEffectRunner    what a move does, by effect KIND
     +-- ExperienceSystem    rewards, levels, moves, evolution
     +-- BattleAI            what the opponent picks
```

Nothing below `BattleEngine` knows about Phaser, and `BattleEngine` reports
everything as events rather than drawing. That is why an entire battle can be
fought in a unit test, and why the same engine serves wild battles, trainer
battles and practice bouts without a separate code path for each.


---

## 16. Encounter architecture at a glance

```
Player 'step' event          only fires after a move actually completes
      |
      v
WorldScene.checkForEncounter()      reports FACTS, decides nothing
      |   { onEncounterTile, dialogueOpen, transitioning,
      |     battleActive, overlayActive, inputLocked }
      v
EncounterSystem.step()              every encounter rule lives here
      |   +-- findEncounterBlocker()   when a step must be ignored
      |   +-- cooldown                 safe steps, counted in steps
      |   +-- chance(rate)             the roll
      |   +-- roll()                   weighted species, level in range
      v
createWildBattleConfig()            what a wild fight IS
      |   canRun, awardExperience, rewardMoney: 0, the LIVE party
      v
WorldScene.launchBattle()           pause the overworld, launch BattleScene
      |
      v
BattleScene / BattleEngine          the same engine trainers and practice use
      |
      v
onFinished -> resume + applyCooldown + releasePlayer
```

**How a map turns encounters on.** Either the short form or the long one:

```js
encounterTable: 'route1',

encounters: {
  table: 'route1',
  rate: 0.11,                 // optional
  cooldownSteps: 3,           // optional
  terrain: ['tall_grass'],    // optional: narrow the eligible tiles
}
```

Encounter terrain comes from tile data (`encounter: true` in `tiles.js`), so
tall grass qualifies everywhere; `terrain` narrows it for one map. Adding a
species to an area is one row in `src/data/encounters.js` — no scene, system or
test changes, because the data tests iterate over every table and every
encounter-enabled map.

**Why the overworld is PAUSED rather than restarted.** A wild battle preserves
the map, the exact tile, the facing, the party, HP, PP, statuses, experience,
levels, learned moves, evolutions, inventory, money and story flags — not
because anything restores them, but because nothing tears them down. There is no
"put the player back" code to get wrong. The party array handed to the engine is
the live one from `GameState`, so everything a battle changes is already in the
right place when it ends.

**What Phase 5 deliberately did not do.** Capture is Phase 6: orbs are listed in
the bag as unavailable, are never consumed, and no probability is rolled — the
rule sits in `BattleItems.js` on the item's own category, so catching can be
added there without touching this pipeline. Defeat keeps its Phase 4 behaviour
(party revived to 1 HP with a plain message); the Mender's Hall blackout is
Phase 7.


---

## 17. Capture, the party and the index (Phase 6)

### The capture formula

    chance = catchRate / 255            how catchable the species is
           * (1 - hpFraction * 0.7)     how hurt it is
           * statusBonus                whether it can struggle
           * orbModifier                what was thrown
           * globalModifier             one knob for the whole game

clamped to **1%..95%**. Every number lives in `CAPTURE` in `balance.js`; the
formula itself is `src/systems/battle/CaptureCalculator.js` and nothing else
computes capture odds.

| Input | Effect |
|-------|--------|
| Full HP | x0.30 — catching something untouched is meant to be a long shot |
| Half HP | x0.65 |
| 1 HP | ~x1.00 |
| Fainted | impossible: it is beaten, not caught |
| Sleep | x2.0 |
| Paralysis | x1.5 |
| Poison / Burn | x1.3 |
| Basic Orb | x1 |
| Great Orb | x1.5 |
| Ultra Orb | x2 |

**Tuning a species** is one number: `catchRate` in `src/data/creatures.js`, on a
1..255 scale. Route 1's commons sit at 255, its rare Emberfly at 120, and the
starter lines at 45. **Adding an orb tier** is one entry in `src/data/items.js`
with `effect: { type: 'capture', modifier: N }` — no code names an orb.

### The shakes

A throw performs `CAPTURE.shakeChecks` (4) checks, each at `chance ** (1/4)`.
Passing all four IS the capture, so:

- the overall odds are exactly `chance`
- the wobble count is genuinely how close the throw came
- **0** broke free at once, **1** almost, **2** so close, **3** agonising,
  **4** caught

The animation reads the rolled count. It is never decided separately.

### Turn behaviour

Throwing an orb is the player's action for the turn, resolved before anything
else, exactly like running:

- **Caught** — the battle ends immediately; the opponent never answers.
- **Missed** — the opponent attacks, then end-of-turn effects run.
- **Refused** — wrong kind of battle, empty bag, fainted target, not an orb:
  nothing is spent and the turn is not used.

Whether orbs may be thrown at all is `allowCapture` on the battle config,
defaulting to wild battles only. Nothing checks an NPC, a map or a scene name.

### Party and storage

Six travel with you. A capture past that goes to **storage**, automatically,
with a message saying so — the player is never asked to throw one away
mid-battle, and nothing is ever lost or overwritten. Storage is a plain array on
GameState, so it serialises with the save. It is a *summary* in Phase 6: you can
see what is waiting, not move it back.

Reordering is a swap: pick one up with Shift, choose a slot, Confirm. The first
slot is the creature that goes out first, so the order matters immediately.
Every reorder is all-or-nothing — an invalid index changes nothing.

### The index

| State | Shows |
|-------|-------|
| Unseen | number, `-----`, no types |
| Seen | number, name, types |
| Caught | the above plus the species write-up |

**SEEN** is set the moment a creature stands on the battlefield, in any battle
type — wild, trainer or practice. If it was on the field, you saw it.
**CAUGHT** is set by catching one, or by being given one; your starter counts.
Caught implies seen, so "caught but not seen" cannot happen.

All of it goes through `src/systems/CreatureIndex.js` — `markSeen`,
`markCaught`, `isSeen`, `isCaught`, `getIndexRows` — and no scene writes the
index directly. Unknown species ids are refused with a warning.

### The menu

Cancel opens it over a paused overworld. Party, Index, Storage, Close.

| Screen | Keys |
|--------|------|
| Root | Up/Down choose, Confirm open, Cancel close |
| Party | Up/Down choose, Confirm summary, **Shift move**, Cancel back |
| Moving | Up/Down pick a slot, Confirm swap, Cancel put it back |
| Summary | Left/Right another creature, Cancel back |
| Index | Up/Down scroll, Cancel back |

All four are one scene with a `view` state machine, so there is one owner of the
keyboard and one place that hands control back to the world.


---

## 18. Money, items and healing (Phase 7)

### The economy

| Value | Number | Where |
|-------|--------|-------|
| Starting money | 800 | `ECONOMY.startingMoney` |
| Sell price | half the buy price | `ECONOMY.sellPriceFraction` |
| Blackout loss | 5% of carried coins | `ECONOMY.faintMoneyLossFraction` |
| Potion | 200 | `items.js` |
| Basic Orb | 150 | `items.js` |
| Status cures | 120 | `items.js` |

800 coins is four Potions and change, or two Potions and three Orbs. That is the
intended feel for the first town: a real choice, not a shopping spree.

**Nothing but `EconomySystem` changes money.** It keeps the value a whole number,
never negative, and refuses to take more than the player has — all or nothing,
never a partial payment.

### Items

An item is an entry in `src/data/items.js`. Its `effect` decides what it does
and, by default, where it can be used:

| Effect | Does | Battle | Field |
|--------|------|--------|-------|
| `{ type: 'heal', amount }` | restores HP, clamped to max | yes | yes |
| `{ type: 'cureStatus', status }` | clears one named status | yes | yes |
| `{ type: 'cureAllStatus' }` | clears whatever is there | yes | yes |
| `{ type: 'capture', modifier }` | an orb | yes | no |

An item may override with `usableInBattle` / `usableInField`. `sellable: false`
keeps a key item out of every shop.

`ItemEffects.applyItemToCreature()` is the ONE implementation, used by both bags.
It returns `{ success, consumed, message, reason, healedHp, curedStatus }`, and
**`consumed` is only ever true when the item actually did something** — a wasted
Potion is refused, not spent.

**To add an item:** one entry in `items.js`. **To sell it:** add its id to a
stock list in `src/data/shops.js`. No code either way.

### Shops

```js
emberhollowSupplyPost: {
  id: 'emberhollowSupplyPost',
  name: 'Supply Post',
  greeting: 'Orbs and potions. What will it be?',
  stock: [{ item: 'potion' }, { item: 'basicOrb' }, { item: 'antidote', when: 'someFlag' }],
}
```

An item existing is not the same as it being for sale. Super Potions and the
stronger orbs are real items the player can find, but the starting shelf leaves
them out so the first town cannot flatten the first route. `when` gates a row
behind a story flag.

A shopkeeper opens it with `action: 'shop:emberhollowSupplyPost'`. Every
transaction is atomic: `ShopSystem` takes the money AND gives the goods, or
changes nothing.

### Healing and blacking out

The Mender restores **HP, every move's PP and any status**, for the active party
only — storage is not a free hospital. It works on the existing creatures, so
instance ids, nicknames, levels, experience, moves and met locations survive.
It is free.

Healing also sets the **recovery point**: a map id and a NAMED spawn point on
`GameState.respawn`. Every Mender's Hall does the same, which is all a future
town needs — the blackout code never learns about individual maps.

Losing a battle with `blackoutOnDefeat` set:

1. `floor(money * 0.05)` is taken, once, capped at what the player has
2. the whole party is fully restored
3. the screen fades and the player wakes at the recovery point
4. the bag, story flags, storage, index and creature identities are untouched

`blackoutOnDefeat` defaults to true for wild and trainer battles and false for
practice. A practice defeat instead patches the party up on the spot — free to
lose, but never leaving the player stranded with a fainted team.

### Controls

| Screen | Keys |
|--------|------|
| Bag | Left/Right category · Up/Down choose · Confirm use · Cancel back |
| Choosing a target | Up/Down choose · Confirm use it · Cancel back to the bag |
| Shop | Up/Down choose · Confirm open · Cancel leave |
| Buy / Sell | Up/Down item · Left/Right how many · Confirm agree · Cancel back |

---

## 19. Trainers (Phase 8)

### A trainer is data

```js
// src/data/trainers.js
route1Scout: {
  id: 'route1Scout',           // stable key; also what `defeatedTrainers` records
  name: 'Wren',
  title: 'Pathfinder',         // shown before the name: "Pathfinder Wren"
  rewardMoney: 240,
  party: [{ species: 'nibbit', level: 6 }],   // built by CreatureFactory
  intro: ['You walk like someone with a partner. Let me see it!'],
  outro: ['Ha! Straight down the Cinderpath with you, then.'],
}
```

Their party is `{ species, level, nickname? }` entries built through the ordinary
`createCreature()`, so a trainer's Aether has the same stats, learnset moves and
full PP as a wild one — there is no separate "trainer creature". It is rebuilt
fresh for every battle, so a rematch after a blackout is never fought against a
half-dead team.

**The id is the identity.** Defeat is recorded by id, never by position or map,
so a trainer who is moved in a later update — or who has walked over to
challenge you — stays beaten.

### A trainer NPC is an ordinary NPC

```js
// src/data/maps/route1.js
{
  id: 'route1Scout', name: 'Wren', x: 13, y: 27,
  facing: 'left', sprite: 'villager', movement: 'static',
  trainer: 'route1Scout',       // which trainer this is
  sightRange: 4,                // how far up their facing they watch
  dialogue: [
    { when: 'trainer:route1Scout', pages: ['Straight up the path, then.'] },
    { pages: ['Ready when you are!'], action: 'trainer:route1Scout' },
  ],
}
```

Two fields (`trainer`, `sightRange`) and ordinary dialogue. **To add a trainer:**
one entry in `trainers.js` and one NPC anywhere. No code either way.

### Sight

`SightSystem` is pure geometry — no Phaser, no game state — so every boundary is
a unit test rather than a walk around the map hoping to notice.

- A trainer sees **only along the one direction they face**. No diagonals, no
  peripheral vision, nothing behind them.
- `sightRange: 4` means distances **1, 2, 3 and 4 are seen and 5 is not**.
  Distance 0 is never a sighting.
- **Blockers:** anything solid strictly between the two — walls, trees,
  furniture — and another person standing in the lane. Ground items do **not**
  block: a Potion lying in the grass is not a screen.
- The tile the **player** stands on is never tested. They are standing on it.

### Who challenges, and when

A completed step is offered to three things in this order, and the first to
claim it stops the others:

    exit  →  trainer  →  wild encounter

So a trainer standing in tall grass always wins over the grass, and a doorway
always wins over both.

When several trainers can see the player at once, **exactly one** challenges,
chosen with nothing random: the **nearest**, and on a tie the one whose **id
sorts first**. Everyone else waits until the player walks into their lane. The
same step always produces the same challenger.

A challenge only starts when the moment allows it — not mid-transition, not with
dialogue open, not with a battle or menu running, not while input is locked, and
never from a trainer who is mid-step (their tile and facing are both unreliable
then) or already beaten.

### The approach

1. `this.trainerChallenge` is claimed **first** and held until the battle is
   over. That one field is what stops a second trainer, a second step or an
   impatient key press starting any of this twice.
2. A "!" pops above their head for ~0.6s.
3. They **walk down the lane** one tile at a time through the ordinary movement
   code, stopping **one tile short** — never onto the player. No pathfinding is
   needed: the sighting already proved the line was clear.
4. Both turn to face each other, and the intro plays with the full title on the
   name plate.

Every delayed step re-checks that the challenge is still theirs, so a map change
mid-approach cancels the sequence rather than firing into a dead scene.

### Two ways in, one pipeline

Being spotted and **walking up and talking to them** both end at
`startTrainerBattle()`, because the map file's challenge branch uses the ordinary
`action: 'trainer:<id>'` dialogue seam. One path to get right, not two that can
drift apart.

### The battle

Everything that makes a trainer battle different is one config object from
`createTrainerBattleConfig()`. Nothing downstream checks a name:

| Field | Value | Why |
|-------|-------|-----|
| `canRun` | `false` | you do not walk away from someone who challenged you |
| `allowCapture` | `false` | their Aethers are not yours to catch |
| `awardExperience` | `true` | with the x1.5 trainer multiplier |
| `rewardMoney` | from the trainer | paid once, through `addMoney()` |
| `blackoutOnDefeat` | `true` | an ordinary Phase 7 loss |
| `trainerId` | the id | carried into the result so the win handler knows who |

They send out their creatures in the declared order, one after another, and the
battle ends when their last one faints.

### Winning and losing

**Winning** marks `defeatedTrainers[id]` — but only *after* `BattleScene` has
finished narrating experience, level-ups, new moves and evolutions, so a trainer
is never marked beaten before the win is fully resolved. Then their outro plays
and control returns.

**Losing** is the Phase 7 blackout, unchanged: 5% of your coins, a full heal, and
waking at the last Mender's Hall. The trainer is **not** marked beaten, so they
are still standing there when you walk back up the route.

**A beaten trainer never challenges again.** They are skipped by the sight check
entirely, and walking up to them gets their post-defeat lines instead of a
rematch.

### Post-defeat dialogue is ordinary dialogue

`getDialogueConditions()` folds every beaten trainer into the flags as
`trainer:<id>`, so a map file writes

```js
{ when: 'trainer:route1Scout', pages: ['Straight up the path, then.'] },
```

and **no scene anywhere contains `if (defeatedTrainers[id])`**. It is the same
machinery as `when: 'gotStarter'`.

### Route 1 roster

| Trainer | Where | Party | Coins |
|---------|-------|-------|-------|
| **Pathfinder Wren** | low on the route, watching west | Nibbit L6 | 240 |
| **Grass-Treader Osrin** | the western jog | Grubbit L7, Vinelet L7 | 320 |
| **Warden Aspirant Halla** | by the shut gate | Flittle L8, Emberfly L9 | 420 |

All three watch 4 tiles. The player arrives with a Lv 5 starter against wild
Aethers at 2-6, so the trainers sit just above that and rise as the route does.
Wren is one creature with no type advantage over any starter — a fight you are
meant to win, teaching what the "!" means. Osrin is the first trainer to send out
a replacement. Halla is the last thing before the north.

Clearing all three pays 980 coins — four or five Potions. Useful, not a shopping
spree.

### How the Gym reuses all of this

Phase 9's Gym trainers and the Gym Leader are meant to be exactly this, with a
bigger party: entries in `trainers.js`, NPCs with `trainer:` and `sightRange` in
the Gym map, a `when: 'trainer:<id>'` branch each. The Leader additionally sets
`sigil_verdant` from their post-battle dialogue's `setFlags`, which is ordinary
dialogue too. Nothing in `TrainerSystem`, `SightSystem` or `WorldScene` should
need to change.

### Debug

```js
debug.trainers()               // every trainer, their party, and who is beaten
debug.trainerBattle('route1Scout')  // start one from anywhere
debug.beatTrainer('route1Scout')    // mark beaten (false to un-beat)
debug.resetTrainers()          // clear every defeat
debug.sight()                  // what each trainer on this map can see right now
```

---

## 20. Thistlewood and the Verdant Hall (Phase 9)

The first-badge vertical slice: the road north opens, the second town exists,
and the region's first Beacon Hall can be beaten.

### Route 1's north gate

The gate has been shut since Phase 2 with a warden who explained why. It opens
on exactly the condition he always gave — **you are a Warden walking with a
partner** — and the conversation itself is what lifts the bar:

```js
{ when: 'gotStarter', setFlags: ['route1GateOpen'], pages: [ ...he opens it... ] }
```

No errand, no waiting, no extra prerequisite. `route1GateOpen` is a story flag,
the gate is a **flag-driven barrier**, and a flag is idempotent — so the gate
cannot open twice and cannot fall out of step with the story.

### Barriers — one mechanism for gates and hedges

A barrier is a set of tiles that is solid only some of the time. A map declares
them; `src/systems/PuzzleSystem.js` decides which are closed; `TileMap` turns
that into collision; `MapRenderer` draws it.

```js
barriers: [
  { id: 'route1Gate', name: 'the north gate', tile: 'G',
    tiles: [[10, 1], [11, 1]], closed: true, openWhen: 'route1GateOpen' },
],
switches: [
  { id: 'rootWest', name: 'the west root', x: 2, y: 5,
    retract: 'hedgeEast', extend: 'hedgeNorth' },
],
```

| Field | Meaning |
|-------|---------|
| `tile` | an ordinary character from `tiles.js` — what the barrier looks like and blocks like while closed |
| `tiles` | which tiles it covers. The map source underneath must be **walkable**, because that is what you walk through when it opens |
| `closed` | how it starts |
| `openWhen` | a condition that forces it open — a flag (`route1GateOpen`) or a Sigil (`badge:verdantSigil`) |

**Two kinds, and a barrier may be both.**

- **Flag-driven** (`openWhen`, no switch): its state is a pure function of the
  condition. Nothing is stored, so nothing can drift. Route 1's gate.
- **Switch-driven** (a switch retracts or extends it): the position is saved in
  `gameState.puzzles[mapId]` as plain booleans.
- **Both**: the Verdant Hall's hedges are moved by switches *and* forced open
  for good once the Sigil is won. An `openWhen` that holds always wins.

**Why the state lives in `TileMap`.** Everything already asks the map whether a
tile is walkable — the player, every NPC, the trainer sight lines, the
interaction check. Putting barriers there means one answer serves all of them,
and a trainer can no more see through a closed hedge than the player can walk
through it. A barrier's sprite is shown or hidden from *the same* call that
decides collision, so the picture and the rule cannot disagree.

**A hedge never closes on anybody.** `pressSwitch()` takes the positions of the
player and every NPC and refuses — changing nothing at all — if extending a
barrier would cover one. The maps are also validated so that no NPC, spawn
point or switch ever sits on a barrier tile, which makes that guard a safety
net rather than a game rule.

### The Verdant Hall puzzle

Exactly the design this document has always described: **three root switches,
each retracting one hedge wall and extending another, in the right order.**

```
                 Fern
                  ▲
              hedgeNorth                 walkway: west side, east side,
   ┌──────────────┼──────────────┐       and the south — the two sides
   │      the central lane       │       meet ONLY along the south
   │              │              │
 hedgeWest    east corridor  hedgeEast
   │              │              │
   └── west pocket ┘             │
   ────────── south walkway ─────┘
                door
```

| Switch | Where | Retracts | Extends |
|--------|-------|----------|---------|
| `rootSouth` | by the door, free | `hedgeWest` | `hedgeEast` |
| `rootWest` | past Gardener Teal | `hedgeEast` | `hedgeNorth` |
| `rootEast` | past Gardener Bracken | `hedgeNorth` | `hedgeWest` |

Everything starts shut. Reaching Fern needs **`hedgeEast` and `hedgeNorth` open
at once**, which is `rootWest` then `rootEast` — and each of those sits past a
Gardener's sight lane, so the fights are the puzzle's price rather than an
obstacle bolted on beside it. `rootSouth` is the free one by the door: it opens
the west pocket and its Super Potion, and teaches what a switch does before
anything is riding on it.

Pressing a switch does **not** open a dialogue box. A hedge animates and a short
note fades in ("the east hedge draws back — the north hedge grows across"), so
experimenting stays cheap.

**The player can never be trapped, and this is proved rather than asserted.**
Every switch stands on the walkway and no barrier ever does, so whatever state
the hedges are in, the walkway — which contains the door and all three switches
— is intact. `tests/puzzle.test.js` walks **every configuration any order of
presses can reach** and checks that the door and all three switches are
reachable from each one, and that Fern is reachable from at least one. The reset
root in the porch is a convenience for a tangled player, not a rescue.

**Persistence.** Switch positions are saved per map on `GameState`, so leaving
and re-entering the Hall — or blacking out inside it — finds the hedges exactly
as they were left. Winning the Sigil sets `openWhen: 'badge:verdantSigil'` on
all three, and they stand open for good.

### Precedence — what one step can trigger

    exit  →  root switch  →  trainer  →  wild encounter

The switch claims the step, so pressing one and being spotted can never collide.

### The Hall's roster

| Who | Class | Party | Coins |
|-----|-------|-------|-------|
| **Teal** | Gardener | Vinelet 9, Puffcap 9 | 480 |
| **Bracken** | Gardener | Grubbit 9, Vinelet 10 | 520 |
| **Fern** | Leader | Vinelet 11, Puffcap 11, **Ivorn 13** (ace) | 1200 |

Both Gardeners stand in dead-end alcoves off the walkway, looking straight
across it. That way neither can ever become a wall — an NPC in a corridor is a
wall — while their sight lanes still cover both walkway columns. Fern has no
sight range at all: you come to her.

### First-Gym balance

Measured over hundreds of seeded battles in `tests/gymBalance.test.js`, driven
by a stand-in for a reasonable player (best move by type, next creature when one
faints, a potion when badly hurt):

| Team at level 13 | Beats Fern |
|------------------|-----------|
| Fire starter + a Route 1 Flittle | ~100% |
| Water starter + a Route 1 Flittle | ~67% |
| Grass starter + a Route 1 Flittle | ~100% |
| Fire starter alone | ~50%, 100% by level 15 |
| Water starter alone | **0%**, at any sensible level |

Every creature Fern fields is Grass or Grass/Poison. Fire walks it. Water is
resisted outright and Drizzle carries no coverage, so a solo Water starter
cannot win — **deliberately**. That is what a type-themed Hall is for, and the
game says so three times over: Mose ("something with wings would do well in
there"), Hesper ("bring something that can hurt a hedge") and the Hall's own
theme. Flittle is the second most common Aether on Route 1, knows Peck (Flying,
2x on every creature in the Hall) from level 1, has a catch rate of 255, and the
player is handed two orbs on the way north. The answer is cheap, early and
signposted — so the Hall asks for a **team**, never for a grind.

Clearing the Hall pays 2200 coins: four Super Potions and a Great Orb.

### Sigils

"Sigil" is this world's word for a badge, and the game says Sigil everywhere.

```js
// src/data/badges.js
verdantSigil: {
  id: 'verdantSigil', name: 'Verdant Sigil', order: 1,
  hall: 'The Verdant Hall', town: 'Thistlewood', leader: 'Fern',
  leaderTrainerId: 'verdantLeaderFern',
  description: '...', icon: 'leaf', color: 0x6fbf73,
}
```

All three planned Halls have an entry from the first game, because the Sigil
screen shows three slots and a locked slot the player can see is a promise the
game intends to keep. An unbuilt Hall says so honestly with
`leaderTrainerId: null`.

**A Leader is an ordinary Phase 8 trainer with one extra field**, `badge`.
Winning marks them defeated, plays their outro, and *then* awards the Sigil —
after experience, level-ups, new moves and evolutions are all resolved. Losing
awards nothing and marks nothing. `awardBadge()` refuses a duplicate, so even a
doubled call cannot produce two. Nothing in `BattleScene` or `WorldScene` names
Fern.

**No story flag stands beside it.** A Sigil reads as a condition, `badge:<id>`,
exactly the way a beaten trainer reads as `trainer:<id>`:

```js
{ when: 'badge:verdantSigil', pages: ['A Sigil already! ...'] },
```

`ProgressionSystem.getWorldConditions()` folds flags, beaten trainers and earned
Sigils into one set, and dialogue, barriers and the menu all read it. That is
why the design's old note about a `sigil_verdant` flag is now redundant: the
Sigil itself answers the question, in one record rather than two that could
disagree.

### What the world does about it

The Gate Warden, Hall Keeper Sorrel, Fern herself, Bryn, Mose, Hesper, Pell,
Nan Thistle and the Mender's Hall challenger all have `when: 'badge:verdantSigil'`
branches. Nine reactions, all ordinary conditional dialogue, no scene changes.

### The Thornway

Thistlewood's north-east road climbs to a shut gate with the Thornway — and
Route 2 — behind it. The road beyond is visible, a keeper explains the bramble
clearance, and a sign says CLOSED. It is a barrier with
`openWhen: 'thornwayOpen'`, a flag nothing in this build sets: the seam for
opening it later is already there and costs no code.

### How the next Hall reuses all of this

Tidewatch's Tidal Hall should be: a map with hedges swapped for whatever suits
it, barriers and switches in its own data, two trainers and a Leader in
`trainers.js`, and `badge: 'tidalSigil'` on the Leader. Nothing in
`PuzzleSystem`, `BadgeSystem`, `TrainerSystem` or `WorldScene` should need to
change. If it does, something here was built wrong.

### Debug

```js
debug.gates()                  // barriers and switches on this map
debug.toggle('rootWest')       // press a root switch from anywhere
debug.resetPuzzle()            // put this map back how it was found
debug.puzzleState('verdantHall')
debug.sigils()                 // every Sigil and whether it is earned
debug.sigil('verdantSigil')    // award one; pass false to take it back
```
