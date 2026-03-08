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
    // We listen for "showDamage" event on the container
    container.on("showDamage", (dmg, isCrit, pos) => {
        damageValueText.text = isCrit ? `CRIT! ${dmg}` : dmg.toString();
        damageValueText.color = isCrit ? k.rgb(255, 50, 50) : k.rgb(255, 255, 255);

        // Highlight effect
        container.use(k.outline(3, isCrit ? k.rgb(255, 50, 50) : k.rgb(255, 255, 255)));

        k.wait(0.5, () => {
            container.use(k.outline(3, k.rgb(100, 100, 120)));
        });

        // ── Floating Combat Text ──
        if (pos) {
            const floatText = k.add([
                k.text(isCrit ? `${dmg}!` : dmg.toString(), { size: isCrit ? 36 : 24, font: "monospace", weight: isCrit ? "bold" : "normal" }),
                k.pos(pos.x, pos.y - 30),
                k.anchor("center"),
                k.color(isCrit ? 255 : 255, isCrit ? 50 : 255, isCrit ? 50 : 255),
                k.opacity(1),
                k.move(k.UP, isCrit ? 80 : 50),
                { z: 200 }
            ]);

            // Fade out
            floatText.onUpdate(() => {
                floatText.opacity -= k.dt();
                if (floatText.opacity <= 0) k.destroy(floatText);
            });
            // Small pop effect for crits
            if (isCrit) {
                floatText.use(k.scale(1.5));
                k.wait(0.1, () => floatText.use(k.scale(1)));
            }
        }
    });
}
