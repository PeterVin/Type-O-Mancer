(() => {
  "use strict";

  const DIFFICULTY_SETTINGS = {
    easy: { modifier: -6, errorModifier: 0.08 },
    medium: { modifier: 4, errorModifier: 0 },
    hard: { modifier: 15, errorModifier: -0.06 },
  };

  window.TypeOMancerCampaign = { DIFFICULTY_SETTINGS };
})();
