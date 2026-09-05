/**
 * creatures.js
 * ----------------------------------------------------------------------------
 * Every Aether species in the game.
 *
 * FIELDS
 *   id            stable key; what save files and encounter tables store
 *   number        index in the Aether Index (the creature encyclopedia)
 *   name          display name
 *   description   one or two lines shown in the index and on the detail screen
 *   types         one or two type ids from src/data/types.js
 *   baseStats     hp / attack / defense / spAttack / spDefense / speed
 *   growthRate    'fast' | 'medium' | 'slow' — how quickly it levels
 *   baseExp       experience awarded for defeating it
 *   catchRate     0-255; HIGHER is easier to catch
 *   evolution     null, or { method:'level', level:16, to:'cindraw' }
 *   learnset      [{ level, move }] sorted by level; level 1 moves are known
 *                 from the moment the creature exists
 *   appearance    { body } — which shape the artwork generator draws.
 *                 Colours come from the primary type unless overridden.
 *
 * BALANCE NOTE
 * The three starter families deliberately share identical stat TOTALS at every
 * stage (307 / 396 / 500), spread differently. No starter is objectively the
 * right pick — they just play differently. A test enforces this.
 *
 * TO ADD A CREATURE: add an entry here. Tests then automatically check its
 * types, stats, growth rate, learnset moves, evolution target and artwork.
 */

export const CREATURES = {
  // =========================================================================
  // STARTERS — Fire line
  // =========================================================================
  pyrret: {
    id: 'pyrret', number: 1, name: 'Pyrret',
    description: 'A restless ferret with a coal-black coat. The seams along its spine glow when it is excited.',
    types: ['fire'],
    baseStats: { hp: 45, attack: 62, defense: 40, spAttack: 50, spDefense: 42, speed: 68 },
    growthRate: 'medium', baseExp: 62, catchRate: 45,
    evolution: { method: 'level', level: 16, to: 'cindraw' },
    appearance: { body: 'quadruped' },
    learnset: [
      { level: 1, move: 'scratch' },
      { level: 1, move: 'ember' },
      { level: 5, move: 'cowerCry' },
      { level: 10, move: 'quickJab' },
      { level: 14, move: 'sharpenClaws' },
      { level: 19, move: 'emberFang' },
      { level: 24, move: 'ashCloud' },
      { level: 30, move: 'flameBurst' },
      { level: 37, move: 'recklessCharge' },
    ],
  },
  cindraw: {
    id: 'cindraw', number: 2, name: 'Cindraw',
    description: 'Its claws leave scorch marks on stone. Cindraw runs the ridgelines at dusk, trailing sparks.',
    types: ['fire'],
    baseStats: { hp: 58, attack: 82, defense: 52, spAttack: 62, spDefense: 54, speed: 88 },
    growthRate: 'medium', baseExp: 142, catchRate: 45,
    evolution: { method: 'level', level: 34, to: 'emberax' },
    appearance: { body: 'quadruped' },
    learnset: [
      { level: 1, move: 'scratch' },
      { level: 1, move: 'ember' },
      { level: 1, move: 'quickJab' },
      { level: 14, move: 'sharpenClaws' },
      { level: 20, move: 'emberFang' },
      { level: 26, move: 'ashCloud' },
      { level: 33, move: 'flameBurst' },
      { level: 41, move: 'recklessCharge' },
      { level: 48, move: 'bodySlam' },
    ],
  },
  emberax: {
    id: 'emberax', number: 3, name: 'Emberax',
    description: 'The vents along its back open when it runs, and the air behind it shimmers for a long while after.',
    types: ['fire'],
    baseStats: { hp: 72, attack: 104, defense: 66, spAttack: 78, spDefense: 68, speed: 112 },
    growthRate: 'medium', baseExp: 240, catchRate: 45,
    evolution: null,
    appearance: { body: 'quadruped' },
    learnset: [
      { level: 1, move: 'scratch' },
      { level: 1, move: 'ember' },
      { level: 1, move: 'quickJab' },
      { level: 1, move: 'emberFang' },
      { level: 26, move: 'ashCloud' },
      { level: 34, move: 'flameBurst' },
      { level: 43, move: 'recklessCharge' },
      { level: 52, move: 'bodySlam' },
      { level: 60, move: 'kindle' },
    ],
  },

  // =========================================================================
  // STARTERS — Water line
  // =========================================================================
  drizzle: {
    id: 'drizzle', number: 4, name: 'Drizzle',
    description: 'A round amphibian that balances a bead of water on its head. It rarely hurries anywhere.',
    types: ['water'],
    baseStats: { hp: 55, attack: 44, defense: 52, spAttack: 60, spDefense: 62, speed: 34 },
    growthRate: 'medium', baseExp: 62, catchRate: 45,
    evolution: { method: 'level', level: 16, to: 'puddlurk' },
    appearance: { body: 'blob' },
    learnset: [
      { level: 1, move: 'tackle' },
      { level: 1, move: 'waterJet' },
      { level: 5, move: 'hardenShell' },
      { level: 10, move: 'bubbleVeil' },
      { level: 14, move: 'mistGuard' },
      { level: 19, move: 'tidePull' },
      { level: 24, move: 'lullHum' },
      { level: 30, move: 'torrentCrash' },
      { level: 37, move: 'bask' },
    ],
  },
  puddlurk: {
    id: 'puddlurk', number: 5, name: 'Puddlurk',
    description: 'It settles into shallow water and waits. Fishermen say a still puddle is worth stepping around.',
    types: ['water'],
    baseStats: { hp: 72, attack: 56, defense: 66, spAttack: 78, spDefense: 80, speed: 44 },
    growthRate: 'medium', baseExp: 142, catchRate: 45,
    evolution: { method: 'level', level: 34, to: 'torrentine' },
    appearance: { body: 'blob' },
    learnset: [
      { level: 1, move: 'tackle' },
      { level: 1, move: 'waterJet' },
      { level: 1, move: 'bubbleVeil' },
      { level: 14, move: 'mistGuard' },
      { level: 20, move: 'tidePull' },
      { level: 26, move: 'lullHum' },
      { level: 33, move: 'torrentCrash' },
      { level: 41, move: 'bask' },
      { level: 48, move: 'bodySlam' },
    ],
  },
  torrentine: {
    id: 'torrentine', number: 6, name: 'Torrentine',
    description: 'A long, coiling body that holds more water than seems possible. Calm until it is not.',
    types: ['water'],
    baseStats: { hp: 92, attack: 70, defense: 84, spAttack: 100, spDefense: 102, speed: 52 },
    growthRate: 'medium', baseExp: 240, catchRate: 45,
    evolution: null,
    appearance: { body: 'serpent' },
    learnset: [
      { level: 1, move: 'tackle' },
      { level: 1, move: 'waterJet' },
      { level: 1, move: 'mistGuard' },
      { level: 1, move: 'tidePull' },
      { level: 26, move: 'lullHum' },
      { level: 34, move: 'torrentCrash' },
      { level: 43, move: 'bask' },
      { level: 52, move: 'bodySlam' },
      { level: 60, move: 'acidSpit' },
    ],
  },

  // =========================================================================
  // STARTERS — Grass line
  // =========================================================================
  sproutle: {
    id: 'sproutle', number: 7, name: 'Sproutle',
    description: 'A stout seed-pod with stubby legs. It plants itself when it sleeps and is very hard to move.',
    types: ['grass'],
    baseStats: { hp: 50, attack: 58, defense: 58, spAttack: 44, spDefense: 48, speed: 49 },
    growthRate: 'medium', baseExp: 62, catchRate: 45,
    evolution: { method: 'level', level: 16, to: 'bramblit' },
    appearance: { body: 'plant' },
    learnset: [
      { level: 1, move: 'tackle' },
      { level: 1, move: 'leafDart' },
      { level: 5, move: 'sharpenClaws' },
      { level: 10, move: 'sapDrain' },
      { level: 14, move: 'hardenShell' },
      { level: 19, move: 'sapLegs' },
      { level: 24, move: 'toxicSpore' },
      { level: 30, move: 'brambleSlam' },
      { level: 37, move: 'rootheal' },
    ],
  },
  bramblit: {
    id: 'bramblit', number: 8, name: 'Bramblit',
    description: 'Thorned vines have grown into a rough mane. It shoulders through undergrowth rather than around it.',
    types: ['grass'],
    baseStats: { hp: 64, attack: 76, defense: 76, spAttack: 56, spDefense: 62, speed: 62 },
    growthRate: 'medium', baseExp: 142, catchRate: 45,
    evolution: { method: 'level', level: 34, to: 'thornmane' },
    appearance: { body: 'plant' },
    learnset: [
      { level: 1, move: 'tackle' },
      { level: 1, move: 'leafDart' },
      { level: 1, move: 'sapDrain' },
      { level: 14, move: 'hardenShell' },
      { level: 20, move: 'sapLegs' },
      { level: 26, move: 'toxicSpore' },
      { level: 33, move: 'brambleSlam' },
      { level: 41, move: 'rootheal' },
      { level: 48, move: 'closeJab' },
    ],
  },
  thornmane: {
    id: 'thornmane', number: 9, name: 'Thornmane',
    description: 'Its mane hardens into a shield at will. Wardens who train one learn to stand their ground.',
    types: ['grass', 'fighting'],
    baseStats: { hp: 82, attack: 100, defense: 96, spAttack: 70, spDefense: 78, speed: 74 },
    growthRate: 'medium', baseExp: 240, catchRate: 45,
    evolution: null,
    appearance: { body: 'plant' },
    learnset: [
      { level: 1, move: 'tackle' },
      { level: 1, move: 'leafDart' },
      { level: 1, move: 'sapDrain' },
      { level: 1, move: 'closeJab' },
      { level: 26, move: 'toxicSpore' },
      { level: 34, move: 'brambleSlam' },
      { level: 43, move: 'rootheal' },
      { level: 52, move: 'thornGuard' },
      { level: 60, move: 'bodySlam' },
    ],
  },

  // =========================================================================
  // ROUTE 1 FAMILIES
  // =========================================================================
  nibbit: {
    id: 'nibbit', number: 10, name: 'Nibbit',
    description: 'A twitchy field rodent with front teeth it never stops using. Common along the Cinderpath.',
    types: ['normal'],
    baseStats: { hp: 40, attack: 45, defense: 35, spAttack: 25, spDefense: 30, speed: 50 },
    growthRate: 'fast', baseExp: 42, catchRate: 255,
    evolution: { method: 'level', level: 18, to: 'chompkin' },
    appearance: { body: 'quadruped' },
    learnset: [
      { level: 1, move: 'tackle' },
      { level: 4, move: 'screech' },
      { level: 8, move: 'gnaw' },
      { level: 12, move: 'quickJab' },
      { level: 17, move: 'sharpenClaws' },
      { level: 22, move: 'bodySlam' },
    ],
  },
  chompkin: {
    id: 'chompkin', number: 11, name: 'Chompkin',
    description: 'Nibbit grown bold. It gnaws stone for the mineral taste and leaves neat grooves in doorframes.',
    types: ['normal'],
    baseStats: { hp: 62, attack: 72, defense: 58, spAttack: 38, spDefense: 48, speed: 66 },
    growthRate: 'fast', baseExp: 118, catchRate: 120,
    evolution: null,
    appearance: { body: 'quadruped' },
    learnset: [
      { level: 1, move: 'tackle' },
      { level: 1, move: 'gnaw' },
      { level: 1, move: 'screech' },
      { level: 20, move: 'quickJab' },
      { level: 25, move: 'sharpenClaws' },
      { level: 31, move: 'bodySlam' },
      { level: 38, move: 'crunchBite' },
      { level: 45, move: 'recklessCharge' },
    ],
  },

  flittle: {
    id: 'flittle', number: 12, name: 'Flittle',
    description: 'A scruffy dawn-bird that is always halfway through moulting. Loud for its size.',
    types: ['normal', 'flying'],
    baseStats: { hp: 38, attack: 42, defense: 34, spAttack: 32, spDefense: 32, speed: 58 },
    growthRate: 'fast', baseExp: 44, catchRate: 255,
    evolution: { method: 'level', level: 20, to: 'gustwing' },
    appearance: { body: 'bird' },
    learnset: [
      { level: 1, move: 'peck' },
      { level: 4, move: 'screech' },
      { level: 9, move: 'gust' },
      { level: 13, move: 'quickJab' },
      { level: 18, move: 'windrush' },
      { level: 23, move: 'aerialDive' },
    ],
  },
  gustwing: {
    id: 'gustwing', number: 13, name: 'Gustwing',
    description: 'Sleek and tireless. Wardens have used Gustwing to carry messages across the region for generations.',
    types: ['normal', 'flying'],
    baseStats: { hp: 60, attack: 68, defense: 55, spAttack: 50, spDefense: 52, speed: 88 },
    growthRate: 'fast', baseExp: 124, catchRate: 120,
    evolution: null,
    appearance: { body: 'bird' },
    learnset: [
      { level: 1, move: 'peck' },
      { level: 1, move: 'gust' },
      { level: 1, move: 'quickJab' },
      { level: 22, move: 'windrush' },
      { level: 28, move: 'aerialDive' },
      { level: 35, move: 'ashCloud' },
      { level: 42, move: 'bodySlam' },
    ],
  },

  vinelet: {
    id: 'vinelet', number: 14, name: 'Vinelet',
    description: 'A curling tendril with one stubborn leaf it refuses to drop, whatever the season.',
    types: ['grass'],
    baseStats: { hp: 42, attack: 38, defense: 45, spAttack: 52, spDefense: 48, speed: 34 },
    growthRate: 'medium', baseExp: 48, catchRate: 235,
    evolution: { method: 'level', level: 22, to: 'ivorn' },
    appearance: { body: 'plant' },
    learnset: [
      { level: 1, move: 'tackle' },
      { level: 5, move: 'leafDart' },
      { level: 9, move: 'sapLegs' },
      { level: 14, move: 'sapDrain' },
      { level: 19, move: 'toxicSpore' },
      { level: 25, move: 'acidSpit' },
    ],
  },
  ivorn: {
    id: 'ivorn', number: 15, name: 'Ivorn',
    description: 'Matured Vinelet. The sap that beads along its stems is bitter enough to strip paint.',
    types: ['grass', 'poison'],
    baseStats: { hp: 65, attack: 58, defense: 68, spAttack: 78, spDefense: 72, speed: 48 },
    growthRate: 'medium', baseExp: 138, catchRate: 100,
    evolution: null,
    appearance: { body: 'plant' },
    learnset: [
      { level: 1, move: 'leafDart' },
      { level: 1, move: 'sapLegs' },
      { level: 1, move: 'sapDrain' },
      { level: 24, move: 'toxicSpore' },
      { level: 30, move: 'acidSpit' },
      { level: 36, move: 'rustBreath' },
      { level: 43, move: 'brambleSlam' },
      { level: 50, move: 'rootheal' },
    ],
  },

  grubbit: {
    id: 'grubbit', number: 16, name: 'Grubbit',
    description: 'An armoured grub that rolls into a disc when startled. It can stay that way for hours.',
    types: ['bug'],
    baseStats: { hp: 45, attack: 40, defense: 58, spAttack: 25, spDefense: 40, speed: 28 },
    growthRate: 'fast', baseExp: 40, catchRate: 255,
    evolution: { method: 'level', level: 20, to: 'carapex' },
    appearance: { body: 'bug' },
    learnset: [
      { level: 1, move: 'tackle' },
      { level: 1, move: 'hardenShell' },
      { level: 6, move: 'bugBite' },
      { level: 11, move: 'venomSting' },
      { level: 17, move: 'carapaceRam' },
    ],
  },
  carapex: {
    id: 'carapex', number: 17, name: 'Carapex',
    description: 'Grubbit fully plated. The shell has a faint metallic ring when struck, which it seems to enjoy.',
    types: ['bug', 'steel'],
    baseStats: { hp: 65, attack: 68, defense: 95, spAttack: 40, spDefense: 62, speed: 40 },
    growthRate: 'fast', baseExp: 128, catchRate: 110,
    evolution: null,
    appearance: { body: 'bug' },
    learnset: [
      { level: 1, move: 'tackle' },
      { level: 1, move: 'hardenShell' },
      { level: 1, move: 'bugBite' },
      { level: 22, move: 'metalClaw' },
      { level: 28, move: 'carapaceRam' },
      { level: 35, move: 'ironSweep' },
      { level: 42, move: 'venomSting' },
    ],
  },

  pebblit: {
    id: 'pebblit', number: 18, name: 'Pebblit',
    description: 'A fist-sized rock with two bright eyes. It is heavier than it looks and knows it.',
    types: ['rock'],
    baseStats: { hp: 48, attack: 52, defense: 68, spAttack: 24, spDefense: 34, speed: 22 },
    growthRate: 'slow', baseExp: 46, catchRate: 200,
    evolution: { method: 'level', level: 24, to: 'cragmaw' },
    appearance: { body: 'rock' },
    learnset: [
      { level: 1, move: 'tackle' },
      { level: 1, move: 'hardenShell' },
      { level: 7, move: 'rockToss' },
      { level: 12, move: 'pebbleVolley' },
      { level: 18, move: 'mudSlap' },
      { level: 23, move: 'stoneHammer' },
    ],
  },
  cragmaw: {
    id: 'cragmaw', number: 19, name: 'Cragmaw',
    description: 'A boulder that learned to bite. Cragmaw sleeps buried and surfaces only when the ground shifts.',
    types: ['rock', 'ground'],
    baseStats: { hp: 72, attack: 82, defense: 100, spAttack: 38, spDefense: 55, speed: 36 },
    growthRate: 'slow', baseExp: 145, catchRate: 90,
    evolution: null,
    appearance: { body: 'rock' },
    learnset: [
      { level: 1, move: 'tackle' },
      { level: 1, move: 'rockToss' },
      { level: 1, move: 'hardenShell' },
      { level: 26, move: 'quakeStomp' },
      { level: 32, move: 'stoneHammer' },
      { level: 39, move: 'crunchBite' },
      { level: 46, move: 'screech' },
    ],
  },

  dampling: {
    id: 'dampling', number: 20, name: 'Dampling',
    description: 'A shy droplet that clings to reeds at the pond edge. It flinches at its own reflection.',
    types: ['water'],
    baseStats: { hp: 44, attack: 34, defense: 40, spAttack: 50, spDefense: 46, speed: 40 },
    growthRate: 'medium', baseExp: 45, catchRate: 235,
    evolution: { method: 'level', level: 20, to: 'brookel' },
    appearance: { body: 'blob' },
    learnset: [
      { level: 1, move: 'tackle' },
      { level: 5, move: 'waterJet' },
      { level: 10, move: 'bubbleVeil' },
      { level: 15, move: 'mistGuard' },
      { level: 21, move: 'tidePull' },
    ],
  },
  brookel: {
    id: 'brookel', number: 21, name: 'Brookel',
    description: 'It carries a running stream inside itself. You can hear it from several paces away.',
    types: ['water'],
    baseStats: { hp: 68, attack: 52, defense: 62, spAttack: 76, spDefense: 70, speed: 60 },
    growthRate: 'medium', baseExp: 132, catchRate: 110,
    evolution: null,
    appearance: { body: 'blob' },
    learnset: [
      { level: 1, move: 'waterJet' },
      { level: 1, move: 'bubbleVeil' },
      { level: 1, move: 'mistGuard' },
      { level: 24, move: 'tidePull' },
      { level: 31, move: 'lullHum' },
      { level: 38, move: 'torrentCrash' },
      { level: 45, move: 'bask' },
    ],
  },

  zaplet: {
    id: 'zaplet', number: 22, name: 'Zaplet',
    description: 'A tuft of fur holding more charge than it has any business holding. Hair stands up nearby.',
    types: ['electric'],
    baseStats: { hp: 38, attack: 36, defense: 32, spAttack: 55, spDefense: 40, speed: 62 },
    growthRate: 'fast', baseExp: 50, catchRate: 190,
    evolution: { method: 'level', level: 24, to: 'voltmane' },
    appearance: { body: 'quadruped' },
    learnset: [
      { level: 1, move: 'tackle' },
      { level: 5, move: 'spark' },
      { level: 10, move: 'staticWeb' },
      { level: 15, move: 'quickJab' },
      { level: 20, move: 'shockJolt' },
      { level: 26, move: 'windrush' },
    ],
  },
  voltmane: {
    id: 'voltmane', number: 23, name: 'Voltmane',
    description: 'Its mane crackles constantly. Voltmane runs ahead of storms and seems to enjoy the company.',
    types: ['electric'],
    baseStats: { hp: 58, attack: 56, defense: 50, spAttack: 85, spDefense: 62, speed: 95 },
    growthRate: 'fast', baseExp: 150, catchRate: 85,
    evolution: null,
    appearance: { body: 'quadruped' },
    learnset: [
      { level: 1, move: 'spark' },
      { level: 1, move: 'staticWeb' },
      { level: 1, move: 'quickJab' },
      { level: 26, move: 'shockJolt' },
      { level: 33, move: 'windrush' },
      { level: 40, move: 'thunderLance' },
      { level: 47, move: 'crunchBite' },
    ],
  },

  // =========================================================================
  // SINGLE-STAGE SPECIES
  // =========================================================================
  puffcap: {
    id: 'puffcap', number: 24, name: 'Puffcap',
    description: 'A nervous mushroom that vents spores whenever it is startled, which is most of the time.',
    types: ['grass', 'poison'],
    baseStats: { hp: 52, attack: 40, defense: 50, spAttack: 58, spDefense: 60, speed: 30 },
    growthRate: 'medium', baseExp: 66, catchRate: 180,
    evolution: null,
    appearance: { body: 'plant' },
    learnset: [
      { level: 1, move: 'tackle' },
      { level: 1, move: 'toxicSpore' },
      { level: 8, move: 'sapDrain' },
      { level: 14, move: 'lullHum' },
      { level: 20, move: 'acidSpit' },
      { level: 27, move: 'rustBreath' },
      { level: 34, move: 'rootheal' },
    ],
  },
  emberfly: {
    id: 'emberfly', number: 25, name: 'Emberfly',
    description: 'A moth whose wingbeats leave sparks hanging in the air. Rare, and worth stopping to watch.',
    types: ['fire', 'bug'],
    baseStats: { hp: 40, attack: 45, defense: 36, spAttack: 62, spDefense: 40, speed: 65 },
    growthRate: 'medium', baseExp: 72, catchRate: 120,
    evolution: null,
    appearance: { body: 'bug' },
    learnset: [
      { level: 1, move: 'bugBite' },
      { level: 1, move: 'ember' },
      { level: 9, move: 'gust' },
      { level: 15, move: 'ashCloud' },
      { level: 22, move: 'cinderSpray' },
      { level: 29, move: 'venomSting' },
      { level: 36, move: 'flameBurst' },
    ],
  },
  wispel: {
    id: 'wispel', number: 26, name: 'Wispel',
    description: 'A lantern-flame with nothing holding it. It follows travellers politely and at a fixed distance.',
    types: ['ghost'],
    baseStats: { hp: 42, attack: 32, defense: 38, spAttack: 68, spDefense: 55, speed: 60 },
    growthRate: 'medium', baseExp: 78, catchRate: 130,
    evolution: null,
    appearance: { body: 'wisp' },
    learnset: [
      { level: 1, move: 'shadowNip' },
      { level: 1, move: 'lullHum' },
      { level: 10, move: 'shadowSneak' },
      { level: 17, move: 'ashCloud' },
      { level: 24, move: 'lifeSiphon' },
      { level: 32, move: 'nightRend' },
    ],
  },
  umbrat: {
    id: 'umbrat', number: 27, name: 'Umbrat',
    description: 'A cave-dweller that hates open sky. It navigates by sound and remembers every corridor it walks.',
    types: ['dark'],
    baseStats: { hp: 46, attack: 60, defense: 42, spAttack: 38, spDefense: 40, speed: 58 },
    growthRate: 'medium', baseExp: 70, catchRate: 150,
    evolution: null,
    appearance: { body: 'quadruped' },
    learnset: [
      { level: 1, move: 'scratch' },
      { level: 1, move: 'screech' },
      { level: 9, move: 'quickJab' },
      { level: 16, move: 'nightRend' },
      { level: 23, move: 'ashCloud' },
      { level: 30, move: 'crunchBite' },
      { level: 38, move: 'shadowSneak' },
    ],
  },
};

/** Every species id. */
export const CREATURE_IDS = Object.keys(CREATURES);

/** The three species offered at the Warden's Lodge, in display order. */
export const STARTER_IDS = ['pyrret', 'drizzle', 'sproutle'];

/** The level a starter is handed over at. */
export const STARTER_LEVEL = 5;

/**
 * Look up a species. Returns null and warns for an unknown id rather than
 * throwing, so bad data in an encounter table cannot crash the overworld.
 */
export function getSpecies(id) {
  const species = CREATURES[id];
  if (!species) {
    console.warn(`[creatures] Unknown species id "${id}".`);
    return null;
  }
  return species;
}

/**
 * The moves a species knows if it reached `level` naturally.
 * Takes the LAST `maxMoves` it would have learned, which is what a wild
 * creature of that level should turn up with.
 */
export function getMovesAtLevel(species, level, maxMoves = 4) {
  if (!species) return [];

  const learned = species.learnset
    .filter((entry) => entry.level <= level)
    .map((entry) => entry.move);

  // Later moves are better, so keep the most recent ones.
  return learned.slice(-maxMoves);
}

/** Every move a species can learn by levelling, in learn order. */
export function getLearnableMoves(species) {
  return species ? species.learnset.map((entry) => entry.move) : [];
}

/** Which species evolve into this one, if any. */
export function getPreEvolution(speciesId) {
  return (
    CREATURE_IDS.find(
      (id) => CREATURES[id].evolution && CREATURES[id].evolution.to === speciesId
    ) || null
  );
}
