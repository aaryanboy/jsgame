// Health Bar UI Component
export function createHealthBar(k, player) {
    const totalHealth = 100;
    const barWidth = 200;
    const barHeight = 20;

    const healthContainer = k.add([
        k.pos(k.width() - 260, 20),
        k.fixed(),
        { z: 100 }
    ]);

    healthContainer.add([
        k.text("HP", { size: 24, font: "monospace" }),
        k.pos(0, -5),
        k.color(255, 255, 255)
    ]);

    healthContainer.add([
        k.rect(barWidth, barHeight),
        k.pos(40, 0),
        k.color(50, 50, 50),
        k.outline(2, k.Color.WHITE)
    ]);

    const healthBar = healthContainer.add([
        k.rect(barWidth, barHeight),
        k.pos(40, 0),
        k.color(0, 255, 0)
    ]);

    const hpText = healthContainer.add([
        k.text("100/100", { size: 16, font: "monospace" }),
        k.pos(40 + barWidth / 2, barHeight / 2),
        k.anchor("center"),
        k.color(255, 255, 255)
    ]);

    healthBar.onUpdate(() => {
        const ratio = player.health / totalHealth;
        healthBar.width = barWidth * Math.max(0, ratio);
        hpText.text = `${Math.ceil(player.health)}/${totalHealth}`;
        if (ratio < 0.3) healthBar.color = k.rgb(255, 0, 0);
        else if (ratio < 0.6) healthBar.color = k.rgb(255, 165, 0);
        else healthBar.color = k.rgb(0, 255, 0);
    });

    return healthContainer;
}
