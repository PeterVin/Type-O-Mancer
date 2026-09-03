(() => {
  "use strict";

  const $ = (selector) => document.querySelector(selector);
  const { DIFFICULTY_SETTINGS, STAGES } = window.TypeOMancerCampaign;
  let difficulty = "easy";

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

  $("#progressText").textContent =
    "Campaign model ready: " + STAGES.length + " guardians";
})();
