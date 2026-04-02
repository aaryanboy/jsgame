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

    // Cat pet spritesheet: 4x4 grid (down, up, left, right — 4 frames each)
    k.loadSprite("cat", "/assets/pets/cat.png", {
        sliceX: 4,
        sliceY: 4,
        anims: {
            "idle-down": 0,
            "walk-down": { from: 0, to: 3, loop: true, speed: 8 },
            "idle-up": 4,
            "walk-up": { from: 4, to: 7, loop: true, speed: 8 },
            "idle-left": 8,
            "walk-left": { from: 8, to: 11, loop: true, speed: 8 },
            "idle-right": 12,
            "walk-right": { from: 12, to: 15, loop: true, speed: 8 },
        },
    });

    // Cat attack spritesheet: 2 columns, 12 rows
    // Rows 1-4: Deepcut (Down, Up, Left, Right)
    // Rows 5-8: Axe Shot (Down, Up, Left, Right)
    // Rows 9-12: Heal (Down, Up, Left, Right)
    k.loadSprite("cat-attack", "/assets/pets/catattack.png", {
        sliceX: 2,
        sliceY: 12,
        anims: {
            "deepcut-down": { from: 0, to: 1, loop: false, speed: 5 },
            "deepcut-up": { from: 2, to: 3, loop: false, speed: 5 },
            "deepcut-left": { from: 4, to: 5, loop: false, speed: 5 },
            "deepcut-right": { from: 6, to: 7, loop: false, speed: 5 },
            "axeshot-down": { from: 8, to: 9, loop: false, speed: 5 },
            "axeshot-up": { from: 10, to: 11, loop: false, speed: 5 },
            "axeshot-left": { from: 12, to: 13, loop: false, speed: 5 },
            "axeshot-right": { from: 14, to: 15, loop: false, speed: 5 },
            "heal-down": { from: 16, to: 17, loop: false, speed: 5 },
            "heal-up": { from: 18, to: 19, loop: false, speed: 5 },
            "heal-left": { from: 20, to: 21, loop: false, speed: 5 },
            "heal-right": { from: 22, to: 23, loop: false, speed: 5 },
        }
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

    k.loadSprite("slime", "./slime.png", {
        sliceX: 7, sliceY: 13,
        anims: {
            "idle-down": { from: 0, to: 3, loop: true, speed: 6 },
            "walk-down": { from: 7, to: 10, loop: true, speed: 10 },
            "idle-right": { from: 21, to: 26, loop: true, speed: 6 },
            "walk-right": { from: 28, to: 33, loop: true, speed: 10 },
            "idle-up": { from: 42, to: 48, loop: true, speed: 6 },
            "walk-up": { from: 49, to: 54, loop: true, speed: 10 },
            "attack-down": { from: 63, to: 65, loop: false, speed: 10 },
            "attack-right": { from: 70, to: 72, loop: false, speed: 10 },
            "attack-up": { from: 77, to: 79, loop: false, speed: 10 },
            "death": { from: 84, to: 88, loop: false, speed: 10 },
        }
    });

    k.setBackground(k.Color.fromHex("#0a0a0f"));
}
