export function openInventory(k) {
  // Create the inventory UI
  const inventoryUI = k.add([
    k.rect(300, 200), // Inventory box size
    k.pos(500, 500), // Position on the screen
    k.color(0, 0, 0), // Background color
    k.outline(2, k.rgb(1, 1, 1)), // Outline color
    "inventory", // Tag to identify the inventory UI


hdubdd
  ]);

  // Close inventory on pressing Escape not workinghihd
  k.onKeyPress("escape", () => {
    console.log("Closing inventory...");
    k.destroyAll("inventory"); // Destroy all inventory UI elements
  });
}
