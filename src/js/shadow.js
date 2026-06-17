// ============================================================
// shadow.js – Shadow layer + time control with animation
// ============================================================
// Layer order in the map style:
//   ... basemap fill layers ... → shadow-layer → 3d-buildings → label layers
// The shadow is inserted before the first symbol/label layer.
// add3DBuildings() in map.js then inserts the building extrusion
// directly after the shadow, so buildings always render on top.
// ============================================================

let currentShadowHour = 12;
let _animationTimer   = null;
let _animationRunning = false;

const SHADOW_HOURS = Array.from({ length: 15 }, (_, i) => i + 6); // 6..20

function getShadowImage(hour) {
  const h = String(hour).padStart(2, "0");
  return `data/shadows/shadow_${h}00.png`;
}

function _formatDateInputValue(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function _getClosestShadowHour(date) {
  const hour = date.getHours();
  const minHour = SHADOW_HOURS[0];
  const maxHour = SHADOW_HOURS[SHADOW_HOURS.length - 1];
  return Math.min(Math.max(hour, minHour), maxHour);
}

function _syncDateInput(date) {
  const input = document.getElementById("shadow-date");
  if (input) input.value = _formatDateInputValue(date);
}

function createShadowLayer(map) {
  // Clean up existing layer and source (e.g. after basemap switch)
  if (map.getLayer("shadow-layer")) map.removeLayer("shadow-layer");
  if (map.getSource("shadow"))      map.removeSource("shadow");

  map.addSource("shadow", {
    type: "image",
    url: getShadowImage(currentShadowHour),
    coordinates: SHADOW_COORDS
  });

  // Insert shadow before the first symbol layer (labels).
  // add3DBuildings() will then insert "3d-buildings" also before that same
  // label layer → "3d-buildings" ends up directly above "shadow-layer".
  let beforeLayerId;
  for (const layer of map.getStyle().layers) {
    if (layer.type === "symbol" && layer.layout?.["text-field"]) {
      beforeLayerId = layer.id;
      break;
    }
  }

  map.addLayer(
    {
      id: "shadow-layer",
      type: "raster",
      source: "shadow",
      paint: { "raster-opacity": 0.55, "raster-fade-duration": 0 }
    },
    beforeLayerId
  );

  // Start hidden; becomes visible when the panel is opened
  map.setLayoutProperty("shadow-layer", "visibility", "none");
}

function updateShadowLayer(map, hour) {
  currentShadowHour = hour;
  const source = map.getSource("shadow");
  if (source) {
    source.updateImage({ url: getShadowImage(hour), coordinates: SHADOW_COORDS });
  }
  _syncTimeDisplay(hour);
  _syncSlider(hour);
}

function _syncTimeDisplay(hour) {
  const el = document.getElementById("shadow-time");
  if (el) el.textContent = `${String(hour).padStart(2, "0")}:00 Uhr`;
}

function _syncSlider(hour) {
  const slider = document.getElementById("shadow-slider");
  if (slider) slider.value = SHADOW_HOURS.indexOf(hour);
}

// ── Animation ─────────────────────────────────────────────

const ANIMATION_SPEED = 1000;

function _startAnimation(map) {
  _animationRunning = true;
  document.getElementById("shadow-play").textContent = "⏸";

  function tick() {
    if (!_animationRunning) return;
    const nextIdx = (SHADOW_HOURS.indexOf(currentShadowHour) + 1) % SHADOW_HOURS.length;
    updateShadowLayer(map, SHADOW_HOURS[nextIdx]);
    _animationTimer = setTimeout(tick, ANIMATION_SPEED);
  }

  _animationTimer = setTimeout(tick, ANIMATION_SPEED);
}

function _stopAnimation() {
  _animationRunning = false;
  clearTimeout(_animationTimer);
  _animationTimer = null;
  const btn = document.getElementById("shadow-play");
  if (btn) btn.textContent = "▶";
}

// ── Visibility ────────────────────────────────────────────

function showShadowLayer(map) {
  if (map.getLayer("shadow-layer"))
    map.setLayoutProperty("shadow-layer", "visibility", "visible");
}

function hideShadowLayer(map) {
  _stopAnimation();
  if (map.getLayer("shadow-layer"))
    map.setLayoutProperty("shadow-layer", "visibility", "none");
}

// ── UI Events ─────────────────────────────────────────────

function initShadowControls(map) {
  const slider  = document.getElementById("shadow-slider");
  const panel   = document.getElementById("shadow-panel");
  const toggle  = document.getElementById("shadow-bar-toggle");
  const hideBtn = document.getElementById("shadow-hide");
  const playBtn = document.getElementById("shadow-play");
  const dateInput = document.getElementById("shadow-date");
  const todayBtn = document.getElementById("shadow-today");

  if (!slider || !panel || !toggle || !hideBtn || !playBtn || !dateInput || !todayBtn) {
    console.warn("Shadow controls: DOM elements not found");
    return;
  }

  slider.max   = SHADOW_HOURS.length - 1;
  slider.value = SHADOW_HOURS.indexOf(currentShadowHour);
  _syncTimeDisplay(currentShadowHour);
  _syncDateInput(new Date());

  slider.addEventListener("input", (e) => {
    _stopAnimation();
    updateShadowLayer(map, SHADOW_HOURS[Number(e.target.value)]);
  });

  dateInput.addEventListener("change", () => {
    _stopAnimation();
  });

  todayBtn.addEventListener("click", () => {
    const now = new Date();
    _stopAnimation();
    _syncDateInput(now);
    updateShadowLayer(map, _getClosestShadowHour(now));
  });

  playBtn.addEventListener("click", () => {
    if (_animationRunning) _stopAnimation();
    else _startAnimation(map);
  });

  toggle.addEventListener("click", () => {
    const isOpen = !panel.classList.contains("hidden");
    if (isOpen) {
      panel.classList.add("hidden");
      hideShadowLayer(map);
    } else {
      panel.classList.remove("hidden");
      showShadowLayer(map);
    }
  });

  hideBtn.addEventListener("click", () => {
    panel.classList.add("hidden");
    hideShadowLayer(map);
  });
}
