// Time Stop System - "The World" / Chrono Stasis skill
import { gameState } from "../utils/utils.js";
import { skills } from "../utils/constants.js";

// Internal time scale that smoothly transitions
let internalTimeScale = 1.0;
let isSlowingDown = false;  // True when slowing down to stop
let isResuming = false;     // True when resuming from stop
let transitionProgress = 0;

// Duration for which time stays fully stopped
const TIME_STOP_DURATION = 5.0; // 5 seconds
// Duration for time to slowly slow down before stopping
const SLOW_DOWN_DURATION = 0.6; // 0.6 seconds to fully stop
// Duration for time to slowly resume back to normal
const RESUME_DURATION = 1.0; // 1 second to fully resume

// Returns the current time scale (0.0 = stopped, 1.0 = normal)
export function getTimeScale() {
    return internalTimeScale;
}

// Toggle time stop on/off
export function toggleTimeStop(k) {
    if (!gameState.isTimeStopped && !isSlowingDown) {
        // Activate time stop (with slow-down transition)
        activateTimeStop(k);
    } else if (gameState.isTimeStopped && !isResuming) {
        // Deactivate time stop (starts slow resume)
        deactivateTimeStop(k);
    }
}

function activateTimeStop(k) {
    isSlowingDown = true;
    isResuming = false;
    transitionProgress = 0;

    console.log("⏱️ TIME SLOWING DOWN...");

    // Create visual effect - purple tint overlay (starts transparent, fades in)
    const overlay = k.add([
        k.rect(k.width(), k.height()),
        k.pos(0, 0),
        k.color(147, 112, 219), // Purple color matching skill
        k.opacity(0),
        k.fixed(),
        k.z(50),
        "timeStopOverlay"
    ]);

    // Add "TIME STOP" text indicator (starts transparent)
    const textIndicator = k.add([
        k.text("⏱ CHRONO STASIS", { size: 24 }),
        k.pos(k.width() / 2, 100),
        k.anchor("center"),
        k.color(255, 255, 255),
        k.opacity(0),
        k.fixed(),
        k.z(51),
        "timeStopText"
    ]);

    // Gradually slow down time
    const slowDownLoop = k.onUpdate(() => {
        transitionProgress += k.dt() / SLOW_DOWN_DURATION;

        if (transitionProgress >= 1.0) {
            // Fully stopped
            internalTimeScale = 0.0;
            gameState.isTimeStopped = true;
            isSlowingDown = false;
            transitionProgress = 0;

            console.log("⏱️ TIME FULLY STOPPED!");
            slowDownLoop.cancel();

            // Start pulsing effect on overlay
            overlay.onUpdate(() => {
                if (gameState.isTimeStopped && !isResuming) {
                    overlay.opacity = 0.2 + Math.sin(k.time() * 4) * 0.1;
                }
            });

            // Schedule automatic deactivation after TIME_STOP_DURATION
            k.wait(TIME_STOP_DURATION, () => {
                if (gameState.isTimeStopped && !isResuming) {
                    deactivateTimeStop(k);
                }
            });
        } else {
            // Ease-out for slowing down (fast at start, slow at end - feels like slowing)
            internalTimeScale = 1.0 - easeOutQuad(transitionProgress);

            // Fade in overlay as time slows
            overlay.opacity = 0.3 * easeOutQuad(transitionProgress);
            textIndicator.opacity = easeOutQuad(transitionProgress);
        }
    });
}

function deactivateTimeStop(k) {
    if (!gameState.isTimeStopped || isResuming) return;

    isResuming = true;
    transitionProgress = 0;

    console.log("⏱️ TIME STARTING TO MOVE...");

    // Phase 1: Go from fully stopped (0) to slow motion (0.3)
    const SLOW_START_DURATION = 0.5;  // Time to reach slow motion
    const SLOW_MOTION_SCALE = 0.25;    // The slow motion speed (25% of normal)
    const SPEED_UP_DURATION = 0.8;    // Time to go from slow motion to normal

    let phase = 1; // 1 = slow start, 2 = speed up

    const resumeLoop = k.onUpdate(() => {
        if (phase === 1) {
            // Phase 1: Stopped → Slow motion
            transitionProgress += k.dt() / SLOW_START_DURATION;

            if (transitionProgress >= 1.0) {
                // Reached slow motion, switch to phase 2
                internalTimeScale = SLOW_MOTION_SCALE;
                transitionProgress = 0;
                phase = 2;
                console.log("⏱️ TIME IN SLOW MOTION...");
            } else {
                // Ease-out: quick start from stopped, slows as it reaches slow-mo
                internalTimeScale = SLOW_MOTION_SCALE * easeOutQuad(transitionProgress);

                // Start fading out overlay
                const overlays = k.get("timeStopOverlay");
                const texts = k.get("timeStopText");
                overlays.forEach(overlay => {
                    overlay.opacity = 0.3 * (1 - transitionProgress * 0.3);
                });
                texts.forEach(text => {
                    text.opacity = 1 - transitionProgress * 0.3;
                });
            }
        } else {
            // Phase 2: Slow motion → Normal speed
            transitionProgress += k.dt() / SPEED_UP_DURATION;

            if (transitionProgress >= 1.0) {
                // Fully resumed
                internalTimeScale = 1.0;
                gameState.isTimeStopped = false;
                isResuming = false;
                transitionProgress = 0;

                // Clean up visual effects
                k.get("timeStopOverlay").forEach(obj => k.destroy(obj));
                k.get("timeStopText").forEach(obj => k.destroy(obj));

                console.log("⏱️ TIME FULLY RESUMED!");
                resumeLoop.cancel();
            } else {
                // Ease-in: slow acceleration from slow-mo, speeds up towards normal
                internalTimeScale = SLOW_MOTION_SCALE + (1.0 - SLOW_MOTION_SCALE) * easeInQuad(transitionProgress);

                // Continue fading out overlay
                const overlays = k.get("timeStopOverlay");
                const texts = k.get("timeStopText");
                const fadeProgress = 0.3 + transitionProgress * 0.7; // Continue from where phase 1 left off
                overlays.forEach(overlay => {
                    overlay.opacity = 0.3 * (1 - fadeProgress);
                });
                texts.forEach(text => {
                    text.opacity = 1 - fadeProgress;
                });
            }
        }
    });
}

// Easing function: slow start, then accelerates
function easeInQuad(t) {
    return t * t;
}

// Easing function: fast start, slow end
function easeOutQuad(t) {
    return 1 - (1 - t) * (1 - t);
}
