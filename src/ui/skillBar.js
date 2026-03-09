// Skill Bar UI Component - Simple vertical layout
import { skills } from "../utils/constants.js";
import { gameState } from "../utils/utils.js";
import { isTouchMode } from "./touchControls.js";

export function createSkillBar(k, player) {
    if (isTouchMode()) return;
    // New keybindings: m, comma, period, slash
    const skillKeys = ['m', ',', '.', '/'];
    const skillTimerKeys = ['mTimer', 'commaTimer', 'periodTimer', 'slashTimer'];
    const skillData = [skills.m, skills.comma, skills.period, skills.slash];

    // LoL Style Layout Dimensions
    const iconSize = 56;
    const spacing = 8;
    const totalWidth = (iconSize * 4) + (spacing * 3);

    skillKeys.forEach((key, index) => {
        const skill = skillData[index];
        const timerKey = skillTimerKeys[index];
        const baseColor = k.rgb(...skill.iconColor);

        const container = k.add([
            k.pos(0, 0), // Set dynamically in onUpdate
            k.fixed(),
            { z: 100 }
        ]);

        // Background square icon
        container.add([
            k.rect(iconSize, iconSize, { radius: 6 }),
            k.color(baseColor),
            k.outline(3, k.rgb(30, 30, 40))
        ]);

        // Keybind letter at bottom left
        container.add([
            k.text(key.toUpperCase(), { size: 14, font: "monospace", weight: "bold" }),
            k.pos(5, iconSize - 16),
            k.color(255, 255, 255)
        ]);

        // Cooldown overlay
        const overlay = container.add([
            k.rect(iconSize, iconSize, { radius: 6 }),
            k.color(0, 0, 0),
            k.opacity(0),
            k.pos(0, 0)
        ]);

        // Cooldown timer text
        const cdText = container.add([
            k.text("", { size: 28, font: "monospace", weight: "bold" }),
            k.pos(iconSize / 2, iconSize / 2),
            k.anchor("center"),
            k.color(255, 255, 0)
        ]);

        container.onUpdate(() => {
            // Keep centered horizontally at the bottom, just beneath health bar
            const startX = Math.round(k.width() / 2 - totalWidth / 2);
            const startY = Math.round(k.height() - 65);
            container.pos.x = startX + index * (iconSize + spacing);
            container.pos.y = startY;

            const timer = player[timerKey];

            if (key === '/' && gameState.isTimeStopped) {
                overlay.opacity = 0.5;
                cdText.text = "ACT";
                cdText.color = k.rgb(147, 112, 219); // Purple processing state
                return;
            }

            if (timer > 0) {
                overlay.opacity = 0.65;
                cdText.text = Math.ceil(timer).toString();
                cdText.color = k.rgb(240, 220, 50); // Warning Yellow
            } else {
                overlay.opacity = 0;
                cdText.text = "";
            }
        });
    });
}
