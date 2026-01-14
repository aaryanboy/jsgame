// enemyMovement.js
import { gameState } from "../utils/utils.js";

export function setupEnemyMovement(k, enemy, movementSpeed) {
  let moveCooldown = k.rand(1, 3);
  let moveDirection = k.vec2(0, 0);
  let lastDirection = "down"; // Default starting direction

  // Logic for random movement a
  enemy.onUpdate(() => {
    if (gameState.isPaused) return;

    // Reduce cooldown time
    moveCooldown -= k.dt();

    if (moveCooldown <= 0) {
      // Randomly determine action: move or stay still
      const moveOrStop = Math.floor(k.rand(1, 4)); // Random value: 1, 2, or 3

      if (moveOrStop === 1) {
        // Generate a random direction vector (x, y between -1 and 1)
        moveDirection = k.vec2(k.rand(-1, 1), k.rand(-1, 1)).unit(); // Normalize for consistent speed
        console.log("Moving in direction:", moveDirection);

        // Determine and play the movement animation based on direction
        if (Math.abs(moveDirection.y) > Math.abs(moveDirection.x)) {
          // Prioritize vertical movement
          if (moveDirection.y > 0) {
            enemy.flipX = false;
            enemy.play("walk-down");
            lastDirection = "down";
          } else {
            enemy.flipX = false;
            enemy.play("walk-up");
            lastDirection = "up";
          }
        } else {
          // Horizontal movement
          if (moveDirection.x > 0) {
            enemy.play("walk-right");
            lastDirection = "right";
          } else if (moveDirection.x < 0) {
            enemy.play("walk-left");
            lastDirection = "left";
          }
        }
      } else if (moveOrStop === 2) {
        // No movement
        moveDirection = k.vec2(0, 0);
        console.log("Enemy stays still.");

        // Play the idle animation based on the last direction
        switch (lastDirection) {
          case "down":
            enemy.play("idle-down");
            break;
          case "up":
            enemy.play("idle-up");
            break;
          case "right":
            enemy.play("idle-right");
            break;
          case "left":
            enemy.play("idle-left");
            break;
        }
      } else {
        console.log("Enemy pathing logic can go here.");
        // Add custom pathing or map-specific logic here
      }

      // Set a new random cooldown interval (1 to 3 seconds)
      moveCooldown = k.rand(1, 3);
    }

    // Move the enemy only if there's a direction
    if (!moveDirection.eq(k.vec2(0, 0))) {
      enemy.move(moveDirection.scale(movementSpeed));
    }
  });
}
