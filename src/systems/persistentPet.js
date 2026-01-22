
// persistentPet.js handles pet state and cross-map persistence logic

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
 * Check if pet is currently dead
 * @returns {boolean}
 */
export function isPetDead() {
    return petState.isDead;
}

/**
 * Check if the pet is close enough to the player to transition
 * Updates petState.shouldPersist based on proximity
 * @param {Object} player - Player object
 * @returns {boolean} True if pet will persist
 */
export function checkPetTransition(player) {
    // If dead, we shouldn't persist (already handled by state, but good to check)
    if (petState.isDead) {
        petState.shouldPersist = false; // Ensure it stays false if dead?
        // Actually, if dead, we might want to keep shouldPersist true to respawn?
        // No, current logic is: if dead, stay dead until revived.
        // So return false.
        return false;
    }

    if (!petState.currentPet) {
        // No pet instance (maybe destroyed or not yet spawned)
        // Keep previous persistence state?
        // If we have no pet instance but shouldPersist is true, it means we are in between rooms?
        // But this function is called *before* leaving the room.
        return petState.shouldPersist;
    }

    const distance = player.pos.dist(petState.currentPet.pos);
    const MAX_FOLLOW_DISTANCE = 300; // Adjust as needed

    if (distance <= MAX_FOLLOW_DISTANCE) {
        petState.shouldPersist = true;
        console.log("Pet is close enough. Will follow.");
        return true;
    } else {
        petState.shouldPersist = false;
        console.log("Pet is too far! It stays behind.");
        return false;
    }
}

/**
 * Spawn the pet in a new room if it should persist
 * @param {Object} k - Kaboom context
 * @param {Object} player - Player object
 * @param {Function} createFrogFn - Function to create the frog entity (dependency injection)
 * @returns {Object|null} The spawned pet or null
 */
export function spawnPetInNewRoom(k, player, createFrogFn) {
    // Don't spawn if pet is dead or shouldn't persist
    if (petState.isDead || !petState.shouldPersist) {
        return null;
    }

    // Spawn pet near the player with restored health
    const spawnPos = player.pos.add(k.vec2(30, 0));

    // We pass true to restoreHealth
    const pet = createFrogFn(k, spawnPos, player, true);
    k.add(pet);

    console.log("Pet spawned in new room with health:", petState.currentHealth);
    return pet;
}

/**
 * Reset persistence (e.g. on death or revive)
 */
export function setPetPersistence(value) {
    petState.shouldPersist = value;
}
