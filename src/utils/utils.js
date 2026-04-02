// Dialogue display system — typewriter text effect

export function displayDialogue(text, onDisplayEnd) {
  const dialogueUI = document.getElementById("textbox-container");
  const dialogue = document.getElementById("dialogue");

  dialogueUI.style.display = "block";
  let index = 0;
  let currentText = "";
  const intervalRef = setInterval(() => {
    if (index < text.length) {
      currentText += text[index];
      dialogue.textContent = currentText;
      index++;
      return;
    }

    clearInterval(intervalRef);
  }, 5); // 5ms per character
  const closeBtn = document.getElementById("close");

  function onKeyDown(key) {
    if (key.code === "Space") {
      key.preventDefault();
      onCloseBtnClick();
    }
  }

  function onCloseBtnClick(e) {
    if (e) e.preventDefault(); // Prevent double-firing from click/touchstart
    onDisplayEnd();
    dialogueUI.style.display = "none";
    dialogue.innerHTML = "";
    clearInterval(intervalRef);
    removeEventListener("keydown", onKeyDown);
    closeBtn.removeEventListener("click", onCloseBtnClick);
    closeBtn.removeEventListener("touchstart", onCloseBtnClick);
  }

  addEventListener("keydown", onKeyDown);
  closeBtn.addEventListener("click", onCloseBtnClick);
  closeBtn.addEventListener("touchstart", onCloseBtnClick, { passive: false });
}

export function setCamScale(k, roomName, zoomMultiplier = 1) {
  // Zoom proportional to screen width so the same amount of
  // game world is always visible regardless of screen size.
  // Main area uses 1250 so it's zoomed out slightly more.
  const divisor = roomName === "main" ? 1250 : 1100;
  const baseZoom = k.width() / divisor;
  k.camScale(k.vec2(baseZoom * zoomMultiplier));
}


export const gameState = {
  isPaused: false,
  bgm: null,
  isTimeStopped: false,
  inputLocked: false,
  inventoryOpen: false,
  playerHealth: null,       // Persisted across rooms. null = use max HP
  slimesByRoom: {},         // { roomName: [{ x, y, health }, ...] }
  
  // RPG Progression
  player: {
    level: 1,
    xp: 0,
    xpToNext: 100,
    skillPoints: 0,
    unlockedSkills: ["overheadSlash"],
    activeSkills: ["overheadSlash", null, null, null], // 4-slot loadout
  }
};

/**
 * Add XP to player and handle leveling
 * @param {number} amount - XP amount to add
 */
export function addXP(amount) {
  const p = gameState.player;
  p.xp += amount;
  
  if (p.xp >= p.xpToNext) {
    p.level++;
    p.xp -= p.xpToNext;
    p.xpToNext = Math.round(p.xpToNext * 1.2);
    p.skillPoints++;
    console.log(`Leveled up to ${p.level}!`);
  }
}

export function setGamePause(k, isPaused) {
  gameState.isPaused = isPaused;
  gameState.inputLocked = isPaused;
}
