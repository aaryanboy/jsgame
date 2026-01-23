import { dialogueData, scaleFactor } from "../utils/constants.js";
import { displayDialogue, setCamScale } from "../utils/utils.js";
import { createPlayer, setPlayerControls } from "../entities/player.js";
import { createBoss, setupBossLogic } from "../entities/boss.js";
import { setupEnemyMovement } from "../systems/enemyMovement.js";
import { createFrog } from "../entities/frog.js";
import { petState, spawnPetInNewRoom, checkPetTransition } from "../systems/persistentPet.js";
import { createDamageBox } from "../ui/damageBox.js";
import { resetTimeStop } from "../systems/timeStop.js";

export const roomData = {
    main: {
        name: "main",
        sprite: "mainroom",
        jjson: "./mainroom.json",
    },
    map: {
        name: "map",
        sprite: "maproom",
        jjson: "./map.json",
    },
    area: {
        name: "area",
        sprite: "maparea",
        jjson: "./maparea.json",
    },
    boss: {
        name: "boss",
        sprite: "bossroom",
        jjson: "./bossroom.json",
    },
};

// Track the desired spawn point for next scene load
let nextSpawnPoint = "player";

export function loadRoom(k, roomName, spawnPoint = "player") {
    k.scene(roomName, async () => {
        // Reset time stop state immediately on room load
        resetTimeStop();

        // Use the tracked spawn point for this scene
        const currentSpawnPoint = nextSpawnPoint;
        nextSpawnPoint = "player"; // Reset for next load
        const room = roomData[roomName];
        const mapData = await (await fetch(room.jjson)).json();
        const layers = mapData.layers;

        // Add room background
        const map = k.add([
            k.sprite(room.sprite),
            k.pos(0),
            k.scale(scaleFactor),
            { z: 0 },
        ]);

        // Variables to hold entities created in this scene
        let player = null;
        let enemy = null;
        let persistentPet = null;

        // We need to define these beforehand so we can use them in the loop
        const pcBoundary = k.make([
            k.area({ shape: new k.Rect(k.vec2(0), 100, 50) }),
            k.pos(),
            "pc",
        ]);

        // Extra decoration for specific room
        if (roomName === "area") {
            k.add([
                k.sprite("tree"),
                k.pos(0),
                k.scale(scaleFactor),
                { z: 4 },
            ]);
        }

        // Process Layers
        for (const layer of layers) {
            if (layer.name === "boundaries") {
                for (const boundary of layer.objects) {
                    k.add([
                        k.area({
                            shape: new k.Rect(
                                k.vec2(0),
                                boundary.width * scaleFactor,
                                boundary.height * scaleFactor
                            ),
                        }),
                        k.body({ isStatic: true }),
                        k.pos(
                            boundary.x * scaleFactor,
                            boundary.y * scaleFactor
                        ),
                        boundary.name,
                    ]);

                    // We attach collision logic to the player LATER once player is defined?
                    // No, we need to do it after player exists.
                    // Since "spawnpoints" usually comes AFTER "boundaries" in Tiled JSON, we might have an issue if we try to attach immediately.
                    // BUT, we can attach to 'player' tag essentially, or wait until player is created.
                    // Actually, k.onCollide works with tags. So we don't need the specific player object instance for the event definition!
                    // Replace `player.onCollide` with `k.onCollide("player", ...)`
                }
                continue;
            }

            if (layer.name === "spawnpoints") {
                // First, find the correct spawn point position
                let playerSpawnPos = null;
                let returnSpawnPos = null;

                for (const entity of layer.objects) {
                    if (entity.name === "player") {
                        playerSpawnPos = k.vec2(
                            (map.pos.x + entity.x) * scaleFactor,
                            (map.pos.y + entity.y) * scaleFactor
                        );
                    }
                    if (entity.name === "return") {
                        returnSpawnPos = k.vec2(
                            (map.pos.x + entity.x) * scaleFactor,
                            (map.pos.y + entity.y) * scaleFactor
                        );
                    }
                }

                // Create player at the appropriate spawn point
                if (playerSpawnPos) {
                    player = createPlayer(k);
                    // Use return spawn if requested and available, otherwise use player spawn
                    if (currentSpawnPoint === "return" && returnSpawnPos) {
                        player.pos = returnSpawnPos;
                    } else {
                        player.pos = playerSpawnPos;
                    }
                    k.add(player);
                    setPlayerControls(k, player);

                    // Attempt to spawn persistent pet (pass createFrog as dependency)
                    persistentPet = spawnPetInNewRoom(k, player, createFrog);
                    createDamageBox(k);
                }

                // Now handle other spawn entities
                for (const entity of layer.objects) {

                    // Boss Entity
                    if (entity.name === "Boss") {
                        enemy = createBoss(k);
                        enemy.pos = k.vec2(
                            (map.pos.x + entity.x) * scaleFactor,
                            (map.pos.y + entity.y) * scaleFactor
                        );
                        k.add(enemy);
                        if (player) {
                            setupBossLogic(k, enemy, player);
                        }
                        continue;
                    }

                    // Pet Entity ( Friendly / No Combat )
                    if (entity.name === "pet" || entity.name === "frog") {
                        // If persistent pet logic is active (alive or dead), skip map spawn
                        if (petState.shouldPersist) continue;

                        const startPos = k.vec2(
                            (map.pos.x + entity.x) * scaleFactor,
                            (map.pos.y + entity.y) * scaleFactor
                        );

                        // We use the createFrog for both pet and frog for now as they share sprites/logic
                        // logic is inside createFrog now
                        const mob = createFrog(k, startPos, player);

                        // If it's specifically "pet", we might want to tag it as pet if needed, 
                        // but the new module tags it as "frog". 
                        // Let's ensure we add it to the scene.
                        k.add(mob);
                    }

                    if (entity.name === "pc") {
                        pcBoundary.pos = k.vec2(
                            (map.pos.x + entity.x) * scaleFactor,
                            (map.pos.y + entity.y) * scaleFactor
                        );
                        k.add(pcBoundary);
                    }
                }
            }
        }

        setCamScale(k);
        k.onResize(() => {
            setCamScale(k);
        });

        // Setup Global boundary collisions for this scene
        // We use "player" tag which is attached to the player entity.

        // Exit Transitions
        k.onCollide("player", "exit_to_map", () => {
            checkPetTransition(player); // Check if pet should follow
            k.destroyAll();
            nextSpawnPoint = "return"; // Use return spawn when coming back
            loadRoom(k, "map");
            k.go("map");
        });
        k.onCollide("player", "exit_to_area", () => {
            checkPetTransition(player);
            k.destroyAll();
            loadRoom(k, "area");
            k.go("area");
        });
        k.onCollide("player", "exit_to_boss", () => {
            checkPetTransition(player);
            k.destroyAll();
            loadRoom(k, "boss");
            k.go("boss");
        });
        k.onCollide("player", "exit_to_main", () => {
            checkPetTransition(player);
            k.destroyAll();
            loadRoom(k, "main");
            k.go("main");
        });

        // Dialogue Interations
        // We iterate over all boundary names that have dialogue
        for (const [key, value] of Object.entries(dialogueData)) {
            // If a boundary has this name, we attach listener
            // But we don't know if the boundary exists in this room without iterating boundaries again.
            // It's safer to just Listen for ANY collision with something that has dialogue data.

            // However, Kaboom onCollide needs a specific tag.
            // The boundaries were created with `boundary.name` as a tag!
            k.onCollide("player", key, () => {
                // Logic to show dialogue
                // We need access to the player object to set 'isInDialogue'
                if (player) {
                    player.isInDialogue = true;
                    displayDialogue(value, () => (player.isInDialogue = false));
                }
            });
        }

    });
}
