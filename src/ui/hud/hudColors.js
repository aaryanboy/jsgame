// ── RPG HUD Color Palette ──
// Centralized retro pixel-art color definitions

export const HUD_COLORS = {
    // Diamond frame
    diamondBorder:   [65, 55, 90],
    diamondBody:     [28, 24, 42],
    diamondInner:    [35, 30, 52],

    // Skill slots
    slotBorder:      [85, 72, 115],
    slotBody:        [20, 16, 32],

    // Name panel
    panelMid:        [42, 36, 60],
    panelLo:         [25, 20, 38],

    // Skin box
    skinBoxBg:       [30, 25, 45],
    skinBorderWhite: [200, 195, 215],

    // Health bar
    hpBackground:    [48, 18, 25],
    hpBorder:        [72, 30, 40],
    hpFill:          [200, 55, 65],
    hpHighlight:     [230, 95, 105],
    hpShadowBand:    [150, 35, 45],

    // XP bar
    xpBackground:    [28, 28, 48],
    xpBorder:        [55, 55, 78],
    xpFill:          [75, 155, 225],

    // Common
    shadow:          [8, 6, 14],
    textWhite:       [225, 220, 240],
    textMuted:       [155, 148, 170],
    textShadow:      [18, 14, 28],

    // Resources
    gold:            [255, 200, 50],
    goldDark:        [175, 135, 15],
    gem:             [95, 195, 255],
    gemDark:         [45, 115, 195],
    soul:            [175, 115, 255],
    soulDark:        [115, 65, 195],

    // Skill slot accent colors (per position)
    slotAccent: {
        top:    [170, 145, 210],
        left:   [255, 165, 55],
        right:  [80, 155, 255],
        bottom: [255, 75, 75],
    },
};
