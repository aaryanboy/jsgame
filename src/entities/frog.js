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
            critRate: petInfo.critRate,
            critDamage: petInfo.critDamage,
        },
        "frog",
    ]);

    // Store references for revive
    petState.kaboom = k;
    petState.player = player;
    petState.currentPet = frog;
    petState.isDead = false;
    petState.shouldPersist = true;

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

        // Block all movement when time is fully stopped
        if (gameState.isTimeStopped) return;

        const timeScale = getTimeScale();
        const distance = player.pos.dist(frog.pos);
        const followThreshold = 50; // Don't get too close
        const detectRange = 500;   // Only follow if close enough

        if (distance > followThreshold && distance < detectRange) {
            const dir = player.pos.sub(frog.pos).unit();
            frog.move(dir.scale(frog.speed * timeScale));

            // Animation
            if (Math.abs(dir.y) > Math.abs(dir.x)) {
                if (dir.y > 0) {
                    frog.play("walk-down");
                } else {
                    frog.play("walk-up");
                }
            } else {
                if (dir.x > 0) {
                    frog.play("walk-right");
                } else {
                    frog.play("walk-left");
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
