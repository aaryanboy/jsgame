export const scaleFactor = 4;

//inside room
export const dialogueData = {
  bed: `This is where I sleep.`,
  resume: `This is my desk and on it is my resume.`,
  "sofa-table": `It's just a table.`,
  "cs-degree": `It's a fake degree.`,
  projects: `Info about this portfolio : It's made with the Kaboom.js library which is a library for making games in JavaScript.
    Text is rendered with HTML/CSS. So the textbox you're currently reading is not rendered within canvas.`,
  library: `There are a lot of programming books on my shelves.`,
  chair: `Pewdiepie gaming chair.`,
  exit3: `Can't Enter Yet.. room not made or coded.`,
};

// ── Single mutable config object — edit at runtime via Creative Mode ──
export const gameConfig = {
  player: {
    speed: 250,
    health: 100,
    damage: 10,
    critRate: 0.2,   // 0–1
    critDamage: 1.5,   // multiplier
    skinIndex: 0,
  },
  boss: {
    health: 100,
    damage: 20,
    speed: 100,
  },
  pet: {
    health: 500,
    speed: 200,
    damage: 20,
    critRate: 0.05,
    critDamage: 1.1,
  },
  skills: {
    swiftSlashDmg: 10,
    swiftSlashCD: 0.5,
    titanCleaveDmg: 30,
    titanCleaveCD: 2.0,
    bladeStormDmg: 15,
    bladeStormCD: 3.0,
    theWorldCD: 5.0,
  },
  ui: {
    controlMode: "keyboard",  // "keyboard" or "touch"
  },
};

// ── Backwards-compatible named exports (point into gameConfig) ──
export const playerinfo = {
  get speed() { return gameConfig.player.speed; },
  get health() { return gameConfig.player.health; },
  get damage() { return gameConfig.player.damage; },
  get critRate() { return gameConfig.player.critRate; },
  get critDamage() { return gameConfig.player.critDamage; },
  direction: "down",
  isInDialogue: false,
  name: "Hero",
};


export const petInfo = {
  get health() { return gameConfig.pet.health; },
  get speed() { return gameConfig.pet.speed; },
  get damage() { return gameConfig.pet.damage; },
  get critRate() { return gameConfig.pet.critRate; },
  get critDamage() { return gameConfig.pet.critDamage; },
  name: "Froggy",
};

export const skills = {
  m: {
    name: "Swift Slash",
    get damage() { return gameConfig.skills.swiftSlashDmg; },
    get cooldown() { return gameConfig.skills.swiftSlashCD; },
    iconColor: [255, 50, 50],
  },
  comma: {
    name: "Titan Cleave",
    get damage() { return gameConfig.skills.titanCleaveDmg; },
    get cooldown() { return gameConfig.skills.titanCleaveCD; },
    windup: 0.5,
    iconColor: [255, 140, 0],
  },
  period: {
    name: "Blade Storm",
    get damage() { return gameConfig.skills.bladeStormDmg; },
    get cooldown() { return gameConfig.skills.bladeStormCD; },
    iconColor: [0, 100, 255],
  },
  slash: {
    name: "The World",
    get cooldown() { return gameConfig.skills.theWorldCD; },
    iconColor: [147, 112, 219],
  },
};
