import { scaleFactor, skills, playerinfo, gameConfig, Z, TAGS, RANGES } from "../utils/constants.js";
import { gameState } from "../utils/utils.js";
import { toggleSettingsMenu } from "../systems/settingsMenu.js";
import { toggleTimeStop, getTimeScale } from "../systems/timeStop.js";
import { revivePet } from "./frog.js";
import { createSlime } from "./enemies/slime.js";
import { createStatsMenu } from "../ui/statsMenu.js";
import { touchInput, isTouchMode, showTouchControls, consumeTouchTriggers } from "../ui/touchControls.js";
import { createGlobalHUD } from "../ui/globalHUD.js";
import { THEME } from "../utils/theme.js";
import { petState } from "../systems/persistentPet.js"; // IMPORT PET STATE

export function createPlayer(k) {
    const skinSprite = `skin_${gameConfig.player.skinIndex}`;
    // Use persisted health if available, otherwise max
    const startHealth = gameState.playerHealth != null
        ? gameState.playerHealth
        : playerinfo.health;

    const player = k.make([
        k.sprite(skinSprite, { anim: "idle-down" }),
        k.area({ shape: new k.Rect(k.vec2(0, 3), 10, 10) }),
        k.body(),
        k.anchor("center"),
        k.pos(),
        k.scale(scaleFactor),
        { z: Z.player },
        {
            speed: playerinfo.speed,
            direction: playerinfo.direction,
            isInDialogue: playerinfo.isInDialogue,
            health: startHealth,
            damage: playerinfo.damage,
            critRate: playerinfo.critRate,
            critDamage: playerinfo.critDamage,
            isInvulnerable: false,
            reviveProgress: 0,
            mTimer: 0,
            commaTimer: 0,
            periodTimer: 0,
            slashTimer: 0,
        },
        TAGS.player,
    ]);

    return player;
}

export function setPlayerControls(k, player) {
    // ── UI Components ──
    createStatsMenu(k, player);
    createGlobalHUD(k, player);
    if (isTouchMode()) showTouchControls(k);

    // ── Revive UI Overlay (Follows Player) ──
    const REVIVE_TIME = 2.0;

    const reviveUI = k.add([
        k.pos(),
        { z: 150 },
        "reviveUI"
    ]);

    const reviveBg = reviveUI.add([
        k.rect(40, 6, { radius: 3 }),
        k.color(...THEME.palette.bg),
        k.opacity(0),
        k.anchor("center"),
        k.pos(0, -45),
    ]);
    
    const reviveFill = reviveUI.add([
        k.rect(0, 6, { radius: 3 }),
        k.color(...THEME.brand.primary), // Sleek purple
        k.opacity(0),
        k.anchor("left"),
        k.pos(-20, -45),
    ]);

    const reviveText = reviveUI.add([
        k.text("Hold to Revive", { size: 10, font: "monospace" }),
        k.color(255, 255, 255),
        k.opacity(0),
        k.anchor("center"),
        k.pos(0, -60),
    ]);

    // Interactable area to allow touch users to hold to revive
    const reviveHitbox = reviveUI.add([
        k.rect(100, 60),
        k.anchor("center"),
        k.pos(0, -50),
        k.opacity(0), 
        k.area(), 
    ]);

    player.onDestroy(() => k.destroy(reviveUI));

    // ── Shared skill execution functions ──
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

    function executeSpawnSlime() {
        const spawnPos = player.pos.add(k.vec2(30, 0));
        const slime = createSlime(k, spawnPos, player);
        k.add(slime);
    }

    // ── Game Loop ──
    k.onUpdate(() => {
        if (player.mTimer > 0) player.mTimer -= k.dt();
        if (player.commaTimer > 0) player.commaTimer -= k.dt();
        if (player.periodTimer > 0) player.periodTimer -= k.dt();
        if (player.slashTimer > 0) player.slashTimer -= k.dt();

        if (player.health <= 0) {
            if (gameState.bgm) { gameState.bgm.stop(); gameState.bgm = null; }
            gameState.playerHealth = null;   // Reset for fresh start
            gameState.slimesByRoom = {};     // Clear saved enemies
            k.go("gameover");
            return;
        }
        k.camPos(player.pos);
        
        // Update Revive UI position
        reviveUI.pos = player.pos;

        // ── Revive Logic ──
        const tvObjects = k.get("tv");
        const nearTV = tvObjects.some(tv => player.pos.dist(tv.pos) < 50);

        if (nearTV && petState.isDead) { // 
            reviveBg.opacity = 0.6;
            reviveText.opacity = Math.max(0.6, Math.sin(k.time() * 4) * 0.5 + 0.5); // Pulse gently
            
            let touchHolding = false;
            if (k.isMouseDown("left") || isTouchMode()) {
                if (k.getTouches && k.getTouches().length > 0) {
                    for (const t of k.getTouches()) {
                        const touchWorldPos = k.toWorld(t.pos ? t.pos : t);
                        // Approximate hovering since hasPoint expects world coord on UI relative elements can be tricky
                        if (reviveHitbox.hasPoint(touchWorldPos) || touchWorldPos.dist(player.pos) < 60) {
                            touchHolding = true;
                        }
                    }
                }
                if (k.isMouseDown("left")) {
                    if (reviveHitbox.isHovering()) touchHolding = true;
                }
            }

            const holding = touchHolding || k.isKeyDown("t");

            if (holding) {
                player.reviveProgress += k.dt() / REVIVE_TIME;
                player.reviveProgress = Math.min(player.reviveProgress, 1);
            } else {
                player.reviveProgress = Math.max(0, player.reviveProgress - k.dt() * 2); // quickly decay
            }
            
            reviveFill.width = 40 * player.reviveProgress;
            reviveFill.opacity = player.reviveProgress > 0 ? 1 : 0;
            
            if (player.reviveProgress >= 1) {
                revivePet();
                player.reviveProgress = 0;
            }
        } else {
            player.reviveProgress = 0;
            reviveBg.opacity = 0;
            reviveFill.opacity = 0;
            reviveText.opacity = 0;
        }

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
        k.onKeyPress("l", guardedAction(executeSpawnSlime)),
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
