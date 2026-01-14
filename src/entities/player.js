import { scaleFactor } from "../utils/constants.js";
import { openInventory } from "../systems/inventory.js";
import { calculateDamage } from "../systems/damage.js";

export function createPlayer(k) {
    const player = k.make([
        k.sprite("spritesheet", { anim: "idle-down" }),
        k.area({ shape: new k.Rect(k.vec2(0, 3), 10, 10) }),
        k.body(),
        k.anchor("center"),
        k.pos(),
        k.scale(scaleFactor),
        { z: 2 },
        {
            speed: 200,
            direction: "down",
            isInDialogue: false,
            health: 100,
            damage: 10,
            critRate: 0,
            critDamage: 0,
        },
        "player",
    ]);

    return player;
}

export function setPlayerControls(k, player) {
    // Health Bar UI
    const totalHealth = 100; // Assuming max health is 100
    const barWidth = 200;
    const barHeight = 20;

    // Background (Grey)
    k.add([
        k.rect(barWidth, barHeight),
        k.pos(k.width() - barWidth - 20, k.height() - barHeight - 20),
        k.color(100, 100, 100),
        k.fixed(),
        { z: 100 }
    ]);

    // Foreground (Red/Green - Dynamic)
    const healthBar = k.add([
        k.rect(barWidth, barHeight),
        k.pos(k.width() - barWidth - 20, k.height() - barHeight - 20),
        k.color(0, 255, 0), // Green initially
        k.fixed(),
        { z: 100 }
    ]);

    healthBar.onUpdate(() => {
        // Update width
        const ratio = player.health / totalHealth;
        healthBar.width = barWidth * Math.max(0, ratio);

        // Dynamic Color (Green -> Red)
        if (ratio < 0.3) {
            healthBar.color = k.rgb(255, 0, 0);
        } else {
            healthBar.color = k.rgb(0, 255, 0);
        }
    });

    // Camera follow
    k.onUpdate(() => {
        k.camPos(player.pos.x, player.pos.y + 100);

        if (player.isInDialogue) return;

        const speed = player.speed;
        let dx = 0;
        let dy = 0;

        if (k.isKeyDown("left") || k.isKeyDown("a")) dx = -1;
        if (k.isKeyDown("right") || k.isKeyDown("d")) dx = 1;
        if (k.isKeyDown("up") || k.isKeyDown("w")) dy = -1;
        if (k.isKeyDown("down") || k.isKeyDown("s")) dy = 1;

        if (dx !== 0 || dy !== 0) {
            const moveVec = k.vec2(dx, dy).unit().scale(speed);
            player.move(moveVec);

            if (dy < 0) {
                if (player.curAnim() !== "walk-up") player.play("walk-up");
                player.direction = "up";
            } else if (dy > 0) {
                if (player.curAnim() !== "walk-down") player.play("walk-down");
                player.direction = "down";
            } else if (dx < 0) {
                if (player.curAnim() !== "walk-side") player.play("walk-side");
                player.direction = "left";
                player.flipX = true;
            } else if (dx > 0) {
                if (player.curAnim() !== "walk-side") player.play("walk-side");
                player.direction = "right";
                player.flipX = false;
            }
        } else {
            const curAnim = player.curAnim();
            if (player.direction === "up" && curAnim !== "idle-up") {
                player.play("idle-up");
            } else if (player.direction === "down" && curAnim !== "idle-down") {
                player.play("idle-down");
            } else if (
                (player.direction === "left" || player.direction === "right") &&
                curAnim !== "idle-side"
            ) {
                player.play("idle-side");
            }
        }
    });

    // Attack
    let lastAttackSide = 1;
    k.onKeyPress("q", () => {
        if (player.isInDialogue) return;

        let attackOffset = k.vec2(0, 0);
        let attackAnim = "";
        let flipX = false;

        switch (player.direction) {
            case "up":
                attackOffset = k.vec2(0, -16);
                attackAnim = "attack-up";
                break;
            case "down":
                attackOffset = k.vec2(0, 16);
                attackAnim = "attack-down";
                break;
            case "left":
                attackOffset = k.vec2(-36, 0);
                attackAnim = lastAttackSide === 1 ? "attack-left" : "attack-right";
                flipX = true;
                lastAttackSide = lastAttackSide === 1 ? 2 : 1;
                break;
            case "right":
                attackOffset = k.vec2(36, 0);
                attackAnim = lastAttackSide === 1 ? "attack-left" : "attack-right";
                flipX = false;
                lastAttackSide = lastAttackSide === 1 ? 2 : 1;
                break;
        }

        const attackSprite = k.add([
            k.sprite("attack", { anim: attackAnim }),
            k.pos(player.pos.add(attackOffset)),
            k.anchor("center"),
            k.scale(scaleFactor),
            k.area(),
            { z: 6 },
            "attack",
        ]);

        attackSprite.flipX = flipX;

        const animationDuration = 0.5;
        k.wait(animationDuration, () => {
            k.destroy(attackSprite);
        });
    });

    // Inventory
    k.onKeyPress("e", () => {
        openInventory(k);
    });
}
