import { gameState } from "../utils/utils.js";

/**
 * Skill Registry
 * Defines the behavior and metadata for all skills.
 */
export const SKILLS = {
    "slash": {
        name: "Basic Slash",
        description: "A standard sword strike.",
        type: "active",
        cooldown: 0.5,
        damage: 10,
        icon: "⚔️",
        color: [255, 255, 255]
    },
    "overheadSlash": {
        name: "Overhead Slash",
        description: "A powerful vertical strike that deals massive damage.",
        type: "active",
        cooldown: 3.0,
        damage: 40,
        icon: "🔨",
        color: [255, 140, 0]
    },
    "bladeStorm": {
        name: "Blade Storm",
        description: "Spin rapidly, damaging all nearby enemies.",
        type: "active",
        cooldown: 5.0,
        damage: 15,
        icon: "🌀",
        color: [0, 100, 255]
    },
    "theWorld": {
        name: "The World",
        description: "Stop time itself for a brief moment.",
        type: "active",
        cooldown: 10.0,
        damage: 0,
        icon: "⏳",
        color: [147, 112, 219]
    },
    "quickStep": {
        name: "Quick Step",
        description: "A short dash that provides invulnerability.",
        type: "active",
        cooldown: 1.5,
        damage: 0,
        icon: "💨",
        color: [100, 255, 100]
    }
};

/**
 * Skill Tree Nodes
 * Radial positions: angle (deg), radius (units)
 */
export const skillTree = [
    {
        id: "root",
        name: "Beginner",
        description: "The path begins here.",
        unlocked: true,
        cost: 0,
        type: "passive",
        pos: { angle: 180, radius: 0 },
        children: ["force_path", "lightsaber_path", "survival_path"]
    },
    
    // --- FORCE PATH (Left Branch) ---
    {
        id: "force_path",
        name: "Force Focus",
        description: "Harness inner energy for mystical abilities.",
        unlocked: false,
        cost: 1,
        type: "stat",
        effect: { attack: 5 },
        pos: { angle: 150, radius: 80 },
        children: ["the_world_node"],
        group: "force"
    },
    {
        id: "the_world_node",
        name: "The World",
        description: "Unlock the ability to freeze time.",
        unlocked: false,
        cost: 2,
        type: "skill",
        unlocksSkill: "theWorld",
        pos: { angle: 140, radius: 160 },
        children: [],
        group: "force"
    },

    // --- LIGHTSABER PATH (Center Branch) ---
    {
        id: "lightsaber_path",
        name: "Combat Mastery",
        description: "Master the art of the blade.",
        unlocked: false,
        cost: 1,
        type: "stat",
        effect: { attack: 10 },
        pos: { angle: 180, radius: 80 },
        children: ["overhead_node", "bladestorm_node"],
        group: "lightsaber"
    },
    {
        id: "overhead_node",
        name: "Overhead Slash",
        description: "Unlock a powerful vertical strike.",
        unlocked: false,
        cost: 1,
        type: "skill",
        unlocksSkill: "overheadSlash",
        pos: { angle: 170, radius: 160 },
        children: [],
        group: "lightsaber"
    },
    {
        id: "bladestorm_node",
        name: "Blade Storm",
        description: "Unlock the spinning blade attack.",
        unlocked: false,
        cost: 1,
        type: "skill",
        unlocksSkill: "bladeStorm",
        pos: { angle: 190, radius: 160 },
        children: [],
        group: "lightsaber"
    },

    // --- SURVIVAL PATH (Right Branch) ---
    {
        id: "survival_path",
        name: "Survivor Instinct",
        description: "Increase longevity and mobility.",
        unlocked: false,
        cost: 1,
        type: "stat",
        effect: { maxHp: 20 },
        pos: { angle: 210, radius: 80 },
        children: ["quickstep_node"],
        group: "survival"
    },
    {
        id: "quickstep_node",
        name: "Quick Step",
        description: "Unlock a short dash ability.",
        unlocked: false,
        cost: 1,
        type: "skill",
        unlocksSkill: "quickStep",
        pos: { angle: 220, radius: 160 },
        children: [],
        group: "survival"
    }
];

/**
 * Check if a node can be unlocked
 */
export function canUnlock(nodeId) {
    const node = skillTree.find(n => n.id === nodeId);
    if (!node || node.unlocked) return false;

    // Check if player has enough points
    if (gameState.player.skillPoints < node.cost) return false;

    // Check if any parent is unlocked
    const parent = skillTree.find(p => p.children.includes(nodeId));
    if (parent && !parent.unlocked) return false;

    // Mutual Exclusivity: For this example, let's say "Force" and "Survival" are mutually exclusive
    // If you pick Force Focus, you can never pick Survivor Instinct.
    const forceNode = skillTree.find(n => n.id === "force_path");
    const survivalNode = skillTree.find(n => n.id === "survival_path");

    if (node.group === "force" && survivalNode.unlocked) return false;
    if (node.group === "survival" && forceNode.unlocked) return false;

    return true;
}

/**
 * Unlock a node and apply its effects
 */
export function unlockNode(nodeId, playerEntity) {
    if (!canUnlock(nodeId)) return false;

    const node = skillTree.find(n => n.id === nodeId);
    gameState.player.skillPoints -= node.cost;
    node.unlocked = true;

    // Apply stats
    if (node.type === "stat") {
        for (const [stat, value] of Object.entries(node.effect)) {
            gameState.player[stat] += value;
            // Also update the physical player entity if provided
            if (playerEntity && playerEntity[stat] !== undefined) {
                playerEntity[stat] += value;
            }
        }
    }

    // Unlock skill
    if (node.type === "skill") {
        gameState.player.unlockedSkills.push(node.unlocksSkill);
    }

    return true;
}

/**
 * Equip a skill to a slot
 */
export function equipSkill(skillId, slotIndex) {
    const p = gameState.player;
    if (!p.unlockedSkills.includes(skillId)) return false;
    if (slotIndex < 0 || slotIndex >= 4) return false;

    p.activeSkills[slotIndex] = skillId;
    return true;
}
