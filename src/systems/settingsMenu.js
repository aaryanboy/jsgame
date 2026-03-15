// Settings Menu — with Creative Mode sliders and skin selection
import { gameState, setGamePause } from "../utils/utils.js";
import { petState } from "./persistentPet.js";
import { gameConfig } from "../utils/constants.js";
import { getLayout } from "../ui/settingsLayout.js";
import { showTouchControls, hideTouchControls } from "../ui/touchControls.js";
import { showGlobalHUD, hideGlobalHUD } from "../ui/globalHUD.js";
import { THEME } from "../utils/theme.js";
import { Z } from "../utils/constants.js";

const C = {
  panelBg:     THEME.palette.bg,
  panelInner:  THEME.palette.bgInner,
  panelBorder: THEME.palette.border,
  shadow:      THEME.palette.shadow,
  separator:   THEME.palette.separator,
  title:       THEME.brand.primary,
  greenFace:   THEME.status.success,
  greenShad:   THEME.status.successDk,
  redFace:     THEME.status.error,
  redShad:     THEME.status.errorDk,
  blueFace:    THEME.status.info,
  blueShad:    THEME.status.infoDk,
  purpleFace:  THEME.brand.primary,
  purpleShad:  THEME.brand.secondary,
  itemBg:      THEME.palette.bgInner,
  itemShad:    THEME.palette.shadow,
  toggleOn:    THEME.status.success,
  toggleOff:   THEME.status.error,
  white:       THEME.palette.white,
  dark:        THEME.palette.muted,
  gold:        THEME.status.warning,
  sliderFill:  THEME.brand.primary,
  sliderTrack: THEME.palette.separator,
};

// ── Module state ──
let selectedIndex = 0;
let handlers = [];
let menuItems = [];
let toggleRefs = {};
let subPanelOpen = false;

// ── Public API ──
export function toggleSettingsMenu(k) {
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
  showTouchControls(k); // Restore touch controls if applicable
  showGlobalHUD(k);     // Restore HUD
  document.body.style.cursor = "default";
}

function closeSubPanel(k) {
  subPanelOpen = false;
  creativeClickHandlers.forEach(h => h.cancel());
  creativeClickHandlers = [];
  k.get("subPanel").forEach(e => k.destroy(e));
  document.body.style.cursor = "default";
}

// ── Main panel (LEFT side) ──
function openMenu(k) {
  setGamePause(k, true);
  hideTouchControls(k); // Hide touch controls while menu is active
  hideGlobalHUD(k);     // Hide HUD while menu is active
  selectedIndex = 0;
  subPanelOpen = false;

  const L = getLayout(k.width(), k.height());
  const S = L.settings;
  const F = L.fontSize;
  const R = L.radius;

  // Overlay
  addFx(k, Z.overlay, "settingsMenu",
    k.rect(k.width() * 3, k.height() * 3), k.pos(-k.width(), -k.height()),
    k.color(0, 0, 0), k.opacity(0.65));

  // Panel shadow + body
  addFx(k, Z.menu - 1, "settingsMenu",
    k.rect(S.w + 4, S.h + 6, { radius: R.panel + 2 }), k.pos(S.x, S.y + 4),
    k.color(...C.shadow), k.opacity(0.4));
  addFx(k, Z.menu, "settingsMenu",
    k.rect(S.w, S.h, { radius: R.panel }), k.pos(S.x, S.y),
    k.color(...C.panelBg), k.outline(1, k.rgb(...C.panelBorder)));
  addFx(k, Z.menu, "settingsMenu",
    k.rect(S.w - 24, S.h - 24, { radius: R.inner }), k.pos(S.x + 12, S.y + 12),
    k.color(...C.panelInner), k.outline(1, k.rgb(...C.separator)));

  // Title
  addFx(k, 101, "settingsMenu",
    k.text("STATS MENU", { size: F.title, font: "monospace" }),
    k.pos(S.x + S.w / 2, S.titleY), k.anchor("center"), k.color(...C.title));

  // Decorative dots
  for (let d = -2; d <= 2; d++) {
    addFx(k, 101, "settingsMenu",
      k.circle(L.dot.radius), k.pos(S.x + S.w / 2 + d * L.dot.spacing, S.dotsY), k.anchor("center"),
      k.color(...(d === 0 ? C.redFace : C.panelBorder)), k.opacity(d === 0 ? 1 : 0.5));
  }

  addFx(k, 101, "settingsMenu",
    k.rect(S.w - 80, 2, { radius: 1 }), k.pos(S.x + 40, S.lineY),
    k.color(...C.panelBorder), k.opacity(0.5));

  // ── Menu items ──
  const musicIsOn = gameState.bgm ? gameState.bgm.volume > 0 : true;
  menuItems = [
    { type: "btn", label: `Music: ${musicIsOn ? "ON" : "OFF"}`, color: musicIsOn ? "green" : "red", action: "music" },
    { type: "dualtoggle", action: "controlmode" },
    { type: "btn", label: "Creative Mode 🎨", color: "purple", action: "creative" },
  ];

  toggleRefs = {};

  menuItems.forEach((item, i) => {
    const y = S.itemStartY + i * (S.itemH + S.itemGap);

    if (item.type === "dualtoggle") {
      // ── Dual Toggle Switch UI (Cooler Input Selector) ──
      // Dark track with inner shadow effect
      addFx(k, 101, "settingsMenu",
        k.rect(S.itemW, S.itemH, { radius: R.item }), k.pos(S.itemX + 2, y + 4), k.color(...C.shadow), k.opacity(0.3));
      
      const face = addFx(k, 102, "settingsMenu", "menuFace_" + i,
        k.rect(S.itemW, S.itemH, { radius: R.item }), k.area(), k.pos(S.itemX, y),
        k.color(35, 30, 25), k.outline(1, k.rgb(...C.panelBorder)));

      const isTouch = gameConfig.ui.controlMode === "touch";
      const pillW = S.itemW / 2;
      const pillX = S.itemX + (isTouch ? pillW : 0);
      const pillColor = isTouch ? C.purpleFace : C.blueFace;

      // Active selected segment (The Pill)
      addFx(k, 103, "settingsMenu", "controlPill",
        k.rect(pillW, S.itemH, { radius: R.item }),
        k.pos(pillX, y),
        k.color(...pillColor),
        k.outline(1, k.rgb(...C.panelBorder))
      );

      // Segment Texts
      addFx(k, 104, "settingsMenu",
        k.text("⌨ PC", { size: F.button - 4, font: "monospace", weight: "bold" }),
        k.pos(S.itemX + pillW / 2, y + S.itemH / 2), k.anchor("center"), k.color(...(isTouch ? [120, 110, 100] : C.white))
      );
      addFx(k, 104, "settingsMenu",
        k.text("🖐 Touch", { size: F.button - 4, font: "monospace", weight: "bold" }),
        k.pos(S.itemX + pillW + pillW / 2, y + S.itemH / 2), k.anchor("center"), k.color(...(isTouch ? C.white : [120, 110, 100]))
      );

      face.onClick(() => { if (!subPanelOpen) { selectedIndex = i; activate(k, true); } });

    } else {
      // ── Standard Button UI ──
      const { face: fc, shad: sc } = btnColors(item);

      addFx(k, 101, "settingsMenu",
        k.rect(S.itemW, S.itemH, { radius: R.item }), k.pos(S.itemX + 2, y + 4), k.color(...sc));

      const face = addFx(k, 102, "settingsMenu", "menuFace_" + i,
        k.rect(S.itemW, S.itemH, { radius: R.item }), k.area(), k.pos(S.itemX, y),
        k.color(...fc), k.outline(1, k.rgb(...C.panelBorder)));

      const labelText = addFx(k, 103, "settingsMenu", `menuLabel_${i}`,
        k.text(item.label, { size: F.button, font: "monospace" }),
        k.pos(S.itemX + S.itemW / 2, y + S.itemH / 2), k.anchor("center"), k.color(...C.white));

      face.onClick(() => { if (!subPanelOpen) { selectedIndex = i; activate(k, true); } });
    }
  });

  // ── Split bottom buttons (Resume / Restart) ──
  const splitBtns = [
    { label: "Resume Game", color: "green", action: "resume", x: S.splitBtnX1, i: menuItems.length },
    { label: "Restart Game", color: "red", action: "restart", x: S.splitBtnX2, i: menuItems.length + 1 }
  ];

  splitBtns.forEach((item) => {
    menuItems.push(item);
    const { face: fc, shad: sc } = btnColors(item);

    addFx(k, 101, "settingsMenu",
      k.rect(S.splitBtnW, S.itemH, { radius: R.item }), k.pos(item.x + 2, S.splitBtnY + 4), k.color(...sc));

    const face = addFx(k, 102, "settingsMenu", `menuFace_${item.i}`,
      k.rect(S.splitBtnW, S.itemH, { radius: R.item }), k.area(), k.pos(item.x, S.splitBtnY),
      k.color(...fc), k.outline(1, k.rgb(...C.panelBorder)));

    addFx(k, 103, "settingsMenu", `menuLabel_${item.i}`,
      k.text(item.label, { size: F.button, font: "monospace" }),
      k.pos(item.x + S.splitBtnW / 2, S.splitBtnY + S.itemH / 2), k.anchor("center"), k.color(...C.white));

    face.onClick(() => { if (!subPanelOpen) { selectedIndex = item.i; activate(k, true); } });
  });


  // Footer
  addFx(k, 101, "settingsMenu",
    k.text("Navigate · Click / Enter · Tab Close", { size: F.small, font: "monospace" }),
    k.pos(S.x + S.w / 2, S.footerY), k.anchor("center"),
    k.color(...C.title), k.opacity(0.55));

  // Key handlers
  const nav = dir => () => { if (!subPanelOpen) selectedIndex = (selectedIndex + dir + menuItems.length) % menuItems.length; };
  handlers.push(k.onKeyPress("up", nav(-1)));
  handlers.push(k.onKeyPress("w", nav(-1)));
  handlers.push(k.onKeyPress("down", nav(1)));
  handlers.push(k.onKeyPress("s", nav(1)));
  handlers.push(k.onKeyPress("enter", () => activate(k, false)));
  handlers.push(k.onKeyPress("escape", () => { if (subPanelOpen) closeSubPanel(k); else closeMenu(k); }));

  // Always show skin panel on the right
  showSkinPanel(k, L);
}

// ── Activate ──
function activate(k, isClick = false) {
  if (subPanelOpen) { closeSubPanel(k); return; }
  const item = menuItems[selectedIndex];
  if (!item) return;

  switch (item.action) {
    case "music":
      if (gameState.bgm) {
        const isOn = gameState.bgm.volume > 0;
        gameState.bgm.volume = isOn ? 0 : 0.5;
        const newIsOn = !isOn;
        // Update label text and face color
        k.get(`menuLabel_${selectedIndex}`).forEach(l => l.text = `Music: ${newIsOn ? "ON" : "OFF"}`);
        k.get(`menuFace_${selectedIndex}`).forEach(f => {
          f.color = newIsOn ? k.rgb(...C.greenFace) : k.rgb(...C.redFace);
        });
      }
      break;
    case "controlmode": {
      const wasTouch = gameConfig.ui.controlMode === "touch";
      let nowTouch;

      if (isClick && k.mousePos) {
        // Differentiate by click position (Segmented Control behavior)
        const mPos = k.mousePos();
        const L = getLayout(k.width(), k.height());
        const S = L.settings;
        nowTouch = mPos.x > (S.itemX + S.itemW / 2);
        if (wasTouch === nowTouch) break; 
      } else {
        // Keyboard behavior (Simple Flip)
        nowTouch = !wasTouch;
      }

      gameConfig.ui.controlMode = nowTouch ? "touch" : "keyboard";
      
      if (nowTouch) showTouchControls(k); else hideTouchControls(k);

      closeMenu(k);
      openMenu(k);
      selectedIndex = 1; 
      break;
    }
    case "resume": closeMenu(k); break;
    case "creative": showCreativePanel(k); break;
    case "restart":
      if (gameState.bgm) { gameState.bgm.stop(); gameState.bgm = null; }
      closeMenu(k);
      gameState.isPaused = false;
      gameState.isTimeStopped = false;
      gameState.timeScale = 1.0;
      gameState.playerHealth = null;
      gameState.slimesByRoom = {};
      petState.isDead = false;
      petState.shouldPersist = false;
      petState.currentPet = null;
      petState.currentHealth = 50;
      k.go("intro");
      break;
  }
}


// ── Skin Selection Panel (always visible on the RIGHT) ──
function showSkinPanel(k, L) {
  const SK = L.skin;
  const F = L.fontSize;
  const R = L.radius;

  // Glow
  addFx(k, 108, "skinPanel",
    k.rect(SK.w + 20, SK.h + 20, { radius: R.panel + 4 }), k.pos(SK.x - 10, SK.y - 10),
    k.color(...C.purpleFace), k.opacity(0.18));

  addFx(k, 109, "skinPanel",
    k.rect(SK.w + 4, SK.h + 6, { radius: R.panel + 2 }), k.pos(SK.x, SK.y + 4),
    k.color(...C.shadow), k.opacity(0.4));
  addFx(k, 110, "skinPanel",
    k.rect(SK.w, SK.h, { radius: R.panel }), k.pos(SK.x, SK.y),
    k.color(...C.panelBg), k.outline(1, k.rgb(...C.panelBorder)));
  addFx(k, 110, "skinPanel",
    k.rect(SK.w - 24, SK.h - 24, { radius: R.inner }), k.pos(SK.x + 12, SK.y + 12),
    k.color(...C.panelInner), k.outline(1, k.rgb(...C.separator)));

  addFx(k, 111, "skinPanel",
    k.text("SELECT SKIN", { size: F.title, font: "monospace" }),
    k.pos(SK.x + SK.w / 2, SK.titleY), k.anchor("center"), k.color(...C.title));

  const SUBTITLES = [
    "Purple Knight", "Green Knight", "Gold Knight", "Red Knight",
    "Purple Mage", "Green Mage", "Gold Mage", "Red Mage"
  ];

  let tempSkin = gameConfig.player.skinIndex;

  const subLabel = addFx(k, 111, "skinPanel",
    k.text(SUBTITLES[tempSkin], { size: F.subtitle, font: "monospace" }),
    k.pos(SK.x + SK.w / 2, SK.subtitleY), k.anchor("center"), k.color(...C.title), k.opacity(0.7));

  addFx(k, 111, "skinPanel",
    k.rect(SK.w - 100, 2), k.pos(SK.x + 50, SK.lineY),
    k.color(...C.panelBorder), k.opacity(0.5));

  // Skin Preview
  const previewBox = addFx(k, 111, "skinPanel",
    k.rect(SK.previewSize, SK.previewSize, { radius: R.item }), k.pos(SK.x + SK.w / 2, SK.previewCenterY), k.anchor("center"),
    k.color(...C.itemBg), k.outline(1, k.rgb(...C.panelBorder)));

  const spritePreview = addFx(k, 112, "skinPanel", "previewSprite",
    k.sprite(`skin_${tempSkin}`, { anim: "walk-down" }),
    k.pos(SK.x + SK.w / 2, SK.previewCenterY), k.anchor("center"), k.scale(SK.previewScale));

  // Left Arrow
  addFx(k, 112, "skinPanel",
    k.rect(SK.arrowSize, SK.arrowSize, { radius: R.item }), k.pos(SK.x + SK.arrowMargin + 2, SK.arrowY + 4), k.color(...C.blueShad));
  const lBtn = addFx(k, 113, "skinPanel",
    k.rect(SK.arrowSize, SK.arrowSize, { radius: R.item }), k.area(), k.pos(SK.x + SK.arrowMargin, SK.arrowY),
    k.color(...C.blueFace), k.outline(1, k.rgb(...C.panelBorder)));
  addFx(k, 114, "skinPanel",
    k.text("◀", { size: F.arrow }), k.pos(SK.x + SK.arrowMargin + SK.arrowSize / 2, SK.arrowY + SK.arrowSize / 2), k.anchor("center"), k.color(...C.white));

  // Right Arrow
  const rBtnX = SK.x + SK.w - SK.arrowMargin - SK.arrowSize;
  addFx(k, 112, "skinPanel",
    k.rect(SK.arrowSize, SK.arrowSize, { radius: R.item }), k.pos(rBtnX + 2, SK.arrowY + 4), k.color(...C.blueShad));
  const rBtn = addFx(k, 113, "skinPanel",
    k.rect(SK.arrowSize, SK.arrowSize, { radius: R.item }), k.area(), k.pos(rBtnX, SK.arrowY),
    k.color(...C.blueFace), k.outline(1, k.rgb(...C.panelBorder)));
  addFx(k, 114, "skinPanel",
    k.text("▶", { size: F.arrow }), k.pos(rBtnX + SK.arrowSize / 2, SK.arrowY + SK.arrowSize / 2), k.anchor("center"), k.color(...C.white));

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

  // Apply Button
  const applyX = SK.x + SK.w / 2 - SK.applyBtnW / 2;
  addFx(k, 112, "skinPanel",
    k.rect(SK.applyBtnW, SK.applyBtnH, { radius: R.btn }), k.pos(applyX + 2, SK.applyBtnY + 4), k.color(...C.purpleShad));
  const applyBtn = addFx(k, 113, "skinPanel",
    k.rect(SK.applyBtnW, SK.applyBtnH, { radius: R.btn }), k.area(), k.pos(applyX, SK.applyBtnY),
    k.color(...C.purpleFace), k.outline(1, k.rgb(...C.panelBorder)));
  addFx(k, 114, "skinPanel",
    k.text("Apply Skin", { size: F.button, font: "monospace" }),
    k.pos(SK.x + SK.w / 2, SK.applyBtnY + SK.applyBtnH / 2), k.anchor("center"), k.color(...C.white));

  applyBtn.onHoverUpdate(() => { document.body.style.cursor = "pointer"; });
  applyBtn.onHoverEnd(() => { document.body.style.cursor = "default"; });
  applyBtn.onClick(() => {
    gameConfig.player.skinIndex = tempSkin;
    k.get("player").forEach(p => {
      p.use(k.sprite(`skin_${tempSkin}`, { anim: "idle-down" }));
    });
    spritePreview.scale = k.vec2(SK.previewScale + 1);
    k.wait(0.1, () => { spritePreview.scale = k.vec2(SK.previewScale); });
  });
}

// ── Creative Mode panel (full overlay) ──
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
  ["Slime HP", "slime.health", 10, 500, 10, v => `${v}`],
  ["Slime Damage", "slime.damage", 1, 100, 1, v => `${v}`],
  ["Slime Speed", "slime.speed", 20, 400, 10, v => `${v}`],
  ["Slime Detect", "slime.detectRange", 50, 800, 10, v => `${v}`],
  ["Slime Atk CD", "slime.attackCooldown", 0.1, 5, 0.1, v => `${v.toFixed(1)}s`],
  ["Slime Spawn Rate", "slime.spawnRate", 0, 1, 0.05, v => `${Math.round(v * 100)}%`],
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

  const L = getLayout(k.width(), k.height());
  const P = L.sub;
  const F = L.fontSize;
  const R = L.radius;

  // Dark overlay to cover settings behind
  addFx(k, 115, "settingsMenu", "subPanel",
    k.rect(k.width() * 3, k.height() * 3), k.pos(-k.width(), -k.height()),
    k.color(0, 0, 0), k.opacity(0.7));

  // Glow
  addFx(k, 116, "settingsMenu", "subPanel",
    k.rect(P.w + 20, P.h + 20, { radius: R.panel + 4 }), k.pos(P.x - 10, P.y - 10),
    k.color(...C.purpleFace), k.opacity(0.18));

  // Panel
  addFx(k, 117, "settingsMenu", "subPanel",
    k.rect(P.w + 4, P.h + 6, { radius: R.panel + 2 }), k.pos(P.x, P.y + 4),
    k.color(...C.shadow), k.opacity(0.45));
  addFx(k, 118, "settingsMenu", "subPanel",
    k.rect(P.w, P.h, { radius: R.panel }), k.pos(P.x, P.y),
    k.color(...C.panelBg), k.outline(1, k.rgb(...C.panelBorder)));
  addFx(k, 118, "settingsMenu", "subPanel",
    k.rect(P.w - 24, P.h - 24, { radius: R.inner }), k.pos(P.x + 12, P.y + 12),
    k.color(...C.panelInner), k.outline(1, k.rgb(...C.separator)));

  // Title
  addFx(k, 119, "settingsMenu", "subPanel",
    k.text("🎨 CREATIVE MODE", { size: F.title, font: "monospace" }),
    k.pos(P.x + P.w / 2, P.titleY), k.anchor("center"), k.color(...C.title));
  addFx(k, 119, "settingsMenu", "subPanel",
    k.text("Adjust game stats live", { size: F.small, font: "monospace" }),
    k.pos(P.x + P.w / 2, P.titleY + F.title + 8), k.anchor("center"), k.color(...C.title), k.opacity(0.55));
  addFx(k, 119, "settingsMenu", "subPanel",
    k.rect(P.w - 80, 2), k.pos(P.x + 40, P.lineY),
    k.color(...C.panelBorder), k.opacity(0.5));

  // Build first page of sliders
  buildSliderPage(k, L);

  // ── Page nav ──
  const totalPages = Math.ceil(ALL_SLIDERS.length / PER_PAGE);

  // ◀ button
  addFx(k, 119, "settingsMenu", "subPanel",
    k.rect(48, 38, { radius: R.btn }), k.pos(P.x + P.w / 2 - 100 + 2, P.navY + 3), k.color(...C.blueShad));
  const prevBtn = addFx(k, 120, "settingsMenu", "subPanel",
    k.rect(48, 38, { radius: R.btn }), k.area(), k.pos(P.x + P.w / 2 - 100, P.navY),
    k.color(...C.blueFace), k.outline(1, k.rgb(...C.panelBorder)));
  addFx(k, 121, "settingsMenu", "subPanel",
    k.text("◀", { size: F.arrow }), k.pos(P.x + P.w / 2 - 76, P.navY + 19),
    k.anchor("center"), k.color(...C.white));

  // Page label
  const pageLabel = addFx(k, 121, "settingsMenu", "subPanel",
    k.text(`Page ${creativePage + 1} / ${totalPages}`, { size: F.subtitle, font: "monospace" }),
    k.pos(P.x + P.w / 2, P.navY + 22), k.anchor("center"), k.color(...C.dark));

  // ▶ button
  addFx(k, 119, "settingsMenu", "subPanel",
    k.rect(48, 38, { radius: R.btn }), k.pos(P.x + P.w / 2 + 56, P.navY + 3), k.color(...C.blueShad));
  const nextBtn = addFx(k, 120, "settingsMenu", "subPanel",
    k.rect(48, 38, { radius: R.btn }), k.area(), k.pos(P.x + P.w / 2 + 54, P.navY),
    k.color(...C.blueFace), k.outline(1, k.rgb(...C.panelBorder)));
  addFx(k, 121, "settingsMenu", "subPanel",
    k.text("▶", { size: F.arrow }), k.pos(P.x + P.w / 2 + 78, P.navY + 19),
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
      buildSliderPage(k, L);
      pageLabel.text = `Page ${creativePage + 1} / ${totalPages}`;
    }
  });
  nextBtn.onClick(() => {
    if (creativePage < totalPages - 1) {
      creativePage++;
      k.get("creativeSliders").forEach(e => k.destroy(e));
      creativeClickHandlers.forEach(h => h.cancel());
      creativeClickHandlers = [];
      buildSliderPage(k, L);
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
      buildSliderPage(k, L);
      pageLabel.text = `Page ${creativePage + 1} / ${totalPages}`;
    }
  });
  const firstSub = k.get("subPanel")[0];
  if (firstSub) firstSub.onDestroy(() => scrollHandler.cancel());

  // ── Bottom row: Reset + Back ──
  addFx(k, 119, "settingsMenu", "subPanel",
    k.rect(P.actionBtnW, P.actionBtnH, { radius: R.btn }), k.pos(P.x + P.w / 2 - P.actionBtnW - 10 + 2, P.actionBtnY + 3), k.color(...C.redShad));
  const resetBtn = addFx(k, 120, "settingsMenu", "subPanel",
    k.rect(P.actionBtnW, P.actionBtnH, { radius: R.btn }), k.area(), k.pos(P.x + P.w / 2 - P.actionBtnW - 10, P.actionBtnY),
    k.color(...C.redFace), k.outline(1, k.rgb(...C.panelBorder)));
  addFx(k, 121, "settingsMenu", "subPanel",
    k.text("Reset Defaults", { size: F.label, font: "monospace" }),
    k.pos(P.x + P.w / 2 - P.actionBtnW / 2 - 10, P.actionBtnY + P.actionBtnH / 2), k.anchor("center"), k.color(...C.white));
  resetBtn.onHoverUpdate(() => { document.body.style.cursor = "pointer"; });
  resetBtn.onHoverEnd(() => { document.body.style.cursor = "default"; });
  resetBtn.onClick(() => {
    Object.assign(gameConfig.player, { speed: 250, health: 100, damage: 10, critRate: 0.2, critDamage: 1.5 });
    Object.assign(gameConfig.boss, { health: 100, damage: 20, speed: 100 });
    Object.assign(gameConfig.pet, { health: 500, speed: 200, damage: 20, critRate: 0.05, critDamage: 1.1 });
    Object.assign(gameConfig.slime, { health: 40, damage: 8, speed: 180, detectRange: 250, attackRange: 40, attackCooldown: 1.5, spawnRate: 0.5 });
    Object.assign(gameConfig.skills, { swiftSlashDmg: 10, swiftSlashCD: 0.5, titanCleaveDmg: 30, titanCleaveCD: 2.0, bladeStormDmg: 15, bladeStormCD: 3.0, theWorldCD: 5.0 });
    k.get("creativeSliders").forEach(e => k.destroy(e));
    creativeClickHandlers.forEach(h => h.cancel());
    creativeClickHandlers = [];
    buildSliderPage(k, L);
  });

  buildBackButton(k, P.x + P.w / 2 + 10, P.actionBtnY, L);
}

// ── Build one page of sliders ──
function buildSliderPage(k, L) {
  const P = L.sub;
  const F = L.fontSize;
  const R = L.radius;

  const start = creativePage * PER_PAGE;
  const pageSliders = ALL_SLIDERS.slice(start, start + PER_PAGE);

  const slW = P.w - 60;
  const slX = P.x + 30;

  pageSliders.forEach(([label, path, min, max, step, fmt], i) => {
    const y = P.sliderStartY + i * P.sliderRowH;
    const [section, key] = path.split(".");
    const curVal = gameConfig[section][key];

    // Label
    addFx(k, 119, "settingsMenu", "subPanel", "creativeSliders",
      k.text(label, { size: F.label, font: "monospace" }),
      k.pos(slX, y), k.anchor("left"), k.color(...C.dark));

    // Value (right-aligned)
    const valText = addFx(k, 121, "settingsMenu", "subPanel", "creativeSliders",
      k.text(fmt(curVal), { size: F.label, font: "monospace" }),
      k.pos(slX + slW, y), k.anchor("right"), k.color(...C.purpleFace));

    // Track
    const trackX = slX;
    const trackW = slW;
    const trackY = y + Math.round(P.sliderRowH * 0.55);
    addFx(k, 119, "settingsMenu", "subPanel", "creativeSliders",
      k.rect(trackW, P.sliderTrackH, { radius: Math.round(P.sliderTrackH / 2) }), k.pos(trackX, trackY),
      k.color(...C.sliderTrack));

    // Fill
    const fillRatio = (curVal - min) / (max - min);
    const fill = addFx(k, 120, "settingsMenu", "subPanel", "creativeSliders",
      k.rect(Math.max(0, trackW * fillRatio), P.sliderTrackH, { radius: Math.round(P.sliderTrackH / 2) }),
      k.pos(trackX, trackY), k.color(...C.sliderFill));

    // Knob
    const knob = addFx(k, 121, "settingsMenu", "subPanel", "creativeSliders",
      k.circle(P.sliderKnobR), k.area(),
      k.pos(trackX + trackW * fillRatio, trackY + P.sliderTrackH / 2),
      k.anchor("center"), k.color(...C.white),
      k.outline(1, k.rgb(...C.panelBorder)));

    let dragging = false;

    knob.onHoverUpdate(() => { document.body.style.cursor = "ew-resize"; });
    knob.onHoverEnd(() => { if (!dragging) document.body.style.cursor = "default"; });

    const clickH = k.onMousePress("left", () => {
      if (knob.isHovering()) dragging = true;
    });
    creativeClickHandlers.push(clickH);

    // Track click zone
    const trackHit = addFx(k, 120, "settingsMenu", "subPanel", "creativeSliders",
      k.rect(trackW, 30, { radius: R.btn }), k.area(),
      k.pos(trackX, trackY - 10), k.color(0, 0, 0), k.opacity(0));
    trackHit.onHoverUpdate(() => { document.body.style.cursor = "pointer"; });
    trackHit.onHoverEnd(() => { document.body.style.cursor = "default"; });

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
  if (section === "slime") {
    k.get("slime").forEach(s => {
      if (key === "health" && val < s.health) s.health = val;
      if (key === "damage") s.damage = val;
      if (key === "speed") s.speed = val;
    });
  }
}

// ── Shared back button ──
function buildBackButton(k, bx, by, L) {
  const P = L.sub;
  const F = L.fontSize;
  const R = L.radius;
  addFx(k, 119, "settingsMenu", "subPanel",
    k.rect(P.actionBtnW, P.actionBtnH, { radius: R.btn }), k.pos(bx + 2, by + 3), k.color(...C.greenShad));
  const btn = addFx(k, 120, "settingsMenu", "subPanel",
    k.rect(P.actionBtnW, P.actionBtnH, { radius: R.btn }), k.area(), k.pos(bx, by),
    k.color(...C.greenFace), k.outline(1, k.rgb(...C.panelBorder)));
  addFx(k, 121, "settingsMenu", "subPanel",
    k.text("← Back", { size: F.label, font: "monospace" }),
    k.pos(bx + P.actionBtnW / 2, by + P.actionBtnH / 2), k.anchor("center"), k.color(...C.white));
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
