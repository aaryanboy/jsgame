import { createFrog } from "./frog.js";
import { createCat } from "./cat.js";

const PET_CREATORS = {
    frog: createFrog,
    cat: createCat,
};

/**
 * Factory function to create any pet type
 * @param {Object} k - Kaboom context
 * @param {string} type - Pet type (e.g., "frog", "cat")
 * @param {Object} pos - Spawn position
 * @param {Object} player - Player entity
 * @param {boolean} restoreHealth - Whether to restore health from state
 * @returns {Object} The created pet entity
 */
export function createPet(k, type, pos, player, restoreHealth = false) {
    const creator = PET_CREATORS[type] || createFrog;
    return creator(k, pos, player, restoreHealth);
}
