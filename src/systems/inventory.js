import { setGamePause } from "../utils/utils.js";

export function openInventory(k) {
  const existingInventory = k.get("inventory");
  if (existingInventory.length > 0) {
    k.destroyAll("inventory");
    setGamePause(k, false);
    return;
  }

  setGamePause(k, true);

  // Create the inventory UI
  const inventoryUI = k.add([
    k.rect(300, 200), // Inventory box size
    k.pos(500, 500), // Position on the screen
    k.color(0, 0, 0), // Background color
    k.outline(2, k.rgb(1, 1, 1)), // Outline color
    "inventory", // Tag to identify the inventory UI
    k.fixed(), // Make it fixed to screen like the health bar
    { z: 100 }
  ]);

  // Close inventory on pressing Escape
  // Note: This adds a new listener every time. Ideally we should manage this better,
  // but for now we ensure at least the UI is toggled.
  const closeHandle = k.onKeyPress("escape", () => {
    k.destroyAll("inventory");
    setGamePause(k, false);
    closeHandle.cancel(); // Cancel this specific listener once used
  });
}
