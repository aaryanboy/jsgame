import { scaleFactor, skills, playerinfo, gameConfig, Z, TAGS, RANGES } from "../utils/constants.js";
import { gameState } from "../utils/utils.js";
import { toggleSettingsMenu } from "../systems/settingsMenu.js";
import { toggleTimeStop, getTimeScale } from "../systems/timeStop.js";
import { createSlime } from "./enemies/slime.js";
import { createStatsMenu } from "../ui/statsMenu.js";
import { touchInput, isTouchMode, showTouchControls, consumeTouchTriggers } from "../ui/touchControls.js";
import { createGlobalHUD } from "../ui/globalHUD.js";
import { THEME } from "../utils/theme.js";
import { petState, revivePet } from "../systems/persistentPet.js"; // UPDATED IMPORT

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
            maxHealth: playerinfo.health,
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

    const REVIVE_TIME = 2.0;
    const reviveUI = k.add([k.pos(), { z: 150 }, "reviveUI"]);
    const reviveBg = reviveUI.add([k.rect(40, 6, { radius: 3 }), k.color(...THEME.palette.bg), k.opacity(0), k.anchor("center"), k.pos(0, -45)]);
    const reviveFill = reviveUI.add([k.rect(0, 6, { radius: 3 }), k.color(...THEME.brand.primary), k.opacity(0), k.anchor("left"), k.pos(-20, -45)]);
    const reviveText = reviveUI.add([k.text("Hold to Revive", { size: 10, font: "monospace" }), k.color(255, 255, 255), k.opacity(0), k.anchor("center"), k.pos(0, -60)]);
    const reviveHitbox = reviveUI.add([k.rect(100, 60), k.anchor("center"), k.pos(0, -50), k.opacity(0), k.area()]);

    player.onDestroy(() => k.destroy(reviveUI));

    // ── Skill System Integration ──
    function executeSkillInSlot(slotIndex) {
        if (gameState.isPaused || player.isInDialogue || gameState.inputLocked) return;
        
        const skillId = gameState.player.activeSkills[slotIndex];
        if (!skillId) return;
        
        import("../systems/progression.js").then(module => {
            const skill = module.SKILLS[skillId];
            if (!skill) return;

            // Handle Unique Skill Behaviors
            if (skillId === "theWorld") {
                if (gameState.isTimeStopped) return;
                k.play("zawarudo", { volume: 0.7 });
                toggleTimeStop(k);
                return;
            }

            if (skillId === "bladeStorm") {
                k.play("shield", { volume: 0.5 });
                const spin = k.add([
                    k.circle(50),
                    k.pos(player.pos),
                    k.anchor("center"),
                    k.color(0, 100, 255),
                    k.opacity(0.5),
                    k.area(),
                    "attack",
                    { damage: player.damage + skill.damage },
                ]);
                k.wait(0.2, () => k.destroy(spin));
                return;
            }

            // Default Attack Skills
            performAttack(k, player, skill.damage > 20 ? "heavy" : "slash", skill.damage);
        });
    }

    function toggleInventory() {
        import("../ui/skillMenu.js").then(module => {
            module.toggleSkillMenu(k, player);
        });
    }

    // ── Game Loop ──
    k.onUpdate(() => {
        if (player.health <= 0) {
            if (gameState.bgm) { gameState.bgm.stop(); gameState.bgm = null; }
            gameState.playerHealth = null;
            gameState.slimesByRoom = {};
            k.go("gameover");
            return;
        }
        
        k.camPos(player.pos);
        reviveUI.pos = player.pos;

        // ── Revive Logic ──
        const tvObjects = k.get("tv");
        const nearTV = tvObjects.some(tv => player.pos.dist(tv.pos) < 50);

        if (nearTV && petState.isDead) { 
            reviveBg.opacity = 0.6;
            reviveText.opacity = Math.max(0.6, Math.sin(k.time() * 4) * 0.5 + 0.5);
            
            let touchHolding = false;
            if (k.isMouseDown("left") || isTouchMode()) {
                if (k.getTouches && k.getTouches().length > 0) {
                    for (const t of k.getTouches()) {
                        const touchWorldPos = k.toWorld(t.pos ? t.pos : t);
                        if (reviveHitbox.hasPoint(touchWorldPos) || touchWorldPos.dist(player.pos) < 60) touchHolding = true;
                    }
                }
                if (k.isMouseDown("left") && reviveHitbox.isHovering()) touchHolding = true;
            }

            if (touchHolding || k.isKeyDown("t")) {
                player.reviveProgress += k.dt() / REVIVE_TIME;
                player.reviveProgress = Math.min(player.reviveProgress, 1);
            } else {
                player.reviveProgress = Math.max(0, player.reviveProgress - k.dt() * 2);
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

        if (gameState.isPaused || player.isInDialogue || gameState.inputLocked) return;

        const speed = player.speed * getTimeScale();
        let dx = 0, dy = 0;

        if (k.isKeyDown("left") || k.isKeyDown("a") || touchInput.left) dx = -1;
        if (k.isKeyDown("right") || k.isKeyDown("d") || touchInput.right) dx = 1;
        if (k.isKeyDown("up") || k.isKeyDown("w") || touchInput.up) dy = -1;
        if (k.isKeyDown("down") || k.isKeyDown("s") || touchInput.down) dy = 1;

        if (dx !== 0 || dy !== 0) {
            const moveVec = k.vec2(dx, dy).unit().scale(speed);
            player.move(moveVec);
            if (dy < 0) { if (player.curAnim() !== "walk-up") player.play("walk-up"); player.direction = "up"; }
            else if (dy > 0) { if (player.curAnim() !== "walk-down") player.play("walk-down"); player.direction = "down"; }
            else if (dx < 0) { if (player.curAnim() !== "walk-side") player.play("walk-side"); player.direction = "left"; player.flipX = true; }
            else if (dx > 0) { if (player.curAnim() !== "walk-side") player.play("walk-side"); player.direction = "right"; player.flipX = false; }
        } else {
            const curAnim = player.curAnim();
            if (player.direction === "up" && curAnim !== "idle-up") player.play("idle-up");
            else if (player.direction === "down" && curAnim !== "idle-down") player.play("idle-down");
            else if ((player.direction === "left" || player.direction === "right") && curAnim !== "idle-side") player.play("idle-side");
        }
    });

    const listeners = [
        k.onKeyPress("1", () => executeSkillInSlot(0)),
        k.onKeyPress("2", () => executeSkillInSlot(1)),
        k.onKeyPress("3", () => executeSkillInSlot(2)),
        k.onKeyPress("4", () => executeSkillInSlot(3)),
        k.onKeyPress("i", toggleInventory),
        k.onKeyPress("e", toggleInventory),
        k.onKeyPress("tab", () => toggleSettingsMenu(k)),
        k.onKeyPress("l", () => {
            if (gameState.isPaused) return;
            const spawnPos = player.pos.add(k.vec2(30, 0));
            k.add(createSlime(k, spawnPos, player));
        }),
    ];

    player.onDestroy(() => listeners.forEach(l => l.cancel()));

    // ── Touch input polling ──
    k.onUpdate(() => {
        if (!isTouchMode()) return;
        if (gameState.isPaused || player.isInDialogue || gameState.inputLocked) {
            consumeTouchTriggers();
            return;
        }

        if (touchInput.m) executeSkillInSlot(0);
        if (touchInput.comma) executeSkillInSlot(1);
        if (touchInput.period) executeSkillInSlot(2);
        if (touchInput.slash) executeSkillInSlot(3);
        if (touchInput.tab) toggleSettingsMenu(k);

        consumeTouchTriggers();
    });

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
