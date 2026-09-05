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

**Built so far (Phase 2):** Emberhollow Town and its four interiors, plus Route 1.
Thistlewood is held back until Beacon Hall 1 exists (Phase 9) — Route 1 ends at a
closed gate with a warden who explains why, rather than an invisible wall or an
empty town.

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

### Route 1 — Cinderpath — as built
22x30, running north from Emberhollow. The path jogs twice so the route is not a
straight corridor. Tall grass sits on both sides of the path throughout, so the
player always chooses between the safe route and the interesting one. A pond
partway up, two ground items, four NPCs, a signpost, and a shut gate at the top.

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

## 7. Beacon Hall 1 — The Verdant Hall (Thistlewood)

- **Theme:** an overgrown greenhouse. Hedges form the walls.
- **Puzzle:** three **root switches**. Stepping on a switch retracts one hedge wall and
  extends another. The player must reach the Leader by toggling switches in the right
  order. Simple, readable, no timers.
- **Trainers:** 2 Gardeners (2 creatures each, L8–10).
- **Leader:** **Fern**, calm and rather smug about her hedges.
  - Vinelet L11, Puffcap L11, **Ivorn L13** (ace, Grass/Poison)
- **Reward:** **Verdant Sigil**, 1200 coins, and the Hall's TM-equivalent later.
- **Flag set:** `sigil_verdant`
- **Unlocks:** the Thornway gate to Route 2.

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

1. **Encounter rate:** ~11% per step in grass, with a **3-step cooldown** after an
   encounter so the player can never be chain-ambushed on consecutive tiles.
2. **Damage variance:** 85%–100% (a 15% band) — enough to feel alive, not enough to
   make a plan fail.
3. **Critical hit rate:** 1/16, dealing 1.5x. No crit-stage system in v1 (kept simple).
4. **STAB (same-type attack bonus):** 1.5x.
5. **Growth rates:** three curves only — `fast`, `medium`, `slow`. Fewer curves is easier
   to reason about and to balance than the six used by the games that inspired this.
6. **Loss penalty:** lose 5% of carried coins (min 0), warp to the last Mender's Hall,
   full heal. Never a game over — this game does not punish learning.
7. **Wild levels track the player**, staying inside each route's own band, so no route
   ever becomes trivially safe or brutally unfair.
8. **Gym leaders are ~2 levels above the local trainers** and always have a coherent
   type plan, so they read as a real step up.
9. **Ground items block their tile.** You have to face one to take it. This is
   why an item is never something you accidentally walk over and miss.
10. **NPCs never wander more than a couple of tiles from home**, so a wandering
    villager can never end up somewhere that makes a corridor impassable, and you
    can always find someone again where you left them.

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

### Practice battles
Assistant Bly and Warden Tace at the Warden's Lodge offer repeatable practice
bouts once you have a starter. They award **no experience and no money** on
purpose: a repeatable fight that paid out would be an infinite progression
exploit. Real, once-only trainer battles with real rewards arrive in Phase 8.

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
