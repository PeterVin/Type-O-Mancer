(() => {
  "use strict";
  const { DIFFICULTY_SETTINGS, STAGES, SPRITES } = window.TypeOMancerCampaign;
  const { renderMap: renderCampaignMap } = window.TypeOMancerMap;

  const $ = (selector) => document.querySelector(selector);
  const mapScreen = $("#mapScreen");
  const battleScreen = $("#battleScreen");
  const worldMap = $("#worldMap");
  const resultModal = $("#resultModal");
  const playerBubble = $("#playerBubble");
  const playerRune = $("#playerRune");
  const playerState = $("#playerState");
  const playerSpeech = $("#playerSpeech");
  const enemyBubble = $("#enemyBubble");
  const enemyRune = $("#enemyRune");
  const enemyState = $("#enemyState");
  const enemySpeech = $("#enemySpeech");
  const typingInput = $("#typingInput");

  const KEY_SOUND = "audio/mixkit-hard-single-key-press-in-a-laptop-2542.wav";
  const KEY_FAIL_SOUND = "audio/mixkit-single-key-type-2533.wav";
  const WIN_SOUND = "audio/mixkit-successful-horns-fanfare-722.wav";
  const DEFEAT_SOUND = "audio/mixkit-slow-sad-trombone-fail-472.wav";
  const FINAL_STAGE_INDEX = STAGES.length - 1;
  const STORAGE_KEYS = {
    progress: "typeforge-progress",
    wins: "typeforge-wins",
    campaignComplete: "typeforge-campaign-complete",
  };

  let difficulty = "easy",
    currentStage = 0,
    challenge = "",
    playerCursor = 0,
    botCursor = 0;

  let playerCorrect = 0,
    playerMistakes = 0,
    elapsed = 0;

  let running = false,
    finished = false,
    playerStunned = false,
    botStunned = false;

  let clock = null,
    botTimer = null,
    playerStunTimer = null,
    botStunTimer = null,
    soundEnabled = true;

  let winScores = readWinScores();

  const savedProgress = Number.parseInt(
    localStorage.getItem(STORAGE_KEYS.progress),
    10,
  );

  let unlocked = Number.isInteger(savedProgress)
    ? Math.min(Math.max(savedProgress, 0), FINAL_STAGE_INDEX)
    : 0;

  let campaignComplete = isStoredCampaignComplete();

  const difficultyButtons = document.querySelectorAll(".difficulty");

  difficultyButtons.forEach((button) => {
    button.addEventListener("click", () => {
      difficulty = button.dataset.difficulty;

      difficultyButtons.forEach((item) => {
        const selected = item === button;
        item.classList.toggle("active", selected);
        item.setAttribute("aria-checked", String(selected));
      });
    });
  });

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
    localStorage.setItem(
      STORAGE_KEYS.campaignComplete,
      String(campaignComplete),
    );
  }

  function readWinScores() {
    try {
      const savedScores = JSON.parse(
        localStorage.getItem(STORAGE_KEYS.wins) || "{}",
      );
      return savedScores &&
        typeof savedScores === "object" &&
        !Array.isArray(savedScores)
        ? savedScores
        : {};
    } catch {
      return {};
    }
  }

  function isStoredCampaignComplete() {
    return (
      localStorage.getItem(STORAGE_KEYS.campaignComplete) === "true" &&
      unlocked === FINAL_STAGE_INDEX &&
      Object.prototype.hasOwnProperty.call(winScores, FINAL_STAGE_INDEX)
    );
  }

  function resetCampaign() {
    localStorage.removeItem(STORAGE_KEYS.progress);
    localStorage.removeItem(STORAGE_KEYS.wins);
    localStorage.removeItem(STORAGE_KEYS.campaignComplete);

    unlocked = 0;
    winScores = {};
    currentStage = 0;
    campaignComplete = false;

    $("#resetModal").hidden = true;
    renderMap();
  }

  function renderMap() {
    renderCampaignMap({
      worldMap,
      stages: STAGES,
      unlocked,
      winScores,
      campaignComplete,
      onStageSelect: (stageIndex) => {
        if (stageIndex <= unlocked) startStage(stageIndex);
      },
    });
    $("#progressText").textContent = getProgressText();
  }

  function getProgressText() {
    if (campaignComplete) {
      return `${STAGES.length} / ${STAGES.length} unlocked · Campaign complete`;
    }

    return `${unlocked + 1} / ${STAGES.length} stages unlocked · Destination: ${STAGES[unlocked].name}`;
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
    clearTransientTimers();
    playerCursor = 0;
    playerCorrect = 0;
    playerMistakes = 0;
    elapsed = 0;
    botCursor = 0;
    running = false;
    finished = false;
    playerStunned = false;
    botStunned = false;
    typingInput.value = "";
    $("#timer").textContent = "00:00";
    playerState.textContent = "Your first key starts the duel.";
    enemyState.textContent = "Waiting for you...";
    playerSpeech.textContent = "Ready when you are.";
    enemySpeech.textContent = STAGES[currentStage].encounter;
    playerBubble.classList.remove("stunned");
    enemyBubble.classList.remove("stunned");
    playerRune.classList.remove("stunned");
    enemyRune.classList.remove("stunned");
    renderPlayer();
    renderBot();
    updateStats();
    typingInput.focus();
  }

  function startStage(index) {
    resultModal.classList.remove("legendary-victory");
    currentStage = index;
    const stage = STAGES[index];
    challenge = stage.texts[Math.floor(Math.random() * stage.texts.length)];
    mapScreen.hidden = true;
    battleScreen.hidden = false;
    battleScreen.className = `battle-screen region-${stage.regionClass}`;
    $("#regionName").textContent = stage.region;
    $("#stageName").textContent = stage.name;
    $("#enemyName").textContent = stage.enemyName;
    playerSpeech.textContent = "Ready when you are.";
    enemySpeech.textContent = stage.encounter;
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

  function getLetterState(index, cursor, errorAt = -1) {
    if (index < cursor) return "correct";
    if (index === cursor && errorAt === index) return "wrong";
    if (index === cursor && !finished) return "current";

    return "";
  }

  function renderPlayer(errorAt = -1) {
    const restoreFocus = document.activeElement === typingInput;
    const runes = document.createDocumentFragment();

    [...challenge].forEach((char, index) => {
      const state = getLetterState(index, playerCursor, errorAt);
      runes.append(letterSpan(char, state));
    });

    playerRune.replaceChildren(runes, typingInput);

    if (restoreFocus && !finished && !playerStunned) {
      typingInput.focus();
    }
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
      correction: [2500, 2200, 2000, 1800, 1600][Math.min(tier, 4)],
    };
  }

  function renderBot(errorAt = -1) {
    const runes = document.createDocumentFragment();

    [...challenge].forEach((char, index) => {
      const state = getLetterState(index, botCursor, errorAt);
      runes.append(letterSpan(char, state));
    });

    enemyRune.replaceChildren(runes);
  }

  function setBotStun(delay) {
    botStunned = true;
    enemyBubble.classList.add("stunned");
    enemyState.textContent = "Mistake! Correcting...";
    enemySpeech.textContent = STAGES[currentStage].dizzy;
    renderBot(botCursor);
    window.clearTimeout(botStunTimer);
    botStunTimer = window.setTimeout(() => {
      botStunned = false;
      enemyBubble.classList.remove("stunned");
      enemySpeech.textContent = STAGES[currentStage].recover;
      scheduleBot(60);
    }, delay);
  }

  function setPlayerStun() {
    playerStunned = true;
    playerBubble.classList.add("stunned");
    playerState.textContent = "Dizzy! Recovering for 2 seconds...";
    playerSpeech.textContent = "Stars...everywhere...";
    window.clearTimeout(playerStunTimer);
    playerStunTimer = window.setTimeout(() => {
      if (finished) return;
      playerStunned = false;
      playerBubble.classList.remove("stunned");
      playerState.textContent = "Recovered. Keep typing.";
      playerSpeech.textContent = "Back in the fight.";
      typingInput.focus();
    }, 2000);
  }

  function scheduleBot(delay) {
    botTimer = window.setTimeout(() => {
      if (!running || finished || botStunned) return;
      const profile = botProfile();
      if (Math.random() < profile.errorRate && challenge[botCursor] !== " ") {
        setBotStun(profile.correction);
        return;
      }
      enemyState.textContent = "I will crush you!";
      botCursor += 1;
      renderBot();
      updateStats();
      if (botCursor >= challenge.length) return endBattle(false);
      const charDelay = Math.max(
        45,
        Math.round((60000 / (profile.wpm * 5)) * (0.85 + Math.random() * 0.25)),
      );

      scheduleBot(charDelay);
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
    window.clearTimeout(botTimer);
    clock = null;
    botTimer = null;
  }

  function clearTransientTimers() {
    window.clearTimeout(playerStunTimer);
    window.clearTimeout(botStunTimer);
    playerStunTimer = null;
    botStunTimer = null;
  }

  typingInput.addEventListener("keydown", (event) => {
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
      playerState.textContent = "Keep typing.";
      updateStats();

      renderPlayer();
      if (playerCursor === challenge.length) {
        endBattle(true);
      }
    } else {
      playerMistakes++;
      playKeyFailSound();
      renderPlayer(playerCursor);
      setPlayerStun();
    }
  });

  function endBattle(victory) {
    if (finished) return;

    finished = true;
    stopRace();
    clearTransientTimers();

    const stage = STAGES[currentStage];
    const score = currentWpm(playerCorrect);
    const finalWin = victory && campaignComplete;

    resultModal.classList.toggle("legendary-victory", finalWin);

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
    resultModal.hidden = false;
  }

  function updateVictoryProgress(score) {
    winScores[currentStage] = Math.max(winScores[currentStage] || 0, score);
    unlocked = Math.max(
      unlocked,
      Math.min(currentStage + 1, FINAL_STAGE_INDEX),
    );
    if (currentStage === FINAL_STAGE_INDEX) {
      campaignComplete = true;
    }
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

  function closeToMap() {
    stopRace();
    clearTransientTimers();
    resultModal.classList.remove("legendary-victory");
    resultModal.hidden = true;
    battleScreen.hidden = true;
    mapScreen.hidden = false;
    renderMap();
  }

  $("#restartBattle").addEventListener("click", prepareBattle);
  $("#leaveBattle").addEventListener("click", closeToMap);

  $("#backToMap").addEventListener("click", closeToMap);
  $("#nextStage").addEventListener("click", () => {
    resultModal.hidden = true;
    if (currentStage < FINAL_STAGE_INDEX) startStage(currentStage + 1);
    else closeToMap();
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

  renderMap();
})();
