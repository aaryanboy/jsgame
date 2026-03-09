import { scaleFactor, skills, playerinfo, gameConfig } from "../utils/constants.js";
import { gameState } from "../utils/utils.js";
import { toggleSettingsMenu } from "../systems/settingsMenu.js";
import { toggleTimeStop, getTimeScale } from "../systems/timeStop.js";
import { revivePet } from "./frog.js";
import { createHealthBar } from "../ui/healthBar.js";
import { createSkillBar } from "../ui/skillBar.js";
import { touchInput, isTouchMode, showTouchControls, consumeTouchTriggers } from "../ui/touchControls.js";
import { createGlobalHUD } from "../ui/globalHUD.js";

export function createPlayer(k) {
    const skinSprite = `skin_${gameConfig.player.skinIndex}`;
    const player = k.make([
        k.sprite(skinSprite, { anim: "idle-down" }),
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
            isInvulnerable: false,
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
    // ── UI Components ──
    createHealthBar(k, player);
    createSkillBar(k, player);
    createGlobalHUD(k, player);
    if (isTouchMode()) showTouchControls(k);

    // ── Shared skill execution functions ──
    // These are used by BOTH keyboard and touch handlers to avoid duplication.

    function executeSwiftSlash() {
        if (player.mTimer > 0) return;
        player.mTimer = skills.m.cooldown;
        performAttack(k, player, "slash", skills.m.damage);
    }

    function executeTitanCleave() {
        if (player.commaTimer > 0) return;
        player.commaTimer = skills.comma.cooldown;
        player.color = k.rgb(255, 140, 0);
        k.wait(skills.comma.windup, () => {
            player.color = k.rgb(255, 255, 255);
            performAttack(k, player, "heavy", skills.comma.damage);
        });
    }

    function executeBladeStorm() {
        if (player.periodTimer > 0) return;
        player.periodTimer = skills.period.cooldown;
        k.play("shield", { volume: 0.5 });
        const spin = k.add([
            k.circle(50),
            k.pos(player.pos),
            k.anchor("center"),
            k.color(0, 100, 255),
            k.opacity(0.5),
            k.area(),
            "attack",
            { damage: player.damage + skills.period.damage },
        ]);
        k.wait(0.2, () => k.destroy(spin));
    }

    function executeTheWorld() {
        if (gameState.isTimeStopped || player.slashTimer > 0) return;
        k.play("zawarudo", { volume: 0.7 });
        player.slashTimer = skills.slash.cooldown;
        toggleTimeStop(k);
    }

    function executeSettingsToggle() {
        toggleSettingsMenu(k);
    }

    function executeRevive() {
        const tvObjects = k.get("tv");
        const nearTV = tvObjects.some(tv => player.pos.dist(tv.pos) < 50);
        if (nearTV) revivePet();
    }

    // ── Game Loop ──
    k.onUpdate(() => {
        if (player.mTimer > 0) player.mTimer -= k.dt();
        if (player.commaTimer > 0) player.commaTimer -= k.dt();
        if (player.periodTimer > 0) player.periodTimer -= k.dt();
        if (player.slashTimer > 0) player.slashTimer -= k.dt();

        if (player.health <= 0) {
            k.go("gameover");
            return;
        }
        k.camPos(player.pos);

        if (gameState.isPaused || player.isInDialogue) return;

        const speed = player.speed * getTimeScale();
        let dx = 0;
        let dy = 0;

        if (k.isKeyDown("left") || k.isKeyDown("a") || touchInput.left) dx = -1;
        if (k.isKeyDown("right") || k.isKeyDown("d") || touchInput.right) dx = 1;
        if (k.isKeyDown("up") || k.isKeyDown("w") || touchInput.up) dy = -1;
        if (k.isKeyDown("down") || k.isKeyDown("s") || touchInput.down) dy = 1;

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

    // ── Keyboard controls ──
    function guardedAction(fn) {
        return () => {
            if (gameState.isPaused || player.isInDialogue) return;
            fn();
        };
    }

    const listeners = [
        k.onKeyPress("m", guardedAction(executeSwiftSlash)),
        k.onKeyPress(",", guardedAction(executeTitanCleave)),
        k.onKeyPress(".", guardedAction(executeBladeStorm)),
        k.onKeyPress("/", guardedAction(executeTheWorld)),
        k.onKeyPress("tab", executeSettingsToggle),
        k.onKeyPress("t", guardedAction(executeRevive)),
    ];

    // Cancel all keyboard listeners when player is destroyed
    player.onDestroy(() => listeners.forEach(l => l.cancel()));

    // ── Touch input polling (shared skill functions — no duplication) ──
    k.onUpdate(() => {
        if (!isTouchMode()) return;
        if (gameState.isPaused || player.isInDialogue) {
            consumeTouchTriggers();
            return;
        }

        if (touchInput.m) executeSwiftSlash();
        if (touchInput.comma) executeTitanCleave();
        if (touchInput.period) executeBladeStorm();
        if (touchInput.slash) executeTheWorld();
        if (touchInput.tab) executeSettingsToggle();
        if (touchInput.t) executeRevive();

        consumeTouchTriggers();
    });

    // ── Attack helper ──
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
            k.sprite("attack", { anim }),
            k.pos(player.pos.add(offset)),
            k.anchor("center"),
            k.scale(type === "heavy" ? scaleFactor * 1.5 : scaleFactor),
            k.area(),
            { z: 6 },
            "attack",
            { damage: player.damage + damage },
        ]);
        attackSprite.flipX = flipX;

        k.wait(0.3, () => k.destroy(attackSprite));
    }
}
