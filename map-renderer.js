(() => {
  "use strict";

  const { ASSET_PATH, MAP_SITE_ARTWORK } = window.TypeOMancerCampaign;

  function renderMap({ worldMap, stages, unlocked, winScores, onStageSelect }) {
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
      if (index > unlocked) {
        node.disabled = true;
        node.classList.add("locked");
        node.setAttribute("aria-label", "Locked guardian");
      }
      if (index === unlocked) {
        node.classList.add("active");
        node.setAttribute("aria-current", "step");
        node.setAttribute("aria-label", "Current destination: " + stage.name);
      }
      if (index < unlocked) {
        node.classList.add("done");
        const badge = document.createElement("span");
        badge.className = "wpm-badge";
        badge.textContent = `${winScores[index] || "-"} WPM`;
        node.append(badge);
      }
      node.addEventListener("click", () => onStageSelect(index));
      worldMap.append(node);
    });
  }

  window.TypeOMancerMap = { renderMap };
})();
