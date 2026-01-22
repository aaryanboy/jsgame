import { scaleFactor, playerinfo, skills } from "../utils/constants.js";
import { gameState } from "../utils/utils.js";
import { toggleInventory } from "../systems/inventory.js";
import { calculateDamage } from "../systems/damage.js";
import { toggleTimeStop, getTimeScale } from "../systems/timeStop.js";
import { revivePet, isPetDead } from "./frog.js";

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
            qTimer: 0,
            fTimer: 0,
            rTimer: 0,
            eTimer: 0,
        },
        "player",
    ]);

    return player;
}

export function setPlayerControls(k, player) {
    // --- HEALTH BAR UI ---
    const totalHealth = 100;
    const barWidth = 200;
    const barHeight = 20;

    const healthContainer = k.add([
        k.pos(k.width() - 300, 20),
        k.fixed(),
        { z: 100 }
    ]);
    healthContainer.add([k.text("HP", { size: 24, font: "monospace" }), k.pos(0, -5), k.color(255, 255, 255)]);
    healthContainer.add([k.rect(barWidth, barHeight), k.pos(40, 0), k.color(50, 50, 50), k.outline(2, k.Color.WHITE)]);
    const healthBar = healthContainer.add([k.rect(barWidth, barHeight), k.pos(40, 0), k.color(0, 255, 0)]);
    const hpText = healthContainer.add([k.text("100/100", { size: 16, font: "monospace" }), k.pos(40 + barWidth / 2, barHeight / 2), k.anchor("center"), k.color(255, 255, 255)]);

    healthBar.onUpdate(() => {
        const ratio = player.health / totalHealth;
        healthBar.width = barWidth * Math.max(0, ratio);
        hpText.text = `${Math.ceil(player.health)}/${totalHealth}`;
        if (ratio < 0.3) healthBar.color = k.rgb(255, 0, 0);
        else if (ratio < 0.6) healthBar.color = k.rgb(255, 165, 0);
        else healthBar.color = k.rgb(0, 255, 0);
    });

    // --- SKILL BAR UI ---
    const iconSize = 50;
    const spacing = 15;
    const skillKeys = ['q', 'f', 'r', 'e'];
    const skillData = [skills.q, skills.f, skills.r, skills.e];
    const totalWidth = skillKeys.length * (iconSize + spacing) + spacing;
    const startX = k.width() / 2 - totalWidth / 2;
    const skillBarY = k.height() - 80;

    // Background Container
    k.add([
        k.rect(totalWidth, iconSize + 20, { radius: 8 }),
        k.pos(startX - spacing, skillBarY - 10),
        k.color(20, 20, 20),
        k.opacity(0.8),
        k.fixed(),
        k.outline(2, k.rgb(100, 100, 100)),
        { z: 90 }
    ]);

    skillKeys.forEach((key, index) => {
        const x = startX + index * (iconSize + spacing);
        const skill = skillData[index];
        const color = k.rgb(...skill.iconColor);

        const container = k.add([
            k.pos(x, skillBarY),
            k.fixed(),
            { z: 100 }
        ]);

        container.add([
            k.rect(iconSize, iconSize, { radius: 4 }),
            k.color(color),
            k.outline(2, k.Color.WHITE)
        ]);

        container.add([
            k.text(key.toUpperCase(), { size: 16, font: "monospace" }),
            k.pos(4, 4),
            k.color(255, 255, 255),
            k.outline(1, k.Color.BLACK)
        ]);

        container.add([
            k.text(skill.name, { size: 10, font: "monospace", width: iconSize, align: "center" }),
            k.pos(iconSize / 2, iconSize + 5),
            k.anchor("top"),
            k.color(200, 200, 200)
        ]);

        const overlay = container.add([
            k.rect(iconSize, iconSize, { radius: 4 }),
            k.color(0, 0, 0),
            k.opacity(0.7),
            k.pos(0, 0)
        ]);

        const cdText = container.add([
            k.text("", { size: 20, font: "monospace" }),
            k.pos(iconSize / 2, iconSize / 2),
            k.anchor("center"),
            k.color(255, 255, 255)
        ]);

        container.onUpdate(() => {
            const timer = player[`${key}Timer`];
            if (key === 'e' && gameState.isTimeStopped) {
                overlay.height = 0;
                overlay.opacity = 0;
                return;
            }

            if (timer > 0) {
                const totalCD = skill.cooldown;
                const ratio = timer / totalCD;
                overlay.opacity = 0.8;
                overlay.height = iconSize * ratio;
                cdText.text = timer.toFixed(1);
            } else {
                overlay.opacity = 0;
                overlay.height = 0;
                cdText.text = "";
            }
        });
    });

    // --- GAME LOOP UPDATE ---
    k.onUpdate(() => {
        if (player.qTimer > 0) player.qTimer -= k.dt();
        if (player.fTimer > 0) player.fTimer -= k.dt();
        if (player.rTimer > 0) player.rTimer -= k.dt();
        if (player.eTimer > 0) player.eTimer -= k.dt();

        if (player.health <= 0) {
            k.go("gameover");
            return;
        }

        k.camPos(player.pos.x, player.pos.y + 100);

        if (gameState.isPaused || gameState.isTimeStopped || player.isInDialogue) return;

        const timeScale = getTimeScale();
        const speed = player.speed * timeScale;
        let dx = 0; let dy = 0;

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
            if (player.direction === "up" && curAnim !== "idle-up") player.play("idle-up");
            else if (player.direction === "down" && curAnim !== "idle-down") player.play("idle-down");
            else if ((player.direction === "left" || player.direction === "right") && curAnim !== "idle-side") player.play("idle-side");
        }
    });

    // --- CONTROLS ---

    // Q: Swift Slash
    const qListener = k.onKeyPress("q", () => {
        if (gameState.isPaused || player.isInDialogue || player.qTimer > 0) return;
        player.qTimer = skills.q.cooldown;
        performAttack(k, player, "slash", skills.q.damage);
    });
    player.onDestroy(() => qListener.cancel());

    // F: Titan Cleave
    const fListener = k.onKeyPress("f", () => {
        if (gameState.isPaused || player.isInDialogue || player.fTimer > 0) return;
        player.fTimer = skills.f.cooldown;

        player.color = k.rgb(255, 140, 0);
        k.wait(skills.f.windup, () => {
            player.color = k.rgb(255, 255, 255);
            performAttack(k, player, "heavy", skills.f.damage);
        });
    });
    player.onDestroy(() => fListener.cancel());

    // R: Blade Storm
    const rListener = k.onKeyPress("r", () => {
        if (gameState.isPaused || player.isInDialogue || player.rTimer > 0) return;
        player.rTimer = skills.r.cooldown;

        const spin = k.add([
            k.circle(50),
            k.pos(player.pos),
            k.anchor("center"),
            k.color(0, 100, 255),
            k.opacity(0.5),
            k.area(),
            "attack",
            { damage: skills.r.damage }
        ]);
        k.wait(0.2, () => k.destroy(spin));
    });
    player.onDestroy(() => rListener.cancel());

    // E: Chrono Stasis
    const timeStopListener = k.onKeyPress("e", () => {
        if (player.isInDialogue) return;

        if (gameState.isTimeStopped) {
            toggleTimeStop(k);
            player.eTimer = skills.e.cooldown;
        } else {
            if (player.eTimer > 0) return;
            toggleTimeStop(k);
        }
    });
    player.onDestroy(() => timeStopListener.cancel());


    function performAttack(k, player, type, damage) {
        let offset = k.vec2(0, 0);
        let anim = "";
        let flipX = false;

        switch (player.direction) {
            case "up": offset = k.vec2(0, -16); anim = "attack-up"; break;
            case "down": offset = k.vec2(0, 16); anim = "attack-down"; break;
            case "left": offset = k.vec2(-36, 0); anim = "attack-left"; flipX = true; break;
            case "right": offset = k.vec2(36, 0); anim = "attack-left"; flipX = false; break;
        }

        const attackSprite = k.add([
            k.sprite("attack", { anim: anim }),
            k.pos(player.pos.add(offset)),
            k.anchor("center"),
            k.scale(type === "heavy" ? scaleFactor * 1.5 : scaleFactor),
            k.area(),
            { z: 6 },
            "attack",
            { damage: damage }
        ]);
        attackSprite.flipX = flipX;

        k.wait(0.3, () => k.destroy(attackSprite));
    }

    // Inventory
    const inventoryListener = k.onKeyPress("tab", () => toggleInventory(k));
    player.onDestroy(() => inventoryListener.cancel());

    // Revive
    const reviveListener = k.onKeyPress("t", () => {
        if (player.isInDialogue || gameState.isPaused) return;
        const tvObjects = k.get("tv");
        let nearTV = tvObjects.some(tv => player.pos.dist(tv.pos) < 50);
        if (nearTV && isPetDead()) revivePet();
    });
    player.onDestroy(() => reviveListener.cancel());
}
