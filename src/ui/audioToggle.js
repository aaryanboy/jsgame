// Audio Toggle UI Component
import { gameState } from "../utils/utils.js";

export function createAudioToggle(k, player) {
    const audioButtonSize = 40;
    const audioContainer = k.add([
        k.pos(k.width() - 60, k.height() - 60),
        k.fixed(),
        { z: 100 }
    ]);

    // Button background
    audioContainer.add([
        k.rect(audioButtonSize, audioButtonSize, { radius: 8 }),
        k.color(30, 30, 30),
        k.opacity(0.9),
        k.outline(2, k.rgb(100, 100, 100))
    ]);

    // Speaker icon (text representation)
    const speakerIcon = audioContainer.add([
        k.text("ON", { size: 14, font: "monospace" }),
        k.pos(audioButtonSize / 2, audioButtonSize / 2),
        k.anchor("center"),
        k.color(100, 255, 100)
    ]);

    // Audio state tracking
    let audioEnabled = true;

    // Toggle audio on key press - use P instead of M
    const audioToggleListener = k.onKeyPress("p", () => {
        if (gameState.bgm) {
            audioEnabled = !audioEnabled;
            if (audioEnabled) {
                gameState.bgm.volume = 0.5;
                speakerIcon.text = "ON";
                speakerIcon.color = k.rgb(100, 255, 100);
            } else {
                gameState.bgm.volume = 0;
                speakerIcon.text = "OFF";
                speakerIcon.color = k.rgb(255, 100, 100);
            }
        }
    });
    player.onDestroy(() => audioToggleListener.cancel());

    // Add hint text below button
    audioContainer.add([
        k.text("P", { size: 12, font: "monospace" }),
        k.pos(audioButtonSize / 2, audioButtonSize + 5),
        k.anchor("top"),
        k.color(150, 150, 150)
    ]);

    return audioContainer;
}
