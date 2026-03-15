import { toggleSettingsMenu } from "../systems/settingsMenu.js";
import { revivePet } from "../entities/frog.js";

let hudPlayer = null;

// A persistent UI layer for top-corner buttons (Settings & Revive)
export function createGlobalHUD(k, player) {
    if (player) hudPlayer = player;
    hideGlobalHUD(k); // clear existing first

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
        k.color(108, 92, 231),
        k.opacity(0.3),
        k.fixed(),
        { z: 90 },
        "globalHUD"
    ]);

    // Dark circle bg
    const btnBg = k.add([
        k.circle(utilSize * 0.5),
        k.pos(x, y),
        k.anchor("center"),
        k.area(),
        k.color(18, 18, 18),
        k.outline(2, k.rgb(167, 139, 250)),
        k.fixed(),
        { z: 91 },
        "globalHUD"
    ]);

    // Stats Icon (renamed from Gear)
    const statsIcon = k.add([
        k.text("📊", { size: Math.round(utilSize * 0.5) }),
        k.pos(x, y),
        k.rotate(0),
        k.scale(1),
        k.anchor("center"),
        k.color(255, 255, 255),
        k.fixed(),
        { z: 92 },
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
                 k.color(108, 92, 231),
                 k.opacity(0.6),
                 k.fixed(),
                 { z: 93 },
                 "globalHUD"
             ]);
             k.tween(pulse.radius, utilSize * 2.5, 0.4, (v) => pulse.radius = v, k.easings.easeOutQuad);
             k.tween(pulse.opacity, 0, 0.4, (v) => pulse.opacity = v, k.easings.easeOutQuad).onEnd(() => k.destroy(pulse));

            toggleSettingsMenu(k);
        }
    });

    // NOTE: Removed the global "T" (revive) button because it has been converted to an in-world interactable hold-progress bar.
}

export function hideGlobalHUD(k) {
    k.destroyAll("globalHUD");
}

export function showGlobalHUD(k) {
    if (hudPlayer) createGlobalHUD(k, hudPlayer);
}
