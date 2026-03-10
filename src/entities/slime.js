import { scaleFactor, gameConfig } from "../utils/constants.js";
import { gameState } from "../utils/utils.js";
import { getTimeScale } from "../systems/timeStop.js";
import { createEntityHealthBar } from "../ui/entityHealthBar.js";

/**
 * Creates a Slime enemy that chases and attacks the player.
 * Stats are read from gameConfig.slime so they can be tweaked in Creative Mode.
 * @param {any} k - Kaboom context
 * @param {any} pos - Spawn position
 * @param {any} player - Player object to target
 */
export function createSlime(k, pos, player) {
    const stats = gameConfig.slime;

    const slime = k.make([
        k.sprite("slime", { anim: "idle-down" }),
        k.area({ shape: new k.Rect(k.vec2(0, 4), 16, 16) }),
        k.body(),
        k.anchor("center"),
        k.pos(pos),
        k.scale(scaleFactor * 0.5),
        { z: 2 },
        {
            health: stats.health,
            maxHealth: stats.health,
            damage: stats.damage,
            speed: stats.speed,
            direction: "down",
            attackTimer: 0,
            isAttacking: false,
        },
        "slime",
        "enemy",
    ]);

    // Health bar
    createEntityHealthBar(k, slime, {
        maxHealth: stats.health,
        barWidth: 20,
        barHeight: 3,
        yOffset: -14,
    });

    // ── Main AI loop ──
    const STANDOFF = 80; // Stay this far from the player
    let preLungePos = null;

    slime.onUpdate(() => {
        if (gameState.isPaused || gameState.isTimeStopped) return;
        if (!player || !player.exists()) return;

        const timeScale = getTimeScale();

        // Tick attack cooldown
        if (slime.attackTimer > 0) slime.attackTimer -= k.dt() * timeScale;

        // Don't move or change anim during attack lunge
        if (slime.isAttacking) return;

        const dist = slime.pos.dist(player.pos);

        // Always face the player
        const diff = player.pos.sub(slime.pos);
        if (Math.abs(diff.x) > Math.abs(diff.y)) {
            slime.direction = diff.x > 0 ? "right" : "left";
        } else {
            slime.direction = diff.y > 0 ? "down" : "up";
        }

        if (dist < stats.detectRange) {
            if (dist > STANDOFF) {
                // ── Chase: approach to standoff distance ──
                const dir = diff.unit();
                slime.move(dir.scale(slime.speed * timeScale));
                playDirectionalAnim("walk");
            } else {
                // ── At standoff: idle and wait for attack cooldown ──
                playDirectionalAnim("idle");

                if (slime.attackTimer <= 0) {
                    performLungeAttack(player);
                }
            }
        } else {
            // ── Out of range: idle ──
            playDirectionalAnim("idle");
        }
    });

    // ── Lunge Attack: dash in → hit → retreat ──
    let pendingRetreat = false;

    // Single onAnimEnd handler (registered once, not per-attack)
    slime.onAnimEnd((anim) => {
        if (!anim.startsWith("attack") || !pendingRetreat) return;
        pendingRetreat = false;

        if (!slime.exists() || !preLungePos) {
            slime.isAttacking = false;
            return;
        }

        const retreatDir = preLungePos.sub(slime.pos).unit();
        const retreatDist = slime.pos.dist(preLungePos);
        const retreatSpeed = retreatDist / 0.2;
        let retreatTimer = 0;

        playDirectionalAnim("walk");

        const retreatUpdate = slime.onUpdate(() => {
            if (!slime.exists()) { retreatUpdate.cancel(); return; }
            retreatTimer += k.dt();
            if (retreatTimer < 0.2) {
                slime.move(retreatDir.scale(retreatSpeed));
            } else {
                retreatUpdate.cancel();
                slime.isAttacking = false;
                playDirectionalAnim("idle");
            }
        });
    });

    function performLungeAttack(target) {
        slime.isAttacking = true;
        slime.attackTimer = stats.attackCooldown;
        preLungePos = slime.pos.clone();
        pendingRetreat = true;

        // Face the player
        const diff = target.pos.sub(slime.pos);
        if (Math.abs(diff.x) > Math.abs(diff.y)) {
            slime.direction = diff.x > 0 ? "right" : "left";
        } else {
            slime.direction = diff.y > 0 ? "down" : "up";
        }

        // Play attack animation
        const attackDir = slime.direction === "left" ? "right" : slime.direction;
        slime.flipX = slime.direction === "left";
        slime.play(`attack-${attackDir}`);

        // Phase 1: Lunge toward player (0–0.15s)
        const lungeTarget = target.pos.clone();
        const lungeDir = lungeTarget.sub(slime.pos).unit();
        const lungeDist = slime.pos.dist(lungeTarget) - 10;
        const lungeSpeed = lungeDist / 0.15;

        let lungeTimer = 0;
        const lungeUpdate = slime.onUpdate(() => {
            if (!slime.exists()) { lungeUpdate.cancel(); return; }
            lungeTimer += k.dt();
            if (lungeTimer < 0.15) {
                slime.move(lungeDir.scale(lungeSpeed));
            }
        });

        // Phase 2: Deal damage at peak (0.15s)
        k.wait(0.15, () => {
            lungeUpdate.cancel();
            if (!slime.exists() || !target.exists()) return;

            if (!target.isInvulnerable) {
                target.health -= slime.damage;
                target.isInvulnerable = true;
                k.wait(0.5, () => {
                    if (target.exists()) target.isInvulnerable = false;
                });
                k.shake(3);
                target.color = k.rgb(255, 100, 100);
                k.wait(0.1, () => {
                    if (target.exists()) target.color = k.rgb(255, 255, 255);
                });
            }
        });
    }

    // ── Animation helper ──
    function playDirectionalAnim(prefix) {
        let animDir = slime.direction === "left" ? "right" : slime.direction;
        const animName = `${prefix}-${animDir}`;
        slime.flipX = slime.direction === "left";

        if (slime.curAnim() !== animName) {
            slime.play(animName);
        }
    }

    // ── Death sequence ──
    slime.die = () => {
        slime.unuse("body");
        slime.unuse("area");
        slime.play("death");
        slime.onAnimEnd((anim) => {
            if (anim === "death") {
                k.destroy(slime);
            }
        });
    };

    // ── Take damage from player attacks ──
    slime.onCollide("attack", (attack) => {
        const dmg = attack.damage || 10;
        slime.health -= dmg;

        // Feed damage to floating damage box
        k.get("damageBox").forEach(b =>
            b.trigger("showDamage", dmg, false, slime.pos)
        );

        // Hit flash
        k.shake(3);
        slime.color = k.rgb(255, 100, 100);
        k.wait(0.1, () => {
            if (slime.exists()) slime.color = k.rgb(255, 255, 255);
        });

        if (slime.health <= 0) {
            slime.die();
        }
    });

    return slime;
}
