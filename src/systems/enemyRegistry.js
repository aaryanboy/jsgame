// ── Enemy Registry ──
// Define all enemy types here. To add a new enemy:
//   1. Add a sprite to loader.js
//   2. Add an entry to ENEMY_REGISTRY below
//   3. Place spawn points in your Tiled map with the enemy's `type` as the name
//
// The roomManager will automatically spawn enemies from the registry.

import { gameConfig, scaleFactor, Z, TAGS, RANGES } from "../utils/constants.js";
import { createEntityHealthBar } from "../ui/entityHealthBar.js";
import { setupEnemyMovement } from "./enemyMovement.js";
import { setupBossAI } from "./bossAI.js";
import { calculateDamage, isLastHitCritical } from "./damage.js";
import { gameState } from "../utils/utils.js";
import { getTimeScale } from "./timeStop.js";

/**
 * Enemy Registry — central definition for all enemy/mob types.
 *
 * Each entry defines:
 *   sprite      — Kaboom sprite name (must be loaded in loader.js)
 *   stats       — { health, damage, speed } (can be a function for dynamic values)
 *   scale       — render scale multiplier (relative to scaleFactor)
 *   ai          — "patrol" | "boss" | "chase" | "static"
 *   healthBar   — { width, height, yOffset } or false to hide
 *   onDeath     — optional callback (k, pos, player) called when enemy dies
 *   loot        — reserved for future drop tables
 */
export const ENEMY_REGISTRY = {
    // The main boss — reads from gameConfig so creative mode works
    Boss: {
        sprite: "boss",
        stats: () => ({
            health: gameConfig.boss.health,
            damage: gameConfig.boss.damage,
            speed: gameConfig.boss.speed,
        }),
        scale: 1,
        ai: "boss",
        healthBar: { width: 40, height: 4, yOffset: -20 },
        onDeath: (k, pos, player) => {
            k.add([
                k.text("VICTORY!", { size: 64, font: "monospace" }),
                k.pos(k.center()),
                k.anchor("center"),
                k.color(255, 215, 0),
                k.fixed(),
                { z: Z.menu },
            ]);
            k.wait(3, () => k.go("map"));
        },
    },

    // ── Template for adding new enemies ──
    // Uncomment and customize to add a new enemy type:
    //
    // Slime: {
    //     sprite: "slime",          // must be loaded in loader.js
    //     stats: () => ({ health: 30, damage: 5, speed: 60 }),
    //     scale: 0.8,
    //     ai: "chase",              // chase the player
    //     healthBar: { width: 20, height: 3, yOffset: -12 },
    //     onDeath: (k, pos) => {
    //         // drop item, play effect, etc.
    //     },
    // },
    //
    // Skeleton: {
    //     sprite: "skeleton",
    //     stats: { health: 50, damage: 12, speed: 80 },
    //     scale: 1,
    //     ai: "patrol",
    //     healthBar: { width: 30, height: 4, yOffset: -16 },
    // },
};

/**
 * Create an enemy from the registry.
 * @param {Object} k         - Kaboom context
 * @param {string} type      - Key in ENEMY_REGISTRY (e.g. "Boss", "Slime")
 * @param {Object} pos       - k.vec2 spawn position
 * @param {Object} player    - Player entity (for AI targeting)
 * @returns {Object|null}    - The spawned enemy entity, or null if type unknown
 */
export function createEnemy(k, type, pos, player) {
    const def = ENEMY_REGISTRY[type];
    if (!def) return null;

    // Resolve stats — support both objects and functions
    const rawStats = typeof def.stats === "function" ? def.stats() : { ...def.stats };

    const enemy = k.make([
        k.sprite(def.sprite, { anim: "idle-down" }),
        k.area({ shape: new k.Rect(k.vec2(0, 3), 10, 10) }),
        k.body(),
        k.anchor("center"),
        k.pos(pos),
        k.scale(scaleFactor * (def.scale ?? 1)),
        { z: Z.enemies },
        {
            health: rawStats.health,
            maxHealth: rawStats.health,
            damage: rawStats.damage,
            speed: rawStats.speed,
            enemyType: type,
        },
        type.toLowerCase(),  // tag (e.g. "boss", "slime")
        TAGS.enemy,             // generic enemy tag for shared logic
    ]);

    // ── Health bar ──
    if (def.healthBar !== false) {
        const hb = def.healthBar || { width: 30, height: 4, yOffset: -15 };
        createEntityHealthBar(k, enemy, {
            maxHealth: rawStats.health,
            barWidth: hb.width,
            barHeight: hb.height,
            yOffset: hb.yOffset,
        });
    }

    // ── AI behavior ──
    switch (def.ai) {
        case "boss":
            setupBossAI(k, enemy, player);
            break;
        case "patrol":
            setupEnemyMovement(k, enemy, rawStats.speed);
        case "chase":
            setupChaseAI(k, enemy, player, rawStats);
            break;
        case "patrol":
            setupEnemyMovement(k, enemy, rawStats.speed);
            break;
        case "static":
        default:
            // No movement
            break;
    }

    // ── Combat — receives damage from "attack" tag ──
    const XP_MAP = { Boss: 100, Slime: 20, Skeleton: 30 };
    
    k.onCollide(TAGS.attack, type.toLowerCase(), (attack) => {
        let totalDamage = calculateDamage(
            attack.damage,
            player.critDamage,
            player.critRate
        );
        enemy.health -= totalDamage;

        // hit colors, shake, etc.
        k.shake(isLastHitCritical() ? 8 : 4);
        enemy.color = k.rgb(255, 100, 100);
        k.wait(0.1, () => {
            if (enemy.exists()) enemy.color = k.rgb(255, 255, 255);
        });

        if (enemy.health <= 0) {
            const xp = XP_MAP[type] || 20;
            addXP(xp);
            if (def.onDeath) def.onDeath(k, enemy.pos, player);
            k.destroy(enemy);
        }
    });

    return enemy;
}

// ── Chase AI — follows player within range, deals contact damage ──
function setupChaseAI(k, enemy, player, stats) {
    const DETECT_RANGE = RANGES.npcDetect;
    const ATTACK_RANGE = RANGES.npcAttack;
    let hitCooldown = 0;

    enemy.onUpdate(() => {
        if (gameState.isPaused || gameState.isTimeStopped) return;

        const timeScale = getTimeScale();
        if (hitCooldown > 0) hitCooldown -= k.dt() * timeScale;

        const dist = enemy.pos.dist(player.pos);

        if (dist < DETECT_RANGE && dist > ATTACK_RANGE) {
            // Chase
            const dir = player.pos.sub(enemy.pos).unit();
            enemy.move(dir.scale(stats.speed * timeScale));

            const anim = Math.abs(dir.y) > Math.abs(dir.x)
                ? (dir.y > 0 ? "walk-down" : "walk-up")
                : (dir.x > 0 ? "walk-right" : "walk-left");
            if (enemy.curAnim() !== anim) enemy.play(anim);
        } else if (dist <= ATTACK_RANGE && hitCooldown <= 0) {
            // Contact damage
            if (!player.isInvulnerable) {
                player.health -= stats.damage;
                player.isInvulnerable = true;
                k.wait(0.5, () => (player.isInvulnerable = false));
                k.shake(3);
            }
            hitCooldown = 1.0;
        } else if (dist >= DETECT_RANGE) {
            if (enemy.curAnim() !== "idle-down") enemy.play("idle-down");
        }
    });
}
