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
  k.destroyAll("skinPanel");
  cancelHandlers();
  setGamePause(k, false);
  subPanelOpen = false;
  selectedIndex = 0;
  toggleRefs = {};
  document.body.style.cursor = "default";
}

function closeSubPanel(k) {
  subPanelOpen = false;
  creativeClickHandlers.forEach(h => h.cancel());
  creativeClickHandlers = [];
  k.get("subPanel").forEach(e => k.destroy(e));
  document.body.style.cursor = "default";
}

// ── Main panel (LEFT side, near full-screen) ──
function openMenu(k) {
  setGamePause(k, true);
  selectedIndex = 0;
  subPanelOpen = false;

  const margin = 30;
  const gap = 30;
  const pw = Math.floor(k.width() * 0.44);
  const ph = k.height() - margin * 2;
  const px = margin;
  const py = margin;

  // Overlay
  addFx(k, 98, "settingsMenu",
    k.rect(k.width() * 3, k.height() * 3), k.pos(-k.width(), -k.height()),
    k.color(0, 0, 0), k.opacity(0.65));

  // Panel shadow + body
  addFx(k, 99, "settingsMenu",
    k.rect(pw + 4, ph + 6, { radius: 16 }), k.pos(px, py + 4),
    k.color(...C.shadow), k.opacity(0.4));
  addFx(k, 100, "settingsMenu",
    k.rect(pw, ph, { radius: 14 }), k.pos(px, py),
    k.color(...C.panelBg), k.outline(4, k.rgb(...C.panelBorder)));
  addFx(k, 100, "settingsMenu",
    k.rect(pw - 24, ph - 24, { radius: 10 }), k.pos(px + 12, py + 12),
    k.color(...C.panelInner), k.outline(2, k.rgb(...C.separator)));

  // Title
  addFx(k, 101, "settingsMenu",
    k.text("SETTINGS", { size: 42, font: "monospace" }),
    k.pos(px + pw / 2, py + 55), k.anchor("center"), k.color(...C.title));

  // Decorative dots
  for (let d = -2; d <= 2; d++) {
    addFx(k, 101, "settingsMenu",
      k.circle(5), k.pos(px + pw / 2 + d * 22, py + 82), k.anchor("center"),
      k.color(...(d === 0 ? C.redFace : C.panelBorder)), k.opacity(d === 0 ? 1 : 0.5));
  }

  addFx(k, 101, "settingsMenu",
    k.rect(pw - 80, 2, { radius: 1 }), k.pos(px + 40, py + 98),
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

  const itemW = pw - 90, itemH = 60, itemGap = 12;
  const itemX = px + 45, startY = py + 120;
  toggleRefs = {};

  menuItems.forEach((item, i) => {
    const y = startY + i * (itemH + itemGap);
    const { face: fc, shad: sc } = btnColors(item);

    addFx(k, 101, "settingsMenu",
      k.rect(itemW, itemH, { radius: 10 }), k.pos(itemX + 2, y + 4), k.color(...sc));

    const face = addFx(k, 102, "settingsMenu", "menuFace_" + i,
      k.rect(itemW, itemH, { radius: 10 }), k.area(), k.pos(itemX, y),
      k.color(...fc), k.outline(2, k.rgb(...C.panelBorder)));

    const tColor = item.type === "toggle" ? C.dark : C.white;
    addFx(k, 103, "settingsMenu",
      k.text(item.label, { size: 24, font: "monospace" }),
      k.pos(itemX + 24, y + itemH / 2), k.anchor("left"), k.color(...tColor));

    if (item.type === "toggle") buildToggle(k, item, itemX + itemW - 110, y + itemH / 2 - 16);

    face.onHoverUpdate(() => {
      if (!subPanelOpen) { selectedIndex = i; document.body.style.cursor = "pointer"; }
    });
    face.onHoverEnd(() => { document.body.style.cursor = "default"; });
    face.onClick(() => { if (!subPanelOpen) { selectedIndex = i; activate(k); } });
  });

  // Selector arrow
  const selector = addFx(k, 105, "settingsMenu",
    k.text("▶", { size: 28 }), k.pos(itemX - 28, startY + itemH / 2),
    k.anchor("center"), k.color(...C.gold));

  selector.onUpdate(() => {
    const ty = startY + selectedIndex * (itemH + itemGap) + itemH / 2;
    selector.pos.y = k.lerp(selector.pos.y, ty, 0.25);
    selector.pos.x = itemX - 28 + Math.sin(k.time() * 5) * 4;
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
    k.text("Navigate · Click / Enter · Tab Close", { size: 14, font: "monospace" }),
    k.pos(px + pw / 2, py + ph - 28), k.anchor("center"),
    k.color(...C.title), k.opacity(0.55));

  // Key handlers
  const nav = dir => () => { if (!subPanelOpen) selectedIndex = (selectedIndex + dir + menuItems.length) % menuItems.length; };
  handlers.push(k.onKeyPress("up", nav(-1)));
  handlers.push(k.onKeyPress("w", nav(-1)));
  handlers.push(k.onKeyPress("down", nav(1)));
  handlers.push(k.onKeyPress("s", nav(1)));
  handlers.push(k.onKeyPress("enter", () => activate(k)));
  handlers.push(k.onKeyPress("escape", () => { if (subPanelOpen) closeSubPanel(k); else closeMenu(k); }));

  // Always show skin panel on the right
  showSkinPanel(k);
}

// ── Toggle widget ──
function buildToggle(k, item, tX, tY) {
  const track = addFx(k, 103, "settingsMenu",
    k.rect(80, 32, { radius: 16 }), k.pos(tX, tY),
    k.color(...(item.value ? C.toggleOn : C.toggleOff)));
  const knob = addFx(k, 104, "settingsMenu",
    k.circle(13), k.pos(item.value ? tX + 64 : tX + 16, tY + 16),
    k.anchor("center"), k.color(255, 255, 255), k.outline(1, k.rgb(200, 200, 200)));
  const lbl = addFx(k, 104, "settingsMenu",
    k.text(item.value ? "ON" : "OFF", { size: 14, font: "monospace" }),
    k.pos(item.value ? tX + 30 : tX + 48, tY + 16), k.anchor("center"),
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
      r.knob.pos.x = item.value ? r.tX + 64 : r.tX + 16;
      r.lbl.text = item.value ? "ON" : "OFF";
      r.lbl.pos.x = item.value ? r.tX + 30 : r.tX + 48;
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

// ── Controls sub-panel (full overlay) ──
function showControlsPanel(k) {
  subPanelOpen = true;
  const pw = Math.floor(k.width() * 0.5), ph = Math.floor(k.height() * 0.85);
  const px = (k.width() - pw) / 2, py = (k.height() - ph) / 2;

  // Dark overlay to cover settings behind
  addFx(k, 115, "settingsMenu", "subPanel",
    k.rect(k.width() * 3, k.height() * 3), k.pos(-k.width(), -k.height()),
    k.color(0, 0, 0), k.opacity(0.7));

  addFx(k, 116, "settingsMenu", "subPanel",
    k.rect(pw + 4, ph + 6, { radius: 16 }), k.pos(px, py + 4),
    k.color(...C.shadow), k.opacity(0.4));
  addFx(k, 117, "settingsMenu", "subPanel",
    k.rect(pw, ph, { radius: 14 }), k.pos(px, py),
    k.color(...C.panelBg), k.outline(4, k.rgb(...C.panelBorder)));
  addFx(k, 117, "settingsMenu", "subPanel",
    k.rect(pw - 24, ph - 24, { radius: 10 }), k.pos(px + 12, py + 12),
    k.color(...C.panelInner), k.outline(2, k.rgb(...C.separator)));
  addFx(k, 118, "settingsMenu", "subPanel",
    k.text("CONTROLS", { size: 36, font: "monospace" }),
    k.pos(px + pw / 2, py + 48), k.anchor("center"), k.color(...C.title));
  addFx(k, 118, "settingsMenu", "subPanel",
    k.rect(pw - 80, 2), k.pos(px + 40, py + 72),
    k.color(...C.panelBorder), k.opacity(0.5));

  const controls = [
    ["WASD", "Move"], ["M", "Swift Slash"], [",", "Titan Cleave"],
    [".", "Blade Storm"], ["/", "The World"], ["T", "Revive Pet"],
    ["Space", "Dialogue"], ["Tab", "Settings"], ["Esc", "Close Menu"],
  ];

  const lx = px + 40, sy = py + 90, lh = 42;
  controls.forEach(([key, desc], i) => {
    const y = sy + i * lh;
    addFx(k, 119, "settingsMenu", "subPanel",
      k.rect(100, 30, { radius: 6 }), k.pos(lx + 1, y + 2), k.color(...C.blueShad));
    addFx(k, 120, "settingsMenu", "subPanel",
      k.rect(100, 30, { radius: 6 }), k.pos(lx, y), k.color(...C.blueFace));
    addFx(k, 121, "settingsMenu", "subPanel",
      k.text(key, { size: 18, font: "monospace" }),
      k.pos(lx + 50, y + 15), k.anchor("center"), k.color(...C.white));
    addFx(k, 120, "settingsMenu", "subPanel",
      k.text(desc, { size: 22, font: "monospace" }),
      k.pos(lx + 120, y + 15), k.anchor("left"), k.color(...C.dark));
  });

  buildBackButton(k, px + pw / 2 - 100, py + ph - 65);
}

// ── Skin Selection Panel (always visible on the RIGHT, near full-screen) ──
function showSkinPanel(k) {

  const margin = 30;
  const gap = 30;
  const settingsPw = Math.floor(k.width() * 0.44);
  const px = margin + settingsPw + gap;
  const pw = k.width() - px - margin;
  const ph = k.height() - margin * 2;
  const py = margin;

  // Glow
  addFx(k, 108, "skinPanel",
    k.rect(pw + 20, ph + 20, { radius: 18 }), k.pos(px - 10, py - 10),
    k.color(...C.purpleFace), k.opacity(0.18));

  addFx(k, 109, "skinPanel",
    k.rect(pw + 4, ph + 6, { radius: 16 }), k.pos(px, py + 4),
    k.color(...C.shadow), k.opacity(0.4));
  addFx(k, 110, "skinPanel",
    k.rect(pw, ph, { radius: 14 }), k.pos(px, py),
    k.color(...C.panelBg), k.outline(4, k.rgb(...C.panelBorder)));
  addFx(k, 110, "skinPanel",
    k.rect(pw - 24, ph - 24, { radius: 10 }), k.pos(px + 12, py + 12),
    k.color(...C.panelInner), k.outline(2, k.rgb(...C.separator)));

  addFx(k, 111, "skinPanel",
    k.text("SELECT SKIN", { size: 36, font: "monospace" }),
    k.pos(px + pw / 2, py + 50), k.anchor("center"), k.color(...C.title));

  const SUBTITLES = [
    "Purple Knight", "Green Knight", "Gold Knight", "Red Knight",
    "Purple Mage", "Green Mage", "Gold Mage", "Red Mage"
  ];

  let tempSkin = gameConfig.player.skinIndex;

  const subLabel = addFx(k, 111, "skinPanel",
    k.text(SUBTITLES[tempSkin], { size: 22, font: "monospace" }),
    k.pos(px + pw / 2, py + 86), k.anchor("center"), k.color(...C.title), k.opacity(0.7));

  addFx(k, 111, "skinPanel",
    k.rect(pw - 100, 2), k.pos(px + 50, py + 108),
    k.color(...C.panelBorder), k.opacity(0.5));

  // Skin Preview — larger box
  const previewCenterY = py + ph * 0.45;
  const previewBox = addFx(k, 111, "skinPanel",
    k.rect(160, 160, { radius: 10 }), k.pos(px + pw / 2, previewCenterY), k.anchor("center"),
    k.color(...C.itemBg), k.outline(2, k.rgb(...C.panelBorder)));

  const spritePreview = addFx(k, 112, "skinPanel", "previewSprite",
    k.sprite(`skin_${tempSkin}`, { anim: "walk-down" }),
    k.pos(px + pw / 2, previewCenterY), k.anchor("center"), k.scale(6));

  // Left Arrow — bigger
  const arrowSize = 52;
  const arrowY = previewCenterY - arrowSize / 2;
  const lBtnShadow = addFx(k, 112, "skinPanel",
    k.rect(arrowSize, arrowSize, { radius: 10 }), k.pos(px + 40 + 2, arrowY + 4), k.color(...C.blueShad));
  const lBtn = addFx(k, 113, "skinPanel",
    k.rect(arrowSize, arrowSize, { radius: 10 }), k.area(), k.pos(px + 40, arrowY),
    k.color(...C.blueFace), k.outline(2, k.rgb(...C.panelBorder)));
  addFx(k, 114, "skinPanel",
    k.text("◀", { size: 24 }), k.pos(px + 40 + arrowSize / 2, arrowY + arrowSize / 2), k.anchor("center"), k.color(...C.white));

  // Right Arrow — bigger
  const rBtnShadow = addFx(k, 112, "skinPanel",
    k.rect(arrowSize, arrowSize, { radius: 10 }), k.pos(px + pw - 40 - arrowSize + 2, arrowY + 4), k.color(...C.blueShad));
  const rBtn = addFx(k, 113, "skinPanel",
    k.rect(arrowSize, arrowSize, { radius: 10 }), k.area(), k.pos(px + pw - 40 - arrowSize, arrowY),
    k.color(...C.blueFace), k.outline(2, k.rgb(...C.panelBorder)));
  addFx(k, 114, "skinPanel",
    k.text("▶", { size: 24 }), k.pos(px + pw - 40 - arrowSize / 2, arrowY + arrowSize / 2), k.anchor("center"), k.color(...C.white));

  function updateSkin(dir) {
    tempSkin = (tempSkin + dir + 8) % 8;
    subLabel.text = SUBTITLES[tempSkin];
    spritePreview.use(k.sprite(`skin_${tempSkin}`, { anim: "walk-down" }));
  }

  [lBtn, rBtn].forEach(btn => {
    btn.onHoverUpdate(() => { document.body.style.cursor = "pointer"; });
    btn.onHoverEnd(() => { document.body.style.cursor = "default"; });
  });

  lBtn.onClick(() => updateSkin(-1));
  rBtn.onClick(() => updateSkin(1));

  // Apply Button — bigger, centered
  const btnY = py + ph - 90;

  addFx(k, 112, "skinPanel",
    k.rect(240, 44, { radius: 10 }), k.pos(px + pw / 2 - 120 + 2, btnY + 4), k.color(...C.purpleShad));
  const applyBtn = addFx(k, 113, "skinPanel",
    k.rect(240, 44, { radius: 10 }), k.area(), k.pos(px + pw / 2 - 120, btnY),
    k.color(...C.purpleFace), k.outline(2, k.rgb(...C.panelBorder)));
  addFx(k, 114, "skinPanel",
    k.text("Apply Skin", { size: 22, font: "monospace" }),
    k.pos(px + pw / 2, btnY + 22), k.anchor("center"), k.color(...C.white));

  applyBtn.onHoverUpdate(() => { document.body.style.cursor = "pointer"; });
  applyBtn.onHoverEnd(() => { document.body.style.cursor = "default"; });
  applyBtn.onClick(() => {
    gameConfig.player.skinIndex = tempSkin;
    k.get("player").forEach(p => {
      p.use(k.sprite(`skin_${tempSkin}`, { anim: "idle-down" }));
    });
    // Visual pop to confirm
    spritePreview.scale = k.vec2(7);
    k.wait(0.1, () => { spritePreview.scale = k.vec2(6); });
  });
}

// ── Creative Mode panel (full overlay) ──
// All slider definitions
const ALL_SLIDERS = [
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
const PER_PAGE = 6;
let creativePage = 0;
let creativeClickHandlers = [];

function showCreativePanel(k) {
  subPanelOpen = true;
  creativePage = 0;
  creativeClickHandlers = [];

  const pw = Math.floor(k.width() * 0.55), ph = Math.floor(k.height() * 0.9);
  const px = (k.width() - pw) / 2, py = (k.height() - ph) / 2;

  // Dark overlay to cover settings behind
  addFx(k, 115, "settingsMenu", "subPanel",
    k.rect(k.width() * 3, k.height() * 3), k.pos(-k.width(), -k.height()),
    k.color(0, 0, 0), k.opacity(0.7));

  // Glow
  addFx(k, 116, "settingsMenu", "subPanel",
    k.rect(pw + 20, ph + 20, { radius: 18 }), k.pos(px - 10, py - 10),
    k.color(...C.purpleFace), k.opacity(0.18));

  // Panel
  addFx(k, 117, "settingsMenu", "subPanel",
    k.rect(pw + 4, ph + 6, { radius: 16 }), k.pos(px, py + 4),
    k.color(...C.shadow), k.opacity(0.45));
  addFx(k, 118, "settingsMenu", "subPanel",
    k.rect(pw, ph, { radius: 14 }), k.pos(px, py),
    k.color(...C.panelBg), k.outline(4, k.rgb(...C.panelBorder)));
  addFx(k, 118, "settingsMenu", "subPanel",
    k.rect(pw - 24, ph - 24, { radius: 10 }), k.pos(px + 12, py + 12),
    k.color(...C.panelInner), k.outline(2, k.rgb(...C.separator)));

  // Title
  addFx(k, 119, "settingsMenu", "subPanel",
    k.text("🎨 CREATIVE MODE", { size: 32, font: "monospace" }),
    k.pos(px + pw / 2, py + 44), k.anchor("center"), k.color(...C.title));
  addFx(k, 119, "settingsMenu", "subPanel",
    k.text("Adjust game stats live", { size: 16, font: "monospace" }),
    k.pos(px + pw / 2, py + 72), k.anchor("center"), k.color(...C.title), k.opacity(0.55));
  addFx(k, 119, "settingsMenu", "subPanel",
    k.rect(pw - 80, 2), k.pos(px + 40, py + 90),
    k.color(...C.panelBorder), k.opacity(0.5));

  // Build first page of sliders
  buildSliderPage(k, px, py, pw, ph);

  // ── Page nav ──
  const totalPages = Math.ceil(ALL_SLIDERS.length / PER_PAGE);
  const navY = py + ph - 120;

  // ◀ button
  addFx(k, 119, "settingsMenu", "subPanel",
    k.rect(48, 38, { radius: 8 }), k.pos(px + pw / 2 - 100 + 2, navY + 3), k.color(...C.blueShad));
  const prevBtn = addFx(k, 120, "settingsMenu", "subPanel",
    k.rect(48, 38, { radius: 8 }), k.area(), k.pos(px + pw / 2 - 100, navY),
    k.color(...C.blueFace), k.outline(2, k.rgb(...C.panelBorder)));
  addFx(k, 121, "settingsMenu", "subPanel",
    k.text("◀", { size: 22 }), k.pos(px + pw / 2 - 76, navY + 19),
    k.anchor("center"), k.color(...C.white));

  // Page label
  const pageLabel = addFx(k, 121, "settingsMenu", "subPanel",
    k.text(`Page ${creativePage + 1} / ${totalPages}`, { size: 20, font: "monospace" }),
    k.pos(px + pw / 2, navY + 19), k.anchor("center"), k.color(...C.dark));

  // ▶ button
  addFx(k, 119, "settingsMenu", "subPanel",
    k.rect(48, 38, { radius: 8 }), k.pos(px + pw / 2 + 56, navY + 3), k.color(...C.blueShad));
  const nextBtn = addFx(k, 120, "settingsMenu", "subPanel",
    k.rect(48, 38, { radius: 8 }), k.area(), k.pos(px + pw / 2 + 54, navY),
    k.color(...C.blueFace), k.outline(2, k.rgb(...C.panelBorder)));
  addFx(k, 121, "settingsMenu", "subPanel",
    k.text("▶", { size: 22 }), k.pos(px + pw / 2 + 78, navY + 19),
    k.anchor("center"), k.color(...C.white));

  prevBtn.onHoverUpdate(() => { document.body.style.cursor = "pointer"; });
  prevBtn.onHoverEnd(() => { document.body.style.cursor = "default"; });
  nextBtn.onHoverUpdate(() => { document.body.style.cursor = "pointer"; });
  nextBtn.onHoverEnd(() => { document.body.style.cursor = "default"; });

  prevBtn.onClick(() => {
    if (creativePage > 0) {
      creativePage--;
      k.get("creativeSliders").forEach(e => k.destroy(e));
      creativeClickHandlers.forEach(h => h.cancel());
      creativeClickHandlers = [];
      buildSliderPage(k, px, py, pw, ph);
      pageLabel.text = `Page ${creativePage + 1} / ${totalPages}`;
    }
  });
  nextBtn.onClick(() => {
    if (creativePage < totalPages - 1) {
      creativePage++;
      k.get("creativeSliders").forEach(e => k.destroy(e));
      creativeClickHandlers.forEach(h => h.cancel());
      creativeClickHandlers = [];
      buildSliderPage(k, px, py, pw, ph);
      pageLabel.text = `Page ${creativePage + 1} / ${totalPages}`;
    }
  });

  // Mouse wheel scrolling
  const scrollHandler = k.onScroll((delta) => {
    if (!subPanelOpen) return;
    const dir = delta.y > 0 ? 1 : -1;
    const newPage = creativePage + dir;
    if (newPage >= 0 && newPage < totalPages) {
      creativePage = newPage;
      k.get("creativeSliders").forEach(e => k.destroy(e));
      creativeClickHandlers.forEach(h => h.cancel());
      creativeClickHandlers = [];
      buildSliderPage(k, px, py, pw, ph);
      pageLabel.text = `Page ${creativePage + 1} / ${totalPages}`;
    }
  });
  // Cleanup scroll handler when panel closes
  const firstSub = k.get("subPanel")[0];
  if (firstSub) firstSub.onDestroy(() => scrollHandler.cancel());

  // ── Bottom row: Reset + Back ──
  const btnY = py + ph - 68;
  addFx(k, 119, "settingsMenu", "subPanel",
    k.rect(180, 38, { radius: 8 }), k.pos(px + pw / 2 - 200 + 2, btnY + 3), k.color(...C.redShad));
  const resetBtn = addFx(k, 120, "settingsMenu", "subPanel",
    k.rect(180, 38, { radius: 8 }), k.area(), k.pos(px + pw / 2 - 200, btnY),
    k.color(...C.redFace), k.outline(2, k.rgb(...C.panelBorder)));
  addFx(k, 121, "settingsMenu", "subPanel",
    k.text("Reset Defaults", { size: 18, font: "monospace" }),
    k.pos(px + pw / 2 - 110, btnY + 19), k.anchor("center"), k.color(...C.white));
  resetBtn.onHoverUpdate(() => { document.body.style.cursor = "pointer"; });
  resetBtn.onHoverEnd(() => { document.body.style.cursor = "default"; });
  resetBtn.onClick(() => {
    Object.assign(gameConfig.player, { speed: 250, health: 100, damage: 10, critRate: 0.2, critDamage: 1.5 });
    Object.assign(gameConfig.boss, { health: 100, damage: 20, speed: 100 });
    Object.assign(gameConfig.pet, { health: 500, speed: 200, damage: 20, critRate: 0.05, critDamage: 1.1 });
    Object.assign(gameConfig.skills, { swiftSlashDmg: 10, swiftSlashCD: 0.5, titanCleaveDmg: 30, titanCleaveCD: 2.0, bladeStormDmg: 15, bladeStormCD: 3.0, theWorldCD: 5.0 });
    k.get("creativeSliders").forEach(e => k.destroy(e));
    creativeClickHandlers.forEach(h => h.cancel());
    creativeClickHandlers = [];
    buildSliderPage(k, px, py, pw, ph);
  });

  buildBackButton(k, px + pw / 2 + 20, btnY);
}

// ── Build one page of sliders ──
function buildSliderPage(k, px, py, pw, ph) {
  const start = creativePage * PER_PAGE;
  const pageSliders = ALL_SLIDERS.slice(start, start + PER_PAGE);

  const slW = pw - 60, slH = 10, knobR = 12;
  const slX = px + 30, slStartY = py + 106;
  const rowH = 56;

  pageSliders.forEach(([label, path, min, max, step, fmt], i) => {
    const y = slStartY + i * rowH;
    const [section, key] = path.split(".");
    const curVal = gameConfig[section][key];

    // Label
    addFx(k, 119, "settingsMenu", "subPanel", "creativeSliders",
      k.text(label, { size: 20, font: "monospace" }),
      k.pos(slX, y), k.anchor("left"), k.color(...C.dark));

    // Value (right-aligned)
    const valText = addFx(k, 121, "settingsMenu", "subPanel", "creativeSliders",
      k.text(fmt(curVal), { size: 20, font: "monospace" }),
      k.pos(slX + slW, y), k.anchor("right"), k.color(...C.purpleFace));

    // Track
    const trackX = slX;
    const trackW = slW;
    const trackY = y + 28;
    addFx(k, 119, "settingsMenu", "subPanel", "creativeSliders",
      k.rect(trackW, slH, { radius: 5 }), k.pos(trackX, trackY),
      k.color(...C.sliderTrack));

    // Fill
    const fillRatio = (curVal - min) / (max - min);
    const fill = addFx(k, 120, "settingsMenu", "subPanel", "creativeSliders",
      k.rect(Math.max(0, trackW * fillRatio), slH, { radius: 5 }),
      k.pos(trackX, trackY), k.color(...C.sliderFill));

    // Knob
    const knob = addFx(k, 121, "settingsMenu", "subPanel", "creativeSliders",
      k.circle(knobR), k.area(),
      k.pos(trackX + trackW * fillRatio, trackY + slH / 2),
      k.anchor("center"), k.color(...C.white),
      k.outline(2, k.rgb(...C.panelBorder)));

    let dragging = false;

    knob.onHoverUpdate(() => { document.body.style.cursor = "ew-resize"; });
    knob.onHoverEnd(() => { if (!dragging) document.body.style.cursor = "default"; });

    const clickH = k.onMousePress("left", () => {
      if (knob.isHovering()) dragging = true;
    });
    creativeClickHandlers.push(clickH);

    // Track click zone
    const trackHit = addFx(k, 120, "settingsMenu", "subPanel", "creativeSliders",
      k.rect(trackW, 30, { radius: 5 }), k.area(),
      k.pos(trackX, trackY - 10), k.color(0, 0, 0), k.opacity(0));
    trackHit.onHoverUpdate(() => { document.body.style.cursor = "pointer"; });
    trackHit.onHoverEnd(() => { document.body.style.cursor = "default"; });

    // Shared update logic
    function applySlider(mx) {
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
    }

    trackHit.onClick(() => applySlider(k.mousePos().x));

    knob.onUpdate(() => {
      if (!dragging) return;
      if (!k.isMouseDown("left")) { dragging = false; document.body.style.cursor = "default"; return; }
      applySlider(k.mousePos().x);
    });
  });
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
  addFx(k, 119, "settingsMenu", "subPanel",
    k.rect(180, 38, { radius: 8 }), k.pos(bx + 2, by + 3), k.color(...C.greenShad));
  const btn = addFx(k, 120, "settingsMenu", "subPanel",
    k.rect(180, 38, { radius: 8 }), k.area(), k.pos(bx, by),
    k.color(...C.greenFace), k.outline(2, k.rgb(...C.panelBorder)));
  addFx(k, 121, "settingsMenu", "subPanel",
    k.text("← Back", { size: 18, font: "monospace" }),
    k.pos(bx + 90, by + 19), k.anchor("center"), k.color(...C.white));
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
