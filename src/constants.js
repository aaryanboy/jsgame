export const scaleFactor = 4;

//inside room
export const dialogueData = {
  pc: `This is my PC. I work mostly in JavaScript/TypeScript these days.
      I've made a couple of games in that language. I also like Golang and Python. Anyway regardless of the language, I just like programming.
      Here is my <a href="https://github.com/aaryanboy" target="_blank">Github</a>!`,
  tv: `That's my TV. I've been watching saucy vdos `,
  bed: `This where I sleep. `,
  resume: `This is my desk and on it is my resume`,
  "sofa-table": `its just a table`,
  "cs-degree": `its a fake degree`,
  projects: `Info about this portfolio : It's made with the Kaboom.js library which is a library for making games in JavaScript.
    Text is rendered with HTML/CSS. So the textbox you're currently reading is not rendered within canvas.`,
  library: `There are a lot of programming books on my shelves.`,

  chair: `pewdiepie gaming chair`,
  exit3: `Cant Enter Yet.. room not made or coded`,
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

export const enemy = {
  name: "Goblin",
  health: 50,
  damage: 8,
  critRate: 0.1,
  critDamage: 1.2,
};
