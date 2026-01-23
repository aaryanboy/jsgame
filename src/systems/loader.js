export function loadAssets(k) {
    // Load sprites
    k.loadSprite("spritesheet", "./spritesheet.png", {
        sliceX: 39,
        sliceY: 31,
        anims: {
            "idle-down": 936,
            "walk-down": { from: 936, to: 939, loop: true, speed: 8 },
            "idle-side": 975,
            "walk-side": { from: 975, to: 978, loop: true, speed: 8 },
            "idle-up": 1014,
            "walk-up": { from: 1014, to: 1017, loop: true, speed: 8 },
        },
    });
    k.loadSprite("attack", "./spritesheet.png", {
        sliceX: 39,
        sliceY: 31,
        anims: {
            "attack-up": { from: 1087, to: 1091, loop: false, speed: 15 },
            "attack-down": { from: 1126, to: 1130, loop: false, speed: 15 },
            "attack-left": { from: 1009, to: 1013, loop: false, speed: 15 },
            "attack-right": { from: 1126, to: 1130, loop: false, speed: 15 },
        },
    });

    k.loadSprite("boss", "./spritesheet.png", {
        sliceX: 39,
        sliceY: 31,
        anims: {
            "idle-down": 862,
            "walk-down": { from: 862, to: 863, loop: true, speed: 8 },
            "idle-right": 864,
            "walk-right": { from: 864, to: 865, loop: true, speed: 8 },
            "idle-left": 903,
            "walk-left": { from: 903, to: 904, loop: true, speed: 8 },
            "idle-up": 901,
            "walk-up": { from: 901, to: 902, loop: true, speed: 8 },
        },
    });

    k.loadSprite("pet", "./spritesheet.png", {
        sliceX: 39,
        sliceY: 31,
        anims: {
            "idle-down": 788,
            "walk-down": { from: 788, to: 789, loop: true, speed: 8 },
            "idle-right": 790,
            "walk-right": { from: 790, to: 791, loop: true, speed: 8 },
            "idle-left": 829,
            "walk-left": { from: 829, to: 830, loop: true, speed: 8 },
            "idle-up": 827,
            "walk-up": { from: 827, to: 828, loop: true, speed: 8 },
        },
    });

    k.loadSprite("mainroom", "./mainroom.png");
    k.loadSprite("maproom", "./map.png");
    k.loadSprite("maparea", "./maparea.png");
    // Load Music
    k.loadSprite("bossroom", "./bossroom.png");
    k.loadSprite("tree", "./trees.png"); // Tree foreground

    // Load Music
    k.loadSound("bgm", "/music/backgroundmusic.mp3");

    // Load Attack Sounds
    k.loadSound("zawarudo", "/attackmusic/za-warudo-dio-the-world.mp3");
    k.loadSound("shield", "/attackmusic/shield.mp3");

    k.setBackground(k.Color.fromHex("#311047"));
}
