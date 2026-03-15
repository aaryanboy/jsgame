import kaboom from "kaboom";

export const k = kaboom({
  global: false,
  touchToMouse: true,
  canvas: document.getElementById("game"),
});

// ── Override default loading screen with pixel-block design ──

// 5×5 pixel font bitmasks
const FONT = {
    L: [0b10000, 0b10000, 0b10000, 0b10000, 0b11111],
    O: [0b01110, 0b10001, 0b10001, 0b10001, 0b01110],
    A: [0b01110, 0b10001, 0b11111, 0b10001, 0b10001],
    D: [0b11110, 0b10001, 0b10001, 0b10001, 0b11110],
    I: [0b11111, 0b00100, 0b00100, 0b00100, 0b11111],
    N: [0b10001, 0b11001, 0b10101, 0b10011, 0b10001],
    G: [0b01110, 0b10000, 0b10111, 0b10001, 0b01110],
    "%": [0b11001, 0b11010, 0b00100, 0b01011, 0b10011],
    "0": [0b01110, 0b10011, 0b10101, 0b11001, 0b01110],
    "1": [0b00100, 0b01100, 0b00100, 0b00100, 0b01110],
    "2": [0b01110, 0b10001, 0b00110, 0b01000, 0b11111],
    "3": [0b11110, 0b00001, 0b01110, 0b00001, 0b11110],
    "4": [0b10010, 0b10010, 0b11111, 0b00010, 0b00010],
    "5": [0b11111, 0b10000, 0b11110, 0b00001, 0b11110],
    "6": [0b01110, 0b10000, 0b11110, 0b10001, 0b01110],
    "7": [0b11111, 0b00001, 0b00010, 0b00100, 0b00100],
    "8": [0b01110, 0b10001, 0b01110, 0b10001, 0b01110],
    "9": [0b01110, 0b10001, 0b01111, 0b00001, 0b01110],
};

function drawBlockText(text, startX, startY, blockSize, gap, color) {
    const charGap = blockSize;
    let cursorX = startX;
    for (const ch of text) {
        const glyph = FONT[ch];
        if (!glyph) { cursorX += blockSize * 3; continue; }
        for (let row = 0; row < 5; row++) {
            for (let col = 0; col < 5; col++) {
                if (glyph[row] & (1 << (4 - col))) {
                    k.drawRect({
                        pos: k.vec2(cursorX + col * (blockSize + gap), startY + row * (blockSize + gap)),
                        width: blockSize, height: blockSize,
                        color: color,
                    });
                }
            }
        }
        cursorX += 5 * (blockSize + gap) + charGap;
    }
}

function getBlockTextWidth(text, blockSize, gap) {
    const charGap = blockSize;
    let w = 0;
    for (let i = 0; i < text.length; i++) {
        w += 5 * (blockSize + gap);
        if (i < text.length - 1) w += charGap;
    }
    return w;
}

// This replaces Kaboom's built-in loading screen
k.onLoading((progress) => {
    const w = k.width();
    const h = k.height();

    // Dark background
    k.drawRect({ pos: k.vec2(0, 0), width: w, height: h, color: k.rgb(10, 10, 15) });

    const scale = Math.min(w, h) / 600;

    // ── "LOADING" in pixel blocks ──
    const bs = Math.max(3, Math.round(6 * scale));
    const gp = Math.max(1, Math.round(1 * scale));
    const textW = getBlockTextWidth("LOADING", bs, gp);
    const textX = (w - textW) / 2;
    const textY = h * 0.36;
    drawBlockText("LOADING", textX, textY, bs, gp, k.rgb(255, 255, 255));

    // ── Progress Bar ──
    const barW = Math.round(Math.min(400 * scale, w * 0.6));
    const barH = Math.round(28 * scale);
    const barX = (w - barW) / 2;
    const barY = textY + 5 * (bs + gp) + Math.round(20 * scale);
    const bt = Math.max(3, Math.round(4 * scale));

    // Outer border (white)
    k.drawRect({ pos: k.vec2(barX, barY), width: barW, height: barH, color: k.rgb(255, 255, 255) });
    // Inner dark track
    k.drawRect({ pos: k.vec2(barX + bt, barY + bt), width: barW - bt * 2, height: barH - bt * 2, color: k.rgb(20, 20, 30) });
    // Green fill
    const fillW = (barW - bt * 2 - 4) * Math.min(1, Math.max(0, progress));
    if (fillW > 0) {
        k.drawRect({ pos: k.vec2(barX + bt + 2, barY + bt + 2), width: fillW, height: barH - bt * 2 - 4, color: k.rgb(76, 175, 80) });
    }

    // ── Percentage ──
    const pct = Math.floor(progress * 100);
    const pctStr = pct.toString() + "%";
    const pbs = Math.max(2, Math.round(4 * scale));
    const pgp = Math.max(1, Math.round(1 * scale));
    const pctW = getBlockTextWidth(pctStr, pbs, pgp);
    const pctX = (w - pctW) / 2;
    const pctY = barY + barH + Math.round(16 * scale);
    drawBlockText(pctStr, pctX, pctY, pbs, pgp, k.rgb(255, 255, 255));
});
