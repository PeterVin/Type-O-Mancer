(() => {
  "use strict";

  const { ASSET_PATH, MAP_SITE_ARTWORK, VICTORY_ARTWORK } =
    window.TypeOMancerCampaign;

  function renderMap({
    worldMap,
    stages,
    unlocked,
    winScores,
    campaignComplete,
    onStageSelect,
  }) {
    worldMap.replaceChildren();

    stages.forEach((stage, index) => {
      const artwork = MAP_SITE_ARTWORK[index];
      const node = document.createElement("button");
      node.type = "button";
      node.className = "map-node";
      node.style.left = `${artwork.left}%`;
      node.style.top = `${artwork.top}%`;
      node.style.setProperty("--site-width", `${artwork.width}%`);
      node.style.setProperty("--site-height", `${artwork.height}%`);
      node.setAttribute("aria-label", stage.name);

      const mask = document.createElement("span");
      mask.className = "site-mask";
      const image = document.createElement("img");
      image.src = `${ASSET_PATH}/sites/${artwork.file}`;
      image.alt = stage.name;
      mask.appendChild(image);
      node.appendChild(mask);

      const isCompleted =
        index < unlocked || (campaignComplete && index === unlocked);

      if (index > unlocked) {
        node.disabled = true;
        node.classList.add("locked");
        node.setAttribute("aria-label", "Locked guardian");
      } else if (isCompleted) {
        node.classList.add("done");
        const badge = document.createElement("span");
        badge.className = "wpm-badge";
        badge.textContent = `${winScores[index] || "-"} WPM`;
        node.append(badge);
      }

      if (index === unlocked && !campaignComplete) {
        node.classList.add("active");
        node.setAttribute("aria-current", "step");
        node.setAttribute("aria-label", "Current destination: " + stage.name);
      }

      node.addEventListener("click", () => onStageSelect(index));
      worldMap.append(node);
    });

    if (campaignComplete) {
      const marker = document.createElement("div");
      marker.className = "final-victory";
      marker.style.left = String(VICTORY_ARTWORK.left) + "%";
      marker.style.top = String(VICTORY_ARTWORK.top) + "%";
      marker.style.width = String(VICTORY_ARTWORK.width) + "%";
      const image = document.createElement("img");
      image.src = ASSET_PATH + "/sites/" + VICTORY_ARTWORK.file;
      image.alt = "Campaign victory";
      marker.append(image);
      worldMap.append(marker);
    }
  }

  window.TypeOMancerMap = { renderMap };
})();
