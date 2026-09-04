(() => {
  "use strict";

  const $ = (selector) => document.querySelector(selector);
  const { DIFFICULTY_SETTINGS, STAGES } = window.TypeOMancerCampaign;
  const { renderMap: renderCampaignMap } = window.TypeOMancerMap;
  let difficulty = "easy";
  let unlocked = 0;
  let currentStage = 0;
  let challenge = "";
  let playerCursor = 0;
  let running = false;
  let elapsed = 0;
  let clock = null;
  let playerCorrect = 0;
  let playerMistakes = 0;
  let winScores = {};
  let finished = false;

  const difficultyButtons = document.querySelectorAll(".difficulty");

  difficultyButtons.forEach((button) => {
    button.addEventListener("click", () => {
      difficulty = button.dataset.difficulty;

      difficultyButtons.forEach((item) => {
        const selected = item === button;
        item.classList.toggle("active", selected);
        item.setAttribute("aria-checked", String(selected));
      });
      const profile = DIFFICULTY_SETTINGS[difficulty];
      $("#progressText").textContent =
        "Difficulty ready: " +
        difficulty +
        " (modifier: " +
        profile.modifier +
        ")";
    });
  });

  function renderMap() {
    renderCampaignMap({
      worldMap: $("#worldMap"),
      stages: STAGES,
      unlocked,
      winScores,
      onStageSelect: (index) => {
        if (index == unlocked) startStage(index);
      },
    });
    $("#progressText").textContent =
      String(unlocked + 1) +
      " / " +
      STAGES.length +
      " stages unlocked * Destination: " +
      STAGES[unlocked].name;
  }

  function renderTyping(target, cursor) {
    const restoreFocus = document.activeElement === $("#typingInput");
    const input = target.id === "playerRune" ? $("#typingInput") : null;
    const runes = document.createDocumentFragment();
    Array.from(challenge).forEach((character, index) => {
      const span = document.createElement("span");
      span.className = "rune-char";
      if (index < cursor) span.classList.add("correct");
      if (index === cursor && !finished) span.classList.add("current");
      if (character === " ") span.classList.add("space");
      span.textContent = character;
      runes.append(span);
    });
    if (input) target.replaceChildren(runes, input);
    else target.replaceChildren(runes);
    if (restoreFocus && !finished) $("#typingInput")?.focus();
  }

  function prepareBattle() {
    playerCursor = 0;
    playerCorrect = 0;
    playerMistakes = 0;
    finished = false;
    $("#typingInput").value = "";
    renderTyping($("#playerRune"), playerCursor);
    renderTyping($("#enemyRune"), botCursor);
    $("#typingInput").focus();
  }

  function startStage(index) {
    currentStage = index;
    const stage = STAGES[index];
    challenge = stage.texts[Math.floor(Math.random() * stage.texts.length)];
    elapsed = 0;

    $("#mapScreen").hidden = true;
    $("#battleScreen").hidden = false;
    $("#regionName").textContent = stage.region;
    $("#stageName").textContent = stage.name;
    $("#enemyName").textContent = stage.enemyName;
    $("#timer").textContent = "00:00";
    prepareBattle();
  }

  function updateStats() {
    const attemts = playerCorrect + playerMistakes;
    const accuracy = attemts
      ? Math.round((playerCorrect / attemts) * 100)
      : 100;
    const wpm = elapsed ? Math.round(playerCorrect / 5 / (elapsed / 60)) : 0;
    $("#accuracy").textContent = `${accuracy}%`;
    $("#wpm").textContent = `${wpm} WPM`;
  }

  function formatTime(total) {
    return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
  }

  function startClock() {
    if (running) return;
    running = true;
    clock = window.setInterval(() => {
      elapsed++;
      $("#timer").textContent = formatTime(elapsed);
      updateStats();
    }, 1000);
  }

  function stopClock() {
    running = false;
    window.clearInterval(clock);
    clock = null;
  }

  $("#typingInput").addEventListener("keydown", (event) => {
    if (
      finished ||
      event.ctrlKey ||
      event.metaKey ||
      event.altKey ||
      event.key.length !== 1
    )
      return;

    event.preventDefault();
    startClock();
    if (event.key === challenge[playerCursor]) {
      playerCursor++;
      playerCorrect++;
      updateStats();

      renderTyping($("#playerRune"), playerCursor);
      $("#battleStatus").textContent = "Correct key. Keep going.";
      if (playerCursor === challenge.length) {
        finished = true;
        stopClock();
        $("#battleStatus").textContent = "Victory!";
      }
    } else {
      playerMistakes++;
      $("#battleStatus").textContent =
        "Wrong key. Try the current character again.";
    }
  });

  renderMap();
})();
