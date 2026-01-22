import { scaleFactor } from "../utils/constants.js";
import { setupBossAI } from "../systems/bossAI.js";
import { calculateDamage } from "../systems/damage.js";

export function createBoss(k) {
    const boss = k.make([
        k.sprite("boss", { anim: "idle-down" }),
        k.area({ shape: new k.Rect(k.vec2(0, 3), 10, 10) }),
        k.body(),
        k.anchor("center"),
        k.pos(),
        k.scale(scaleFactor),
        { z: 2 },
        {
            health: 100,
            damage: 20,
            speed: 100,
        },
        "boss",
    ]);

    // Add Health Bar
    const barWidth = 40;
    const barHeight = 4;

    // Background (Red)
    boss.add([
        k.rect(barWidth, barHeight),
        k.pos(-barWidth / 2, -20),
        k.color(255, 0, 0),
    ]);

    // Foreground (Green)
    const hpBar = boss.add([
        k.rect(barWidth, barHeight),
        k.pos(-barWidth / 2, -20),
        k.color(0, 255, 0),
    ]);

    // Update HP Bar
    hpBar.onUpdate(() => {
        hpBar.width = barWidth * (boss.health / 100);
    });

    return boss;
}

export function setupBossLogic(k, boss, player) {
    // Advanced Boss AI
    setupBossAI(k, boss, player);

    // Collision/Combat logic
    k.onCollide("attack", "boss", () => {
        console.log("You hit the boss!");
        let totalDamage = calculateDamage(
            player.damage,
            player.critDamage,
            player.critRate
        );
        boss.health -= totalDamage;

        if (boss.health <= 0) {
            console.log("Boss defeated!");
            k.destroy(boss);

            // Victory Message
            k.add([
                k.text("VICTORY!", { size: 64, font: "monospace" }),
                k.pos(k.center()),
                k.anchor("center"),
                k.color(255, 215, 0), // Gold
                k.fixed(),
                { z: 100 }
            ]);

            // Teleport back to base after delay
            k.wait(3, () => {
                k.go("map");
            });
        }
    });
}
