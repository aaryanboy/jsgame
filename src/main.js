// import { dialogueData, scaleFactor } from "./constants";
// import { k } from "./kaboomCtx";
// import { displayDialogue, setCamScale } from "./utils";

// //main charater ko phoro ra anoimation

// k.loadSprite("spritesheet", "./spritesheet.png", {
//   sliceX: 39,
//   sliceY: 31,
//   anims: {
//     "idle-down": 936,
//     "walk-down": { from: 936, to: 939, loop: true, speed: 8 },
//     "idle-side": 975,
//     "walk-side": { from: 975, to: 978, loop: true, speed: 8 },
//     "idle-up": 1014,
//     "walk-up": { from: 1014, to: 1017, loop: true, speed: 8 },
//   },
// });

// k.loadSprite("map", "./mainroom.png");
// k.loadSprite("maproom", "./map.png");
// // map background

// k.setBackground(k.Color.fromHex("#311047"));

// k.scene("main", async () => {
//   const mapData = await (await fetch("./mainroom.json")).json(); // border and things
//   const layers = mapData.layers;

//   const map = k.add([k.sprite("map"), k.pos(0), k.scale(scaleFactor)]);

//   const player = k.make([
//     k.sprite("spritesheet", { anim: "idle-down" }),
//     k.area({ shape: new k.Rect(k.vec2(0, 3), 10, 10) }),
//     k.body(),
//     k.anchor("center"), //player ganna be here....
//     k.pos(),
//     k.scale(scaleFactor),
//     {
//       speed: 250,
//       direction: "down",
//       isInDialogue: false, //when textbox open player dowsnt move
//     },
//     "player",
//   ]);

//   for (const layer of layers) {
//     if (layer.name === "boundaries") {
//       for (const boundary of layer.objects) {
//         map.add([
//           k.area({
//             shape: new k.Rect(k.vec2(0), boundary.width, boundary.height),
//           }),
//           k.body({ isStatic: true }), //walls in kaboom js
//           k.pos(boundary.x, boundary.y),
//           boundary.name, // boundary is named
//         ]);

//         if (boundary.name) {
//           player.onCollide(boundary.name, () => {
//             player.isInDialogue = true;
//             displayDialogue(
//               dialogueData[boundary.name],
//               () => (player.isInDialogue = false)
//             );
//           });
//         }
//       }
//       continue;
//     }
//     if (layer.name === "spawnpoints") {
//       for (const entity of layer.objects) {
//         if (entity.name === "player") {
//           player.pos = k.vec2(
//             (map.pos.x + entity.x) * scaleFactor, //move by scalefactor so visible
//             (map.pos.y + entity.y) * scaleFactor
//           );
//           k.add(player);
//           continue;
//         }
//       }
//     }
//   }

//   setCamScale(k);
//   k.onResize(() => {
//     setCamScale(k);
//   });
//   k.onUpdate(() => {
//     k.camPos(player.pos.x, player.pos.y + 100);
//   });

//   k.onMouseDown((mouseBtn) => {
//     if (mouseBtn !== "left" || player.isInDialogue) return;

//     //movement
//     const worldMousePos = k.toWorld(k.mousePos());
//     player.moveTo(worldMousePos, player.speed);

//     const mouseAngle = player.pos.angle(worldMousePos);

//     const lowerBound = 50;
//     const upperBound = 125;

//     if (
//       mouseAngle > lowerBound &&
//       mouseAngle < upperBound &&
//       player.curAnim() !== "walk-up" //up
//     ) {
//       player.play("walk-up");
//       player.direction = "up";
//       return;
//     }

//     if (
//       mouseAngle < -lowerBound &&
//       mouseAngle > -upperBound &&
//       player.curAnim() !== "walk-down" //down
//     ) {
//       player.play("walk-down");
//       player.direction = "down";
//       return;
//     }
//     if (Math.abs(mouseAngle) > upperBound) {
//       player.flipX = false;
//       if (player.curAnim() !== "walk-side") player.play("walk-side"); //rignt
//       player.direction = "right";
//       return;
//     }

//     if (Math.abs(mouseAngle) < lowerBound) {
//       player.flipX = true;
//       if (player.curAnim() !== "walk-side") player.play("walk-side"); //left
//       player.direction = "left";
//       return;
//     }
//   });

//   k.onMouseRelease(() => {
//     if (player.direction === "up") {
//       player.play("idle-up");
//       return;
//     }
//     if (player.direction === "down") {
//       player.play("idle-down");
//       return;
//     }

//     player.play("idle-side");
//   });
// });

// k.go("main");

//
///
//
//
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
  },
});

k.loadSprite("mainroom", "./mainroom.png");
k.loadSprite("maproom", "./map.png");

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

          if (boundary.name === "exit") {
            player.onCollide(boundary.name, () => {
              // Transition to another room
              const nextRoom = roomName === "main" ? "map" : "main";
              roomData[nextRoom].playerEntry =
                boundary.entryPoint || k.vec2(50, 50); // Example
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

    // Camera and movement setup
    //     setCamScale(k);
    //     k.onResize(() => setCamScale(k));
    //     k.onUpdate(() => k.camPos(player.pos.x, player.pos.y + 100));

    //     k.onMouseDown((mouseBtn) => {
    //       if (mouseBtn !== "left" || player.isInDialogue) return;

    //       const worldMousePos = k.toWorld(k.mousePos());
    //       player.moveTo(worldMousePos, player.speed);
    //       const mouseAngle = player.pos.angle(worldMousePos);

    //       if (mouseAngle > 50 && mouseAngle < 125) {
    //         player.play("walk-up");
    //         player.direction = "up";
    //       } else if (mouseAngle < -50 && mouseAngle > -125) {
    //         player.play("walk-down");
    //         player.direction = "down";
    //       } else if (Math.abs(mouseAngle) > 125) {
    //         player.flipX = false;
    //         player.play("walk-side");
    //         player.direction = "right";
    //       } else {
    //         player.flipX = true;
    //         player.play("walk-side");
    //         player.direction = "left";
    //       }
    //     });

    //     k.onMouseRelease(() => {
    //       if (player.direction === "up") player.play("idle-up");
    //       else if (player.direction === "down") player.play("idle-down");
    //       else player.play("idle-side");
    //     });
    //   });
    // }

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
  });
}
// Load the initial room
loadRoom("main");
loadRoom("map");
k.go("map");
