// ── RPG HUD Layout Calculator ──
// All positions and sizes are computed from a single scale factor (S).
// Change values here to tweak positioning without touching render code.

export function getHudLayout(screenW, screenH) {
    // Tweak: minimum scale bumped up so it's readable on small screens
    const S = Math.max(1.8, Math.min(screenW, screenH) / 400);
    const shOff = Math.round(2 * S);

    // ── Diamond ──
    const bigDiamond   = Math.round(52 * S);
    const smallDiamond = Math.round(18 * S);
    const slotOffset   = Math.round(15 * S);
    const diamondCX    = Math.round(44 * S);
    const diamondCY    = Math.round(44 * S);

    // ── Right-side panel origin (tucked behind diamond) ──
    const panelX = diamondCX + Math.round(32 * S);
    const panelY = diamondCY - Math.round(15 * S);

    // ── Skin box ──
    const skinSize = Math.round(20 * S);

    // ── Name box ──
    const nameX = panelX + skinSize + Math.round(2 * S);
    const nameW = Math.round(150 * S);

    // ── Full width used by bars ──
    const fullW = skinSize + Math.round(2 * S) + nameW;

    // ── HP bar (parallelogram) ──
    const hpX    = panelX - Math.round(6 * S);
    const hpY    = panelY + skinSize + Math.round(2 * S);
    const hpW    = fullW + Math.round(8 * S);
    const hpH    = Math.round(10 * S);
    const hpSkew = Math.round(8 * S);

    // ── XP bar (thin parallelogram) ──
    const xpX    = hpX - Math.round(8 * S);
    const xpY    = hpY + hpH + Math.round(2 * S);
    const xpW    = hpW - Math.round(4 * S);
    const xpH    = Math.round(5 * S);
    const xpSkew = Math.round(5 * S);

    // ── Resource row ──
    const resY      = xpY + xpH + Math.round(8 * S);
    const resStartX = panelX - Math.round(5 * S);
    const resGap    = Math.round(50 * S);
    const iconRadius = Math.round(4 * S);

    // ── Fonts ──
    const fontBar = Math.round(8 * S);
    const fontRes = Math.round(7 * S);

    return {
        S, shOff,
        diamond: { cx: diamondCX, cy: diamondCY, big: bigDiamond, small: smallDiamond, slotOffset },
        skin:    { x: panelX, y: panelY, size: skinSize },
        name:    { x: nameX, y: panelY, w: nameW, h: skinSize },
        hp:      { x: hpX, y: hpY, w: hpW, h: hpH, skew: hpSkew },
        xp:      { x: xpX, y: xpY, w: xpW, h: xpH, skew: xpSkew },
        res:     { y: resY, startX: resStartX, gap: resGap, iconR: iconRadius },
        font:    { bar: fontBar, res: fontRes },
    };
}
