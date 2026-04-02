import { petInfo } from "../utils/constants.js";
import { createPet } from "../entities/pets/petFactory.js";

// Track pet state globally
export const petState = {
    isDead: false,
    lastDeathPos: null,
    currentPet: null,
    player: null,
    kaboom: null,
    shouldPersist: false,  // Start false, becomes true after first spawn
    currentHealth: 50,    // Track health across maps
};


/**
 * Check if the pet is close enough to the player to transition
 * Updates petState.shouldPersist based on proximity
 * @param {Object} player - Player object
 * @returns {boolean} True if pet will persist
 */
export function checkPetTransition(player) {
    if (petState.isDead) {
        petState.shouldPersist = false; 
        return false;
    }

    if (!petState.currentPet) {
        return petState.shouldPersist;
    }

    const distance = player.pos.dist(petState.currentPet.pos);
    const MAX_FOLLOW_DISTANCE = 300; 

    if (distance <= MAX_FOLLOW_DISTANCE) {
        petState.shouldPersist = true;
        return true;
    } else {
        petState.shouldPersist = false;
        return false;
    }
}

/**
 * Spawn the pet in a new room if it should persist
 * @param {Object} k - Kaboom context
 * @param {Object} player - Player object
 * @returns {Object|null} The spawned pet or null
 */
export function spawnPetInNewRoom(k, player) {
    // Don't spawn if pet is dead or shouldn't persist
    if (petState.isDead || !petState.shouldPersist) {
        return null;
    }

    // Spawn pet near the player with restored health
    const spawnPos = player.pos.add(k.vec2(30, 0));

    // We use the factory now
    const pet = createPet(k, petInfo.type, spawnPos, player, true);
    k.add(pet);

    return pet;
}

/**
 * Revive the pet at the player's position
 * @returns {boolean} Whether the pet was successfully revived
 */
export function revivePet() {
    if (!petState.kaboom || !petState.player) {
        return false;
    }

    const k = petState.kaboom;
    const player = petState.player;

    // If the pet is already alive and in this room, don't do anything
    if (petState.currentPet && !petState.isDead) {
        return false;
    }

    // If there's an existing pet instance (e.g. it was dead in this room), destroy it before re-spawning
    if (petState.currentPet) {
        k.destroy(petState.currentPet);
    }

    // Reset state to ensure it spawns and persists
    petState.isDead = false;
    petState.shouldPersist = true;

    // Spawn current equipped pet near the player
    const spawnPos = player.pos.add(k.vec2(30, 0));
    const newPet = createPet(k, petInfo.type, spawnPos, player);
    k.add(newPet);

    return true;
}

/**
 * Reset persistence (e.g. on death or revive)
 */
