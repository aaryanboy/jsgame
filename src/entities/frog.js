import { scaleFactor } from "../utils/constants.js";
import { gameState } from "../utils/utils.js";
import { calculateDamage } from "../systems/damage.js";
import { getTimeScale } from "../systems/timeStop.js";
import { petState } from "../systems/persistentPet.js";

export function createFrog(k, pos, player, restoreHealth = false) {
    const maxHealth = 50;
    // Use stored health if restoring, otherwise use max
    const startHealth = restoreHealth && petState.currentHealth > 0
        ? petState.currentHealth
        : maxHealth;

    const frog = k.make([
        k.sprite("pet", { anim: "idle-down" }),
        k.area({ shape: new k.Rect(k.vec2(0, 3), 10, 10) }),
        k.body(),
        k.anchor("center"),
        k.pos(pos),
        k.scale(scaleFactor * 0.5),
        { z: 2 },
        {
            speed: 100, // Faster to catch up
            health: startHealth,
            maxHealth: maxHealth,
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
        hpBar.width = barWidth * (frog.health / maxHealth);
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
    frog.onCollide("attack", () => {
        // Calculate Damage
        const damageDealt = calculateDamage(
            player.damage,
            player.critDamage,
            player.critRate
        );

        frog.health -= damageDealt;

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
    if (!petState.isDead) {
        console.log("Pet is not dead, no need to revive.");
        return false;
    }

    if (!petState.kaboom || !petState.player) {
        console.log("Cannot revive pet - missing kaboom or player reference.");
        return false;
    }

    const k = petState.kaboom;
    const player = petState.player;

    // Spawn pet near the player
    const spawnPos = player.pos.add(k.vec2(30, 0));
    const newPet = createFrog(k, spawnPos, player);
    k.add(newPet);

    console.log("Pet revived!");
    return true;
}

/**
 * Check if pet is currently dead
 * @returns {boolean}
 */
export function isPetDead() {
    return petState.isDead;
}
