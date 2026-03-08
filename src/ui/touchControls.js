// ── On-Screen Touch Controls ──
// Creates a virtual D-pad (left side) and action buttons (right side)
// that inject virtual key states into a shared touchInput object.

import { gameConfig } from "../utils/constants.js";

// ── Shared virtual input state ──
export const touchInput = {
    left: false, right: false, up: false, down: false,
    // Skill triggers (true for one frame, then reset)
    m: false, comma: false, period: false, slash: false,
    tab: false, t: false,
};

export function isTouchMode() {
    return gameConfig.ui.controlMode === "touch";
}

export function showTouchControls(k) {
    hideTouchControls(k);
    if (!isTouchMode()) return;

    const w = k.width(), h = k.height();
    const base = Math.min(w, h);

    // ── MOBA Joystick (Left) ──
    const joyR = Math.round(base * 0.14);
    const joyX = Math.round(w * 0.16);
    const joyY = Math.round(h * 0.75);

    // Joystick Base
    k.add([
        k.circle(joyR),
        k.pos(joyX + 2, joyY + 4),
        k.anchor("center"),
        k.color(20, 20, 20),
        k.opacity(0.4),
        k.fixed(),
        { z: 200 },
        "touchControl",
    ]);

    k.add([
        k.circle(joyR),
        k.pos(joyX, joyY),
        k.anchor("center"),
        k.color(50, 60, 70),
        k.opacity(0.35),
        k.outline(3, k.rgb(120, 130, 150)),
        k.fixed(),
        { z: 201 },
        "touchControl",
    ]);

    // 4 Directional Quadrants over the joystick
    const padSize = Math.round(joyR * 0.85);
    const dirs = [
        { key: "up", dx: 0, dy: -1, label: "▲" },
        { key: "down", dx: 0, dy: 1, label: "▼" },
        { key: "left", dx: -1, dy: 0, label: "◀" },
        { key: "right", dx: 1, dy: 0, label: "▶" },
    ];

    dirs.forEach(({ key, dx, dy, label }) => {
        const ax = joyX + dx * padSize * 0.55;
        const ay = joyY + dy * padSize * 0.55;

        const btn = k.add([
            k.circle(padSize * 0.55),
            k.pos(ax, ay),
            k.anchor("center"),
            k.area(),
            k.color(255, 255, 255),
            k.opacity(0.0), // Invisible interaction area
            k.fixed(),
            { z: 202 },
            "touchControl",
        ]);

        const arrow = k.add([
            k.text(label, { size: Math.round(padSize * 0.4) }),
            k.pos(ax, ay),
            k.anchor("center"),
            k.color(200, 200, 200),
            k.opacity(0.5),
            k.fixed(),
            { z: 203 },
            "touchControl",
        ]);

        btn.onUpdate(() => {
            if (k.isMouseDown("left") && btn.isHovering()) {
                touchInput[key] = true;
                arrow.opacity = 1.0;
                arrow.color = k.rgb(255, 220, 50);
            } else {
                touchInput[key] = false;
                arrow.opacity = 0.5;
                arrow.color = k.rgb(200, 200, 200);
            }
        });
    });

    // ── MOBA Action Buttons (Right) ──
    const atkR = Math.round(base * 0.12);
    const atkX = Math.round(w * 0.88);
    const atkY = Math.round(h * 0.78);

    // Basic Attack Button
    makeActionButton(k, atkX, atkY, atkR, "m", "ATK", [255, 70, 50]);

    // Skills Arc
    const arcDist = Math.round(base * 0.22);
    const skillR = Math.round(base * 0.065);

    // Angles: 0 is Right, PI is Left, -PI/2 is Up. We want an arc from Left to Up.
    const skills = [
        { key: "comma", label: "S1", color: [40, 180, 255], angle: Math.PI },                // Left
        { key: "period", label: "S2", color: [255, 170, 30], angle: Math.PI * 1.25 },        // Top-Left
        { key: "slash", label: "ULT", color: [160, 50, 255], angle: Math.PI * 1.5 },         // Top
    ];

    skills.forEach(({ key, label, color, angle }) => {
        const sx = atkX + Math.cos(angle) * arcDist;
        const sy = atkY + Math.sin(angle) * arcDist;
        makeActionButton(k, sx, sy, skillR, key, label, color);
    });

    // ── Utility Buttons (Tab / T) — top corners ──
    const utilSize = Math.round(base * 0.06);

    // Tab (settings) — top-left
    const tabBtn = makeUtilBtn(k, Math.round(w * 0.06), Math.round(h * 0.06), utilSize, "⚙", [180, 160, 140]);
    tabBtn.onClick(() => {
        touchInput.tab = true;
        tabBtn.opacity = 0.9;
        k.wait(0.15, () => { if (tabBtn.exists()) tabBtn.opacity = 0.5; });
    });

    // T (revive) — top-right
    const tBtn = makeUtilBtn(k, Math.round(w * 0.94), Math.round(h * 0.06), utilSize, "T", [100, 200, 100]);
    tBtn.onClick(() => {
        touchInput.t = true;
        tBtn.opacity = 0.9;
        k.wait(0.15, () => { if (tBtn.exists()) tBtn.opacity = 0.5; });
    });
}

function makeActionButton(k, x, y, r, key, label, color) {
    k.add([
        k.circle(r),
        k.pos(x + 2, y + 4),
        k.anchor("center"),
        k.color(20, 20, 20),
        k.opacity(0.4),
        k.fixed(),
        { z: 200 },
        "touchControl",
    ]);

    const btn = k.add([
        k.circle(r),
        k.pos(x, y),
        k.anchor("center"),
        k.area(),
        k.color(...color),
        k.opacity(0.6),
        k.outline(3, k.rgb(220, 220, 230)),
        k.fixed(),
        { z: 201 },
        "touchControl",
    ]);

    k.add([
        k.text(label, { size: Math.round(r * 0.45), font: "monospace", weight: "bold" }),
        k.pos(x, y),
        k.anchor("center"),
        k.color(255, 255, 255),
        k.fixed(),
        { z: 202 },
        "touchControl",
    ]);

    btn.onClick(() => {
        touchInput[key] = true;
        btn.opacity = 0.9;
        k.wait(0.15, () => { if (btn.exists()) btn.opacity = 0.6; });
    });
}

function makeUtilBtn(k, x, y, size, label, color) {
    k.add([
        k.rect(size, size, { radius: Math.round(size * 0.25) }),
        k.pos(x + 1, y + 2),
        k.anchor("center"),
        k.color(30, 30, 30),
        k.opacity(0.3),
        k.fixed(),
        { z: 200 },
        "touchControl",
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
        { z: 201 },
        "touchControl",
    ]);

    k.add([
        k.text(label, { size: Math.round(size * 0.45), font: "monospace" }),
        k.pos(x, y),
        k.anchor("center"),
        k.color(255, 255, 255),
        k.fixed(),
        { z: 202 },
        "touchControl",
    ]);

    return btn;
}

export function hideTouchControls(k) {
    k.destroyAll("touchControl");
    // Reset all inputs
    Object.keys(touchInput).forEach(key => touchInput[key] = false);
}

/**
 * Call once per frame to consume one-shot triggers (skills, tab, t).
 * D-pad keys (up/down/left/right) stay held until mouseRelease.
 */
export function consumeTouchTriggers() {
    touchInput.m = false;
    touchInput.comma = false;
    touchInput.period = false;
    touchInput.slash = false;
    touchInput.tab = false;
    touchInput.t = false;
}
