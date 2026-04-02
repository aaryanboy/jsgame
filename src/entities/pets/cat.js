import { scaleFactor, petInfo } from "../../utils/constants.js";
import { gameState } from "../../utils/utils.js";
import { getTimeScale } from "../../systems/timeStop.js";
import { petState } from "../../systems/persistentPet.js";
import { createEntityHealthBar } from "../../ui/entityHealthBar.js";

export function createCat(k, pos, player, restoreHealth = false) {
    // Use stored health if restoring, otherwise use max
    const startHealth = restoreHealth && petState.currentHealth > 0
        ? petState.currentHealth
        : petInfo.health;

    const cat = k.make([
        k.sprite("cat", { anim: "idle-down" }),
        k.area({ shape: new k.Rect(k.vec2(0, 3), 10, 10) }),
        k.body(),
        k.anchor("center"),
        k.pos(pos),
        k.scale(scaleFactor * 0.5),
        { z: 2 },
        {
            speed: petInfo.speed,
            health: startHealth,
            maxHealth: petInfo.health,
            damage: petInfo.damage,
            critRate: petInfo.critRate,
            critDamage: petInfo.critDamage,
            direction: "down",
            attackTimer: 0,
            attackType: 0, // 0: Deepcut, 1: Axe Shot, 2: Heal
        },
        "cat",
        "pet",
    ]);

    // Store references for revive
    petState.kaboom = k;
    petState.player = player;
    petState.currentPet = cat;
    petState.isDead = false;
    petState.shouldPersist = true;

    // Helper for Cat Attack
    function performPetAttack(targetPos) {
        if (cat.attackTimer > 0) return;

        // Determine direction based on target position
        const diff = targetPos.sub(cat.pos);
        if (Math.abs(diff.x) > Math.abs(diff.y)) {
            cat.direction = diff.x > 0 ? "right" : "left";
        } else {
            cat.direction = diff.y > 0 ? "down" : "up";
        }

        const attackTypes = ["deepcut", "axeshot", "heal"];
        const currentType = attackTypes[cat.attackType];
        
        // Construct animation name
        let anim = `${currentType}-${cat.direction}`;

        // Hide main cat sprite during attack animation
        cat.opacity = 0;

        const attackSprite = k.add([
            k.sprite("cat-attack", { anim: anim }),
            k.pos(cat.pos),
            k.anchor("center"),
            k.scale(cat.scale), 
            { z: cat.z + 1 },
            "attack-effect"
        ]);

        // Deal damage or heal based on type
        if (currentType === "heal") {
            // Heal only the player, and ONLY if touching (within 60 units)
            const distToPlayer = cat.pos.dist(player.pos);
            const touchThreshold = 60; 

            if (distToPlayer < touchThreshold) {
                const healAmount = player.maxHealth * 0.1;
                player.health = Math.min(player.maxHealth, player.health + healAmount);
                
                // Visual feedback for heal on the player
                const healText = k.add([
                    k.text(`+${Math.floor(healAmount)}`, { size: 12 }),
                    k.pos(player.pos.add(0, -20)),
                    k.color(0, 255, 0),
                    k.anchor("center"),
                    k.move(k.UP, 20),
                    k.opacity(1),
                ]);
                healText.onUpdate(() => {
                    healText.opacity -= k.dt();
                    if (healText.opacity <= 0) k.destroy(healText);
                });
            }
        } else {
            // Spawn an actual attack hitbox for damage
            const hitbox = k.add([
                k.rect(20, 20),
                k.opacity(0),
                k.area(),
                k.pos(cat.pos.add(diff.unit().scale(15))),
                k.anchor("center"),
                "attack",
                { damage: cat.damage * (currentType === "axeshot" ? 1.5 : 1.0) }
            ]);
            k.wait(0.2, () => k.destroy(hitbox));
        }

        cat.attackTimer = 1.0; // 1 second cooldown
        
        // Cycle attack type
        cat.attackType = (cat.attackType + 1) % 3;

        attackSprite.onAnimEnd((name) => {
            if (name === anim) {
                cat.opacity = 1;
                k.destroy(attackSprite);
            }
        });

        // Fallback if animation end doesn't fire
        k.wait(0.5, () => {
            if (attackSprite.exists()) {
                cat.opacity = 1;
                k.destroy(attackSprite);
            }
        });
    }

    // Track health changes
    cat.onUpdate(() => {
        petState.currentHealth = cat.health;
    });

    // Health bar (reusable component)
    createEntityHealthBar(k, cat, {
        maxHealth: petInfo.health,
        barWidth: 20,
        barHeight: 4,
        yOffset: -15,
    });


    cat.onUpdate(() => {
        if (gameState.isPaused) return;
        if (!player) return;

        // Tick attack timer
        if (cat.attackTimer > 0) cat.attackTimer -= k.dt();

        // Block all movement when time is fully stopped
        if (gameState.isTimeStopped) return;

        const timeScale = getTimeScale();

        // COMBAT LOGIC: Search for any enemy
        const enemies = k.get("enemy");
        let targetEnemy = null;
        for (const enemy of enemies) {
            if (cat.pos.dist(enemy.pos) < 400) {
                targetEnemy = enemy;
                break;
            }
        }

        if (targetEnemy) {
            const dist = cat.pos.dist(targetEnemy.pos);
            const attackRange = 50;

            if (dist > attackRange) {
                // Move towards enemy
                const dir = targetEnemy.pos.sub(cat.pos).unit();
                cat.move(dir.scale(cat.speed * timeScale));

                // Direction for animation
                if (Math.abs(dir.y) > Math.abs(dir.x)) {
                    const anim = dir.y > 0 ? "walk-down" : "walk-up";
                    if (cat.curAnim() !== anim) cat.play(anim);
                } else {
                    const anim = dir.x > 0 ? "walk-right" : "walk-left";
                    if (cat.curAnim() !== anim) cat.play(anim);
                }
            } else {
                // In range! Attack
                cat.play("idle-down");
                performPetAttack(targetEnemy.pos);
            }
            return; // Don't follow player while fighting
        }

        // DEFAULT LOGIC: Follow Player
        const distance = player.pos.dist(cat.pos);
        const followThreshold = 50; // Don't get too close
        const detectRange = 500;   // Only follow if close enough

        // OUT-OF-COMBAT HEAL: If player is hurt and we are close, prioritize healing
        if (!targetEnemy && cat.attackTimer <= 0 && distance < followThreshold + 10) {
            if (player.health < player.maxHealth) {
                cat.attackType = 2; // Force heal turn
                performPetAttack(player.pos);
            }
        }

        if (distance > followThreshold && distance < detectRange) {
            const dir = player.pos.sub(cat.pos).unit();
            cat.move(dir.scale(cat.speed * timeScale));

            // Animation
            if (Math.abs(dir.y) > Math.abs(dir.x)) {
                if (dir.y > 0) {
                    if (cat.curAnim() !== "walk-down") cat.play("walk-down");
                    cat.direction = "down";
                } else {
                    if (cat.curAnim() !== "walk-up") cat.play("walk-up");
                    cat.direction = "up";
                }
            } else {
                if (dir.x > 0) {
                    if (cat.curAnim() !== "walk-right") cat.play("walk-right");
                    cat.direction = "right";
                } else {
                    if (cat.curAnim() !== "walk-left") cat.play("walk-left");
                    cat.direction = "left";
                }
            }
        } else {
            cat.play("idle-down");
        }
    });

    // Collision/Combat Logic
    cat.onCollide("attack", (attack) => {
        const damageDealt = Math.floor(attack.damage);
        cat.health -= damageDealt;

        k.shake(2);
        cat.color = k.rgb(255, 100, 100);
        k.wait(0.1, () => {
            if (cat.exists()) cat.color = k.rgb(255, 255, 255);
        });

        if (cat.health <= 0) {
            petState.lastDeathPos = cat.pos.clone();
            petState.isDead = true;
            petState.currentPet = null;
            k.destroy(cat);
        }
    });

    return cat;
}
