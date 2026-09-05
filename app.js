(() => {
  "use strict";

  const $ = (selector) => document.querySelector(selector);
  const { DIFFICULTY_SETTINGS, STAGES, SPRITES } = window.TypeOMancerCampaign;
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
        if (index <= unlocked) startStage(index);
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

  function getSpriteUrl(sprite) {
    return `url('assets/characters/${sprite}.png')`;
  }

  function renderCharacters() {
    $(".player-sprite").style.backgroundImage = getSpriteUrl(SPRITES.PLAYER);
    $("#enemySprite").style.backgroundImage = getSpriteUrl(
      STAGES[currentStage].sprite,
    );
  }

  function prepareBattle() {
    stopRace();
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
    $("#battleScreen").className = `battle-screen region-${stage.regionClass}`;
    $("#regionName").textContent = stage.region;
    $("#stageName").textContent = stage.name;
    $("#enemyName").textContent = stage.enemyName;
    $("#playerSpeech").textContent = "Ready when you are.";
    $("#enemySpeech").textContent = stage.encounter;
    renderCharacters();
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
    $("#enemyBubble").classList.add("stunned");
    $("#enemyState").textContent = "Mistake! Correcting...";
    $("#enemySpeech").textContent = STAGES[currentStage].dizzy;

    botStunTimer = window.setTimeout(() => {
      botStunned = false;
      $("#enemyBubble").classList.remove("stunned");
      $("#enemySpeech").textContent = STAGES[currentStage].recover;
      scheduleBot(60);
    }, delay);
  }

  function stunPlayer() {
    playerStunned = true;
    $("#playerBubble").classList.add("stunned");
    $("#playerState").textContent = "Dizzy! Recovering for 2 seconds...";
    $("#playerSpeech").textContent = "Stars...everywhere...";
    window.clearTimeout(playerStunTimer);
    playerStunTimer = window.setTimeout(() => {
      if (finished) return;
      playerStunned = false;
      $("#playerBubble").classList.remove("stunned");
      $("#playerState").textContent = "Recovered. Keep typing.";
      $("#playerSpeech").textContent = "Back in the fight.";
      $("#typingInput").focus();
    }, 2000);
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
        endBattle(false);
        return;
      }
      scheduleBot(Math.max(45, Math.round(60000 / (profile.wpm * 5))));
    }, delay);
  }

  function startRace() {
    if (running) return;
    running = true;
    clock = window.setInterval(() => {
      elapsed++;
      $("#timer").textContent = formatTime(elapsed);
      updateStats();
    }, 1000);
    scheduleBot(200);
  }

  function stopRace() {
    running = false;
    window.clearInterval(clock);
    clock = null;
    window.clearInterval(botTimer);
    botTimer = null;
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

    startRace();

    if (event.key === challenge[playerCursor]) {
      playerCursor++;
      playerCorrect++;
      $("#playerState").textContent = "Keep typing.";
      updateStats();

      renderTyping($("#playerRune"), playerCursor);
      if (playerCursor === challenge.length) {
        endBattle(true);
      }
    } else {
      playerMistakes++;
      renderTyping($("#playerRune"), playerCursor, playerCursor);
      stunPlayer();
    }
  });

  function endBattle(victory) {
    if (finished) return;
    finished = true;
    stopRace();
    const stage = STAGES[currentStage];
    const score = currentWpm(playerCorrect);
    if (victory) {
      winScores[currentStage] = Math.max(winScores[currentStage] || 0, score);
      unlocked = Math.max(
        unlocked,
        Math.min(currentStage + 1, STAGES.length - 1),
      );
    }
    $("#resultEyebrow").textContent = victory ? "VICTORY" : "RACE LOST";
    $("#resultTitle").textContent = victory
      ? `${stage.name} defeated!`
      : `${stage.name} finished first!`;
    $("#resultCopy").textContent = victory
      ? `${stage.win} Winning speed: ${score} WPM.`
      : "Restart the duel and protect your rhythm.";
    $("#nextStage").hidden = !victory;
    $("#resultModal").hidden = false;
  }

  $("#restartBattle").addEventListener("click", prepareBattle);
  $("#leaveBattle").addEventListener("click", () => {
    stopRace();
    $("#battleScreen").hidden = true;
    $("#mapScreen").hidden = false;
    renderMap();
  });

  $("#backToMap").addEventListener("click", () => {
    $("#resultModal").hidden = true;
    $("#battleScreen").hidden = true;
    $("#mapScreen").hidden = false;
    renderMap();
  });
  $("#nextStage").addEventListener("click", () => {
    $("#resultModal").hidden = true;
    if (currentStage < STAGES.length - 1) startStage(currentStage + 1);
    else {
      $("#battleScreen").hidden = true;
      $("#mapScreen").hidden = false;
      renderMap();
    }
  });

  renderMap();
})();
