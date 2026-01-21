import { scaleFactor } from "../utils/constants.js";
import { setupEnemyMovement } from "../systems/enemyMovement.js";
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
            health: 50,
            damage: 10,
            speed: 50,
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
        hpBar.width = barWidth * (boss.health / 50); // Assuming max health is 50
    });

    return boss;
}

export function setupBossLogic(k, boss, player) {
    // Movement logic
    setupEnemyMovement(k, boss, boss.speed);

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
            boss.onUpdate = null; // Stop movement logic?
            boss.destroy();
        }
    });
}
