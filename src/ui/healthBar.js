// Health Bar UI Component
import { gameConfig } from "../utils/constants.js";

export function createHealthBar(k, player) {
    const getMaxHealth = () => gameConfig.player.health;
    const barWidth = 320;
    const barHeight = 22;

    const healthContainer = k.add([
        k.pos(k.width() / 2 - barWidth / 2, k.height() - 95),
        k.fixed(),
        { z: 100 }
    ]);

    // Keep centered even if window resizes
    healthContainer.onUpdate(() => {
        healthContainer.pos.x = k.width() / 2 - barWidth / 2;
        healthContainer.pos.y = k.height() - 95;
    });

    healthContainer.add([
        k.rect(barWidth, barHeight, { radius: 4 }),
        k.pos(0, 0),
        k.color(20, 20, 20),
        k.outline(3, k.rgb(40, 50, 60))
    ]);

    const healthBar = healthContainer.add([
        k.rect(barWidth, barHeight, { radius: 4 }),
        k.pos(0, 0),
        k.color(40, 200, 60)
    ]);

    const hpText = healthContainer.add([
        k.text("100/100", { size: 16, font: "monospace", weight: "bold" }),
        k.pos(barWidth / 2, barHeight / 2),
        k.anchor("center"),
        k.color(255, 255, 255)
    ]);

    healthBar.onUpdate(() => {
        const maxHP = getMaxHealth();
        const ratio = player.health / maxHP;
        healthBar.width = barWidth * Math.max(0, ratio);
        hpText.text = `${Math.ceil(player.health)}/${maxHP}`;
        if (ratio < 0.3) healthBar.color = k.rgb(220, 40, 40);
        else if (ratio < 0.6) healthBar.color = k.rgb(255, 160, 20);
        else healthBar.color = k.rgb(40, 200, 60);
    });

    return healthContainer;
}
