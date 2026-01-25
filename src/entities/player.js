import { scaleFactor, skills, playerinfo } from "../utils/constants.js";
import { gameState } from "../utils/utils.js";
import { toggleInventory } from "../systems/inventory.js";
import { toggleTimeStop, getTimeScale } from "../systems/timeStop.js";
import { revivePet, isPetDead } from "./frog.js";
import { createHealthBar } from "../ui/healthBar.js";
import { createSkillBar } from "../ui/skillBar.js";
import { createAudioToggle } from "../ui/audioToggle.js";

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
            speed: playerinfo.speed,
            direction: playerinfo.direction,
            isInDialogue: playerinfo.isInDialogue,
            health: playerinfo.health,
            damage: playerinfo.damage,
            critRate: playerinfo.critRate,
            critDamage: playerinfo.critDamage,
            mTimer: 0,
            commaTimer: 0,
            periodTimer: 0,
            slashTimer: 0,
        },
        "player",
    ]);

    return player;
}

export function setPlayerControls(k, player) {
    // --- UI COMPONENTS (modular) ---
    createHealthBar(k, player);
    createSkillBar(k, player);
    createAudioToggle(k, player);

    // --- GAME LOOP UPDATE ---
    k.onUpdate(() => {
        if (player.mTimer > 0) player.mTimer -= k.dt();
        if (player.commaTimer > 0) player.commaTimer -= k.dt();
        if (player.periodTimer > 0) player.periodTimer -= k.dt();
        if (player.slashTimer > 0) player.slashTimer -= k.dt();

        if (player.health <= 0) {
            k.go("gameover");
            return;
        }

        k.camPos(player.pos.x, player.pos.y + 100);

        // Player can still move during time stop - only pause and dialogue block movement
        if (gameState.isPaused || player.isInDialogue) return;

        // Player speed is affected by time scale (slows down and stops)
        const speed = player.speed * getTimeScale();
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

    // M: Swift Slash
    const mListener = k.onKeyPress("m", () => {
        if (gameState.isPaused || player.isInDialogue || player.mTimer > 0) return;
        player.mTimer = skills.m.cooldown;
        performAttack(k, player, "slash", skills.m.damage);
    });
    player.onDestroy(() => mListener.cancel());

    // , (Comma): Titan Cleave
    const commaListener = k.onKeyPress(",", () => {
        if (gameState.isPaused || player.isInDialogue || player.commaTimer > 0) return;
        player.commaTimer = skills.comma.cooldown;

        player.color = k.rgb(255, 140, 0);
        k.wait(skills.comma.windup, () => {
            player.color = k.rgb(255, 255, 255);
            performAttack(k, player, "heavy", skills.comma.damage);
        });
    });
    player.onDestroy(() => commaListener.cancel());

    // . (Period): Blade Storm
    const periodListener = k.onKeyPress(".", () => {
        if (gameState.isPaused || player.isInDialogue || player.periodTimer > 0) return;
        player.periodTimer = skills.period.cooldown;

        // Play shield sound
        k.play("shield", { volume: 0.5 });

        const spin = k.add([
            k.circle(50),
            k.pos(player.pos),
            k.anchor("center"),
            k.color(0, 100, 255),
            k.opacity(0.5),
            k.area(),
            "attack",
            { damage: player.damage + skills.period.damage }
        ]);
        k.wait(0.2, () => k.destroy(spin));
    });
    player.onDestroy(() => periodListener.cancel());

    // / (Slash): Chrono Stasis - "The World"
    const slashListener = k.onKeyPress("/", () => {
        if (player.isInDialogue) return;
        if (gameState.isTimeStopped) return; // Can't use while already active
        if (player.slashTimer > 0) return; // Cooldown check

        // Play ZA WARUDO sound
        k.play("zawarudo", { volume: 0.7 });

        // Start cooldown immediately upon activation
        player.slashTimer = skills.slash.cooldown;

        // Activate time stop (will auto-resume after 5 seconds)
        toggleTimeStop(k);
    });
    player.onDestroy(() => slashListener.cancel());


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
            { damage: player.damage + damage }
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
        if (nearTV) revivePet();
    });
    player.onDestroy(() => reviveListener.cancel());
}
