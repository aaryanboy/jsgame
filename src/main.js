import { k } from "./kaboomCtx.js";
import { loadAssets } from "./systems/loader.js";
import { loadRoom } from "./world/roomManager.js";

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
k.go("map");
