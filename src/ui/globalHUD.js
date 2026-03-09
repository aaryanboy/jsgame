import { toggleSettingsMenu } from "../systems/settingsMenu.js";
import { revivePet } from "../entities/frog.js";


let hudPlayer = null;

// A persistent UI layer for top-corner buttons (Settings & Revive)
// These are visible in both Keyboard and Touch modes.
export function createGlobalHUD(k, player) {
    if (player) hudPlayer = player;
    hideGlobalHUD(k); // clear existing first

    const w = k.width(), h = k.height();
    const base = Math.min(w, h);
    const utilSize = Math.round(base * 0.06);

    // Tab (settings) — top-left
    const tabBtn = makeHUDBtn(k, Math.round(w * 0.06), Math.round(h * 0.06), utilSize, "⚙", [180, 160, 140]);
    tabBtn.onClick(() => {
        if (!k.get("settingsMenu").length) {
            tabBtn.opacity = 0.9;
            k.wait(0.15, () => { if (tabBtn.exists()) tabBtn.opacity = 0.5; });
            toggleSettingsMenu(k);
        }
    });

    // T (revive) — top-right
    const tBtn = makeHUDBtn(k, Math.round(w * 0.94), Math.round(h * 0.06), utilSize, "T", [100, 200, 100]);
    tBtn.onClick(() => {
        if (!k.get("settingsMenu").length) {
            tBtn.opacity = 0.9;
            k.wait(0.15, () => { if (tBtn.exists()) tBtn.opacity = 0.5; });
            const tvObjects = k.get("tv");
            let nearTV = tvObjects.some(tv => hudPlayer && hudPlayer.pos && hudPlayer.pos.dist(tv.pos) < 50);
            if (nearTV) revivePet();
        }
    });
}

function makeHUDBtn(k, x, y, size, label, color) {
    k.add([
        k.rect(size, size, { radius: Math.round(size * 0.25) }),
        k.pos(x + 1, y + 2),
        k.anchor("center"),
        k.color(30, 30, 30),
        k.opacity(0.3),
        k.fixed(),
        { z: 90 }, // Below settingsMenu (98), above most things
        "globalHUD",
    ]);

    const btn = k.add([
        k.rect(size, size, { radius: Math.round(size * 0.25) }),
        k.pos(x, y),
        k.anchor("center"),
        k.area(),
        k.color(...color),
        k.opacity(0.5),
        k.outline(2, k.rgb(200, 200, 200)),
        k.fixed(),
        { z: 91 },
        "globalHUD",
    ]);

    k.add([
        k.text(label, { size: Math.round(size * 0.45), font: "monospace" }),
        k.pos(x, y),
        k.anchor("center"),
        k.color(255, 255, 255),
        k.fixed(),
        { z: 92 },
        "globalHUD",
    ]);

    return btn;
}

export function hideGlobalHUD(k) {
    k.destroyAll("globalHUD");
}

export function showGlobalHUD(k) {
    if (hudPlayer) createGlobalHUD(k, hudPlayer);
}
