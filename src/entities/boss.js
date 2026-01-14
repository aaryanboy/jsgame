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
