import { k } from "./kaboomCtx.js";
import { loadAssets } from "./systems/loader.js";
import { loadRoom } from "./world/roomManager.js";

import { gameState } from "./utils/utils.js";

// 1. Load Assets
loadAssets(k);

// 2. Define Rooms (scenes)
// Instead of calling loadRoom for every room immediately, the roomManager handles Scene registration inside loadRoom.
// We should register all potential rooms or just the first one?
// roomManager.js's loadRoom registers a scene k.scene(roomName, ...).
// So we need to call it for all rooms so k.go() works for any of them.

loadRoom(k, "main");
loadRoom(k, "map");
loadRoom(k, "area");
loadRoom(k, "boss");

// 3. Start the Game
k.scene("intro", () => {
    k.add([
        k.text("Press Enter to Start", { size: 32 }),
        k.pos(k.center()),
        k.anchor("center"),
        k.color(255, 255, 255),
    ]);

    k.onKeyPress("enter", () => {
        gameState.bgm = k.play("bgm", { loop: true, volume: 0.5 });
        k.go("map");
    });
});

k.go("intro");

k.scene("gameover", () => {
    k.add([
        k.text("Game Over", { size: 64 }),
        k.pos(k.center()),
        k.anchor("center"),
        k.color(255, 0, 0),
    ]);
    k.add([
        k.text("Press Enter to Retry", { size: 24 }),
        k.pos(k.center().add(0, 50)),
        k.anchor("center"),
        k.color(255, 255, 255),
    ]);

    k.onKeyPress("enter", () => {
        k.go("intro");
    });
});
