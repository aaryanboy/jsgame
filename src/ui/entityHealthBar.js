import { THEME } from "../utils/theme.js";

/**
 * Attach a floating health bar to any entity.
 * @param {Object} k       - Kaboom context
 * @param {Object} entity  - The entity to attach the bar to
 * @param {Object} options - Configuration
 * @param {number} options.maxHealth - Maximum health value (for bar scaling)
 * @param {number} [options.barWidth=30]   - Width in pixels
 * @param {number} [options.barHeight=4]   - Height in pixels
 * @param {number} [options.yOffset=-15]   - Y offset above center
 * @param {Array}  [options.fgColor=THEME.status.success] - Foreground (healthy) color
 * @param {Array}  [options.bgColor=THEME.status.error] - Background (damage) color
 */
export function createEntityHealthBar(k, entity, options = {}) {
    const {
        maxHealth,
        barWidth = 30,
        barHeight = 4,
        yOffset = -15,
        fgColor = THEME.status.success,
        bgColor = THEME.status.error,
    } = options;

    // Background (red/damage layer)
    entity.add([
        k.rect(barWidth, barHeight),
        k.pos(-barWidth / 2, yOffset),
        k.color(...bgColor),
    ]);

    // Foreground (green/health layer)
    const hpBar = entity.add([
        k.rect(barWidth, barHeight),
        k.pos(-barWidth / 2, yOffset),
        k.color(...fgColor),
    ]);

    // Update every frame
    hpBar.onUpdate(() => {
        const max = maxHealth ?? entity.maxHealth ?? 100;
        hpBar.width = barWidth * Math.max(0, entity.health / max);
    });

    return hpBar;
}
