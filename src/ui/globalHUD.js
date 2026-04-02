import { THEME } from "../utils/theme.js";
import { Z } from "../utils/constants.js";
import { gameState } from "../utils/utils.js";
import { toggleSettingsMenu } from "../systems/settingsMenu.js";

let hudPlayer = null;

// A persistent UI layer for top-corner buttons (Settings & Revive)
export function createGlobalHUD(k, player) {
    if (player) hudPlayer = player;
    if (k.get("globalHUD").length > 0) return;

    const w = k.width(), h = k.height();
    const base = Math.min(w, h);
    // Tweak: minimum size bumped for small screens
    const utilSize = Math.round(Math.max(40, base * 0.07));

    const x = Math.round(w * 0.94);
    const y = Math.round(h * 0.06);

    // Glow behind the button
    const glow = k.add([
        k.circle(utilSize * 0.6),
        k.pos(x, y),
        k.anchor("center"),
        k.color(...THEME.brand.secondary),
        k.opacity(0.3),
        k.fixed(),
        k.stay(["main", "map", "area", "boss"]),
        { z: Z.hudBack },
        "globalHUD"
    ]);

    // Dark circle bg
    const btnBg = k.add([
        k.circle(utilSize * 0.5),
        k.pos(x, y),
        k.anchor("center"),
        k.area(),
        k.color(...THEME.palette.bg),
        k.outline(2, k.rgb(...THEME.brand.primary)),
        k.fixed(),
        k.stay(["main", "map", "area", "boss"]),
        { z: Z.hudFront },
        "globalHUD"
    ]);

    // Stats Icon (renamed from Gear)
    const statsIcon = k.add([
        k.text("📊", { size: Math.round(utilSize * 0.5) }),
        k.pos(x, y),
        k.rotate(0),
        k.scale(1),
        k.anchor("center"),
        k.color(...THEME.palette.white),
        k.fixed(),
        k.stay(["main", "map", "area", "boss"]),
        { z: Z.hudFront + 1 },
        "globalHUD"
    ]);

    let hoverTween = null;

    btnBg.onHoverUpdate(() => {
        document.body.style.cursor = "pointer";
        glow.opacity = 0.6;
        if (!hoverTween) {
            hoverTween = k.tween(statsIcon.scale, k.vec2(1.2), 0.15, (v) => statsIcon.scale = v, k.easings.easeOutQuad)
                .onEnd(() => {
                    k.tween(statsIcon.scale, k.vec2(1), 0.15, (v) => statsIcon.scale = v, k.easings.easeOutQuad);
                });
        }
    });

    btnBg.onHoverEnd(() => {
        document.body.style.cursor = "default";
        glow.opacity = 0.3;
        k.tween(statsIcon.scale, k.vec2(1), 0.2, (v) => statsIcon.scale = v, k.easings.easeOutQuad);
        hoverTween = null;
    });

    btnBg.onClick(() => {
        if (!k.get("settingsMenu").length) {
            k.tween(statsIcon.scale, k.vec2(1.5), 0.2, (v) => statsIcon.scale = v, k.easings.easeOutCubic)
             .onEnd(() => {
                 statsIcon.scale = k.vec2(1);
             });

             const pulse = k.add([
                 k.circle(utilSize * 0.5),
                 k.pos(x, y),
                 k.anchor("center"),
                 k.color(...THEME.brand.secondary),
                 k.opacity(0.6),
                 k.fixed(),
                 { z: Z.hudFront + 2 },
                 "globalHUD"
             ]);
             k.tween(pulse.radius, utilSize * 2.5, 0.4, (v) => pulse.radius = v, k.easings.easeOutQuad);
             k.tween(pulse.opacity, 0, 0.4, (v) => pulse.opacity = v, k.easings.easeOutQuad).onEnd(() => k.destroy(pulse));

            toggleSettingsMenu(k);
        }
    });

    // NOTE: Removed the global "T" (revive) button because it has been converted to an in-world interactable hold-progress bar.

    const centerX = w / 2;

    // --- XP BAR (Top Center) ---
    const barW = 200;
    const barH = 8;
    const barX = centerX - barW / 2;
    const barY = 20;

    const xpBg = k.add([
        k.rect(barW, barH, { radius: 4 }),
        k.pos(barX, barY),
        k.color(20, 20, 20),
        k.outline(1, k.rgb(60, 60, 60)),
        k.fixed(),
        k.stay(["main", "map", "area", "boss"]),
        { z: Z.hudBack },
        "globalHUD"
    ]);

    const xpFill = k.add([
        k.rect(0, barH, { radius: 4 }),
        k.pos(barX, barY),
        k.color(...THEME.brand.primary),
        k.fixed(),
        k.stay(["main", "map", "area", "boss"]),
        { z: Z.hudFront },
        "globalHUD"
    ]);

    const lvlText = k.add([
        k.text(`LVL ${gameState.player.level}`, { size: 12, font: "monospace" }),
        k.pos(centerX, barY + barH + 8),
        k.anchor("center"),
        k.color(255, 255, 255),
        k.fixed(),
        k.stay(["main", "map", "area", "boss"]),
        { z: Z.hudFront },
        "globalHUD"
    ]);

    k.onUpdate(() => {
        const p = gameState.player;
        const targetWidth = barW * (p.xp / p.xpToNext);
        xpFill.width = k.lerp(xpFill.width, targetWidth, 0.1);
        lvlText.text = `LVL ${p.level}`;
    });

    // --- SKILL MENU BUTTON (Top Right, next to Stats) ---
    const skillBtnX = x - utilSize - 10;
    const skillBtnBg = k.add([
        k.circle(utilSize * 0.5),
        k.pos(skillBtnX, y),
        k.anchor("center"),
        k.area(),
        k.color(...THEME.palette.bg),
        k.outline(2, k.rgb(...THEME.brand.primary)),
        k.fixed(),
        k.stay(["main", "map", "area", "boss"]),
        { z: Z.hudFront },
        "globalHUD"
    ]);

    const skillIcon = k.add([
        k.text("💠", { size: Math.round(utilSize * 0.5) }),
        k.pos(skillBtnX, y),
        k.anchor("center"),
        k.fixed(),
        k.stay(["main", "map", "area", "boss"]),
        { z: Z.hudFront + 1 },
        "globalHUD"
    ]);

    skillBtnBg.onClick(() => {
        import("./skillMenu.js").then(m => m.toggleSkillMenu(k, hudPlayer));
    });

    skillBtnBg.onHoverUpdate(() => {
        document.body.style.cursor = "pointer";
        skillIcon.scale = k.vec2(1.2);
    });
    skillBtnBg.onHoverEnd(() => {
        document.body.style.cursor = "default";
        skillIcon.scale = k.vec2(1);
    });

    // --- STATS MENU BUTTON (Existing) ---
    // ... (rest of the stats button logic stays same)
}

export function hideGlobalHUD(k) {
    k.destroyAll("globalHUD");
}

export function showGlobalHUD(k) {
    if (hudPlayer) createGlobalHUD(k, hudPlayer);
}
