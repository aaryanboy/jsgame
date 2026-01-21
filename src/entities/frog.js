import { scaleFactor } from "../utils/constants.js";
import { gameState } from "../utils/utils.js";
import { calculateDamage } from "../systems/damage.js";

export function createFrog(k, pos, player) {
    const maxHealth = 50;
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
            health: maxHealth,
        },
        "frog",
    ]);

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

        const distance = player.pos.dist(frog.pos);
        const followThreshold = 50; // Don't get too close
        const detectRange = 500;   // Only follow if close enough

        if (distance > followThreshold && distance < detectRange) {
            const dir = player.pos.sub(frog.pos).unit();
            frog.move(dir.scale(frog.speed));

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
            k.destroy(frog);
        }
    });

    return frog;
}
