import { gameState } from "../utils/utils.js";

// Time stop configuration
const TIME_STOP_CONFIG = {
    slowdownDuration: 0.5,  // Time in seconds to slow down to stop
    minTimeScale: 0.0,      // Minimum time scale (0 = complete stop)
    slowdownSteps: [1.0, 0.7, 0.4, 0.2, 0.1, 0.0], // Gradual slowdown steps
};

let timeStopState = {
    isActive: false,
    currentStep: 0,
    stepTimer: null,
};

/**
 * Initiates the gradual time slowdown effect
 * @param {Object} k - Kaboom context
 */
export function startTimeStop(k) {
    if (timeStopState.isActive) return; // Already stopping time

    timeStopState.isActive = true;
    timeStopState.currentStep = 0;

    const stepDuration = TIME_STOP_CONFIG.slowdownDuration / (TIME_STOP_CONFIG.slowdownSteps.length - 1);

    // Apply first step immediately
    applyTimeScale(k, TIME_STOP_CONFIG.slowdownSteps[0]);

    // Gradually apply each step
    function nextStep() {
        timeStopState.currentStep++;

        if (timeStopState.currentStep >= TIME_STOP_CONFIG.slowdownSteps.length) {
            // Time is now fully stopped
            gameState.isTimeStopped = true;
            return;
        }

        const scale = TIME_STOP_CONFIG.slowdownSteps[timeStopState.currentStep];
        applyTimeScale(k, scale);

        // Schedule next step (using real time, not game time)
        timeStopState.stepTimer = setTimeout(() => nextStep(), stepDuration * 1000);
    }

    // Start the slowdown sequence
    timeStopState.stepTimer = setTimeout(() => nextStep(), stepDuration * 1000);
}

/**
 * Resumes time back to normal
 * @param {Object} k - Kaboom context
 */
export function endTimeStop(k) {
    if (!timeStopState.isActive) return;

    // Clear any pending step timer
    if (timeStopState.stepTimer) {
        clearTimeout(timeStopState.stepTimer);
        timeStopState.stepTimer = null;
    }

    // Reset time scale to normal
    applyTimeScale(k, 1.0);

    timeStopState.isActive = false;
    timeStopState.currentStep = 0;
    gameState.isTimeStopped = false;
}

/**
 * Toggle time stop on/off
 * @param {Object} k - Kaboom context
 */
export function toggleTimeStop(k) {
    if (timeStopState.isActive) {
        endTimeStop(k);
    } else {
        startTimeStop(k);
    }
}

/**
 * Applies the time scale to the game
 * @param {Object} k - Kaboom context
 * @param {number} scale - Time scale (1.0 = normal, 0 = stopped)
 */
function applyTimeScale(k, scale) {
    gameState.timeScale = scale;

    // Visual/audio feedback for time slowdown
    if (gameState.bgm) {
        // Slow down BGM playback rate with time
        gameState.bgm.speed = Math.max(0.5, scale); // Min 0.5 for audio
        if (scale === 0) {
            gameState.bgm.pause();
        } else if (gameState.bgm.paused) {
            gameState.bgm.play();
        }
    }
}

/**
 * Gets the current time scale for use in movement/animation calculations
 * @returns {number} Current time scale
 */
export function getTimeScale() {
    return gameState.timeScale ?? 1.0;
}

/**
 * Check if time is currently stopped or stopping
 * @returns {boolean}
 */
export function isTimeStopping() {
    return timeStopState.isActive;
}
