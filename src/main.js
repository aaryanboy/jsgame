import { dialogueData, scaleFactor, playerinfo } from "./constants";
import { k } from "./kaboomCtx";
import { displayDialogue, setCamScale } from "./utils";
import { setupEnemyMovement } from "./enemymovement";
import { calculateDamage } from "./damageCalculation.js";
import { openInventory } from "./inventory.js";

// Load sprites
k.loadSprite("spritesheet", "./spritesheet.png", {
  sliceX: 39,
  sliceY: 31,
  anims: {
    "idle-down": 936,
    "walk-down": { from: 936, to: 939, loop: true, speed: 8 },
    "idle-side": 975,
    "walk-side": { from: 975, to: 978, loop: true, speed: 8 },
    "idle-up": 1014,
    "walk-up": { from: 1014, to: 1017, loop: true, speed: 8 },
  },
});
k.loadSprite("attack", "./spritesheet.png", {
  sliceX: 39,
  sliceY: 31,
  anims: {
    "attack-up": { from: 1087, to: 1091, loop: false, speed: 15 },

    "attack-down": { from: 1126, to: 1130, loop: false, speed: 15 },

    "attack-left": { from: 1009, to: 1013, loop: false, speed: 15 },

    "attack-right": { from: 1126, to: 1130, loop: false, speed: 15 },
  },
});

// maybe make some other entity that like walks beside mc, and some that like small mob villane etc.. first manage yhe dmg mecanics

// dmg 1-4 px afar of mc like there is if done dmg continuously for 4 time fifth dmg is powerfull.... maybe make a inventory with 4 items like afk arena which can gacha dmg increase

k.loadSprite("boss", "./spritesheet.png", {
  sliceX: 39,
  sliceY: 31,
  anims: {
    "idle-down": 862,
    "walk-down": { from: 862, to: 863, loop: true, speed: 8 },
    "idle-right": 864,
    "walk-right": { from: 864, to: 865, loop: true, speed: 8 },
    "idle-left": 903,
    "walk-left": { from: 903, to: 904, loop: true, speed: 8 },
    "idle-up": 901,
    "walk-up": { from: 901, to: 902, loop: true, speed: 8 },
  },
});

k.loadSprite("mainroom", "./mainroom.png");
k.loadSprite("maproom", "./map.png");
k.loadSprite("maparea", "./maparea.png");
k.loadSprite("bossroom", "./bossroom.png");
k.loadSprite("tree", "./trees.png"); // Tree foreground

const roomData = {
  main: {
    name: "main",
    sprite: "mainroom",
    jjson: "./mainroom.json",
    // playerEntry: k.vec2(100, 200),
  },
  map: {
    name: "map",
    sprite: "maproom",
    jjson: "./map.json",
    // playerEntry: k.vec2(50, 50),
  },
  area: {
    name: "area",
    sprite: "maparea",
    jjson: "./maparea.json",
    // playerEntry: k.vec2(100, 200),
  },
  boss: {
    name: "boss",
    sprite: "bossroom",
    jjson: "./bossroom.json",
    // playerEntry: k.vec2(100, 200),
  },
};

// Load all rooms
loadRoom("main");
loadRoom("map");
loadRoom("area");
loadRoom("boss");

k.setBackground(k.Color.fromHex("#311047"));

function loadRoom(roomName) {
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

    // Add player
    const player = k.make([
      k.sprite("spritesheet", { anim: "idle-down" }),
      k.area({ shape: new k.Rect(k.vec2(0, 3), 10, 10) }),
      k.body(),
      k.anchor("center"),
      // k.pos(room.playerEntry),
      k.pos(),
      k.scale(scaleFactor),
      { z: 2 },
      {
        speed: 200,
        direction: "down",
        isInDialogue: false,
        health: 100,
        damage: 10,
        critRate: 0,
        critDamage: 0,
      },
      "player",
    ]);

    // add enemy
    const enemy = k.make([
      k.sprite("boss", { anim: "idle-down" }), // Use an enemy sprite
      k.area({ shape: new k.Rect(k.vec2(0, 3), 10, 10) }),
      k.body(),
      k.anchor("center"),
      k.pos(), // Position from the spawnpoint
      k.scale(scaleFactor),
      { z: 2 },
      {
        health: 50, // Enemy health
        damage: 10, // Enemy damage
        speed: 50, // Movement speed (if needed)
      },
      "boss", // Tag to identify this as an enemy
    ]);

    const pcBoundary = k.make([
      k.rect(100, 50), // A rectangle to represent the PC boundary

      k.color(0, 0, 1), // Color for visualization
      k.area(), // Adds collision area
      k.pos(),
      // Makes it solid if needed
      "pc", // Tag to identify it as "PC"
    ]);

    // Define movement speed and direction change interval
    const movementSpeed = enemy.speed; // Speed of movement per frame

    if (roomName === "area") {
      k.add([
        k.sprite("tree"),
        k.pos(0), // Position of the tree
        k.scale(scaleFactor),
        { z: 4 },
      ]);
    }

    for (const layer of layers) {
      if (layer.name === "boundaries") {
        for (const boundary of layer.objects) {
          k.add([
            k.area({
              shape: new k.Rect(
                k.vec2(0),
                boundary.width * scaleFactor, // Scale boundary width
                boundary.height * scaleFactor // Scale boundary height
              ),
            }),
            k.body({ isStatic: true }),
            k.pos(
              boundary.x * scaleFactor, // Scale boundary x-position
              boundary.y * scaleFactor // Scale boundary y-position
            ),
            boundary.name,
          ]);

          if (boundary.name === "exit_to_map") {
            player.onCollide(boundary.name, () => {
              k.destroyAll();
              k.go("map"); // Transition to the map room
            });
          }
          if (boundary.name === "exit_to_area") {
            player.onCollide(boundary.name, () => {
              k.destroyAll();
              k.go("area"); // Transition to the area room
            });
          }
          if (boundary.name === "exit_to_boss") {
            player.onCollide(boundary.name, () => {
              k.destroyAll();
              k.go("boss"); // Transition to the boss room
            });
          }
          if (boundary.name === "exit_to_main") {
            player.onCollide(boundary.name, () => {
              k.destroyAll();
              k.go("main"); // Transition to the main room
            });
          }

          if (boundary)
            if (boundary.name) {
              player.onCollide(boundary.name, () => {
                if (dialogueData[boundary.name]) {
                  // Dialogue data exists for this boundary
                  player.isInDialogue = true;
                  displayDialogue(
                    dialogueData[boundary.name],
                    () => (player.isInDialogue = false)
                  );
                } else {
                  // No dialogue data available
                  console.log(
                    `No dialogue available for boundary: ${boundary.name}`
                  );
                }
              });
            }
        }
        continue;
      }
      if (layer.name === "spawnpoints") {
        for (const entity of layer.objects) {
          if (entity.name === "player") {
            player.pos = k.vec2(
              (map.pos.x + entity.x) * scaleFactor, //move by scalefactor so visible
              (map.pos.y + entity.y) * scaleFactor
            );
            k.add(player);
            continue;
          }

          if (entity.name === "pet") {
            enemy.pos = k.vec2(
              (map.pos.x + entity.x) * scaleFactor, //move by scalefactor so visible
              (map.pos.y + entity.y) * scaleFactor
            );
            k.add(enemy);
            setupEnemyMovement(k, enemy, movementSpeed);

            continue;
          }

          if (entity.name === "pc") {
            pcBoundary.pos = k.vec2(
              (map.pos.x + entity.x) * scaleFactor, //move by scalefactor so visible
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
    k.onUpdate(() => {
      k.camPos(player.pos.x, player.pos.y + 100);
    });

    //charater movenment by mouse
    k.onMouseDown((mouseBtn) => {
      const audioContext = new AudioContext();
      audioContext.resume();
      // Now you can play sounds
      if (mouseBtn !== "left" || player.isInDialogue) return;

      //movement
      const worldMousePos = k.toWorld(k.mousePos());
      player.moveTo(worldMousePos, player.speed);
      // console.log("Moving to:", worldMousePos, "with speed:", player.speed); //for debugging

      const mouseAngle = player.pos.angle(worldMousePos);

      const lowerBound = 50;
      const upperBound = 125;

      if (
        mouseAngle > lowerBound &&
        mouseAngle < upperBound &&
        player.curAnim() !== "walk-up" //up
      ) {
        player.play("walk-up");
        player.direction = "up";
        return;
      }

      if (
        mouseAngle < -lowerBound &&
        mouseAngle > -upperBound &&
        player.curAnim() !== "walk-down" //down
      ) {
        player.play("walk-down");
        player.direction = "down";
        return;
      }
      if (Math.abs(mouseAngle) > upperBound) {
        player.flipX = false;
        if (player.curAnim() !== "walk-side") player.play("walk-side"); //rignt
        player.direction = "right";
        return;
      }

      if (Math.abs(mouseAngle) < lowerBound) {
        player.flipX = true;
        if (player.curAnim() !== "walk-side") player.play("walk-side"); //left
        player.direction = "left";
        return;
      }
    });

    k.onMouseRelease(() => {
      if (player.direction === "up") {
        player.play("idle-up");
        return;
      }
      if (player.direction === "down") {
        player.play("idle-down");
        return;
      }

      player.play("idle-side");
    });

    k.onCollide("attack", "boss", () => {
      console.log("You hit the boss!");
      // Decrease boss health
      let totalDamage = calculateDamage(
        player.damage,
        player.critDamage,
        player.critRate
      );
      enemy.health -= totalDamage;
      // console.log(`Boss health: ${enemy.health}`);
      // console.log(`Total damage: ${totalDamage}`);

      // Check if the boss is defeated
      if (enemy.health <= 0) {
        console.log("Boss defeated!");

        enemy.onUpdate = null;
        enemy.destroy();

        // Optionally, you can trigger other events here, like playing a victory sound
      }
    });

    k.onKeyPress("e", () => {
      console.log("Opening inventory...");
      openInventory(k); // Call the inventory function
    });

    let lastAttackSide = 1; // Track the last side attack animation used

    k.onKeyPress("space", () => {
      if (player.isInDialogue) return; // Prevent attacks during dialogue

      // Determine the position and direction of the attack sprite
      let attackOffset = k.vec2(0, 0);
      let attackAnim = "";
      let flipX = false;

      switch (player.direction) {
        case "up":
          attackOffset = k.vec2(0, -16); // Place above the player
          attackAnim = "attack-up";
          break;
        case "down":
          attackOffset = k.vec2(0, 16); // Place below the player
          attackAnim = "attack-down";
          break;
        case "left":
          attackOffset = k.vec2(-36, 0); // Place to the left
          attackAnim = lastAttackSide === 1 ? "attack-left" : "attack-right";
          flipX = true; // Flip the attack sprite for left direction
          lastAttackSide = lastAttackSide === 1 ? 2 : 1;
          break;
        case "right":
          attackOffset = k.vec2(36, 0); // Place to the right
          // Alternate between side1 and side2
          attackAnim = lastAttackSide === 1 ? "attack-left" : "attack-right";
          flipX = false; // No flip for right direction
          lastAttackSide = lastAttackSide === 1 ? 2 : 1;
          break;
      }

      // Create the attack sprite
      const attackSprite = k.add([
        k.sprite("attack", { anim: attackAnim }),
        k.pos(player.pos.add(attackOffset)), // Position relative to the player
        k.anchor("center"),
        k.scale(scaleFactor),
        k.area(),
        { z: 6 },
        "attack",
      ]);

      attackSprite.flipX = flipX;

      // Remove the attack sprite after the animation duration
      const animationDuration = 0.5;
      k.wait(animationDuration, () => {
        k.destroy(attackSprite);
      });

      // (Optional) Add collision logic or other attack effects
    });
  });
}
// Load the initial room
loadRoom("main");
loadRoom("map");
k.go("map");
