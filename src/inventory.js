export function openInventory(k) {
  // Create the inventory UI
  const inventoryUI = k.add([
    k.rect(300, 200), // Inventory box size
    k.pos(100, 100), // Position on the screen
    k.color(0, 0, 0), // Background color
    k.outline(2, k.rgb(1, 1, 1)), // Outline color
    "inventory", // Tag to identify the inventory UI
  ]);

  // Add text to the inventory
  k.add([k.text("Inventory", { size: 24 }), k.pos(120, 120)]);

  // Example item
  k.add([k.text("Item 1", { size: 16 }), k.pos(120, 160)]);

  // Close inventory on pressing Escape
  k.onKeyPress("escape", () => {
    console.log("Closing inventory...");
    k.destroyAll("inventory"); // Destroy all inventory UI elements
  });
}
