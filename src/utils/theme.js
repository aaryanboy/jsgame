// ── Unified Project Theme ──
// central location for all colors and visual styles

export const THEME = {
    // Premium Dark Palette
    palette: {
        bg:          [18, 18, 18],     // #121212
        bgInner:     [26, 26, 28],     // Sleek dark inner
        border:      [75, 60, 140],    // Subtle purple border
        separator:   [45, 45, 50],     // Dark gray separator
        shadow:      [0, 0, 0],        // Pure black drops
        shadowLight: [8, 6, 14],       // HUD-style translucent shadow
        white:       [245, 245, 250],
        muted:       [180, 180, 190],
    },

    // HUD Specific Colors (Stats Menu)
    hud: {
        diamondBorder:   [65, 55, 90],
        diamondBody:     [28, 24, 42],
        diamondInner:    [35, 30, 52],

        slotBorder:      [85, 72, 115],
        slotBody:        [20, 16, 32],

        panelMid:        [42, 36, 60],
        panelLo:         [25, 20, 38],

        skinBoxBg:       [30, 25, 45],
        skinBorderWhite: [200, 195, 215],

        hpBg:            [48, 18, 25],
        hpBorder:        [72, 30, 40],
        hpFill:          [200, 55, 65],
        hpHighlight:     [230, 95, 105],
        hpShadowBand:    [150, 35, 45],

        xpBg:            [28, 28, 48],
        xpBorder:        [55, 55, 78],
        xpFill:          [75, 155, 225],

        textMax:         [225, 220, 240],
        textMid:         [155, 148, 170],
        textDark:        [18, 14, 28],
    },

    // Brand & Status Colors
    brand: {
        primary:   [167, 139, 250],    // Vibrant Purple
        secondary: [108, 92, 231],     // Deep Purple
        accent:    [170, 145, 210],    // Light Purple/Skill
    },

    status: {
        success:   [52, 211, 153],     // Emerald
        successDk: [16, 185, 129],
        error:     [248, 113, 113],     // Rose
        errorDk:   [239, 68, 68],
        info:      [96, 165, 250],      // Sky
        infoDk:    [59, 130, 246],
        warning:   [251, 191, 36],      // Gold
        warningDk: [175, 135, 15],
    },

    // Resource Palette
    resources: {
        gold:  [255, 200, 50],
        goldD: [175, 135, 15],
        gem:   [95, 195, 255],
        gemD:  [45, 115, 195],
        soul:  [175, 115, 255],
        soulD: [115, 65, 195],
    },

    // Skill Slot Accent Colors
    slotAccents: {
        top:    [170, 145, 210],
        left:   [255, 165, 55],
        right:  [80, 155, 255],
        bottom: [255, 75, 75],
    }
};
