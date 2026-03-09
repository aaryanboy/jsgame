import { scaleFactor, gameConfig } from "../utils/constants.js";
import { createEntityHealthBar } from "../ui/entityHealthBar.js";

/**
 * Creates a boss entity with stats from gameConfig.
 * Combat logic is now handled by enemyRegistry.js — use createEnemy("Boss", ...) for new spawns.
 * This factory is kept for backward compatibility and for cases where you need
 * the raw entity without the registry's combat/AI wiring.
 */
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
            health: gameConfig.boss.health,
            maxHealth: gameConfig.boss.health,
            damage: gameConfig.boss.damage,
            speed: gameConfig.boss.speed,
        },
        "boss",
        "enemy",
    ]);

    // Reusable health bar component
    createEntityHealthBar(k, boss, {
        maxHealth: gameConfig.boss.health,
        barWidth: 40,
        barHeight: 4,
        yOffset: -20,
    });

    return boss;
}
