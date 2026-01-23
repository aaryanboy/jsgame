// Damage UI Component
export function createDamageBox(k) {
    const boxWidth = 200;
    const boxHeight = 60;
    const padding = 20;

    // Position below skill bar (Skill bar starts at 55 and has 4 items of ~35 height each)
    // 55 + (4 * 35) = 195. Let's start at 210.
    const startX = k.width() - boxWidth - padding;
    const startY = 210;

    const container = k.add([
        k.pos(startX, startY),
        k.rect(boxWidth, boxHeight, { radius: 8 }),
        k.color(30, 30, 40),
        k.outline(3, k.rgb(100, 100, 120)),
        k.fixed(),
        { z: 100 },
        "damageBox"
    ]);

    const titleText = container.add([
        k.text("LAST DAMAGE", { size: 12, font: "monospace" }),
        k.pos(10, 8),
        k.color(180, 180, 200)
    ]);

    const damageValueText = container.add([
        k.text("---", { size: 20, font: "monospace", weight: "bold" }),
        k.pos(boxWidth / 2, boxHeight / 2 + 5),
        k.anchor("center"),
        k.color(255, 255, 255)
    ]);

    // Exposure function to global or custom events if needed
    // For now, we'll listen for a custom "showDamage" event on the container
    container.on("showDamage", (dmg, isCrit) => {
        damageValueText.text = isCrit ? `CRIT! ${dmg}` : dmg.toString();
        damageValueText.color = isCrit ? k.rgb(255, 50, 50) : k.rgb(255, 255, 255);

        // Highlight effect
        container.use(k.outline(3, isCrit ? k.rgb(255, 50, 50) : k.rgb(255, 255, 255)));

        k.wait(0.5, () => {
            container.use(k.outline(3, k.rgb(100, 100, 120)));
        });
    });
}
