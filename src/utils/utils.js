//text dialog box dekhoune ra remove garneee

export function displayDialogue(text, onDisplayEnd) {
  const dialogueUI = document.getElementById("textbox-container");
  const dialogue = document.getElementById("dialogue");

  dialogueUI.style.display = "block";
  let index = 0;
  let currentText = ""; //text to append in page
  const intervalRef = setInterval(() => {
    if (index < text.length) {
      currentText += text[index];
      dialogue.innerHTML = currentText; //can get hacked if accepte user input
      index++;
      return;
    }

    clearInterval(intervalRef);
  }, 5); //5 sec
  const closeBtn = document.getElementById("close");

  function onKeyDown(key) {
    if (key.code === "Space") {
      key.preventDefault();
      onCloseBtnClick();
    }
  }

  function onCloseBtnClick() {
    onDisplayEnd();
    dialogueUI.style.display = "none";
    dialogue.innerHTML = "";
    clearInterval(intervalRef);
    removeEventListener("keydown", onKeyDown);
  }

  addEventListener("keydown", onKeyDown);
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
  timeScale: 1.0,
  isTimeStopped: false,
};

export function setGamePause(k, isPaused) {
  gameState.isPaused = isPaused;
  if (gameState.bgm) {
    if (isPaused) {
      gameState.bgm.pause();
    } else {
      gameState.bgm.play();
    }
  }
}
