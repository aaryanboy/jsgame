export function loadAssets(k) {
    // ── Player skin definitions ──
    // Each skin: [startCol, framesPerDir]  — rows 24/25/26
    const SKIN_DEFS = [
        [0, 4], // skin_0  — Purple Knight (default)
        [4, 4], // skin_1  — Green Knight
        [8, 4], // skin_2  — Gold Knight
        [12, 4], // skin_3  — Red Knight
        [16, 2], // skin_4  — Brown Mage
        [20, 2], // skin_5  — Yellow Mage
        [24, 2], // skin_6  — Gold Mage
        [28, 2], // skin_7  — Red Mage
    ];

    SKIN_DEFS.forEach(([col, frames], i) => {
        const d = 24 * 39 + col; // row 24 = walk-down
        const s = 25 * 39 + col; // row 25 = walk-side
        const u = 26 * 39 + col; // row 26 = walk-up
        const end = frames - 1;
        k.loadSprite(`skin_${i}`, "./spritesheet.png", {
            sliceX: 39, sliceY: 31,
            anims: {
                "idle-down": d,
                "walk-down": { from: d, to: d + end, loop: true, speed: 8 },
                "idle-side": s,
                "walk-side": { from: s, to: s + end, loop: true, speed: 8 },
                "idle-up": u,
                "walk-up": { from: u, to: u + end, loop: true, speed: 8 },
            },
        });
    });

    // Default "spritesheet" sprite is skin_0 (backwards compat)
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

    k.loadSprite("joystick", "./joystick.png", {
        sliceX: 9, sliceY: 1,
        anims: {
            "knob": 4, // Middle (Idle)
            "up": 1, "down": 7, "left": 3, "right": 5,
            "up-left": 0, "up-right": 2, "down-left": 6, "down-right": 8,
        }
    });

    k.loadSprite("ui-buttons", "./joystick.png", {
        sliceX: 10, sliceY: 10,
        anims: {
            "a": 10, "b": 11, "x": 12, "y": 13,
            "r1": 4, "r2": 14, "l1": 6, "l2": 16,
        }
    });

    k.setBackground(k.Color.fromHex("#311047"));
}
