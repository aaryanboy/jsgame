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

export const playerinfo = {
  speed: 250,
  direction: "down",
  isInDialogue: false,
  name: "Hero",
  health: 100,
  damage: 10,
  critRate: 0.2,
  critDamage: 1.5,
};

export const bossInfo = {
  name: "Boss",
  health: 100,
  damage: 20,
  speed: 100,
  critRate: 0.1,
  critDamage: 1.2,
};

export const petInfo = {
  name: "Froggy",
  health: 500,
  speed: 200,
  damage: 20,
  critRate: 0.05,
  critDamage: 1.1,
};

export const skills = {
  m: {
    name: "Swift Slash",
    damage: 10,
    cooldown: 0.5,
    iconColor: [255, 50, 50], // Bright Red
  },
  comma: {
    name: "Titan Cleave",
    damage: 30,
    cooldown: 2.0,
    windup: 0.5,
    iconColor: [255, 140, 0], // Deep Orange
  },
  period: {
    name: "Blade Storm",
    damage: 15,
    cooldown: 3.0,
    iconColor: [0, 100, 255], // Deep Blue
  },
  slash: {
    name: "The World",
    cooldown: 5.0,
    iconColor: [147, 112, 219], // Purple
  },
};
