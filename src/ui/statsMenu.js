// ── Pixel-Art RPG HUD — Main Entry ──
// Composes the full HUD from modular components.
//
// File structure:
//   hud/hudColors.js  — Color palette
//   hud/hudLayout.js  — Layout/position calculator
//   statsMenu.js      — This file (assembly + render)

import { gameConfig, skills, Z } from "../utils/constants.js";
import { isTouchMode } from "./touchControls.js";
import { gameState } from "../utils/utils.js";
import { THEME } from "../utils/theme.js";
import { getHudLayout } from "./hud/hudLayout.js";

const C = THEME.hud;
const P = THEME.palette;
const R = THEME.resources;
const S_ACC = THEME.slotAccents;

export function createStatsMenu(k, player) {
    const isTouch = isTouchMode();
    if (k.get("statsMenu").length > 0) return;

    const L = getHudLayout(k.width(), k.height(), isTouch);
    const S = L.S;
    const sh = L.shOff;

    // ════════════════════════════════════════
    //  BACK LAYER — info panels (behind diamond)
    // ════════════════════════════════════════
    const back = k.add([k.pos(0, 0), k.fixed(), k.stay(["main", "map", "area", "boss"]), { z: Z.hudBack }, "statsMenu"]);

    drawSkinBox(k, back, L, S, sh);
    drawNameBox(k, back, L, S, sh);
    drawHealthBar(k, back, L, S, sh, player);
    drawXpBar(k, back, L, S, sh);
    drawResourceRow(k, back, L, S, sh);

    // ════════════════════════════════════════
    //  FRONT LAYER — diamond on top
    // ════════════════════════════════════════
    const front = k.add([k.pos(0, 0), k.fixed(), k.stay(["main", "map", "area", "boss"]), { z: Z.hudFront }, "statsMenu"]);

    drawDiamond(k, front, L, S, sh);
    drawSkillSlots(k, front, L, S, sh, player);
}

// ─────────────────────────────────────────────
//  SKIN BOX — player head portrait
// ─────────────────────────────────────────────
function drawSkinBox(k, parent, L, S, sh) {
    const { x, y, size } = L.skin;

    // Shadow
    parent.add([
        k.rect(size, size),
        k.pos(x + sh, y + sh),
        k.color(...P.shadowLight), k.opacity(0.6),
    ]);
    // Body
    parent.add([
        k.rect(size, size),
        k.pos(x, y),
        k.color(...C.skinBoxBg),
    ]);
    // White border — top
    parent.add([
        k.rect(size, Math.round(1.5 * S)),
        k.pos(x, y),
        k.color(...C.skinBorderWhite),
    ]);
    // White border — right
    parent.add([
        k.rect(Math.round(1.5 * S), size),
        k.pos(x + size - Math.round(1.5 * S), y),
        k.color(...C.skinBorderWhite),
    ]);
    // Player sprite
    const skinSprite = parent.add([
        k.sprite(`skin_${gameConfig.player.skinIndex}`, { anim: "idle-down" }),
        k.pos(x + size / 2, y + size / 2),
        k.anchor("center"),
        k.scale(Math.max(1, Math.round(1.4 * S))),
    ]);

    let lastSkinIndex = gameConfig.player.skinIndex;
    skinSprite.onUpdate(() => {
        if (gameConfig.player.skinIndex !== lastSkinIndex) {
            lastSkinIndex = gameConfig.player.skinIndex;
            skinSprite.use(k.sprite(`skin_${lastSkinIndex}`, { anim: "idle-down" }));
        }
    });
}

// ─────────────────────────────────────────────
//  NAME BOX — player name label
// ─────────────────────────────────────────────
function drawNameBox(k, parent, L, S, sh) {
    const { x, y, w, h } = L.name;
    const fontSize = L.font.bar;

    // Shadow
    parent.add([
        k.rect(w, h),
        k.pos(x + sh, y + sh),
        k.color(...P.shadowLight), k.opacity(0.5),
    ]);
    // Body
    parent.add([
        k.rect(w, h),
        k.pos(x, y),
        k.color(...C.panelMid),
    ]);
    // Text shadow
    parent.add([
        k.text("Necromancer", { size: fontSize, font: "monospace", weight: "bold" }),
        k.pos(x + Math.round(8 * S) + 1, y + h / 2 + 1),
        k.anchor("left"), k.color(...C.textDark),
    ]);
    // Text
    parent.add([
        k.text("Necromancer", { size: fontSize, font: "monospace", weight: "bold" }),
        k.pos(x + Math.round(8 * S), y + h / 2),
        k.anchor("left"), k.color(...C.textMax),
    ]);
}

// ─────────────────────────────────────────────
//  HEALTH BAR — parallelogram with dynamic fill
// ─────────────────────────────────────────────
function drawHealthBar(k, parent, L, S, sh, player) {
    const { x, y, w, h, skew } = L.hp;
    const fontSize = L.font.bar;

    // Shadow
    parent.add([
        k.polygon([
            k.vec2(skew + sh, sh), k.vec2(w + sh, sh),
            k.vec2(w - skew + sh, h + sh), k.vec2(sh, h + sh),
        ]),
        k.pos(x, y), k.color(...P.shadowLight), k.opacity(0.6),
    ]);
    // Track
    parent.add([
        k.polygon([
            k.vec2(skew, 0), k.vec2(w, 0),
            k.vec2(w - skew, h), k.vec2(0, h),
        ]),
        k.pos(x, y), k.color(...C.hpBg),
        k.outline(Math.round(1.5 * S), k.rgb(...C.hpBorder)),
    ]);
    // Fill
    const hpFill = parent.add([
        k.polygon([
            k.vec2(skew, 1), k.vec2(w - 1, 1),
            k.vec2(w - skew - 1, h - 1), k.vec2(1, h - 1),
        ]),
        k.pos(x, y), k.color(...C.hpFill),
    ]);
    // Highlight band (top 35%)
    parent.add([
        k.polygon([
            k.vec2(skew + 1, 2), k.vec2(w - 2, 2),
            k.vec2(w - 3, Math.round(h * 0.35)),
            k.vec2(skew, Math.round(h * 0.35)),
        ]),
        k.pos(x, y), k.color(...C.hpHighlight), k.opacity(0.35),
    ]);
    // Dark band (bottom 28%)
    parent.add([
        k.polygon([
            k.vec2(2, Math.round(h * 0.72)),
            k.vec2(w - skew - 2, Math.round(h * 0.72)),
            k.vec2(w - skew - 1, h - 2),
            k.vec2(1, h - 2),
        ]),
        k.pos(x, y), k.color(...C.hpShadowBand), k.opacity(0.3),
    ]);
    // HP text (shadow + text)
    const hpTextSh = parent.add([
        k.text("", { size: fontSize, font: "monospace", weight: "bold" }),
        k.pos(x + w / 2 + 1, y + h / 2 + 1),
        k.anchor("center"), k.color(...C.textDark),
    ]);
    const hpText = parent.add([
        k.text("", { size: fontSize, font: "monospace", weight: "bold" }),
        k.pos(x + w / 2, y + h / 2),
        k.anchor("center"), k.color(...C.textMax),
    ]);

    // Dynamic update
    hpFill.onUpdate(() => {
        const p = k.get("player")[0];
        if (!p) return;
        
        const max = gameConfig.player.health;
        const cur = Math.max(0, p.health);
        const r = Math.max(0, Math.min(1, cur / max));
        if (r > 0) {
            hpFill.opacity = 1;
            const fw = (w - 2) * r;
            hpFill.pts = [
                k.vec2(skew, 1),
                k.vec2(skew + fw - skew * r, 1),
                k.vec2(fw - skew * r, h - 1),
                k.vec2(1, h - 1),
            ];
        } else { hpFill.opacity = 0; }
        const t = `${Math.ceil(cur)} / ${max}`;
        hpText.text = t;
        hpTextSh.text = t;
    });
}

// ─────────────────────────────────────────────
//  XP BAR — thin parallelogram
// ─────────────────────────────────────────────
function drawXpBar(k, parent, L, S, sh) {
    const { x, y, w, h, skew } = L.xp;

    // Shadow
    parent.add([
        k.polygon([
            k.vec2(skew + sh, sh), k.vec2(w + sh, sh),
            k.vec2(w - skew + sh, h + sh), k.vec2(sh, h + sh),
        ]),
        k.pos(x, y), k.color(...P.shadowLight), k.opacity(0.5),
    ]);
    // Track
    parent.add([
        k.polygon([
            k.vec2(skew, 0), k.vec2(w, 0),
            k.vec2(w - skew, h), k.vec2(0, h),
        ]),
        k.pos(x, y), k.color(...C.xpBg),
        k.outline(Math.round(S), k.rgb(...C.xpBorder)),
    ]);
    // Fill (0% placeholder — hook into XP system later)
    parent.add([
        k.polygon([
            k.vec2(skew, 1), k.vec2(skew, 1),
            k.vec2(0, h - 1), k.vec2(1, h - 1),
        ]),
        k.pos(x, y), k.color(...C.xpFill), k.opacity(0),
    ]);
    // Shine line
    parent.add([
        k.polygon([
            k.vec2(skew + 1, 1), k.vec2(w - 2, 1),
            k.vec2(w - 2, Math.max(1, Math.round(S * 1.5))),
            k.vec2(skew, Math.max(1, Math.round(S * 1.5))),
        ]),
        k.pos(x, y), k.color(120, 190, 255), k.opacity(0.15),
    ]);
}

// ─────────────────────────────────────────────
//  RESOURCE ROW — Gold, Gem, Soul
// ─────────────────────────────────────────────
function drawResourceRow(k, parent, L, S, sh) {
    const { y, startX, gap, iconR } = L.res;
    const fontSize = L.font.res;

    const resources = [
        { color: R.gold, dark: R.goldD, shape: "circle", value: "50" },
        { color: R.gem, dark: R.gemD, shape: "diamond", value: "50" },
        { color: R.soul, dark: R.soulD, shape: "flame", value: "5" },
    ];

    resources.forEach((res, i) => {
        const rx = startX + i * gap;
        const r = iconR;

        // Draw icon based on shape
        if (res.shape === "circle") {
            parent.add([k.circle(r), k.pos(rx + 1, y + 1), k.anchor("center"), k.color(...P.shadowLight), k.opacity(0.5)]);
            parent.add([k.circle(r), k.pos(rx, y), k.anchor("center"), k.color(...res.color), k.outline(1, k.rgb(...res.dark))]);
            parent.add([k.text("$", { size: Math.round(r * 0.9), font: "monospace", weight: "bold" }), k.pos(rx, y), k.anchor("center"), k.color(...res.dark)]);
        } else if (res.shape === "diamond") {
            const pts = [k.vec2(0, -r), k.vec2(r * 0.6, 0), k.vec2(0, r), k.vec2(-r * 0.6, 0)];
            parent.add([k.polygon(pts), k.pos(rx + 1, y + 1), k.color(...P.shadowLight), k.opacity(0.5)]);
            parent.add([k.polygon(pts), k.pos(rx, y), k.color(...res.color), k.outline(1, k.rgb(...res.dark))]);
        } else {
            const pts = [k.vec2(0, -r), k.vec2(r * 0.5, r * 0.4), k.vec2(0, r), k.vec2(-r * 0.5, r * 0.4)];
            parent.add([k.polygon(pts), k.pos(rx + 1, y + 1), k.color(...P.shadowLight), k.opacity(0.5)]);
            parent.add([k.polygon(pts), k.pos(rx, y), k.color(...res.color), k.outline(1, k.rgb(...res.dark))]);
        }

        // Value text (shadow + text)
        const tx = rx + r + Math.round(4 * S);
        parent.add([k.text(res.value, { size: fontSize, font: "monospace" }), k.pos(tx + 1, y + 1), k.anchor("left"), k.color(...THEME.palette.shadow)]);
        parent.add([k.text(res.value, { size: fontSize, font: "monospace" }), k.pos(tx, y), k.anchor("left"), k.color(...P.muted)]);
    });
}

// ─────────────────────────────────────────────
//  DIAMOND — large rotated container
// ─────────────────────────────────────────────
function drawDiamond(k, parent, L, S, sh) {
    const { cx, cy, big } = L.diamond;

    // Shadow
    parent.add([
        k.rect(big, big),
        k.pos(cx + sh, cy + sh), k.anchor("center"), k.rotate(45),
        k.color(...P.shadowLight), k.opacity(0.7),
    ]);
    // Outer border
    parent.add([
        k.rect(big + Math.round(3 * S), big + Math.round(3 * S)),
        k.pos(cx, cy), k.anchor("center"), k.rotate(45),
        k.color(...C.diamondBorder),
    ]);
    // Body
    parent.add([
        k.rect(big, big),
        k.pos(cx, cy), k.anchor("center"), k.rotate(45),
        k.color(...C.diamondBody),
    ]);
    // Inner accent
    parent.add([
        k.rect(big - Math.round(5 * S), big - Math.round(5 * S)),
        k.pos(cx, cy), k.anchor("center"), k.rotate(45),
        k.color(...C.diamondInner), k.outline(1, k.rgb(...C.diamondBorder)),
    ]);
}

// ─────────────────────────────────────────────
//  SKILL SLOTS — 4 diamonds in cross pattern
// ─────────────────────────────────────────────
function drawSkillSlots(k, parent, L, S, sh) {
    const { cx, cy, small, slotOffset } = L.diamond;
    const fontSize = L.font.bar;

    const equippedSkills = {
        top: "slash", left: "comma", right: "period", bottom: "m"
    };

    const timerKeys = { m: "mTimer", comma: "commaTimer", period: "periodTimer", slash: "slashTimer" };
    const keyLabels = { m: "M", comma: ",", period: ".", slash: "/" };

    const positions = {
        top: k.vec2(0, -slotOffset),
        left: k.vec2(-slotOffset, 0),
        right: k.vec2(slotOffset, 0),
        bottom: k.vec2(0, slotOffset),
    };

    Object.entries(positions).forEach(([slotId, offset]) => {
        const skillKey = equippedSkills[slotId];
        const skillData = skills[skillKey];
        if (!skillData) return;

        const slotX = cx + offset.x;
        const slotY = cy + offset.y;
        const accent = S_ACC[slotId];

        // Shadow
        parent.add([k.rect(small, small), k.pos(slotX + 1, slotY + 2), k.anchor("center"), k.rotate(45), k.color(...P.shadowLight), k.opacity(0.55)]);
        // Border glow
        parent.add([k.rect(small + 2, small + 2), k.pos(slotX, slotY), k.anchor("center"), k.rotate(45), k.color(...accent), k.opacity(0.45)]);
        // Body
        parent.add([k.rect(small, small), k.pos(slotX, slotY), k.anchor("center"), k.rotate(45), k.color(...C.slotBody), k.outline(1, k.rgb(...accent))]);
        // Skill color fill
        parent.add([k.rect(small - Math.round(3 * S), small - Math.round(3 * S)), k.pos(slotX, slotY), k.anchor("center"), k.rotate(45), k.color(...skillData.iconColor), k.opacity(0.85)]);
        // Highlight edge
        parent.add([k.rect(small - Math.round(3 * S), Math.max(1, Math.round(S * 0.8))), k.pos(slotX, slotY - 1), k.anchor("center"), k.rotate(45), k.color(255, 255, 255), k.opacity(0.2)]);
        // Key label (shadow + text)
        const label = keyLabels[skillKey] || skillKey.toUpperCase();
        parent.add([k.text(label, { size: Math.round(7 * S), font: "monospace", weight: "bold" }), k.pos(slotX + 1, slotY + 1), k.anchor("center"), k.color(...C.textDark)]);
        parent.add([k.text(label, { size: Math.round(7 * S), font: "monospace", weight: "bold" }), k.pos(slotX, slotY), k.anchor("center"), k.color(...P.white)]);

        // Cooldown overlay + text
        const cdOverlay = parent.add([k.rect(small - 2, small - 2), k.pos(slotX, slotY), k.anchor("center"), k.rotate(45), k.color(0, 0, 0), k.opacity(0)]);
        const cdText = parent.add([k.text("", { size: Math.round(9 * S), font: "monospace", weight: "bold" }), k.pos(slotX, slotY), k.anchor("center"), k.color(240, 220, 50)]);
        const timerKey = timerKeys[skillKey];

        cdOverlay.onUpdate(() => {
            const p = k.get("player")[0];
            if (!p) return;

            if (skillKey === "slash" && gameState.isTimeStopped) {
                cdOverlay.opacity = 0.55;
                cdText.text = "⏱";
                cdText.color = k.rgb(147, 112, 219);
            } else if (p[timerKey] > 0) {
                cdOverlay.opacity = 0.65;
                cdText.text = Math.ceil(p[timerKey]).toString();
                cdText.color = k.rgb(240, 220, 50);
            } else {
                cdOverlay.opacity = 0;
                cdText.text = "";
            }
        });
    });
}
