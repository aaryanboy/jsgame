import { dialogueData, scaleFactor } from "../utils/constants.js";
import { displayDialogue, setCamScale } from "../utils/utils.js";
import { createPlayer, setPlayerControls } from "../entities/player.js";
import { createFrog } from "../entities/frog.js";
import { petState, spawnPetInNewRoom, checkPetTransition } from "../systems/persistentPet.js";
import { createDamageBox } from "../ui/damageBox.js";
import { resetTimeStop } from "../systems/timeStop.js";
import { createEnemy, ENEMY_REGISTRY } from "../systems/enemyRegistry.js";
import { createSlime } from "../entities/slime.js";
import { gameState } from "../utils/utils.js";

export const roomData = {
    main: {
        name: "main",
        sprite: "mainroom",
        mapPath: "./mainroom.json",
    },
    map: {
        name: "map",
        sprite: "maproom",
        mapPath: "./map.json",
    },
    area: {
        name: "area",
        sprite: "maparea",
        mapPath: "./maparea.json",
    },
    boss: {
        name: "boss",
        sprite: "bossroom",
        mapPath: "./bossroom.json",
    },
};

// Track the desired spawn point for next scene load
let nextSpawnPoint = "player";

export function loadRoom(k, roomName) {
    k.scene(roomName, async () => {
        resetTimeStop();

        // Use the tracked spawn point, then reset for next load
        const currentSpawnPoint = nextSpawnPoint;
        nextSpawnPoint = "player";

        const room = roomData[roomName];
        const mapData = await (await fetch(room.mapPath)).json();
        const layers = mapData.layers;

        // Room background
        const map = k.add([
            k.sprite(room.sprite),
            k.pos(0),
            k.scale(scaleFactor),
            { z: 0 },
        ]);

        let player = null;

        // Extra foreground decoration
        if (roomName === "area") {
            k.add([
                k.sprite("tree"),
                k.pos(0),
                k.scale(scaleFactor),
                { z: 4 },
            ]);
        }

        // ── Process Tiled map layers ──
        for (const layer of layers) {
            // Boundary layer — static collision objects
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
                }
                continue;
            }

            // Spawnpoint layer — entities
            if (layer.name === "spawnpoints") {
                // First pass: find player spawn positions
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

                // Create player
                if (playerSpawnPos) {
                    player = createPlayer(k);
                    if (currentSpawnPoint === "return" && returnSpawnPos) {
                        player.pos = returnSpawnPos;
                    } else {
                        player.pos = playerSpawnPos;
                    }
                    k.add(player);

                    // Sync global pet references for new room
                    petState.kaboom = k;
                    petState.player = player;
                    petState.currentPet = null;

                    setPlayerControls(k, player);
                    spawnPetInNewRoom(k, player, createFrog);
                    createDamageBox(k);

                    // Restore saved slimes for this room
                    const savedSlimes = gameState.slimesByRoom[roomName];
                    if (savedSlimes && savedSlimes.length > 0) {
                        for (const s of savedSlimes) {
                            const slime = createSlime(k, k.vec2(s.x, s.y), player);
                            slime.health = s.health;
                            k.add(slime);
                        }
                    }
                }

                // Second pass: spawn entities
                for (const entity of layer.objects) {
                    if (entity.name === "player" || entity.name === "return") continue;

                    const entityPos = k.vec2(
                        (map.pos.x + entity.x) * scaleFactor,
                        (map.pos.y + entity.y) * scaleFactor
                    );

                    // ── Dynamic enemy spawning via registry ──
                    // Any spawn name matching an ENEMY_REGISTRY key is auto-spawned.
                    // To add a new enemy type: add to ENEMY_REGISTRY + place in Tiled map.
                    if (entity.name.toLowerCase() === "slime") {
                        // Only spawn new slimes strictly on the first visit to the room
                        if (gameState.slimesByRoom[roomName] === undefined) {
                            if (player && Math.random() <= gameConfig.slime.spawnRate) {
                                const enemy = createSlime(k, entityPos, player);
                                k.add(enemy);
                            }
                        }
                        continue;
                    }

                    if (ENEMY_REGISTRY[entity.name]) {
                        if (player) {
                            const enemy = createEnemy(k, entity.name, entityPos, player);
                            if (enemy) k.add(enemy);
                        }
                        continue;
                    }

                    // Pet / Frog companion
                    if (entity.name === "pet" || entity.name === "frog") {
                        if (petState.shouldPersist) continue;
                        const pet = createFrog(k, entityPos, player);
                        k.add(pet);
                        continue;
                    }

                    // Interactable boundary (e.g. PC / TV objects)
                    if (entity.name === "pc" || entity.name === "tv") {
                        k.add([
                            k.area({ shape: new k.Rect(k.vec2(0), 100, 50) }),
                            k.pos(entityPos),
                            entity.name,
                        ]);
                    }
                }
            }
        }

        setCamScale(k);
        k.onResize(() => setCamScale(k));

        // ── Room exit transitions ──
        // Each exit tag triggers a scene change. The new scene is already
        // registered in main.js so we just k.go() — no re-registration needed.
        const EXIT_MAP = {
            exit_to_map: "map",
            exit_to_area: "area",
            exit_to_boss: "boss",
            exit_to_main: "main",
        };

        for (const [exitTag, targetRoom] of Object.entries(EXIT_MAP)) {
            k.onCollide("player", exitTag, () => {
                // Save player health
                if (player) {
                    gameState.playerHealth = player.health;
                    checkPetTransition(player);
                }

                // Save slime state for current room
                const slimes = k.get("slime");
                gameState.slimesByRoom[roomName] = slimes.map(s => ({
                    x: s.pos.x,
                    y: s.pos.y,
                    health: s.health,
                }));

                // Set return spawn for specific transitions
                if (exitTag === "exit_to_map") nextSpawnPoint = "return";
                k.go(targetRoom);
            });
        }

        // ── Dialogue interactions ──
        for (const [key, value] of Object.entries(dialogueData)) {
            k.onCollide("player", key, () => {
                if (player) {
                    player.isInDialogue = true;
                    displayDialogue(value, () => (player.isInDialogue = false));
                }
            });
        }
    });
}
