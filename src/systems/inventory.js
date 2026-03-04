// Retro Settings Menu — with Creative Mode sliders
import { gameState, setGamePause } from "../utils/utils.js";
import { petState } from "./persistentPet.js";
import { gameConfig } from "../utils/constants.js";

// ── Retro Color Palette ──
const C = {
  panelBg: [212, 197, 169],
  panelInner: [225, 215, 195],
  panelBorder: [92, 64, 51],
  shadow: [40, 30, 20],
  separator: [180, 165, 140],
  title: [92, 64, 51],
  greenFace: [120, 190, 70],
  greenShad: [80, 140, 40],
  redFace: [210, 70, 60],
  redShad: [160, 45, 35],
  blueFace: [100, 160, 220],
  blueShad: [65, 120, 175],
  purpleFace: [160, 100, 220],
  purpleShad: [110, 60, 170],
  itemBg: [235, 225, 205],
  itemShad: [195, 185, 165],
  toggleOn: [76, 175, 80],
  toggleOff: [210, 70, 60],
  white: [255, 255, 255],
  dark: [60, 50, 40],
  gold: [255, 200, 50],
  sliderFill: [255, 160, 30],
  sliderTrack: [180, 165, 140],
};

// ── Module state ──
let selectedIndex = 0;
let handlers = [];
let menuItems = [];
let toggleRefs = {};
let subPanelOpen = false; // tracks any open sub-panel

// ── Public API ──
export function toggleInventory(k) {
  if (k.get("settingsMenu").length > 0) { closeMenu(k); return; }
  openMenu(k);
}

function cancelHandlers() { handlers.forEach(h => h.cancel()); handlers = []; }

function closeMenu(k) {
  k.destroyAll("settingsMenu");
  cancelHandlers();
  setGamePause(k, false);
  subPanelOpen = false;
  selectedIndex = 0;
  toggleRefs = {};
  document.body.style.cursor = "default";
}

function closeSubPanel(k) {
  subPanelOpen = false;
  k.get("subPanel").forEach(e => k.destroy(e));
  document.body.style.cursor = "default";
}

// ── Main panel ──
function openMenu(k) {
  setGamePause(k, true);
  selectedIndex = 0;
  subPanelOpen = false;

  const pw = 380, ph = 450;
  const px = (k.width() - pw) / 2;
  const py = (k.height() - ph) / 2;

  // Overlay
  addFx(k, 98, "settingsMenu",
    k.rect(k.width() * 3, k.height() * 3), k.pos(-k.width(), -k.height()),
    k.color(0, 0, 0), k.opacity(0.65));

  // Panel shadow + body
  addFx(k, 99, "settingsMenu",
    k.rect(pw + 4, ph + 6, { radius: 14 }), k.pos(px, py + 4),
    k.color(...C.shadow), k.opacity(0.4));
  addFx(k, 100, "settingsMenu",
    k.rect(pw, ph, { radius: 12 }), k.pos(px, py),
    k.color(...C.panelBg), k.outline(4, k.rgb(...C.panelBorder)));
  addFx(k, 100, "settingsMenu",
    k.rect(pw - 20, ph - 20, { radius: 8 }), k.pos(px + 10, py + 10),
    k.color(...C.panelInner), k.outline(2, k.rgb(...C.separator)));

  // Title
  addFx(k, 101, "settingsMenu",
    k.text("SETTINGS", { size: 32, font: "monospace" }),
    k.pos(px + pw / 2, py + 42), k.anchor("center"), k.color(...C.title));

  // Decorative dots
  for (let d = -2; d <= 2; d++) {
    addFx(k, 101, "settingsMenu",
      k.circle(4), k.pos(px + pw / 2 + d * 18, py + 62), k.anchor("center"),
      k.color(...(d === 0 ? C.redFace : C.panelBorder)), k.opacity(d === 0 ? 1 : 0.5));
  }

  addFx(k, 101, "settingsMenu",
    k.rect(pw - 60, 2, { radius: 1 }), k.pos(px + 30, py + 75),
    k.color(...C.panelBorder), k.opacity(0.5));

  // ── Menu items ──
  const musicIsOn = gameState.bgm ? gameState.bgm.volume > 0 : true;
  menuItems = [
    { type: "toggle", label: "Music", key: "music", value: musicIsOn },
    { type: "btn", label: "Controls", color: "blue", action: "controls" },
    { type: "btn", label: "Creative Mode 🎨", color: "purple", action: "creative" },
    { type: "btn", label: "Resume Game", color: "green", action: "resume" },
    { type: "btn", label: "Restart Game", color: "red", action: "restart" },
  ];

  const itemW = pw - 70, itemH = 46, gap = 12;
  const itemX = px + 35, startY = py + 92;
  toggleRefs = {};

  menuItems.forEach((item, i) => {
    const y = startY + i * (itemH + gap);
    const { face: fc, shad: sc } = btnColors(item);

    addFx(k, 101, "settingsMenu",
      k.rect(itemW, itemH, { radius: 8 }), k.pos(itemX + 2, y + 4), k.color(...sc));

    const face = addFx(k, 102, "settingsMenu", "menuFace_" + i,
      k.rect(itemW, itemH, { radius: 8 }), k.area(), k.pos(itemX, y),
      k.color(...fc), k.outline(2, k.rgb(...C.panelBorder)));

    const tColor = item.type === "toggle" ? C.dark : C.white;
    addFx(k, 103, "settingsMenu",
      k.text(item.label, { size: 18, font: "monospace" }),
      k.pos(itemX + 18, y + itemH / 2), k.anchor("left"), k.color(...tColor));

    if (item.type === "toggle") buildToggle(k, item, itemX + itemW - 90, y + itemH / 2 - 14);

    face.onHoverUpdate(() => {
      if (!subPanelOpen) { selectedIndex = i; document.body.style.cursor = "pointer"; }
    });
    face.onHoverEnd(() => { document.body.style.cursor = "default"; });
    face.onClick(() => { if (!subPanelOpen) { selectedIndex = i; activate(k); } });
  });

  // Selector arrow
  const selector = addFx(k, 105, "settingsMenu",
    k.text("▶", { size: 22 }), k.pos(itemX - 22, startY + itemH / 2),
    k.anchor("center"), k.color(...C.gold));

  selector.onUpdate(() => {
    const ty = startY + selectedIndex * (itemH + gap) + itemH / 2;
    selector.pos.y = k.lerp(selector.pos.y, ty, 0.25);
    selector.pos.x = itemX - 22 + Math.sin(k.time() * 5) * 3;
  });

  // Selected outline updater
  addFx(k, 90, "settingsMenu", k.pos(0, 0), {
    update() {
      for (let i = 0; i < menuItems.length; i++) {
        k.get("menuFace_" + i).forEach(f => {
          f.outline.color = i === selectedIndex ? k.rgb(...C.gold) : k.rgb(...C.panelBorder);
          f.outline.width = i === selectedIndex ? 3 : 2;
        });
      }
    }
  });

  // Footer
  addFx(k, 101, "settingsMenu",
    k.text("Navigate · Click / Enter · Tab Close", { size: 10, font: "monospace" }),
    k.pos(px + pw / 2, py + ph - 20), k.anchor("center"),
    k.color(...C.title), k.opacity(0.55));

  // Key handlers
  const nav = dir => () => { if (!subPanelOpen) selectedIndex = (selectedIndex + dir + menuItems.length) % menuItems.length; };
  handlers.push(k.onKeyPress("up", nav(-1)));
  handlers.push(k.onKeyPress("w", nav(-1)));
  handlers.push(k.onKeyPress("down", nav(1)));
  handlers.push(k.onKeyPress("s", nav(1)));
  handlers.push(k.onKeyPress("enter", () => activate(k)));
  handlers.push(k.onKeyPress("escape", () => { if (subPanelOpen) closeSubPanel(k); else closeMenu(k); }));
}

// ── Toggle widget ──
function buildToggle(k, item, tX, tY) {
  const track = addFx(k, 103, "settingsMenu",
    k.rect(70, 28, { radius: 14 }), k.pos(tX, tY),
    k.color(...(item.value ? C.toggleOn : C.toggleOff)));
  const knob = addFx(k, 104, "settingsMenu",
    k.circle(11), k.pos(item.value ? tX + 56 : tX + 14, tY + 14),
    k.anchor("center"), k.color(255, 255, 255), k.outline(1, k.rgb(200, 200, 200)));
  const lbl = addFx(k, 104, "settingsMenu",
    k.text(item.value ? "ON" : "OFF", { size: 12, font: "monospace" }),
    k.pos(item.value ? tX + 25 : tX + 42, tY + 14), k.anchor("center"),
    k.color(255, 255, 255));
  toggleRefs[item.key] = { track, knob, lbl, tX, tY };
}

// ── Activate ──
function activate(k) {
  if (subPanelOpen) { closeSubPanel(k); return; }
  const item = menuItems[selectedIndex];
  if (!item) return;

  if (item.type === "toggle") {
    item.value = !item.value;
    if (item.key === "music" && gameState.bgm) gameState.bgm.volume = item.value ? 0.5 : 0;
    const r = toggleRefs[item.key];
    if (r) {
      r.track.color = item.value ? k.rgb(...C.toggleOn) : k.rgb(...C.toggleOff);
      r.knob.pos.x = item.value ? r.tX + 56 : r.tX + 14;
      r.lbl.text = item.value ? "ON" : "OFF";
      r.lbl.pos.x = item.value ? r.tX + 25 : r.tX + 42;
    }
    return;
  }

  switch (item.action) {
    case "resume": closeMenu(k); break;
    case "controls": showControlsPanel(k); break;
    case "creative": showCreativePanel(k); break;
    case "restart":
      // Stop existing BGM cleanly before restarting
      if (gameState.bgm) { gameState.bgm.stop(); gameState.bgm = null; }
      closeMenu(k);
      gameState.isPaused = false;
      gameState.isTimeStopped = false;
      gameState.timeScale = 1.0;
      petState.isDead = false;
      petState.shouldPersist = false;
      petState.currentPet = null;
      petState.currentHealth = 50;
      k.go("intro");
      break;
  }
}

// ── Controls sub-panel ──
function showControlsPanel(k) {
  subPanelOpen = true;
  const pw = 350, ph = 420;
  const px = (k.width() - pw) / 2, py = (k.height() - ph) / 2;

  addFx(k, 109, "settingsMenu", "subPanel",
    k.rect(pw + 4, ph + 6, { radius: 14 }), k.pos(px, py + 4),
    k.color(...C.shadow), k.opacity(0.4));
  addFx(k, 110, "settingsMenu", "subPanel",
    k.rect(pw, ph, { radius: 12 }), k.pos(px, py),
    k.color(...C.panelBg), k.outline(4, k.rgb(...C.panelBorder)));
  addFx(k, 110, "settingsMenu", "subPanel",
    k.rect(pw - 20, ph - 20, { radius: 8 }), k.pos(px + 10, py + 10),
    k.color(...C.panelInner), k.outline(2, k.rgb(...C.separator)));
  addFx(k, 111, "settingsMenu", "subPanel",
    k.text("CONTROLS", { size: 28, font: "monospace" }),
    k.pos(px + pw / 2, py + 36), k.anchor("center"), k.color(...C.title));
  addFx(k, 111, "settingsMenu", "subPanel",
    k.rect(pw - 60, 2), k.pos(px + 30, py + 55),
    k.color(...C.panelBorder), k.opacity(0.5));

  const controls = [
    ["WASD", "Move"], ["M", "Swift Slash"], [",", "Titan Cleave"],
    [".", "Blade Storm"], ["/", "The World"], ["T", "Revive Pet"],
    ["Space", "Dialogue"], ["Tab", "Settings"], ["Esc", "Close Menu"],
  ];

  const lx = px + 25, sy = py + 68, lh = 30;
  controls.forEach(([key, desc], i) => {
    const y = sy + i * lh;
    addFx(k, 112, "settingsMenu", "subPanel",
      k.rect(80, 22, { radius: 5 }), k.pos(lx + 1, y + 2), k.color(...C.blueShad));
    addFx(k, 113, "settingsMenu", "subPanel",
      k.rect(80, 22, { radius: 5 }), k.pos(lx, y), k.color(...C.blueFace));
    addFx(k, 114, "settingsMenu", "subPanel",
      k.text(key, { size: 14, font: "monospace" }),
      k.pos(lx + 40, y + 11), k.anchor("center"), k.color(...C.white));
    addFx(k, 113, "settingsMenu", "subPanel",
      k.text(desc, { size: 16, font: "monospace" }),
      k.pos(lx + 96, y + 11), k.anchor("left"), k.color(...C.dark));
  });

  buildBackButton(k, px + pw / 2 - 100, py + ph - 52);
}

// ── Creative Mode panel ──
function showCreativePanel(k) {
  subPanelOpen = true;

  const pw = 420, ph = 500;
  const px = (k.width() - pw) / 2, py = (k.height() - ph) / 2;

  // Glow effect
  addFx(k, 108, "settingsMenu", "subPanel",
    k.rect(pw + 20, ph + 20, { radius: 18 }), k.pos(px - 10, py - 10),
    k.color(...C.purpleFace), k.opacity(0.18));

  // Panel
  addFx(k, 109, "settingsMenu", "subPanel",
    k.rect(pw + 4, ph + 6, { radius: 14 }), k.pos(px, py + 4),
    k.color(...C.shadow), k.opacity(0.45));
  addFx(k, 110, "settingsMenu", "subPanel",
    k.rect(pw, ph, { radius: 12 }), k.pos(px, py),
    k.color(...C.panelBg), k.outline(4, k.rgb(...C.panelBorder)));
  addFx(k, 110, "settingsMenu", "subPanel",
    k.rect(pw - 20, ph - 20, { radius: 8 }), k.pos(px + 10, py + 10),
    k.color(...C.panelInner), k.outline(2, k.rgb(...C.separator)));

  // Title
  addFx(k, 111, "settingsMenu", "subPanel",
    k.text("🎨 CREATIVE MODE", { size: 22, font: "monospace" }),
    k.pos(px + pw / 2, py + 34), k.anchor("center"), k.color(...C.title));
  addFx(k, 111, "settingsMenu", "subPanel",
    k.text("Changes apply live to existing entities", { size: 10, font: "monospace" }),
    k.pos(px + pw / 2, py + 54), k.anchor("center"), k.color(...C.title), k.opacity(0.55));
  addFx(k, 111, "settingsMenu", "subPanel",
    k.rect(pw - 60, 2), k.pos(px + 30, py + 64),
    k.color(...C.panelBorder), k.opacity(0.5));

  // Sliders
  const sliders = [
    // [label,  configPath,       min, max,  step, format]
    ["Player Speed", "player.speed", 50, 800, 10, v => `${v}`],
    ["Player HP", "player.health", 10, 500, 10, v => `${v}`],
    ["Player Damage", "player.damage", 1, 100, 1, v => `${v}`],
    ["Crit Rate", "player.critRate", 0, 1, 0.05, v => `${Math.round(v * 100)}%`],
    ["Crit Damage", "player.critDamage", 1, 5, 0.1, v => `${v.toFixed(1)}x`],
    ["Boss HP", "boss.health", 10, 1000, 10, v => `${v}`],
    ["Boss Damage", "boss.damage", 1, 100, 1, v => `${v}`],
    ["Boss Speed", "boss.speed", 20, 400, 10, v => `${v}`],
    ["Pet HP", "pet.health", 10, 2000, 50, v => `${v}`],
    ["Pet Damage", "pet.damage", 1, 100, 1, v => `${v}`],
    ["Swift Slash Dmg", "skills.swiftSlashDmg", 1, 200, 1, v => `${v}`],
    ["Titan Cleave Dmg", "skills.titanCleaveDmg", 1, 300, 1, v => `${v}`],
  ];

  const slW = pw - 50, slH = 6, knobR = 9;
  const slX = px + 25, slStartY = py + 80;
  const rowH = 32;

  sliders.forEach(([label, path, min, max, step, fmt], i) => {
    const y = slStartY + i * rowH;
    const [section, key] = path.split(".");
    const curVal = gameConfig[section][key];

    // Label
    addFx(k, 112, "settingsMenu", "subPanel",
      k.text(label, { size: 13, font: "monospace" }),
      k.pos(slX, y + slH / 2), k.anchor("left"), k.color(...C.dark));

    // Value text (right side)
    const valText = addFx(k, 114, "settingsMenu", "subPanel",
      k.text(fmt(curVal), { size: 13, font: "monospace" }),
      k.pos(slX + slW, y + slH / 2), k.anchor("right"), k.color(...C.purpleFace));

    // Track bg
    const trackX = slX + 120;
    const trackW = slW - 120;
    addFx(k, 112, "settingsMenu", "subPanel",
      k.rect(trackW, slH, { radius: 3 }), k.pos(trackX, y),
      k.color(...C.sliderTrack));

    // Fill
    const fillRatio = (curVal - min) / (max - min);
    const fill = addFx(k, 113, "settingsMenu", "subPanel",
      k.rect(Math.max(0, trackW * fillRatio), slH, { radius: 3 }),
      k.pos(trackX, y), k.color(...C.sliderFill));

    // Knob (draggable)
    const knob = addFx(k, 114, "settingsMenu", "subPanel",
      k.circle(knobR), k.area(),
      k.pos(trackX + trackW * fillRatio, y + slH / 2),
      k.anchor("center"), k.color(...C.white),
      k.outline(2, k.rgb(...C.panelBorder)));

    let dragging = false;

    knob.onHoverUpdate(() => { document.body.style.cursor = "ew-resize"; });
    knob.onHoverEnd(() => { document.body.style.cursor = "default"; });

    // Only start dragging if mouse was pressed while hovering THIS knob
    const clickHandler = k.onMousePress("left", () => {
      if (knob.isHovering()) dragging = true;
    });

    // Clean up handlers when menu closes
    k.get("subPanel")[0].onDestroy(() => {
      clickHandler.cancel();
    });

    // Track click to jump
    const trackHit = addFx(k, 113, "settingsMenu", "subPanel",
      k.rect(trackW, 24, { radius: 3 }), k.area(),
      k.pos(trackX, y - 9), k.color(0, 0, 0), k.opacity(0));
    trackHit.onHoverUpdate(() => { document.body.style.cursor = "pointer"; });
    trackHit.onHoverEnd(() => { document.body.style.cursor = "default"; });
    trackHit.onClick(() => {
      const mx = k.mousePos().x;
      let ratio = (mx - trackX) / trackW;
      ratio = Math.min(1, Math.max(0, ratio));
      const raw = min + ratio * (max - min);
      const snapped = Math.round(raw / step) * step;
      const clamped = parseFloat(Math.min(max, Math.max(min, snapped)).toFixed(4));
      gameConfig[section][key] = clamped;
      const r2 = (clamped - min) / (max - min);
      knob.pos.x = trackX + trackW * r2;
      fill.width = Math.max(0, trackW * r2);
      valText.text = fmt(clamped);
      applyLiveStats(k, section, key, clamped);
    });

    knob.onUpdate(() => {
      if (!dragging) return;
      if (!k.isMouseDown("left")) { dragging = false; document.body.style.cursor = "default"; return; }
      const mx = k.mousePos().x;
      let ratio = (mx - trackX) / trackW;
      ratio = Math.min(1, Math.max(0, ratio));
      const raw = min + ratio * (max - min);
      const snapped = Math.round(raw / step) * step;
      const clamped = parseFloat(Math.min(max, Math.max(min, snapped)).toFixed(4));
      gameConfig[section][key] = clamped;
      const r2 = (clamped - min) / (max - min);
      knob.pos.x = trackX + trackW * r2;
      fill.width = Math.max(0, trackW * r2);
      valText.text = fmt(clamped);
      applyLiveStats(k, section, key, clamped);
    });
  });

  // Reset defaults button
  addFx(k, 112, "settingsMenu", "subPanel",
    k.rect(154, 30, { radius: 7 }), k.pos(px + 25 + 2, py + ph - 54 + 3),
    k.color(...C.redShad));
  const resetBtn = addFx(k, 113, "settingsMenu", "subPanel",
    k.rect(154, 30, { radius: 7 }), k.area(),
    k.pos(px + 25, py + ph - 54),
    k.color(...C.redFace), k.outline(2, k.rgb(...C.panelBorder)));
  addFx(k, 114, "settingsMenu", "subPanel",
    k.text("Reset Defaults", { size: 13, font: "monospace" }),
    k.pos(px + 25 + 77, py + ph - 54 + 15), k.anchor("center"), k.color(...C.white));
  resetBtn.onHoverUpdate(() => { document.body.style.cursor = "pointer"; });
  resetBtn.onHoverEnd(() => { document.body.style.cursor = "default"; });
  resetBtn.onClick(() => {
    Object.assign(gameConfig.player, { speed: 250, health: 100, damage: 10, critRate: 0.2, critDamage: 1.5 });
    Object.assign(gameConfig.boss, { health: 100, damage: 20, speed: 100 });
    Object.assign(gameConfig.pet, { health: 500, speed: 200, damage: 20, critRate: 0.05, critDamage: 1.1 });
    Object.assign(gameConfig.skills, { swiftSlashDmg: 10, swiftSlashCD: 0.5, titanCleaveDmg: 30, titanCleaveCD: 2.0, bladeStormDmg: 15, bladeStormCD: 3.0, theWorldCD: 5.0 });
    closeSubPanel(k);
    showCreativePanel(k);
  });

  buildBackButton(k, px + pw / 2 + 10, py + ph - 54);
}

// ── Push live stat changes onto existing entities ──
function applyLiveStats(k, section, key, val) {
  if (section === "player") {
    k.get("player").forEach(p => {
      if (key === "speed") p.speed = val;
      if (key === "health" && val < p.health) p.health = val;
      if (key === "damage") p.damage = val;
      if (key === "critRate") p.critRate = val;
      if (key === "critDamage") p.critDamage = val;
    });
  }
  if (section === "boss") {
    k.get("boss").forEach(b => {
      if (key === "health" && val < b.health) b.health = val;
      if (key === "damage") b.damage = val;
      if (key === "speed") b.speed = val;
    });
  }
  if (section === "pet") {
    k.get("frog").forEach(f => {
      if (key === "health" && val < f.health) f.health = val;
      if (key === "damage") f.damage = val;
      if (key === "speed") f.speed = val;
    });
  }
}

// ── Shared back button ──
function buildBackButton(k, bx, by) {
  addFx(k, 112, "settingsMenu", "subPanel",
    k.rect(154, 30, { radius: 7 }), k.pos(bx + 2, by + 3), k.color(...C.greenShad));
  const btn = addFx(k, 113, "settingsMenu", "subPanel",
    k.rect(154, 30, { radius: 7 }), k.area(), k.pos(bx, by),
    k.color(...C.greenFace), k.outline(2, k.rgb(...C.panelBorder)));
  addFx(k, 114, "settingsMenu", "subPanel",
    k.text("← Back", { size: 14, font: "monospace" }),
    k.pos(bx + 77, by + 15), k.anchor("center"), k.color(...C.white));
  btn.onHoverUpdate(() => { document.body.style.cursor = "pointer"; });
  btn.onHoverEnd(() => { document.body.style.cursor = "default"; });
  btn.onClick(() => closeSubPanel(k));
}

// ── Color lookup ──
function btnColors(item) {
  if (item.type === "toggle") return { face: C.itemBg, shad: C.itemShad };
  const map = { green: [C.greenFace, C.greenShad], red: [C.redFace, C.redShad], blue: [C.blueFace, C.blueShad], purple: [C.purpleFace, C.purpleShad] };
  const [f, s] = map[item.color] || [C.itemBg, C.itemShad];
  return { face: f, shad: s };
}

// ── Utility: create a fixed z-indexed entity with optional tags ──
function addFx(k, z, ...args) {
  const tags = args.filter(a => typeof a === "string");
  const comps = args.filter(a => typeof a !== "string");
  return k.add([...comps, k.fixed(), { z }, ...tags]);
}
