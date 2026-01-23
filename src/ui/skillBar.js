// Skill Bar UI Component - Simple vertical layout
import { skills } from "../utils/constants.js";
import { gameState } from "../utils/utils.js";

export function createSkillBar(k, player) {
    // New keybindings: m, comma, period, slash
    const skillKeys = ['m', ',', '.', '/'];
    const skillTimerKeys = ['mTimer', 'commaTimer', 'periodTimer', 'slashTimer'];
    const skillData = [skills.m, skills.comma, skills.period, skills.slash];

    // Simple rectangular dimensions
    const iconWidth = 200;
    const iconHeight = 30;
    const spacing = 5;
    const startX = k.width() - iconWidth - 20;
    const startY = 55;

    skillKeys.forEach((key, index) => {
        const x = startX;
        const y = startY + index * (iconHeight + spacing);
        const skill = skillData[index];
        const timerKey = skillTimerKeys[index];
        const baseColor = k.rgb(...skill.iconColor);

        const container = k.add([
            k.pos(x, y),
            k.fixed(),
            { z: 100 }
        ]);

        // Background bar
        container.add([
            k.rect(iconWidth, iconHeight, { radius: 4 }),
            k.color(40, 40, 50),
            k.outline(2, k.Color.WHITE)
        ]);

        // Key badge on left
        container.add([
            k.rect(30, iconHeight, { radius: 4 }),
            k.pos(0, 0),
            k.color(baseColor)
        ]);

        container.add([
            k.text(key.toUpperCase(), { size: 16, font: "monospace" }),
            k.pos(15, iconHeight / 2),
            k.anchor("center"),
            k.color(255, 255, 255)
        ]);

        // Skill name in center
        container.add([
            k.text(skill.name, { size: 14, font: "monospace" }),
            k.pos(iconWidth / 2 + 10, iconHeight / 2),
            k.anchor("center"),
            k.color(255, 255, 255)
        ]);

        // Cooldown overlay
        const overlay = container.add([
            k.rect(iconWidth, iconHeight, { radius: 4 }),
            k.color(0, 0, 0),
            k.opacity(0),
            k.pos(0, 0)
        ]);

        // Cooldown timer
        const cdText = container.add([
            k.text("", { size: 16, font: "monospace" }),
            k.pos(iconWidth - 25, iconHeight / 2),
            k.anchor("center"),
            k.color(255, 255, 0)
        ]);

        container.onUpdate(() => {
            const timer = player[timerKey];

            if (key === '/' && gameState.isTimeStopped) {
                overlay.opacity = 0.4;
                overlay.width = iconWidth;
                cdText.text = "ACTIVE";
                cdText.color = k.rgb(147, 112, 219); // Purple
                return;
            }

            if (timer > 0) {
                const totalCD = skill.cooldown;
                const ratio = timer / totalCD;
                overlay.opacity = 0.6;
                overlay.width = iconWidth * ratio;
                cdText.text = timer.toFixed(1);
                cdText.color = k.rgb(255, 255, 0); // Reset to yellow
            } else {
                overlay.opacity = 0;
                overlay.width = 0;
                cdText.text = "";
            }
        });
    });
}
