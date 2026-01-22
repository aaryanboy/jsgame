import { setGamePause } from "../utils/utils.js";

export function toggleInventory(k) {
  const noteUI = document.querySelector(".note");
  const existingInventory = k.get("inventory");

  if (existingInventory.length > 0) {
    console.log("Closing Inventory...");
    k.destroyAll("inventory");
    setGamePause(k, false);
    if (noteUI) noteUI.style.display = "none";
    return;
  }

  console.log("Opening Inventory...");
  setGamePause(k, true);
  if (noteUI) noteUI.style.display = "flex";

  // Full-screen dark overlay
  k.add([
    k.rect(k.width(), k.height()),
    k.pos(0, 0),
    k.color(0, 0, 0),
    k.opacity(0.8),
    k.fixed(),
    { z: 99 },
    "inventory"
  ]);

  // Inventory Text
  k.add([
    k.text("INVENTORY", { size: 48, font: "monospace" }),
    k.pos(k.center().x, k.center().y - 50),
    k.anchor("center"),
    k.color(255, 255, 255),
    k.fixed(),
    { z: 100 },
    "inventory"
  ]);

  // Pause Text
  k.add([
    k.text("(PAUSED)", { size: 24, font: "monospace" }),
    k.pos(k.center().x, k.center().y + 50),
    k.anchor("center"),
    k.color(200, 200, 200),
    k.fixed(),
    { z: 100 },
    "inventory"
  ]);

  // Close inventory on pressing Escape
  const closeHandle = k.onKeyPress("escape", () => {
    console.log("Closing Inventory via Escape...");
    k.destroyAll("inventory");
    setGamePause(k, false);
    if (noteUI) noteUI.style.display = "none";
    closeHandle.cancel();
  });
}
