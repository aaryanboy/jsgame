// ── On-Screen Touch Controls ──
// Creates a virtual D-pad (left side) and action buttons (right side)
import { gameConfig } from "../utils/constants.js";
import { gameState } from "../utils/utils.js";

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

function checkPressed(btn, k) {
    if (k.isMouseDown("left") && btn.isHovering()) return true;
    if (k.getTouches) {
        for (const t of k.getTouches()) {
            if (btn.hasPoint(t.pos)) return true;
        }
    }
    return false;
}

let touchPlayer = null;

export function showTouchControls(k, player) {
    if (player) touchPlayer = player;
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

    // Draggable Joystick Handle
    const handleR = Math.round(joyR * 0.4);
    const handle = k.add([
        k.circle(handleR),
        k.pos(joyX, joyY),
        k.anchor("center"),
        k.color(200, 210, 220),
        k.opacity(0.8),
        k.outline(2, k.rgb(255, 255, 255)),
        k.fixed(),
        { z: 205 },
        "touchControl",
    ]);

    // Joystick Interaction Logic
    let joyActive = false;
    let joyPointerId = null;

    handle.onUpdate(() => {
        let currentPos = null;
        let isActiveNow = false;

        // 1. Check true touches
        if (k.getTouches) {
            for (const t of k.getTouches()) {
                if (joyActive && t.id === joyPointerId) {
                    currentPos = t.pos;
                    isActiveNow = true;
                    break;
                }
                if (!joyActive) {
                    const dist = t.pos.dist(k.vec2(joyX, joyY));
                    if (dist < joyR * 1.5) {
                        joyActive = true;
                        joyPointerId = t.id;
                        currentPos = t.pos;
                        isActiveNow = true;
                        break;
                    }
                }
            }
        }

        // 2. Fallback to mouse dragging for desktop testing
        if (!isActiveNow && k.isMouseDown("left")) {
            const mPos = k.mousePos();
            if (joyActive && joyPointerId === "mouse") {
                currentPos = mPos;
                isActiveNow = true;
            } else if (!joyActive) {
                const dist = mPos.dist(k.vec2(joyX, joyY));
                if (dist < joyR * 1.5) {
                    joyActive = true;
                    joyPointerId = "mouse";
                    currentPos = mPos;
                    isActiveNow = true;
                }
            }
        }

        // 3. Process movement or release
        if (isActiveNow && currentPos) {
            updateJoystick(currentPos);
        } else {
            if (joyActive) {
                joyActive = false;
                joyPointerId = null;
                // Snap back to center
                handle.pos = k.vec2(joyX, joyY);
                handle.opacity = 0.8;
                touchInput.up = false;
                touchInput.down = false;
                touchInput.left = false;
                touchInput.right = false;
            }
        }
    });

    function updateJoystick(pos) {
        handle.opacity = 1.0;
        let diff = pos.sub(k.vec2(joyX, joyY));
        let dist = diff.len();
        const maxDist = joyR - handleR * 0.5;

        // Clamp handle to joystick base
        if (dist > maxDist) {
            diff = diff.scale(maxDist / dist);
        }
        handle.pos = k.vec2(joyX, joyY).add(diff);

        // Determine directions based on thresholds
        // We use a deadzone of roughly 20% to prevent drift
        const deadzone = maxDist * 0.2;

        touchInput.up = diff.y < -deadzone;
        touchInput.down = diff.y > deadzone;
        touchInput.left = diff.x < -deadzone;
        touchInput.right = diff.x > deadzone;
    }

    // ── MOBA Action Buttons (Right) ──
    const atkR = Math.round(base * 0.12);
    const atkX = Math.round(w * 0.88);
    const atkY = Math.round(h * 0.78);

    // Basic Attack Button
    makeActionButton(k, atkX, atkY, atkR, "m", "ATK", [255, 70, 50], 'mTimer');

    // Skills Arc
    const arcDist = Math.round(base * 0.22);
    const skillR = Math.round(base * 0.065);

    // Angles: 0 is Right, PI is Left, -PI/2 is Up. We want an arc from Left to Up.
    const skills = [
        { key: "comma", label: "S1", color: [40, 180, 255], angle: Math.PI, timerKey: "commaTimer" },                // Left
        { key: "period", label: "S2", color: [255, 170, 30], angle: Math.PI * 1.25, timerKey: "periodTimer" },        // Top-Left
        { key: "slash", label: "ULT", color: [160, 50, 255], angle: Math.PI * 1.5, timerKey: "slashTimer" },         // Top
    ];

    skills.forEach(({ key, label, color, angle, timerKey }) => {
        const sx = atkX + Math.cos(angle) * arcDist;
        const sy = atkY + Math.sin(angle) * arcDist;
        makeActionButton(k, sx, sy, skillR, key, label, color, timerKey);
    });
}

function makeActionButton(k, x, y, r, key, label, color, timerKey) {
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

    const cdOverlay = k.add([
        k.circle(r),
        k.pos(x, y),
        k.anchor("center"),
        k.color(0, 0, 0),
        k.opacity(0),
        k.fixed(),
        { z: 203 },
        "touchControl",
    ]);

    const cdText = k.add([
        k.text("", { size: Math.round(r * 0.6), font: "monospace", weight: "bold" }),
        k.pos(x, y),
        k.anchor("center"),
        k.color(255, 255, 0),
        k.fixed(),
        { z: 204 },
        "touchControl",
    ]);

    let lastPressed = false;
    btn.onUpdate(() => {
        // Cooldown Rendering Logic
        let isOnCooldown = false;

        // Custom logic for ULT (The World)
        if (key === 'slash' && gameState.isTimeStopped) {
            cdOverlay.opacity = 0.4;
            cdText.text = "ACT";
            cdText.color = k.rgb(147, 112, 219); // Purple
            isOnCooldown = true;
        } else if (touchPlayer && timerKey) {
            const timer = touchPlayer[timerKey];
            if (timer > 0) {
                isOnCooldown = true;
                cdOverlay.opacity = 0.6;
                cdText.text = timer.toFixed(1);
                cdText.color = k.rgb(255, 255, 0); // Yellow
            } else {
                cdOverlay.opacity = 0;
                cdText.text = "";
            }
        } else {
            cdOverlay.opacity = 0;
            cdText.text = "";
        }

        const pressed = checkPressed(btn, k);
        // Only trigger if pressed this frame, wasn't pressed last frame, and not on cooldown
        if (pressed && !lastPressed && !isOnCooldown) {
            touchInput[key] = true;
            btn.opacity = 0.9;
            k.wait(0.15, () => { if (btn.exists()) btn.opacity = 0.6; });
        }
        lastPressed = pressed;
    });
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
