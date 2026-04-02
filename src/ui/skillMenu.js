import { gameState } from "../utils/utils.js";
import { THEME } from "../utils/theme.js";
import { Z } from "../utils/constants.js";
import { skillTree, SKILLS, canUnlock, unlockNode, equipSkill } from "../systems/progression.js";

/**
 * Open the Skill Tree / Inventory / Loadout Menu
 */
export function toggleSkillMenu(k, player) {
    if (k.get("skillMenu").length > 0) {
        closeMenu(k);
        return;
    }
    openMenu(k, player);
}

function closeMenu(k) {
    k.destroyAll("skillMenu");
    k.get("statsMenu").forEach(el => el.hidden = false);
    k.get("globalHUD").forEach(el => el.hidden = false);
    gameState.inventoryOpen = false;
    gameState.isPaused = false;
    gameState.inputLocked = false;
    document.body.style.cursor = "default";
}

function openMenu(k, player) {
    k.get("statsMenu").forEach(el => el.hidden = true);
    k.get("globalHUD").forEach(el => el.hidden = true);
    
    gameState.inventoryOpen = true;
    gameState.isPaused = true;
    gameState.inputLocked = true;

    const w = k.width();
    const h = k.height();
    const centerX = w / 2;
    const centerY = h * 0.6;

    // --- LIGHT THEME BACKGROUND OVERLAY ---
    // 1. White Main Overlay
    k.add([
        k.rect(w, h),
        k.pos(0, 0),
        k.color(255, 255, 255),
        k.opacity(0.95),
        k.fixed(),
        { z: 1000 },
        "skillMenu"
    ]);

    // 2. Faux-Vignette (Light edges)
    for (let i = 0; i < 5; i++) {
        const op = 0.05 / (i + 1);
        k.add([ k.rect(w, 20 + i * 20), k.pos(0, 0), k.color(200, 200, 200), k.opacity(op), k.fixed(), { z: 1000 }, "skillMenu" ]);
        k.add([ k.rect(w, 20 + i * 20), k.pos(0, h), k.anchor("botleft"), k.color(200, 200, 200), k.opacity(op), k.fixed(), { z: 1000 }, "skillMenu" ]);
    }

    // 3. Subtle Animated Grid & Scanline
    for (let i = 0; i < w; i += 50) {
        k.add([ k.rect(1, h), k.pos(i, 0), k.color(...THEME.brand.primary), k.opacity(0.04), k.fixed(), { z: 1000 }, "skillMenu" ]);
    }
    for (let i = 0; i < h; i += 50) {
        k.add([ k.rect(w, 1), k.pos(0, i), k.color(...THEME.brand.primary), k.opacity(0.04), k.fixed(), { z: 1000 }, "skillMenu" ]);
    }

    const scanLine = k.add([
        k.rect(w, 2),
        k.pos(0, 0),
        k.color(...THEME.brand.primary),
        k.opacity(0.1),
        k.fixed(),
        { z: 1000 },
        "skillMenu"
    ]);
    scanLine.onUpdate(() => {
        scanLine.pos.y += k.dt() * 100;
        if (scanLine.pos.y > h) scanLine.pos.y = 0;
    });

    // 4. Glowing Border Frame with pulsing effect
    const frame = k.add([
        k.rect(w - 40, h - 40, { radius: 10 }),
        k.pos(w/2, h/2),
        k.anchor("center"),
        k.outline(2, k.rgb(...THEME.brand.primary)),
        k.color(0, 0, 0, 0),
        k.opacity(0.2),
        k.fixed(),
        { z: 1000 },
        "skillMenu"
    ]);
    frame.onUpdate(() => {
        frame.opacity = 0.1 + Math.sin(k.time() * 2) * 0.1;
    });

    // --- TITLE & STATS (Dark for Light Theme) ---
    const titleY = h * 0.1;
    k.add([
        k.text("SKILL TREE", { size: 32, font: "monospace" }),
        k.pos(centerX, titleY),
        k.anchor("center"),
        k.color(20, 20, 40), // Dark Navy
        k.fixed(),
        { z: 1001 },
        "skillMenu"
    ]);

    const p = gameState.player;
    const statsText = `LVL ${p.level}  ·  SP ${p.skillPoints}  ·  XP ${p.xp}/${p.xpToNext}`;
    k.add([
        k.text(statsText, { size: 18, font: "monospace" }),
        k.pos(centerX, titleY + 40),
        k.anchor("center"),
        k.color(60, 60, 80),
        k.opacity(0.8),
        k.fixed(),
        { z: 1001 },
        "skillMenu"
    ]);

    // --- RADIAL TREE RENDERING ---
    // First pass: Draw lines between nodes
    skillTree.forEach(node => {
        const startPos = getRadialPos(k, centerX, centerY, node.pos.angle, node.pos.radius);
        
        node.children.forEach(childId => {
            const childNode = skillTree.find(n => n.id === childId);
            if (!childNode) return;
            
            const endPos = getRadialPos(k, centerX, centerY, childNode.pos.angle, childNode.pos.radius);
            
            // Draw connector line
            const isUnlocked = node.unlocked && childNode.unlocked;
            const dist = startPos.dist(endPos);
            const angle = endPos.sub(startPos).angle();

            k.add([
                k.rect(dist, 2),
                k.pos(startPos),
                k.rotate(angle),
                k.color(isUnlocked ? THEME.brand.primary : [120, 120, 120]),
                k.opacity(isUnlocked ? 0.8 : 0.3),
                k.fixed(),
                { z: 1000 },
                "skillMenu"
            ]);
        });
    });

    // Second pass: Draw nodes
    skillTree.forEach(node => {
        const nodePos = getRadialPos(k, centerX, centerY, node.pos.angle, node.pos.radius);
        
        const canUnlockNow = canUnlock(node.id);
        const color = node.unlocked 
            ? THEME.brand.secondary // Use a darker purple for unlocked
            : (canUnlockNow ? [120, 120, 120] : [200, 200, 200]);

        // Background / Border
        const btn = k.add([
            k.circle(20),
            k.pos(nodePos),
            k.anchor("center"),
            k.color(...THEME.palette.bg),
            k.outline(3, k.rgb(...color)),
            k.area(),
            k.fixed(),
            { z: 1001 },
            "skillMenu",
            { nodeId: node.id }
        ]);

        // Icon / Symbol inside node
        let icon = "○";
        if (node.type === "skill") icon = "◈";
        if (node.type === "stat") icon = "▲";

        k.add([
            k.text(icon, { size: 16 }),
            k.pos(nodePos),
            k.anchor("center"),
            k.color(...color),
            k.fixed(),
            { z: 1002 },
            "skillMenu"
        ]);

        // Interactions
        btn.onHoverUpdate(() => {
            document.body.style.cursor = "pointer";
            btn.scale = k.vec2(1.2);
            showNodeInfo(k, node, nodePos);
        });

        btn.onHoverEnd(() => {
            document.body.style.cursor = "default";
            btn.scale = k.vec2(1);
            k.destroyAll("nodeHoverInfo");
        });

        btn.onClick(() => {
            if (unlockNode(node.id, player)) {
                k.play("score", { volume: 0.5 }); // Use existing sound
                closeMenu(k);
                openMenu(k, player); // Refresh
            }
        });
    });

    // --- ACTIVE SKILL SLOTS (BOTTOM) ---
    const slotsY = h * 0.85;
    const slotGap = 80;
    const startX = centerX - (slotGap * 1.5);

    p.activeSkills.forEach((skillId, i) => {
        const slotX = startX + i * slotGap;
        const skill = SKILLS[skillId];

        // Slot Background
        const slot = k.add([
            k.rect(60, 60, { radius: 8 }),
            k.pos(slotX, slotsY),
            k.anchor("center"),
            k.color(skill ? [255, 255, 255] : [230, 230, 230]),
            k.outline(2, k.rgb(...(skill ? THEME.brand.primary : [180, 180, 180]))),
            k.area(),
            k.fixed(),
            { z: 1001 },
            "skillMenu",
            { slotIndex: i }
        ]);

        if (skill) {
            k.add([
                k.text(skill.icon, { size: 24 }),
                k.pos(slotX, slotsY),
                k.anchor("center"),
                k.fixed(),
                { z: 1002 },
                "skillMenu"
            ]);
        }

        k.add([
            k.text(`${i + 1}`, { size: 12 }),
            k.pos(slotX - 25, slotsY - 25),
            k.anchor("center"),
            k.color(80, 80, 100),
            k.fixed(),
            { z: 1002 },
            "skillMenu"
        ]);

        slot.onClick(() => {
            showSkillSelection(k, i, player);
        });
    });

    // Helper: Close hint
    k.add([
        k.text("Press ESC/TAB to exit", { size: 14, font: "monospace" }),
        k.pos(centerX, h - 30),
        k.anchor("center"),
        k.color(40, 40, 60),
        k.opacity(0.6),
        k.fixed(),
        { z: 1001 },
        "skillMenu"
    ]);
}

/**
 * Convert polar to cartesian
 */
function getRadialPos(k, centerX, centerY, angleDeg, radius) {
    const angleRad = (angleDeg - 90) * (Math.PI / 180); // Adjust so 0 is UP
    return k.vec2(
        centerX + radius * Math.cos(angleRad),
        centerY + radius * Math.sin(angleRad)
    );
}

/**
 * Show node info on hover
 */
function showNodeInfo(k, node, pos) {
    k.destroyAll("nodeHoverInfo");
    
    const infoW = 200;
    const infoH = 100;
    const infoX = pos.x + 30;
    const infoY = pos.y - 50;

    k.add([
        k.rect(infoW, infoH, { radius: 8 }),
        k.pos(infoX, infoY),
        k.color(...THEME.palette.bg),
        k.outline(1, k.rgb(...THEME.brand.primary)),
        k.fixed(),
        { z: 1010 },
        "skillMenu",
        "nodeHoverInfo"
    ]);

    k.add([
        k.text(node.name.toUpperCase(), { size: 14, font: "monospace", width: infoW - 20 }),
        k.pos(infoX + 10, infoY + 10),
        k.color(...THEME.brand.primary),
        k.fixed(),
        { z: 1011 },
        "skillMenu",
        "nodeHoverInfo"
    ]);

    k.add([
        k.text(node.description, { size: 12, font: "monospace", width: infoW - 20 }),
        k.pos(infoX + 10, infoY + 35),
        k.color(40, 40, 40), // Dark Gray
        k.fixed(),
        { z: 1011 },
        "skillMenu",
        "nodeHoverInfo"
    ]);

    const costText = node.unlocked ? "UNLOCKED" : `COST: ${node.cost} SP`;
    k.add([
        k.text(costText, { size: 12, font: "monospace" }),
        k.pos(infoX + 10, infoY + infoH - 15),
        k.color(...(node.unlocked ? THEME.status.success : THEME.status.warning)),
        k.fixed(),
        { z: 1011 },
        "skillMenu",
        "nodeHoverInfo"
    ]);
}

/**
 * Show skill selection modal for a slot
 */
function showSkillSelection(k, slotIndex, player) {
    k.destroyAll("skillSelector");
    
    const w = k.width();
    const h = k.height();
    const p = gameState.player;
    
    // Background dim
    k.add([
        k.rect(w, h),
        k.pos(0, 0),
        k.color(255, 255, 255),
        k.opacity(0.9),
        k.fixed(),
        { z: 1050 },
        "skillMenu",
        "skillSelector"
    ]);

    k.add([
        k.text(`SELECT SKILL FOR SLOT ${slotIndex + 1}`, { size: 24, font: "monospace" }),
        k.pos(w / 2, h * 0.2),
        k.anchor("center"),
        k.color(...THEME.brand.primary),
        k.fixed(),
        { z: 1051 },
        "skillMenu",
        "skillSelector"
    ]);

    // List of unlocked skills
    p.unlockedSkills.forEach((skillId, i) => {
        const skill = SKILLS[skillId];
        const itemY = h * 0.35 + i * 50;

        const btn = k.add([
            k.rect(w * 0.4, 40, { radius: 5 }),
            k.pos(w / 2, itemY),
            k.anchor("center"),
            k.color(...THEME.palette.bg),
            k.outline(1, k.rgb(...THEME.brand.primary)),
            k.area(),
            k.fixed(),
            { z: 1051 },
            "skillMenu",
            "skillSelector"
        ]);

        k.add([
            k.text(`${skill.icon} ${skill.name}`, { size: 18, font: "monospace" }),
            k.pos(w / 2, itemY),
            k.anchor("center"),
            k.fixed(),
            { z: 1052 },
            "skillMenu",
            "skillSelector"
        ]);

        btn.onClick(() => {
            equipSkill(skillId, slotIndex);
            k.destroyAll("skillSelector");
            closeMenu(k);
            openMenu(k, player); // Refresh
        });

        btn.onHoverUpdate(() => {
            document.body.style.cursor = "pointer";
            btn.color = k.rgb(...THEME.palette.bgInner);
        });
        btn.onHoverEnd(() => {
            document.body.style.cursor = "default";
            btn.color = k.rgb(...THEME.palette.bg);
        });
    });

    // Close button
    const closeBtn = k.add([
        k.text("CANCEL", { size: 18, font: "monospace" }),
        k.pos(w / 2, h * 0.8),
        k.anchor("center"),
        k.area(),
        k.fixed(),
        { z: 1051 },
        "skillMenu",
        "skillSelector"
    ]);
    closeBtn.onClick(() => k.destroyAll("skillSelector"));
}
