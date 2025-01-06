import { dialogueData, scaleFactor } from "./constants";
import { k } from "./kaboomCtx";
import { displayDialogue, setCamScale } from "./utils";

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

    "attack-up": { from: 1087, to: 1091, loop: false, speed: 15 },

    "attack-down": { from: 1126, to: 1130, loop: false, speed: 15 },

    "attack-side": { from: 1009, to: 1013, loop: false, speed: 15 },
  },
});

k.loadSprite("mainroom", "./mainroom.png");
k.loadSprite("maproom", "./map.png");
k.loadSprite("maparea", "./maparea.png");

const roomData = {
  main: {
    name: "main",
    sprite: "mainroom",
    jjson: "./mainroom.json",
    // playerEntry: k.vec2(100, 200),
  },
  area: {
    name: "map",
    sprite: "maproom",
    jjson: "./map.json",
    // playerEntry: k.vec2(50, 50),
  },
  map: {
    name: "area",
    sprite: "maparea",
    jjson: "./maparea.json",
    // playerEntry: k.vec2(100, 200),
  },
};

k.setBackground(k.Color.fromHex("#311047"));

function loadRoom(roomName) {
  k.scene(roomName, async () => {
    const room = roomData[roomName];
    const mapData = await (await fetch(room.jjson)).json();
    const layers = mapData.layers;

    // Add room background
    const map = k.add([k.sprite(room.sprite), k.pos(0), k.scale(scaleFactor)]);

    // Add player
    const player = k.make([
      k.sprite("spritesheet", { anim: "idle-down" }),
      k.area({ shape: new k.Rect(k.vec2(0, 3), 10, 10) }),
      k.body(),
      k.anchor("center"),
      // k.pos(room.playerEntry),
      k.pos(),
      k.scale(scaleFactor),
      {
        speed: 250,
        direction: "down",
        isInDialogue: false,
      },
      "player",
    ]);

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

          if (
            boundary.name === "exit" ||
            boundary.name === "exit1" ||
            boundary.name === "exit3"
          ) {
            player.onCollide(boundary.name, () => {
              // Destroy all objects in the current scene
              k.destroyAll();

              // Transition to another room
              const nextRoom = roomName === "main" ? "map" : "main";
              roomData[nextRoom].playerEntry = boundary.spawnpoints; // Example
              k.go(nextRoom);
            });
          }

          if (boundary.name) {
            player.onCollide(boundary.name, () => {
              player.isInDialogue = true;
              displayDialogue(
                dialogueData[boundary.name],
                () => (player.isInDialogue = false)
              );
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

    k.onMouseDown((mouseBtn) => {
      if (mouseBtn !== "left" || player.isInDialogue) return;

      //movement
      const worldMousePos = k.toWorld(k.mousePos());
      player.moveTo(worldMousePos, player.speed);
      console.log("Moving to:", worldMousePos, "with speed:", player.speed); //for debugging

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

    k.onKeyPress("space", () => {
      // Check the direction and play the corresponding attack animation
      switch (player.direction) {
        case "up":
          player.play("attack-up");
          break;
        case "down":
          player.play("attack-down");
          break;
        case "left":
          player.flipX = true;
          player.play("attack-side");
          break;
        case "right":
          player.flipX = false;
          player.play("attack-side");
          break;
        default:
          console.log("Invalid direction for attack animation");
          break;
      }

      // Function to trigger attack  how to empliment this with the charater so both are present at same tinme

      // function triggerAttack() {

      //   // Determine the offset and animation based on direction
      //   let offset = k.vec2(0, 0);
      //   let attackAnim = "";

      //   switch (player.direction) {
      //     case "up":
      //       offset = k.vec2(0, -16); // Above the player
      //       attackAnim = "attack-up";
      //       break;
      //     case "down":
      //       offset = k.vec2(0, 16); // Below the player
      //       attackAnim = "attack-down";
      //       break;
      //     case "left":
      //       offset = k.vec2(-16, 0); // To the left
      //       attackAnim = "attack-side";
      //       player.flipX = true; // Flip sprite for left direction
      //       break;
      //     case "right":
      //       offset = k.vec2(16, 0); // To the right
      //       attackAnim = "attack-side";
      //       player.flipX = false; // Ensure sprite faces right
      //       break;
      //   }

      // Optionally, you can set a timeout to return to the idle state after the animation finishes
      const animationDuration = 0.5; // Replace with the actual duration of your attack animation in seconds
      k.wait(animationDuration, () => {
        // Return to the idle animation based on direction
        switch (player.direction) {
          case "up":
            player.play("idle-up");
            break;
          case "down":
            player.play("idle-down");
            break;
          case "left":
          case "right":
            player.play("idle-side");
            break;
        }
      });
    });
  });
}
// Load the initial room
loadRoom("main");
loadRoom("map");
k.go("map");
