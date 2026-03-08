// ── Dynamic Settings Layout Config ──
// All sizes are computed from screen dimensions (w, h) so the UI
// scales to fit any resolution.

/**
 * Returns the full layout configuration for the settings + skin panels.
 * Call with the current canvas width & height: getLayout(k.width(), k.height())
 */
export function getLayout(w, h) {
    const margin = Math.round(Math.max(16, Math.min(w, h) * 0.035));
    const gap = Math.round(Math.max(12, w * 0.025));

    // ── Settings panel (LEFT) ──
    const settingsW = Math.round(w * 0.44);
    const settingsH = h - margin * 2;
    const settingsX = margin;
    const settingsY = margin;

    // ── Skin panel (RIGHT, fills remaining space) ──
    const skinX = settingsX + settingsW + gap;
    const skinW = w - skinX - margin;
    const skinH = settingsH;
    const skinY = margin;

    // ── Responsive font sizes ──
    const base = Math.min(w, h);
    const fontSize = {
        title: Math.round(Math.max(24, base * 0.055)),   // "SETTINGS", "SELECT SKIN"
        subtitle: Math.round(Math.max(18, base * 0.035)),   // skin name, sub-titles
        button: Math.round(Math.max(16, base * 0.032)),   // menu button labels
        label: Math.round(Math.max(14, base * 0.028)),   // slider labels, control keys
        small: Math.round(Math.max(10, base * 0.02)),    // footer, hints
        toggle: Math.round(Math.max(12, base * 0.022)),   // ON/OFF text
        arrow: Math.round(Math.max(18, base * 0.035)),   // ◀ ▶ arrows
        selector: Math.round(Math.max(20, base * 0.04)),    // ▶ selector arrow
    };

    // ── Responsive element sizes ──
    const itemH = Math.round(Math.max(44, settingsH * 0.1));
    const itemGap = Math.round(Math.max(8, settingsH * 0.018));
    const itemPadX = Math.round(Math.max(30, settingsW * 0.1));
    const itemW = settingsW - itemPadX * 2;
    const itemStartY = settingsY + Math.round(settingsH * 0.2);

    const toggleW = Math.round(Math.max(60, itemW * 0.22));
    const toggleH = Math.round(Math.max(24, itemH * 0.5));
    const toggleKnobR = Math.round(toggleH * 0.42);

    // ── Split buttons (Resume/Restart) ──
    const splitBtnW = Math.round((itemW - gap) / 2);
    const splitBtnX1 = settingsX + itemPadX;
    const splitBtnX2 = splitBtnX1 + splitBtnW + gap;
    const splitBtnY = settingsY + settingsH - itemH - Math.round(margin * 1.5);

    // ── Skin panel elements ──
    const skinPreviewSize = Math.round(Math.max(100, Math.min(skinW, skinH) * 0.3));
    const skinPreviewScale = Math.max(4, Math.round(skinPreviewSize / 24));
    const skinPreviewCenterY = skinY + Math.round(skinH * 0.42);
    const skinArrowSize = Math.round(Math.max(36, Math.min(skinW, skinH) * 0.09));
    const skinArrowMargin = Math.round(Math.max(24, skinW * 0.08));

    const applyBtnW = Math.round(Math.max(160, skinW * 0.55));
    const applyBtnH = Math.round(Math.max(36, skinH * 0.065));

    // ── Sub-panel (Controls / Creative) — centered overlay ──
    const subPanelW = Math.round(w * 0.55);
    const subPanelH = Math.round(h * 0.88);
    const subPanelX = Math.round((w - subPanelW) / 2);
    const subPanelY = Math.round((h - subPanelH) / 2);

    // Controls
    const controlKeyW = Math.round(Math.max(70, subPanelW * 0.2));
    const controlKeyH = Math.round(Math.max(24, subPanelH * 0.04));
    const controlRowH = Math.round(Math.max(32, subPanelH * 0.065));

    // Creative sliders
    const sliderRowH = Math.round(Math.max(42, subPanelH * 0.08));
    const sliderTrackH = Math.round(Math.max(8, subPanelH * 0.014));
    const sliderKnobR = Math.round(Math.max(8, subPanelH * 0.017));

    // Shared buttons (back, reset, etc.)
    const actionBtnW = Math.round(Math.max(140, subPanelW * 0.32));
    const actionBtnH = Math.round(Math.max(32, subPanelH * 0.055));

    // Panel corner radius scales with size
    const radius = {
        panel: Math.round(Math.max(10, base * 0.02)),
        inner: Math.round(Math.max(6, base * 0.014)),
        item: Math.round(Math.max(6, base * 0.014)),
        btn: Math.round(Math.max(6, base * 0.012)),
    };

    // Decorative dots
    const dotRadius = Math.round(Math.max(3, base * 0.007));
    const dotSpacing = Math.round(Math.max(14, base * 0.028));

    return {
        margin, gap, w, h,

        settings: {
            x: settingsX, y: settingsY, w: settingsW, h: settingsH,
            itemX: settingsX + itemPadX,
            itemW, itemH, itemGap, itemStartY,
            splitBtnW, splitBtnX1, splitBtnX2, splitBtnY,
            titleY: settingsY + Math.round(settingsH * 0.08),
            dotsY: settingsY + Math.round(settingsH * 0.125),
            lineY: settingsY + Math.round(settingsH * 0.155),
            footerY: settingsY + settingsH - Math.round(margin * 0.9),
        },

        skin: {
            x: skinX, y: skinY, w: skinW, h: skinH,
            titleY: skinY + Math.round(skinH * 0.07),
            subtitleY: skinY + Math.round(skinH * 0.12),
            lineY: skinY + Math.round(skinH * 0.16),
            previewCenterY: skinPreviewCenterY,
            previewSize: skinPreviewSize,
            previewScale: skinPreviewScale,
            arrowSize: skinArrowSize,
            arrowMargin: skinArrowMargin,
            arrowY: skinPreviewCenterY - Math.round(skinArrowSize / 2),
            applyBtnW, applyBtnH,
            applyBtnY: skinY + skinH - Math.round(margin * 3),
        },

        sub: {
            x: subPanelX, y: subPanelY, w: subPanelW, h: subPanelH,
            titleY: subPanelY + Math.round(subPanelH * 0.06),
            lineY: subPanelY + Math.round(subPanelH * 0.10),
            contentStartY: subPanelY + Math.round(subPanelH * 0.13),
            controlKeyW, controlKeyH, controlRowH,
            sliderRowH, sliderTrackH, sliderKnobR,
            sliderStartY: subPanelY + Math.round(subPanelH * 0.14),
            actionBtnW, actionBtnH,
            actionBtnY: subPanelY + subPanelH - Math.round(margin * 2.5),
            navY: subPanelY + subPanelH - Math.round(subPanelH * 0.18),
        },

        fontSize,
        radius,
        dot: { radius: dotRadius, spacing: dotSpacing },

        toggle: {
            w: toggleW, h: toggleH, knobR: toggleKnobR,
        },
    };
}
