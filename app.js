(() => {
  "use strict";

  const $ = (selector) => document.querySelector(selector);
  const { DIFFICULTY_SETTINGS, STAGES, SPRITES } = window.TypeOMancerCampaign;
  const { renderMap: renderCampaignMap } = window.TypeOMancerMap;
  let difficulty = "easy";
  let unlocked = 0;
  let currentStage = 0;
  let campaignComplete = false;
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
  let soundEnabled = true;
  const KEY_SOUND = "audio/mixkit-hard-single-key-press-in-a-laptop-2542.wav";
  const KEY_FAIL_SOUND = "audio/mixkit-single-key-type-2533.wav";
  const WIN_SOUND = "audio/mixkit-successful-horns-fanfare-722.wav";
  const DEFEAT_SOUND = "audio/mixkit-slow-sad-trombone-fail-472.wav";
  const STORAGE_KEYS = {
    progress: "typeforge-progress",
    wins: "typeforge-wins",
    complete: "typeforge-campaign-complete",
  };

  function playAudio(src, volume = 0.72, playbackRate = 1) {
    if (!soundEnabled) return;

    const sound = new Audio(src);
    sound.volume = volume;
    sound.playbackRate = playbackRate;
    sound.currentTime = 0;
    sound.play().catch(() => {});
  }

  function playKeySound() {
    const randomRate = 0.95 + Math.random() * 0.1;
    playAudio(KEY_SOUND, 0.62, randomRate);
  }

  function playKeyFailSound() {
    playAudio(KEY_FAIL_SOUND, 0.72, 0.9);
  }

  function playWinSound() {
    playAudio(WIN_SOUND);
  }

  function playDefeatSound() {
    playAudio(DEFEAT_SOUND);
  }

  function saveProgress() {
    localStorage.setItem(STORAGE_KEYS.progress, String(unlocked));
    localStorage.setItem(STORAGE_KEYS.wins, JSON.stringify(winScores));
    localStorage.setItem(STORAGE_KEYS.complete, String(campaignComplete));
  }

  function restoreProgress() {
    try {
      const value = Number.parseInt(
        localStorage.getItem(STORAGE_KEYS.progress),
        10,
      );
      unlocked = Number.isInteger(value)
        ? Math.min(Math.max(value, 0), STAGES.length - 1)
        : 0;
      const scores = JSON.parse(
        localStorage.getItem(STORAGE_KEYS.wins) || "{}",
      );
      winScores = scores && typeof scores === "object" ? scores : {};
      campaignComplete = localStorage.getItem(STORAGE_KEYS.complete) === "true";
    } catch {
      unlocked = 0;
      winScores = {};
    }
  }

  function resetCampaign() {
    localStorage.removeItem(STORAGE_KEYS.progress);
    localStorage.removeItem(STORAGE_KEYS.wins);
    localStorage.removeItem(STORAGE_KEYS.complete);

    unlocked = 0;
    winScores = {};
    currentStage = 0;
    campaignComplete = false;

    $("#resetModal").hidden = true;
    renderMap();
  }

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
      playKeySound();
    });
  });

  function renderMap() {
    renderCampaignMap({
      worldMap: $("#worldMap"),
      stages: STAGES,
      unlocked,
      winScores,
      campaignComplete,
      onStageSelect: (index) => {
        if (index <= unlocked) startStage(index);
      },
    });
    $("#progressText").textContent = getProgressText();
  }

  function getProgressText() {
    if (campaignComplete) {
      return "Campaign complete";
    }

    return `${unlocked + 1} / ${STAGES.length} stages unlocked · Destination: ${STAGES[unlocked].name}`;
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
      playKeySound();
      $("#playerState").textContent = "Keep typing.";
      updateStats();

      renderTyping($("#playerRune"), playerCursor);
      if (playerCursor === challenge.length) {
        endBattle(true);
      }
    } else {
      playerMistakes++;
      playKeyFailSound();
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
      updateVictoryProgress(score);
      playWinSound();
    } else {
      playDefeatSound();
    }
    const result = getBattleResult(victory, stage, score);
    $("#resultEyebrow").textContent = result.eyebrow;
    $("#resultTitle").textContent = result.title;
    $("#resultCopy").textContent = result.copy;
    $("#nextStage").hidden = !victory || campaignComplete;
    $("#resultModal").hidden = false;
  }

  function updateVictoryProgress(score) {
    winScores[currentStage] = Math.max(winScores[currentStage] || 0, score);
    unlocked = Math.max(
      unlocked,
      Math.min(currentStage + 1, STAGES.length - 1),
    );
    campaignComplete = currentStage === STAGES.length - 1;
    saveProgress();
  }

  function getBattleResult(victory, stage, score) {
    if (!victory) {
      return {
        eyebrow: "RACE LOST",
        title: `${stage.name} finished first`,
        copy: "Restart the duel and protect your rhythm.",
      };
    }
    if (campaignComplete) {
      return {
        eyebrow: "LEGENDARY TYPIST",
        title: "You are the Realm's Greatest Typist!",
        copy: "Every guardian fell to your rhythm. Keep forging faster, Keyboard Knight!",
      };
    }
    return {
      eyebrow: "VICTORY",
      title: `${stage.name} defeated!`,
      copy: `${stage.win} Winning speed: ${score} WPM.`,
    };
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

  $("#soundToggle").addEventListener("click", () => {
    soundEnabled = !soundEnabled;
    $("#soundToggle").setAttribute("aria-pressed", String(soundEnabled));
    $("#soundToggle .sound-label").textContent = soundEnabled
      ? "Sound: on"
      : "Sound: off";
    if (soundEnabled) playKeySound();
  });

  $("#resetCampaign").addEventListener("click", () => {
    $("#resetModal").hidden = false;
  });

  $("#cancelReset").addEventListener("click", () => {
    $("#resetModal").hidden = true;
  });

  $("#confirmReset").addEventListener("click", () => {
    resetCampaign();
  });

  restoreProgress();
  renderMap();
})();
