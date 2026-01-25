import { scaleFactor, petInfo } from "../utils/constants.js";
import { gameState } from "../utils/utils.js";
import { calculateDamage, isLastHitCritical } from "../systems/damage.js";
import { getTimeScale } from "../systems/timeStop.js";
import { petState } from "../systems/persistentPet.js";

export function createFrog(k, pos, player, restoreHealth = false) {
    // Use stored health if restoring, otherwise use max
    const startHealth = restoreHealth && petState.currentHealth > 0
        ? petState.currentHealth
        : petInfo.health;

    const frog = k.make([
        k.sprite("pet", { anim: "idle-down" }),
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
        },
        "frog",
    ]);

    // Store references for revive
    petState.kaboom = k;
    petState.player = player;
    petState.currentPet = frog;
    petState.isDead = false;
    petState.shouldPersist = true;

    // Helper for Frog Attack (Sword Style)
    function performPetAttack(targetPos) {
        if (frog.attackTimer > 0) return;

        // Determine direction based on target position
        const diff = targetPos.sub(frog.pos);
        if (Math.abs(diff.x) > Math.abs(diff.y)) {
            frog.direction = diff.x > 0 ? "right" : "left";
        } else {
            frog.direction = diff.y > 0 ? "down" : "up";
        }

        let offset = k.vec2(0, 0);
        let anim = "";
        let flipX = false;

        switch (frog.direction) {
            case "up": offset = k.vec2(0, -12); anim = "attack-up"; break;
            case "down": offset = k.vec2(0, 12); anim = "attack-down"; break;
            case "left": offset = k.vec2(-24, 0); anim = "attack-left"; flipX = true; break;
            case "right": offset = k.vec2(24, 0); anim = "attack-left"; flipX = false; break;
        }

        const attackSprite = k.add([
            k.sprite("attack", { anim: anim }),
            k.pos(frog.pos.add(offset)),
            k.anchor("center"),
            k.scale(scaleFactor * 0.4), // Smaller for the frog
            k.area(),
            { z: 6 },
            "attack",
            { damage: frog.damage } // Use damage from petInfo
        ]);
        attackSprite.flipX = flipX;

        frog.attackTimer = 1.0; // 1 second cooldown
        k.wait(0.3, () => k.destroy(attackSprite));
    }

    // Track health changes
    frog.onUpdate(() => {
        petState.currentHealth = frog.health;
    });

    // Add Health Bar
    const barWidth = 20;
    const barHeight = 4;

    // Background (Red)
    frog.add([
        k.rect(barWidth, barHeight),
        k.pos(-barWidth / 2, -15),
        k.color(255, 0, 0),
    ]);

    // Foreground (Green)
    const hpBar = frog.add([
        k.rect(barWidth, barHeight),
        k.pos(-barWidth / 2, -15),
        k.color(0, 255, 0),
    ]);

    // Update HP Bar
    hpBar.onUpdate(() => {
        hpBar.width = barWidth * (frog.health / petInfo.health);
    });


    frog.onUpdate(() => {
        if (gameState.isPaused) return;
        if (!player) return;

        // Tick attack timer
        if (frog.attackTimer > 0) frog.attackTimer -= k.dt();

        // Block all movement when time is fully stopped
        if (gameState.isTimeStopped) return;

        const timeScale = getTimeScale();

        // COMBAT LOGIC: Search for Boss
        const bosses = k.get("boss");
        let targetEnemy = null;
        if (bosses.length > 0) {
            const boss = bosses[0];
            if (frog.pos.dist(boss.pos) < 400) {
                targetEnemy = boss;
            }
        }

        if (targetEnemy) {
            const dist = frog.pos.dist(targetEnemy.pos);
            const attackRange = 50;

            if (dist > attackRange) {
                // Move towards enemy
                const dir = targetEnemy.pos.sub(frog.pos).unit();
                frog.move(dir.scale(frog.speed * timeScale));

                // Direction for animation
                if (Math.abs(dir.y) > Math.abs(dir.x)) {
                    const anim = dir.y > 0 ? "walk-down" : "walk-up";
                    if (frog.curAnim() !== anim) frog.play(anim);
                } else {
                    const anim = dir.x > 0 ? "walk-right" : "walk-left";
                    if (frog.curAnim() !== anim) frog.play(anim);
                }
            } else {
                // In range! Attack
                frog.play("idle-down");
                performPetAttack(targetEnemy.pos);
            }
            return; // Don't follow player while fighting
        }

        // DEFAULT LOGIC: Follow Player
        const distance = player.pos.dist(frog.pos);
        const followThreshold = 50; // Don't get too close
        const detectRange = 500;   // Only follow if close enough

        if (distance > followThreshold && distance < detectRange) {
            const dir = player.pos.sub(frog.pos).unit();
            frog.move(dir.scale(frog.speed * timeScale));

            // Animation
            if (Math.abs(dir.y) > Math.abs(dir.x)) {
                if (dir.y > 0) {
                    if (frog.curAnim() !== "walk-down") frog.play("walk-down");
                    frog.direction = "down";
                } else {
                    if (frog.curAnim() !== "walk-up") frog.play("walk-up");
                    frog.direction = "up";
                }
            } else {
                if (dir.x > 0) {
                    if (frog.curAnim() !== "walk-right") frog.play("walk-right");
                    frog.direction = "right";
                } else {
                    if (frog.curAnim() !== "walk-left") frog.play("walk-left");
                    frog.direction = "left";
                }
            }
        } else {
            frog.play("idle-down");
        }
    });

    // Collision/Combat Logic
    frog.onCollide("attack", (attack) => {
        // Calculate Damage
        const damageDealt = calculateDamage(
            attack.damage,
            player.critDamage,
            player.critRate
        );
        frog.health -= damageDealt;
        k.get("damageBox").forEach(b => b.trigger("showDamage", damageDealt, isLastHitCritical()));

        if (frog.health <= 0) {
            // Track death position and state
            petState.lastDeathPos = frog.pos.clone();
            petState.isDead = true;
            petState.currentPet = null;
            k.destroy(frog);
        }
    });

    return frog;
}

/**
 * Revive the pet at the player's position
 * @returns {boolean} Whether the pet was successfully revived
 */
export function revivePet() {
    if (!petState.kaboom || !petState.player) {
        console.log("Cannot revive/summon pet - missing kaboom or player reference.");
        return false;
    }

    const k = petState.kaboom;
    const player = petState.player;

    // If the pet is already alive and in this room, don't do anything
    if (petState.currentPet && !petState.isDead) {
        console.log("Pet is already alive and with you.");
        return false;
    }

    // If there's an existing pet instance (e.g. it was dead in this room), destroy it before re-spawning
    if (petState.currentPet) {
        k.destroy(petState.currentPet);
    }

    // Reset state to ensure it spawns and persists
    petState.isDead = false;
    petState.shouldPersist = true;

    // Spawn pet near the player
    const spawnPos = player.pos.add(k.vec2(30, 0));
    const newPet = createFrog(k, spawnPos, player);
    k.add(newPet);

    console.log("Pet summoned beside player!");
    return true;
}

/**
 * Check if pet is currently dead
 * @returns {boolean}
 */
export function isPetDead() {
    return petState.isDead;
}
