(() => {
  "use strict";

  const $ = (selector) => document.querySelector(selector);
  const { DIFFICULTY_SETTINGS, STAGES } = window.TypeOMancerCampaign;
  const { renderMap: renderCampaignMap } = window.TypeOMancerMap;
  let difficulty = "easy";
  let unlocked = 0;
  let currentStage = 0;
  let playerCursor = 0;
  let playerCorrect = 0;
  let playerMistakes = 0;
  let playerStunned = false;
  let playerStunTimer = null;
  let botCursor = 0;
  let botTimer = null;
  let botStunned = false;
  let botStunTimer = null;
  let elapsed = 0;
  let challenge = "";
  let winScores = {};
  let running = false;
  let finished = false;
  let clock = null;

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

  function renderTyping(target, cursor, errorAt = -1) {
    const restoreFocus = document.activeElement === $("#typingInput");
    const input = target.id === "playerRune" ? $("#typingInput") : null;
    const runes = document.createDocumentFragment();
    Array.from(challenge).forEach((character, index) => {
      const span = document.createElement("span");
      span.className = "rune-char";
      if (index < cursor) span.classList.add("correct");
      if (index === cursor && errorAt === index) span.classList.add("wrong");
      else if (index === cursor && !finished) span.classList.add("current");
      if (character === " ") span.classList.add("space");
      span.textContent = character;
      runes.append(span);
    });
    if (input) target.replaceChildren(runes, input);
    else target.replaceChildren(runes);
    if (restoreFocus && !finished) $("#typingInput")?.focus();
  }

  function prepareBattle() {
    stopClock();
    playerCursor = 0;
    playerCorrect = 0;
    playerMistakes = 0;
    running = false;
    finished = false;
    elapsed = 0;
    botCursor = 0;
    playerStunned = false;
    botStunned = false;
    window.clearTimeout(playerStunTimer);
    window.clearTimeout(botStunTimer);
    $("#typingInput").value = "";
    $("#timer").textContent = "00:00";
    renderTyping($("#playerRune"), playerCursor);
    renderTyping($("#enemyRune"), botCursor);
    updateStats();
    $("#typingInput").focus();
  }

  function startStage(index) {
    currentStage = index;
    const stage = STAGES[index];
    challenge = stage.texts[Math.floor(Math.random() * stage.texts.length)];
    $("#mapScreen").hidden = true;
    $("#battleScreen").hidden = false;
    $("#regionName").textContent = stage.region;
    $("#stageName").textContent = stage.name;
    $("#enemyName").textContent = stage.enemyName;
    prepareBattle();
  }

  function currentWpm(value) {
    return elapsed ? Math.round(value / 5 / (elapsed / 60)) : 0;
  }

  function updateStats() {
    const attemts = playerCorrect + playerMistakes;
    const accuracy = attemts
      ? Math.round((playerCorrect / attemts) * 100)
      : 100;
    const wpm = currentWpm(playerCorrect);
    const pcWpm = currentWpm(botCursor);
    $("#accuracy").textContent = `${accuracy}%`;
    $("#wpm").textContent = `${wpm} WPM`;
    $("#pcWpm").textContent = `${pcWpm} WPM`;
    const enemyHealth = Math.max(
      0,
      100 - Math.round((playerCursor / challenge.length) * 100),
    );
    const playerHealth = Math.max(
      0,
      100 - Math.round((botCursor / challenge.length) * 100),
    );
    $("#enemyHealthFill").style.width = `${enemyHealth}%`;
    $("#enemyHealthText").textContent = `${enemyHealth}%`;
    $("#playerHealthFill").style.width = `${playerHealth}%`;
    $("#playerHealthText").textContent = `${playerHealth}%`;
  }

  function formatTime(total) {
    return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
  }

  function letterSpan(char, className = "") {
    const span = document.createElement("span");
    span.className = `rune-char${char === " " ? " space" : ""}${className ? ` ${className}` : ""}`;
    span.textContent = char;
    return span;
  }

  function botProfile() {
    const tier = Math.floor(currentStage / 3);
    return {
      wpm: 24 + currentStage * 3 + DIFFICULTY_SETTINGS[difficulty].modifier,
      errorRate: Math.max(
        0.01,
        0.15 -
          currentStage * 0.009 +
          DIFFICULTY_SETTINGS[difficulty].errorModifier,
      ),
      correction: [2000, 1000, 750, 500, 250][Math.min(tier, 4)],
    };
  }

  function renderBot(errorAt = -1) {
    $("#enemyRune").replaceChildren();
    [...challenge].forEach((char, index) => {
      const state =
        index < botCursor
          ? "correct"
          : index === botCursor
            ? errorAt === index
              ? "wrong"
              : "current"
            : "";
      $("#enemyRune").append(letterSpan(char, state));
    });
  }

  function stunBot(delay) {
    renderBot(botCursor);
    botStunned = true;
    $("#enemyState").textContent = "Mistake! Correcting...";
    botStunTimer = window.setTimeout(() => {
      botStunned = false;
      scheduleBot(60);
    }, delay);
  }

  function scheduleBot(delay) {
    botTimer = window.setTimeout(() => {
      if (!running || finished || botStunned) return;
      const profile = botProfile();
      if (Math.random() < profile.errorRate && challenge[botCursor] !== " ") {
        stunBot(profile.correction);
        return;
      }
      $("#enemyState").textContent = "I will crush you!";
      botCursor += 1;
      renderBot();
      updateStats();
      if (botCursor >= challenge.length) {
        finished = true;
        $("#battleStatus").textContent = "The guardian finished first.";
        stopClock();
        return;
      }
      scheduleBot(Math.max(45, Math.round(60000 / (profile.wpm * 5))));
    }, delay);
  }

  function startClock() {
    if (running) return;
    running = true;
    clock = window.setInterval(() => {
      elapsed++;
      $("#timer").textContent = formatTime(elapsed);
      updateStats();
    }, 1000);
    scheduleBot(200);
  }

  function stopClock() {
    running = false;
    window.clearInterval(clock);
    clock = null;
    window.clearInterval(botTimer);
    botTimer = null;
  }

  function stunPlayer() {
    playerStunned = true;
    $("#playerState").textContent = "Dizzy! Recovering for 2 seconds...";
    window.clearTimeout(playerStunTimer);
    playerStunTimer = window.setTimeout(() => {
      if (finished) return;
      playerStunned = false;
      $("#playerState").textContent = "Recovered. Keep typing.";
      $("#typingInput").focus();
    }, 2000);
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

    if (playerStunned) return;

    startClock();

    if (event.key === challenge[playerCursor]) {
      playerCursor++;
      playerCorrect++;
      $("#playerState").textContent = "Keep typing.";
      updateStats();

      renderTyping($("#playerRune"), playerCursor);
      if (playerCursor === challenge.length) {
        finished = true;
        stopClock();
        $("#battleStatus").textContent = "Victory!";
      }
    } else {
      playerMistakes++;
      renderTyping($("#playerRune"), playerCursor, playerCursor);
      stunPlayer();
    }
  });

  renderMap();
})();
