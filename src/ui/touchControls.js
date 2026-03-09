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
    if (!touchPlayer) touchPlayer = k.get("player")[0];
    
    hideTouchControls(k);
    if (!isTouchMode()) return;

    const w = k.width(), h = k.height();
    const base = Math.min(w, h);

    // ── MOBA Joystick (Left) ──
    const joyR = Math.round(base * 0.14);
    const joyX = Math.round(w * 0.16);
    const joyY = Math.round(h * 0.75);

    // Draggable Joystick Handle (Static, only changes tiles)
    const handle = k.add([
        k.sprite("joystick", { anim: "knob" }),
        k.pos(joyX, joyY),
        k.anchor("center"),
        k.scale(base * 0.0035), // Slightly larger since it's floating
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
            for (const pos of k.getTouches()) {
                const tPos = pos.pos ? pos.pos : pos;
                const tId = pos.id !== undefined ? pos.id : k.getTouches().indexOf(pos);
                
                if (tPos.x < w / 2) {
                    if (joyActive && tId === joyPointerId) {
                        currentPos = tPos;
                        isActiveNow = true;
                        break;
                    }
                    if (!joyActive) {
                        const dist = tPos.dist(k.vec2(joyX, joyY));
                        if (dist < joyR * 1.5) {
                            joyActive = true;
                            joyPointerId = tId;
                            currentPos = tPos;
                            isActiveNow = true;
                            break;
                        }
                    }
                }
            }
        }

        // 2. Fallback to mouse dragging
        if (!isActiveNow && k.isMouseDown("left")) {
            const mPos = k.mousePos();
            if (mPos.x < w / 2) {
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
        }

        // 3. Process movement or release
        if (isActiveNow && currentPos) {
            updateJoystick(currentPos);
        } else {
            if (joyActive) {
                joyActive = false;
                joyPointerId = null;
                handle.pos = k.vec2(joyX, joyY);
                handle.play("knob"); // Back to neutral
                touchInput.up = false;
                touchInput.down = false;
                touchInput.left = false;
                touchInput.right = false;
            }
        }
    });

    function updateJoystick(pos) {
        let diff = pos.sub(k.vec2(joyX, joyY));
        let dist = diff.len();
        const maxDist = joyR - 10;

        if (dist > maxDist) {
            diff = diff.scale(maxDist / dist);
        }
        // Perfectly static: The handle no longer shifts physically.
        handle.pos = k.vec2(joyX, joyY); 

        const deadzone = maxDist * 0.2;
        touchInput.up = diff.y < -deadzone;
        touchInput.down = diff.y > deadzone;
        touchInput.left = diff.x < -deadzone;
        touchInput.right = diff.x > deadzone;

        // Visual direction feedback mapping to new sprites
        if (touchInput.up && touchInput.right) handle.play("up-right");
        else if (touchInput.up && touchInput.left) handle.play("up-left");
        else if (touchInput.down && touchInput.right) handle.play("down-right");
        else if (touchInput.down && touchInput.left) handle.play("down-left");
        else if (touchInput.up) handle.play("up");
        else if (touchInput.down) handle.play("down");
        else if (touchInput.left) handle.play("left");
        else if (touchInput.right) handle.play("right");
        else handle.play("knob");
    }

    // ── Pixel Art Action Buttons (Right) ──
    const atkR = Math.round(base * 0.14);
    const atkX = Math.round(w * 0.86);
    const atkY = Math.round(h * 0.76);

    // Basic Attack Button
    makeActionButton(k, atkX, atkY, atkR, "m", "ATK", [255, 70, 50], 'mTimer');

    // Skills Arc
    const arcDist = Math.round(base * 0.25);
    const skillR = Math.round(base * 0.08);

    const skills = [
        { key: "comma", label: "S1", angle: Math.PI, timerKey: "commaTimer" },
        { key: "period", label: "S2", angle: Math.PI * 1.25, timerKey: "periodTimer" },
        { key: "slash", label: "ULT", angle: Math.PI * 1.5, timerKey: "slashTimer" },
    ];

    skills.forEach(({ key, label, angle, timerKey }) => {
        const sx = atkX + Math.cos(angle) * arcDist;
        const sy = atkY + Math.sin(angle) * arcDist;
        makeActionButton(k, sx, sy, skillR, key, label, [40, 180, 255], timerKey);
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
        k.opacity(0.5),
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
            cdOverlay.opacity = 0.5;
            cdText.text = "ACT";
            cdText.color = k.rgb(147, 112, 219); // Purple
            isOnCooldown = true;
        } else if (touchPlayer && timerKey) {
            const timer = touchPlayer[timerKey];
            if (timer > 0) {
                isOnCooldown = true;
                cdOverlay.opacity = 0.65;
                cdText.text = Math.ceil(timer).toString();
                cdText.color = k.rgb(240, 220, 50); // Yellow
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
