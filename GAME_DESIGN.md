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

**Built so far (Phase 11):** Emberhollow Town and its four interiors, Route 1,
Thistlewood with its Mender's Hall, Supply Post, a cottage and the Verdant Hall
(the vertical slice, locations 1-3), and now **Route 2 — the Thornway**
(location 4), up to the mouth of Mistvault Cavern.

Mistvault is held back the same way Route 2 was before it — the cavern is
visible at the top of the Thornway, behind a Warden cordon, with a Warden and a
sign that explain why, rather than an invisible wall or an empty cave. See
section 22.

### Region flavour notes
- Emberhollow: warm ochre + slate, a small quarry town built on a dormant ember vent.
- Cinderpath: ash-grey soil, hardy green grass, low stone walls.
- Thistlewood: overgrown timber town, everything half-swallowed by hedges.
- The Thornway: a bramble-cut road climbing from thicket onto bare scree, with
  Mistvault's dark mouth at the top.

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

### Route 2 — The Thornway — as built (Phase 11)
30x50, running north from Thistlewood's Thornway gate — bigger than Route 1
(660 tiles) at 1500, without being a slog. South to north: a **bramble
cutting** with the bramble crew and a trainer, a grassy pocket to the west and
two trails east to a **dry spring** (a loop); a **thicket** of tall grass where
the road **forks** round a bramble island (one gap, one item inside) and meets
itself again, a trainer on each fork; **the Brow**, where the trees stop; a
**scree slope** — the route's second habitat — with a trainer on a gravel spur
and items in the far corners; a one-tile **gully** straight into Kestrel's
sight; and the **landing** below Mistvault Cavern, behind a Warden cordon.
Four trainers, Kestrel, three other people, four signs, six ground items. Full
detail in section 22.

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

### Added in Phase 11 (Route 2): 7 species — 34 in all

| # | Line | Types | Where |
|---|------|-------|-------|
| 28-29 | Jabbit → Brawnhare (24) | Fighting | Route 2 thicket and scree |
| 30-31 | Glimmote → Brambelle (22) | Fairy, then Fairy/Grass | Route 2 thicket |
| 32-33 | Delvit → Ironvole (26) | Ground, then Ground/Steel | Route 2 scree |
| 34 | Burrzap | Electric/Grass | Route 2 thicket (rare) |

Each fills a gap the first 27 left: the first real **Fighting** family, the
first **Fairy** anything (the type chart always had it), a Ground line that
grows into Steel, and a dual type nothing else has. Stat totals sit with the
other route families (about 270 first stage, 400 evolved); Burrzap is 342.

**Now 34 species: 13 evolutionary families and 5 single-stage species,
15 of 18 types** (Ice, Psychic and Dragon are still held back). The full-game
target of 30+ creatures is met.

---

## 4b. Moves — 61 built

27 physical, 18 special, 16 status, across 15 types. (56 until Phase 11, which
added five, each for a new species that needed it: **Hop Kick** and **Flurry
Jabs** for the Fighting family, **Glimmer** and **Moonpetal** for the first
Fairy creatures, **Burrow Strike** for a Ground attack between Mud Slap's 30
and Quake Stomp's 80. All use existing effect kinds — no engine change.) Effects are declared as
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
  → Receive Capture Orbs
  → Route 1 (Cinderpath): wild Aethers, 3 trainers
  → Thistlewood: shop, mender, Beacon Hall #1
  → Verdant Beacon Hall: 2 trainers + puzzle + Leader Fern
  → Earn the Verdant Sigil  ← END OF VERTICAL SLICE
  → Kestrel at the Thornway gate (rival battle #1) — opens Route 2
  → Route 2 (the Thornway): 4 trainers, Kestrel again below Mistvault
  → Mistvault Cavern cordoned off  ← END OF PHASE 11
  → Mistvault Cavern, Hollow Vane event
  → Tidewatch Harbor: Beacon Hall #2 (Tidal)
  → Route 3, Voltspire City: Beacon Hall #3 (Storm)
  → The Aerie: Champion gauntlet
```

### Level pacing
| Milestone | Expected player level |
|-----------|----------------------|
| Route 1 wild Aethers | 3–6 |
| Route 1 trainers | 5–7 |
| **Beacon Hall 1 (Fern)** | **10–13** |
| Rival battle #1 — Thornway gate (Kestrel's ace L13) | 13–14 *(measured)* |
| Route 2 wild Aethers / trainers | 13–18 / 13–16 |
| Rival battle #2 — below Mistvault (Kestrel's ace L16) | 15–17 *(measured)* |

The planned pacing had Route 2 at 14-18 and Hall 2 at 18-22. Walking Route 2
through the real engine (tests/helpers/routeWalk.js) puts a player's starter
at 15-17 by the top: the experience economy is slower than the plan assumed,
so Route 2 is pitched at what players really have, and the rows below are
still plans to be measured the same way when they are built.

| Planned | Expected player level |
|---------|----------------------|
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
- **Unlocks:** the Thornway gate to Route 2 — once the Sigil is held, Kestrel
  is waiting in front of it, and beating them sets `thornwayOpen` (Phase 11).

---

## 8. The Rival

**Name:** Kestrel. Confident, competitive, never actually mean — treats the player as
the one person worth beating. **Pronouns: they/them** (nothing in the canon
gave any, so the game uses the neutral default rather than guessing).

**As built (Phase 11)** — two meetings, both on the ordinary trainer pipeline:

| Meeting | Where | When | Team |
|---------|-------|------|------|
| 1 | Thistlewood, in front of the Thornway gate | once the Verdant Sigil is held | Flittle L12, **starter L13** |
| 2 | Route 2, the gully below Mistvault | on the way to the cordon | Gustwing L14, Grubbit L13, **evolved starter L16** |
| 3+ | later routes / The Aerie | Phase 12 onwards | grows to a full 6 |

The **original plan** had three appearances — Emberhollow after the starter
(L5), Route 1's exit (starter L9 + Flittle L8) and after Hall 1 (evolved
starter L15 + Gustwing L14 + Grubbit L13). The first two were never built, so
the first meeting the player actually has is the plan's third — which is why
Kestrel introduces themself at the gate. Its planned team won **0%** of the
time for every starter against a real post-Fern team, so the gate fight took
the SHAPE of the plan's appearance 2 (starter + Flittle) at post-Fern levels,
and the plan's appearance 3 (evolved starter + Gustwing + Grubbit) became the
second meeting on Route 2, where the species data evolves the starter. Section
22 has the numbers.

**Kestrel's starter** is always the one strong against the player's (section
3): Fire → Water, Water → Grass, Grass → Fire. One mapping in
`src/data/rivals.js` decides it.

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
| `thornwayOpen` | Beating Kestrel at the Thornway gate (`setFlags` on the trainer) | The Thornway gate opens, for good; the keeper and the sign change |
| `pickedUpRoute2Salve`, `…UltraOrb`, `…IslandPotion`, `…Rouser`, `…GreatOrbs`, `…ScreePotion` | Taking Route 2's six ground items | Each stays taken |
| `mistvaultOpen` | *nothing yet* | Would lift the Wardens' cordon across Mistvault Cavern. Reserved for Phase 12 |

The player's **starter** is not a flag either — it is `GameState.starter`
(Phase 11) — but it is readable as one: `starter:pyrret`, `starter:drizzle` or
`starter:sproutle`. Kestrel's lines branch on it.

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
GameState, and it is saved and loaded in order (Phase 10). It is a *summary*:
you can see what is waiting, not move it back.

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

Cancel opens it over a paused overworld. Party, Bag, Index, Sigils, Storage,
Save, Settings, Close (Bag arrived in Phase 7, Sigils in Phase 9, Save and
Settings in Phase 10).

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
and re-entering the Hall — or blacking out inside it, or closing the game and
coming back (Phase 10) — finds the hedges exactly as they were left. Winning the Sigil sets `openWhen: 'badge:verdantSigil'` on
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

**Re-measured in Phase 11.** The driver behind these numbers had a bug: it
read `entry.power` off a creature's move entry, which only holds
`{ id, pp, maxPp }`, so it never found a damaging move and always used the
FIRST one. With the fixed driver (60 seeds): Fire + Flittle **100%**, Water +
Flittle **43%** (85% two levels later), Grass + Flittle **100%**, Fire alone
**98%** at 13, Water alone **0%** at 13, 15 and 17. The guard rails in
`tests/gymBalance.test.js` all still hold; Water + Flittle at 13 now sits just
above its 40% bar, which is worth watching if Fern is ever touched.

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

Eight NPCs have `when: 'badge:verdantSigil'` branches — the Gate Warden, Hall
Keeper Sorrel, Bryn, Mose, Hesper, Pell, Nan Thistle and the challenger waiting
at the Mender's Hall. Fern makes nine, on `when: 'trainer:verdantLeaderFern'`:
what must stop her offering another fight is having been BEATEN, and a reward
should never be the thing that closes a rematch.

Nine reactions, all ordinary conditional dialogue, and not one line of scene
code.

### The Thornway

Thistlewood's north-east road climbs to a gate with the Thornway — and Route 2
— behind it. It is a barrier with `openWhen: 'thornwayOpen'`. Until Phase 11
nothing set that flag; now beating Kestrel, who waits in front of the gate once
the Verdant Sigil is held, sets it. See section 22.

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

---

## 21. Saving, loading and settings (Phase 10)

A game you can close is a game you can play. Phase 10 makes the first-badge
slice survive a closed tab: everything the player has done comes back exactly,
from any safe moment, and nothing about the save system can lose a creature,
duplicate an item or strand the player in a wall.

### What is saved — every piece of state, sorted

Before any code was written, every piece of state in the game was put in one of
four boxes. The save system is simply that table, enforced.

| Kind | What | Where it lives |
|------|------|----------------|
| **Canonical — saved** | player name; map, tile and facing; recovery point; coins; party and storage (each creature's id, species, nickname, level, experience, current HP, moves and their PP, status, where it was met); the bag; Sigils; story flags; beaten trainers; switch positions per map; seen and caught; play time; start date | `gameState`, written by `src/save/SaveSchema.js` |
| **Derived — rebuilt on load** | a creature's stats; each move's maximum PP; which gates and hedges are shut; where NPCs stand; whether a ground item is still there; the place name shown on a save slot | worked out from the canonical state, so it can never disagree with it |
| **Preferences — their own key** | text speed, master volume | `src/core/Settings.js`, stored apart from every save |
| **Never saved** | anything on screen: sprites, tweens, timers, keys, an open dialogue box, a menu cursor, a battle in progress (stat stages, sleep counters), a trainer's "!" or the tile they walked to, the encounter cooldown | the running scenes, and thrown away |

Leaving the derived state out is deliberate. A save that stored both a level
and the stats for that level could hold stats that disagree with the level —
after a balance change, after a hand edit, after a bug. Storing only the level
means there is one source of truth, and a balance change reaches old saves
without a migration.

### The save file

```js
{
  game: 'aetheria-chronicles',     // never mistake some other JSON for a save
  version: 3,                      // the shape of everything below (Phase 11)
  metadata: {                      // what the Continue screen shows
    source: 'manual', savedAt, playerName, mapId, locationName,
    badgeCount, partySize, caughtCount, playTimeMs, lead: { speciesId, name, level },
  },
  gameState: { ...the canonical state above... },
}
```

The serialiser picks every field **by name**; it never copies an object
wholesale. That is what makes "no Phaser object is ever saved" a guarantee
rather than a hope. Keys are sorted, so the same facts always produce the same
text. A save with eight creatures, a bag, a Sigil and a half-solved Hall is
about 3 KB and takes well under a millisecond to write or read.

| Storage key | Holds |
|-------------|-------|
| `aetheria-chronicles/save/manual` | the Manual Save |
| `aetheria-chronicles/save/autosave` | the Autosave |
| `aetheria-chronicles/settings` | text speed and volume |

Nothing else in the game touches `localStorage` — `src/save/SaveStorage.js` is
the only file that does. If the browser refuses storage outright (a privacy
mode, a page opened from disk), the game still runs, keeps saves in memory, and
the title screen says progress will last only until the page closes.

### Two slots

- **Manual** — written only when the player chooses Save in the pause menu.
- **Autosave** — written by the game at safe moments. It never touches the
  manual slot, and a manual save never touches it.

Each slot is judged on its own — *empty*, *valid*, *corrupt* or *incompatible*
(from a newer version) — so a damaged manual save never hides a good autosave.

**A save is all or nothing.** The whole file is built, turned into text, and
checked by parsing it back and validating it exactly as a load would. Only
then is it written, in one `setItem` call — which either replaces the old value
completely or throws (storage full, storage refused) and leaves it exactly
where it was. The old save is never removed first. A state that would not load
is never written at all.

### When the game autosaves — and when it never does

A checkpoint *asks* for an autosave; nothing saves on the spot. The save is
written on the first frame the world is safe:

| Checkpoint | Why it matters |
|------------|----------------|
| arriving on a map | through a door, along a road, waking after a blackout |
| a battle fully over | experience, captures, a beaten trainer, a Sigil, prize money |
| healing at a Mender's Hall | the recovery point has moved |
| story flags set by a conversation | Route 1's gate opening |
| leaving a shop counter | coins and the bag changed hands |
| choosing a starter | the first real progress |
| picking up a ground item | so it is never lying there again after a reload |
| a trainer win that sets story flags (Phase 11) | Kestrel at the gate: labelled `story`, still ONE autosave |

**Never** mid-battle, mid-dialogue, mid-map-change, mid-step, while a trainer
is walking over, while a Sigil is on screen, during a blackout, during the
starter chooser, or with the player not in control (`WorldScene.isSafeToSave`).
There is one pending slot, so a battle, the trainer's outro and the Sigil
award together make **exactly one** autosave.

Two arrivals are deliberately **not** checkpoints: straight after Continue (the
game was just loaded — it is already saved, and saving again could replace a
newer autosave with the older manual save the player happened to pick), and
the start of a New Game (it has done nothing worth replacing the previous
game's autosave with yet; the first door does).

**The indicator** is a small "Autosaved" note in the top-right corner that
fades in and out over about a second and a half. It never takes input and never
pauses anything. A failed autosave says "Autosave failed" the same way.

The autosave will **not** overwrite a save from a newer version of the game.
The player is told once per session — "Autosave off: slot holds a newer save" —
and can still save manually.

### Continue

| What is saved | What Continue does |
|---------------|--------------------|
| nothing usable | shown, greyed out |
| one valid save, the other slot empty | loads it at once |
| two valid saves | opens the chooser, the more recent highlighted |
| a valid save and a damaged/newer one | opens the chooser, so the problem can be explained |

The chooser shows each slot's place ("Thistlewood — The Verdant Hall"), lead
creature and level, Sigils, catches, play time and when it was saved. A tie in
time goes to the manual save. Damaged and newer-version slots are listed but
cannot be highlighted, and are also named under the title menu, so a greyed
Continue always has a reason on screen.

### Loading

    read → parse → migrate → validate → build a fresh state → find a safe tile
         → only now: make it the live game → start the map

Nothing touches the running game until every step has succeeded. A failure
shows the reason and stays on the title screen with nothing changed.

The map is then built in a fixed order: **switch positions and flags → gates
and hedges (collision and picture, from one call) → every NPC on their tile →
the player**. The saved tile must be walkable *with the hedges as saved*, not
an NPC's home tile (a trainer who had walked over to challenge, or a villager
who had wandered, is back home after a load) and not an uncollected item's
tile. If it fails, the player goes to the first safe choice of: that map's
spawn point → the recovery point → the start of the game. Each fallback is
logged; none can put the player in a wall.

**Creature identity.** Every creature keeps its id through any number of saves
and loads. After a load, every loaded id is *reserved*, so a creature caught
later can never be given an id that is already taken — even though the id
counter restarts with the page. `giveCreature()` also re-ids anything arriving
with an id the player already owns.

### Damage: repair or refuse

A save is untrusted input. `SaveValidator.js` builds a brand new state from it
and copies across only what checks out.

| Refused — the save cannot be loaded | Repaired — loads, with a warning |
|---|---|
| not JSON, not an object, not this game's | a collection missing entirely (older saves) |
| a version that is not a number | a number out of range: clamped (negative coins → 0) |
| a collection of the wrong type (party not a list, coins not a number) | an id for content that does not exist: dropped |
| a creature whose species or level cannot be read | a missing or duplicated creature id: a fresh one issued, both creatures kept |
| | a position off the map, or a facing that is not a direction |
| | a creature with no usable moves: given its natural ones |

The line is simple: refuse when we can no longer tell what the player *had*;
repair when the intent is obvious and nothing real is lost. Every repair is
reported. A damaged save is **never deleted** by the game — it stays until the
player saves over it.

A save from a **newer** version is refused with exactly: *"This save was
created by a newer version of the game and cannot be loaded here."* It is never
migrated down and never overwritten automatically.

### Migrations

`SaveMigrations.js` holds one function per version step. Loading a version 1
save runs `1→2` then `2→3`; a version 2 (Phase 10) save runs `2→3`. Each
migration is pure — a copy in, a new object out — and has its own tests.

Version 1 is the GameState of Phases 1–9, which lived only in memory. Its
migration wraps it in the envelope, moves settings out, drops the derived
caches, and fills in anything an early phase lacked (storage, the Index, the
recovery point, beaten trainers, puzzles, Sigils). `legacyFixtures.js` holds a
hand-built version 1 save for the end of Phases 2, 3, 6, 7, 8 and 9; every one
loads.

**Version 3 (Phase 11)** adds one field, `starter` — which starter the player
took — because Kestrel's team depends on it and nothing had recorded it. The
`2→3` step recovers it from the creature met at the **Warden's Lodge**
(party or storage, evolved or not); a save with no such creature records
`null`, and the rival then warns and uses a fallback rather than refusing the
battle. `tests/fixtures/phase10-saves.json` holds two save files written by
the real Phase 10 build (commit `638279c`, its own `createSaveFile()`); both
migrate, load, keep their Continue summary, come back on their saved tile, and
play on with the right Kestrel. Nothing else in Phase 11 needed a new field:
beaten rivals live in `defeatedTrainers`, the Thornway in `flags`.

### Settings

| Setting | Values | Default |
|---------|--------|---------|
| Text speed | Slow (55 ms a letter), Normal (30), Fast (12), Instant | Normal |
| Master volume | 0 to 100, in steps of 10 | 80 |

Settings belong to the **player**, not to a playthrough. They are stored under
their own key, load before the title screen appears, survive a New Game, and
are never written into, or read from, a save — loading an old save cannot put
someone's volume back. One Settings panel serves both the title screen and the
pause menu. Every change applies and is stored at once: the text speed is read
as each page of dialogue starts, and a sample line types itself out at the
chosen speed. The volume drives Phaser's sound manager (`game.sound.volume`,
0–1). There is no music or sound yet, so for now that is all it does — when
audio arrives, it is already at the player's chosen volume.

### New Game with a save

New Game asks first, defaulting to **Back**, and says plainly: nothing is
deleted, the Manual Save stays until the player saves over it, and Continue can
still load it; the Autosave follows the new game once it next autosaves.

### The standing rule

**Any future persistent gameplay field added to GameState must be added to
serialization, validation/defaults, migration where required, and round-trip
tests.** `tests/saveSchema.test.js` compares GameState's fields with the
serialiser's list and fails the build until a new field has been given a fate.

### Debug

```js
debug.saves()                     // both slots: status, place, time, problems
debug.save('manual')              // force a save into a slot ('autosave' too)
debug.dumpSave('autosave')        // the raw stored text
debug.clearSave('manual', true)   // DESTRUCTIVE — needs the true; 'all' for both
debug.injectLegacySave('phase9')  // put a version 1 save in a slot
debug.corruptSave('manual', 'json')  // json, root, version, future, party,
                                     // species, wall, duplicateIds
debug.saveVersion()               // 3
debug.settings({ textSpeed: 'fast' })
```

---

## 22. Kestrel and Route 2 — the Thornway (Phase 11)

Phase 11 is the first step past the vertical slice: the rival, the road that
opens behind the Verdant Sigil, and the honest end of it at Mistvault Cavern.

### The rival is an ordinary trainer

There is no rival scene, no rival battle code and no rival save field. A
meeting with Kestrel is **one entry in `src/data/trainers.js`**, fought through
the Phase 8 pipeline — spotted or spoken to, the "!", the walk over, the intro,
the battle, the outro — with five optional fields that any trainer may use:

| Field | Meaning |
|-------|---------|
| `rival: 'kestrel'`, `stage: 1` | which rival, which meeting (1, 2, 3 … with no gaps — tested) |
| `requires: 'badge:verdantSigil'` | a world condition that must hold; the map's NPC uses the same one as `presentWhen` |
| `setFlags: ['thornwayOpen']` | story flags a WIN sets, in the same pure call that marks the trainer beaten (`recordTrainerVictory`) |
| `victoryLines: [...]` | what they say when they beat the player — before the ordinary blackout |
| party entry `{ rivalStarter: true, level }` | the rival's starter, resolved per player at battle time |

`intro`, `outro` and `victoryLines` may be plain lines or **conditional
branches**, like any dialogue (section 12) — Kestrel's intro branches on
`starter:<id>` to name the right starter.

**The rival's starter** is decided by ONE mapping, `RIVALS.kestrel.starterFor`
in `src/data/rivals.js`: player Fire → Kestrel Water, Water → Grass,
Grass → Fire. `RivalSystem.resolvePartyEntry` looks up the player's starter,
takes the counter's family base, and walks its evolution chain as far as the
entry's level allows — so the species data alone decides that Kestrel's
Drizzle is a Puddlurk at 16. If the player's starter cannot be told (a
damaged save), Kestrel warns in the console and uses `fallbackStarter`
rather than refusing the fight.

### Where Kestrel stands

A map NPC with `trainer: 'kestrelThornway'` and two presence fields
(`src/systems/NpcPresence.js`):

- `presentWhen: 'badge:verdantSigil'` — there only once the fight is allowed
- `absentWhen: 'trainer:kestrelThornway'` — gone for good once beaten

Both read the same world conditions as dialogue, and the save loader asks the
same question, so a player saved on Kestrel's tile is moved off it only while
Kestrel is really there. Two more optional fields say what a beaten trainer
does next: `exitAfterDefeat: { direction, steps }` (walk off and fade — steps
counted from their own tile, so a trainer who walked over to challenge walks
back first) and `returnAfterDefeat: true` (walk back to their post — Kestrel in
Route 2's one-tile gully, who would otherwise block it). Talking to Kestrel
says exactly what being spotted does: the map reuses the trainer's own intro
branches, each with `action: 'trainer:<id>'`.

### Meeting 1 — the Thornway gate

| | |
|--|--|
| Where | Thistlewood (26,5), in the western lane of the gate road, facing down it (sight 5) |
| Needs | the Verdant Sigil |
| Team | Flittle L12, then Kestrel's starter L13 (Drizzle / Sproutle / Pyrret) |
| Pays | 960 coins |
| Win | `thornwayOpen` is set; the gate opens while the player watches; Kestrel walks back up the lane, through the gate and away; one autosave (`story`) |
| Loss | Kestrel: *"Ha! One step ahead. Like always."*, then the ordinary blackout. Nothing is recorded; Kestrel is still at the gate |

The Thornway needs **both** the Sigil and the win: Kestrel is only there with
the Sigil, and only the win opens the gate. Pell the keeper sends a new player
to the Hall, points a Sigil-holder at Kestrel, and says the road is open once
it is; the sign changes with the flag.

### Meeting 2 — below Mistvault

| | |
|--|--|
| Where | Route 2 (14,4), at the top of the one-tile gully, facing down it (sight 5) |
| Needs | meeting 1 (always true on Route 2) |
| Team | Gustwing L14, Grubbit L13, then Kestrel's **evolved** starter L16 (Puddlurk / Bramblit / Cindraw) |
| Pays | 1000 coins |
| Win | no flags — Mistvault stays shut either way. Kestrel walks back to the landing and stays there, with new lines; the Warden has heard them arguing |
| Loss | Kestrel: *"Ha! That makes it one each."*, then the ordinary blackout |

### Balance — measured, not guessed

`tests/rivalBalance.test.js` and `tests/route2.test.js` play real battles
through the engine, seeded, with the shared sensible-player driver
(`tests/helpers/battleSim.js`). `tests/helpers/routeWalk.js` WALKS Route 2 with
a post-Fern team — Kestrel, wild battles from the route's own tables, every
trainer — letting the engine award the experience, so "the levels a player
has" is a measurement.

Meeting 1, 60 seeds, Fire / Water / Grass:

| Player's team | Win rate |
|---------------|----------|
| starter 14 + Flittle 13 (straight after Fern) | 52% / 100% / 70% |
| one level higher | 83% / 100% / 100% |
| plus a third Route 1 capture | 100% / 100% / 98% |
| no potions | 30% / 100% / 10% |
| the starter alone | 0% / 0% / 0% |

Meeting 2, against the team the walk produces:

| | Fire | Water | Grass |
|--|------|-------|-------|
| with the Route 2 catch the road points at | 87% (Zaplet), 100% (Vinelet) | 97% | 97% (Delvit), 100% (Pebblit) |
| with nothing new | 0% | 95% | 2% |

Like Fern for a lone Water starter, Kestrel's evolved counter asks Fire and
Grass players for a second type — and Route 2 hands it to them on the way:
Maren names Zaplet and Vinelet for a Fire player, Tamsin names Delvit and
Pebblit against anything fiery. A Water player's Flittle already answers
Bramblit (they paid for that at Fern). Every ordinary Route 2 trainer falls
first time for every starter, down either fork, with or without a catch — with
one exception: a Fire player with nothing new needs about three goes at
Dunmore's Delvit. (`tests/route2.test.js` fails any trainer that takes more
than four.)

**What was changed to get here.** The plan's evolved-starter team at the gate
won 0% for everyone; three first stages led by the starter still gave a Fire
player 3%. Route 2's first draft (trainers at 15-17, a Gustwing-led
Birdwatcher, a Rock/Ground Scree-Walker) was a wall — the Birdwatcher was
never beaten by a Grass player in 20 tries. The walk showed players top out
around 15-17, so the trainers came down to 13-16 and the two type walls were
rebuilt (Tamsin became a Lookout with a Zaplet; Dunmore fields an Umbrat).

### Route 2 — what is on it

**Name:** Route 2 — The Thornway. **Connects:** Thistlewood (south, through
the gate) ↔ Mistvault Cavern (north, cordoned). **Size:** 30x50.

| Zone | Rows | What is there |
|------|------|---------------|
| The cutting | 38-49 | the road from Thistlewood, Ansel of the bramble crew, **Hollis** (Bramble-Cutter), a west pocket of grass, two trails to the dry spring |
| The dry spring | 33-38 | a cracked basin, **Tobiah**, the survey stake, an Ultra Orb |
| The thicket | 21-37 | tall grass; the road forks round a bramble island; **Maren** (Forager) on the west fork, **Tamsin** (Lookout) on the east |
| The Brow | 20 | where the trees stop — a sign |
| The scree | 10-19 | the second habitat; **Dunmore** (Scree-Walker) on a gravel spur |
| The gully | 4-9 | one tile wide, all in Kestrel's sight |
| The landing | 0-3 | Mistvault's mouth, the cordon, **Warden Corran**, a sign |

**Trainers** (2 creatures each):

| Trainer | Team | Pays |
|---------|------|------|
| Bramble-Cutter Hollis | Jabbit 13, Vinelet 14 | 540 |
| Forager Maren | Glimmote 14, Puffcap 14 | 580 |
| Lookout Tamsin | Flittle 14, Zaplet 14 | 600 |
| Scree-Walker Dunmore | Delvit 15, Umbrat 15 | 680 |

**Wild Aethers** — two habitats on one map. `encounters.byTerrain` (new in
Phase 11) lets a map roll a different table on particular encounter tiles;
the rate and cooldown are shared.

| `route2Thicket` (tall grass) | Lv | Weight | | `route2Scree` (scree) | Lv | Weight |
|---|---|---|---|---|---|---|
| Jabbit | 13-16 | 24 | | Delvit | 14-17 | 28 |
| Glimmote | 13-15 | 18 | | Pebblit | 14-17 | 24 |
| Flittle | 14-16 | 16 | | Jabbit | 15-17 | 14 |
| Vinelet | 14-16 | 14 | | Zaplet | 15-17 | 12 |
| Grubbit | 14-16 | 12 | | Carapex | 16-18 | 10 |
| Zaplet | 14-16 | 10 | | Umbrat | 15-17 | 8 |
| Gustwing *(rare)* | 17-18 | 3 | | Gustwing *(rare)* | 17-18 | 4 |
| Burrzap *(rare)* | 15-17 | 3 | | | | |

**Items** (existing items only): Burn Salve (west pocket), Ultra Orb (dry
spring), 2 Super Potions (bramble island), Rouser (north-west thicket),
2 Great Orbs (west scree), Super Potion (east scree). No new shop, no new
Mender — Thistlewood's are one walk south.

### The story thread — and where it stops

Something is drawing the **aether currents** out of the ground. The Thornway's
spring, which ran for three hundred years, stopped four days ago. Someone has
driven a surveyor's stake into the dry basin: a grey tag stamped with a hollow
ring crossed by a line — *a weathervane with nothing at its heart* — reading
SURVEY 14 — CURRENT DRAW, and no name. Cave-dwellers (Umbrat) are coming out
of Mistvault onto the open scree. The Wardens have cordoned the cavern.

That is foreshadowing only. The **Hollow Vane** (section 9) appear from
Mistvault onward; nobody on Route 2 names them, and no grunt is fought.

### The Phase 12 boundary

The Thornway ends at the **Wardens' cordon** across Mistvault Cavern's mouth:
a barrier (`mistvaultCordon`) with `openWhen: 'mistvaultOpen'`, a flag nothing
sets. The cave is visible behind it; Warden Corran says the Circle is sending
someone and nobody goes in until then; the sign says CLOSED. There are no exit
tiles behind the cordon. Phase 12 (the dungeon) opens it with one flag and
adds the cavern's exits.

### Saving

- **Save version 3** — `starter` (section 21). No other new field.
- Beaten rivals are `defeatedTrainers`; the gate is `flags.thornwayOpen`; the
  items are `pickedUpRoute2…` flags.
- **Autosaves:** arriving on Route 2 (and back in Thistlewood); Kestrel's gate
  win (one, labelled `story`); every other battle; each item. Never while
  Kestrel is walking off or the gate is opening — the player is not in control.
- Save anywhere on Route 2. A reload puts every trainer — Kestrel included —
  back on their post, and never offers a beaten trainer's fight again.

### How to add a rival meeting

1. **`src/data/trainers.js`** — a new entry with `rival: 'kestrel'`, the next
   `stage`, `requires` (what must be true first), a party with exactly one
   `{ rivalStarter: true, level }` (last, at the top level — tested), intro
   branches per `starter:<id>` naming the right family, an `outro`, and
   `victoryLines`. Add `setFlags` only if the win should change the world.
2. **The map** — an NPC with `trainer`, `sightRange`, `sprite: 'rival'`,
   `presentWhen` equal to the trainer's `requires` (tested), and either
   `absentWhen: 'trainer:<id>'` + `exitAfterDefeat` (they leave) or
   post-defeat dialogue (they stay; add `returnAfterDefeat` if their lane is a
   corridor). Its dialogue is the intro branches with `action: 'trainer:<id>'`.
3. **Measure it** in `tests/rivalBalance.test.js` for all three starters.

No scene, system or save code changes.

