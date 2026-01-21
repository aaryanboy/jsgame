import { setGamePause } from "../utils/utils.js";

let isInventoryOpen = false;

export function openInventory(k) {
  if (isInventoryOpen) {
    k.destroyAll("inventory");
    setGamePause(k, false);
    isInventoryOpen = false;
    return;
  }

  isInventoryOpen = true;
  setGamePause(k, true);

  // Create the inventory UI - centered on screen
  const inventoryUI = k.add([
    k.rect(300, 200), // Inventory box size
    k.pos(k.width() / 2, k.height() / 2), // Center of screen
    k.anchor("center"),
    k.color(0, 0, 0), // Background color
    k.outline(2, k.rgb(255, 255, 255)), // Outline color (white)
    "inventory", // Tag to identify the inventory UI
    k.fixed(), // Make it fixed to screen like the health bar
    { z: 100 }
  ]);

  // Close inventory on pressing Escape
  const closeHandle = k.onKeyPress("escape", () => {
    k.destroyAll("inventory");
    setGamePause(k, false);
    isInventoryOpen = false;
    closeHandle.cancel(); // Cancel this specific listener once used
  });
}
