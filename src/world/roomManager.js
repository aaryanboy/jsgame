import { dialogueData, scaleFactor } from "../utils/constants.js";
import { displayDialogue, setCamScale } from "../utils/utils.js";
import { createPlayer, setPlayerControls } from "../entities/player.js";
import { createBoss, setupBossLogic } from "../entities/boss.js";

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

export function loadRoom(k, roomName) {
    k.scene(roomName, async () => {
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

        // We need to define these beforehand so we can use them in the loop
        const pcBoundary = k.make([
            k.rect(100, 50),
            k.color(0, 0, 1),
            k.area(),
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
                for (const entity of layer.objects) {
                    if (entity.name === "player") {
                        player = createPlayer(k);
                        player.pos = k.vec2(
                            (map.pos.x + entity.x) * scaleFactor,
                            (map.pos.y + entity.y) * scaleFactor
                        );
                        k.add(player);
                        setPlayerControls(k, player);
                        continue;
                    }

                    if (entity.name === "pet" || entity.name === "Boss") {
                        enemy = createBoss(k);
                        enemy.pos = k.vec2(
                            (map.pos.x + entity.x) * scaleFactor,
                            (map.pos.y + entity.y) * scaleFactor
                        );
                        k.add(enemy);
                        // We need player to set up boss logic (target).
                        // Assuming player is spawned before/after. Safe to wrap in k.onUpdate or just check?
                        // Usually player spawn point exists if enemy exists.
                        if (player) {
                            setupBossLogic(k, enemy, player);
                        }
                        continue;
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
            k.destroyAll();
            loadRoom(k, "map"); // Recursive call? No, it calls the function to register/go.
            k.go("map");
        });
        k.onCollide("player", "exit_to_area", () => {
            k.destroyAll();
            loadRoom(k, "area");
            k.go("area");
        });
        k.onCollide("player", "exit_to_boss", () => {
            k.destroyAll();
            loadRoom(k, "boss");
            k.go("boss");
        });
        k.onCollide("player", "exit_to_main", () => {
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
