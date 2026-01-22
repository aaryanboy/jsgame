import { gameState } from "../utils/utils.js";
import { getTimeScale } from "../systems/timeStop.js";

const AI_CONFIG = {
    detectRange: 500,
    attackRange: 150,
    speed: 100,
    dashSpeed: 500,
    attackCooldown: 1.5,
    dashDuration: 0.5,
    frenzyCount: 3,
};

const BOSS_STATES = {
    IDLE: "idle",
    CHASE: "chase",
    PRE_ATTACK: "pre_attack",
    ATTACK: "attack",
    COOLDOWN: "cooldown",
};

const ATTACK_TYPES = {
    DASH: "dash",
    FRENZY: "frenzy",
    TELEPORT: "teleport",
    SHOOT: "shoot",
};

export function setupBossAI(k, boss, player) {
    let currentState = BOSS_STATES.IDLE;
    let stateTimer = 0;
    let attackCooldownTimer = 0;

    // Attack State Variables
    let currentAttackType = ATTACK_TYPES.DASH;
    let attackDirection = k.vec2(0, 0);
    let frenzyCounter = 0;

    // Helper to deal damage if touching
    function checkDamage() {
        if (boss.isColliding(player)) {
            // Logic to avoid instant death (frame damage)
            // Ideally player has invulnerability frames.
            // For now, we assume player handles damage frames or we just hit once per attack phase?
            // But user asked for continuous check "even if close".
            // We'll rely on player's collision handler or 'hurt' state if possible.
            // Or mostly likely, this triggers the collision event we set up in boss.js
            // But boss.js only uses `onCollide`. 
            // We need to trigger it manually or just apply damage here.

            // Simplest fix: Just push player and damage if no cooldown
            // But boss.js collision logic is: k.onCollide("attack", "boss")... that's player hitting boss.
            // Boss hitting player logic is inside bossAI.js (previous version).

            // We will apply damage directly here.
            // We need a cooldown or player will die in 1 frame.
            // Implementing simple damage tick? 
            // Let's call a damage function if we can.

            // For now, let's just make sure we intersect.
            player.trigger("hurt", boss.damage);
            // "hurt" event not defined on player? 
            // Let's modify player logic later or just subtract health if not invulnerable.

            if (!player.isInvulnerable) {
                player.health -= boss.damage;
                // Set invulnerability for short time?
                player.isInvulnerable = true;
                k.wait(0.5, () => player.isInvulnerable = false);
                console.log("Boss hit player! HP:", player.health);

                // Knockback
                const knockDir = player.pos.sub(boss.pos).unit();
                player.move(knockDir.scale(500 * k.dt())); // Small push
            }
        }
    }

    boss.onUpdate(() => {
        if (gameState.isPaused || gameState.isTimeStopped) return;

        const timeScale = getTimeScale();
        const dt = k.dt() * timeScale;

        // Update timers
        if (stateTimer > 0) stateTimer -= dt;
        if (attackCooldownTimer > 0) attackCooldownTimer -= dt;

        const distToPlayer = boss.pos.dist(player.pos);

        // Continuous damage check during aggressive moves
        if (currentState === BOSS_STATES.ATTACK &&
            (currentAttackType === ATTACK_TYPES.DASH || currentAttackType === ATTACK_TYPES.FRENZY)) {
            checkDamage();
        }

        switch (currentState) {
            case BOSS_STATES.IDLE:
                if (distToPlayer < AI_CONFIG.detectRange) {
                    currentState = BOSS_STATES.CHASE;
                } else {
                    boss.play("idle-down");
                }
                break;

            case BOSS_STATES.CHASE:
                if (distToPlayer < AI_CONFIG.attackRange && attackCooldownTimer <= 0) {
                    currentState = BOSS_STATES.PRE_ATTACK;
                    stateTimer = 0.5;
                    boss.color = k.rgb(255, 100, 100); // Red Warning

                    // Choose Attack
                    const roll = k.rand();
                    if (roll < 0.4) currentAttackType = ATTACK_TYPES.DASH;
                    else if (roll < 0.7) currentAttackType = ATTACK_TYPES.FRENZY;
                    else if (roll < 0.9) currentAttackType = ATTACK_TYPES.SHOOT;
                    else currentAttackType = ATTACK_TYPES.TELEPORT;

                    console.log("Boss preparing:", currentAttackType);

                } else if (distToPlayer > AI_CONFIG.detectRange * 1.5) {
                    currentState = BOSS_STATES.IDLE;
                } else {
                    // Constant Chase
                    const dir = player.pos.sub(boss.pos).unit();
                    boss.move(dir.scale(AI_CONFIG.speed * timeScale));

                    // Animation
                    if (Math.abs(dir.y) > Math.abs(dir.x)) {
                        boss.play(dir.y > 0 ? "walk-down" : "walk-up");
                    } else {
                        boss.play(dir.x > 0 ? "walk-right" : "walk-left");
                    }
                }
                break;

            case BOSS_STATES.PRE_ATTACK:
                if (stateTimer <= 0) {
                    currentState = BOSS_STATES.ATTACK;
                    boss.color = k.rgb(255, 255, 255); // Reset color

                    // Initialize Attack Logic
                    if (currentAttackType === ATTACK_TYPES.DASH) {
                        stateTimer = AI_CONFIG.dashDuration;
                        attackDirection = player.pos.sub(boss.pos).unit();
                    }
                    else if (currentAttackType === ATTACK_TYPES.FRENZY) {
                        frenzyCounter = AI_CONFIG.frenzyCount;
                        stateTimer = AI_CONFIG.dashDuration;
                        attackDirection = player.pos.sub(boss.pos).unit();
                    }
                    else if (currentAttackType === ATTACK_TYPES.TELEPORT) {
                        // Instant Teleport
                        const offset = k.vec2(k.rand(-50, 50), k.rand(-50, 50));
                        boss.pos = player.pos.add(offset);
                        // Short pause after teleport before cooldown
                        stateTimer = 0.5;
                    }
                    else if (currentAttackType === ATTACK_TYPES.SHOOT) {
                        // Fire projectile
                        const dir = player.pos.sub(boss.pos).unit();
                        const projectile = k.make([
                            k.circle(12),
                            k.color(255, 255, 0), // Yellow
                            k.outline(2, k.rgb(255, 0, 0)), // Red outline
                            k.area(),
                            k.pos(boss.pos),
                            k.anchor("center"),
                            k.move(dir, 400),
                            k.offscreen({ destroy: true }),
                            "boss_projectile" // Tag
                        ]);

                        // Projectile collision
                        projectile.onCollide("player", () => {
                            if (!player.isInvulnerable) {
                                player.health -= 15;
                                player.isInvulnerable = true;
                                k.wait(0.5, () => player.isInvulnerable = false);
                                k.destroy(projectile);
                            }
                        });

                        k.add(projectile);
                        stateTimer = 0.5; // Fire delay
                    }
                }
                break;

            case BOSS_STATES.ATTACK:
                if (currentAttackType === ATTACK_TYPES.DASH) {
                    boss.move(attackDirection.scale(AI_CONFIG.dashSpeed * timeScale));
                    if (stateTimer <= 0) {
                        currentState = BOSS_STATES.COOLDOWN;
                        attackCooldownTimer = AI_CONFIG.attackCooldown;
                    }
                }
                else if (currentAttackType === ATTACK_TYPES.FRENZY) {
                    boss.move(attackDirection.scale(AI_CONFIG.dashSpeed * 1.5 * timeScale)); // Faster frenzy
                    if (stateTimer <= 0) {
                        frenzyCounter--;
                        if (frenzyCounter > 0) {
                            // Reset for next dash
                            stateTimer = AI_CONFIG.dashDuration;
                            attackDirection = player.pos.sub(boss.pos).unit(); // Re-target
                        } else {
                            currentState = BOSS_STATES.COOLDOWN;
                            attackCooldownTimer = AI_CONFIG.attackCooldown + 1; // Longer cooldown
                        }
                    }
                }
                else if (currentAttackType === ATTACK_TYPES.TELEPORT || currentAttackType === ATTACK_TYPES.SHOOT) {
                    // For teleport/shoot, we just wait out the stateTimer
                    if (stateTimer <= 0) {
                        currentState = BOSS_STATES.COOLDOWN;
                        attackCooldownTimer = AI_CONFIG.attackCooldown;
                    }
                }
                break;

            case BOSS_STATES.COOLDOWN:
                if (attackCooldownTimer <= 0) {
                    currentState = BOSS_STATES.CHASE;
                } else {
                    boss.play("idle-down");
                }
                break;
        }
    });
}
