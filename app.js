(() => {
  "use strict";

  const $ = (selector) => document.querySelector(selector);
  const { DIFFICULTY_SETTINGS, STAGES } = window.TypeOMancerCampaign;
  const { renderMap: renderCampaignMap } = window.TypeOMancerMap;
  let difficulty = "easy";
  let unlocked = 0;
  let currentStage = 0;

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

  function startStage(index) {
    currentStage = index;
    const stage = STAGES[index];
    $("#mapScreen").hidden = true;
    $("#battleScreen").hidden = false;
    $("#regionName").textContent = stage.region;
    $("#stageName").textContent = stage.name;
    $("#enemyName").textContent = stage.enemyName;
  }

  renderMap();
})();
