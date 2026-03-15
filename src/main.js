import { k } from "./kaboomCtx.js";
import { loadAssets } from "./systems/loader.js";
import { loadRoom } from "./world/roomManager.js";

import { gameState } from "./utils/utils.js";

// 1. Load Assets
loadAssets(k);

// 2. Define Rooms (scenes)
loadRoom(k, "main");
loadRoom(k, "map");
loadRoom(k, "area");
loadRoom(k, "boss");

// 3. Start the Game — wait for assets to finish, THEN go to intro
//    k.go() clears internal events, so calling it during loading
//    would destroy the custom loading screen listener.
k.scene("intro", () => {
    k.add([
        k.text("Press Enter or Tap to Start", { size: 32 }),
        k.pos(k.center()),
        k.anchor("center"),
        k.color(255, 255, 255),
    ]);

    const startGame = () => {
        // Stop any leftover BGM before starting fresh
        if (gameState.bgm) { gameState.bgm.stop(); gameState.bgm = null; }
        gameState.bgm = k.play("bgm", { loop: true, volume: 0.5 });
        k.go("map");
    };

    k.onKeyPress("enter", startGame);
    k.onClick(startGame);
});

k.onLoad(() => {
    k.go("intro");
});

k.scene("gameover", () => {
    k.add([
        k.text("Game Over", { size: 64 }),
        k.pos(k.center()),
        k.anchor("center"),
        k.color(255, 0, 0),
    ]);
    k.add([
        k.text("Press Enter or Tap to Retry", { size: 24 }),
        k.pos(k.center().add(0, 50)),
        k.anchor("center"),
        k.color(255, 255, 255),
    ]);

    const retry = () => {
        // Stop BGM so intro can start a fresh one
        if (gameState.bgm) { gameState.bgm.stop(); gameState.bgm = null; }
        k.go("intro");
    };
    k.onKeyPress("enter", retry);
    k.onClick(retry);
});
