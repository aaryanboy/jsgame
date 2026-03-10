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

export function setCamScale(k) {
  const resizeFactor = k.width() / k.height();
  if (resizeFactor < 1) {
    k.camScale(k.vec2(1));
  } else {
    k.camScale(k.vec2(1.5));
  }
}

export const gameState = {
  isPaused: false,
  bgm: null,
  isTimeStopped: false,
  playerHealth: null,       // Persisted across rooms. null = use max HP
  slimesByRoom: {},         // { roomName: [{ x, y, health }, ...] }
};

export function setGamePause(k, isPaused) {
  gameState.isPaused = isPaused;
}
