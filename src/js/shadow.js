// ============================================================
// shadow.js – Shadow layer + time control with animation
// ============================================================
// Layer order in the map style:
//   ... basemap fill layers ... → shadow-layer → boundary mask → 3d-buildings → label layers
// The shadow is inserted before the first symbol/label layer.
// addBoundaryMask() in map.js then inserts the outside shading above it.
// ============================================================

let currentShadowHour = 12;
let _animationTimer   = null;
let _animationRunning = false;
let _shadowVisible    = false;
let _shadowUpdateSeq  = 0;

const _shadowImageCache = new Map();

const SHADOW_HOURS = Array.from({ length: 13 }, (_, i) => i + 8); // 8..20
const SHADOW_DATE_MONTHS = [
  { month: 4, label: "April" },
  { month: 5, label: "Mai" },
  { month: 6, label: "Juni" },
  { month: 7, label: "Juli" },
  { month: 8, label: "August" },
  { month: 9, label: "September" }
];
const SHADOW_DATE_DAYS = [1, 15];

function getShadowImage(hour) {
  const h = String(hour).padStart(2, "0");
  return `data/shadows/shadow_${h}00.png`;
}

function _preloadShadowImage(url) {
  if (_shadowImageCache.has(url)) return _shadowImageCache.get(url);

  const promise = new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = url;
  });

  _shadowImageCache.set(url, promise);
  return promise;
}

function _preloadShadowImages() {
  SHADOW_HOURS.forEach((hour) => _preloadShadowImage(getShadowImage(hour)));
}

function _formatDateValue(month, day) {
  const paddedMonth = String(month).padStart(2, "0");
  const paddedDay = String(day).padStart(2, "0");
  return `${paddedMonth}-${paddedDay}`;
}

function _formatDateLabel(monthLabel, day) {
  return `${day === 1 ? "Anfang" : "Mitte"} ${monthLabel}`;
}

function _getAllowedShadowDates(year) {
  return SHADOW_DATE_MONTHS.flatMap(({ month, label }) =>
    SHADOW_DATE_DAYS.map((day) => ({
      value: _formatDateValue(month, day),
      label: _formatDateLabel(label, day),
      date: new Date(year, month - 1, day, 12)
    }))
  );
}

function _getNextAllowedShadowDate(date) {
  const today = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const options = _getAllowedShadowDates(date.getFullYear());
  return options.find((option) => option.date >= today) || options[0];
}

function _populateShadowDateSelect(select, referenceDate) {
  const options = _getAllowedShadowDates(referenceDate.getFullYear());
  select.innerHTML = "";
  options.forEach((option) => {
    const el = document.createElement("option");
    el.value = option.value;
    el.textContent = option.label;
    select.appendChild(el);
  });
}

function _formatDateInputValue(date) {
  return _getNextAllowedShadowDate(date).value;
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
  // Boundary and 3D layers are inserted later before that same label layer,
  // so they render above the shadow raster.
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

  // Start hidden; the separate shadow toggle controls visibility.
  map.setLayoutProperty("shadow-layer", "visibility", "none");
  _syncShadowToggle();
}

async function updateShadowLayer(map, hour) {
  const updateSeq = ++_shadowUpdateSeq;
  const url = getShadowImage(hour);
  const loaded = await _preloadShadowImage(url);
  if (updateSeq !== _shadowUpdateSeq) return false;

  currentShadowHour = hour;
  const source = map.getSource("shadow");
  if (source) {
    source.updateImage({ url, coordinates: SHADOW_COORDS });
  }
  _syncTimeDisplay(hour);
  _syncSlider(hour);
  if (typeof updatePOISource === "function") updatePOISource(map);

  if (!loaded) console.warn(`Shadow image could not be preloaded: ${url}`);
  return true;
}

function _syncTimeDisplay(hour) {
  const el = document.getElementById("shadow-time");
  if (el) el.textContent = `${String(hour).padStart(2, "0")}:00 Uhr`;
}

function _syncSlider(hour) {
  const slider = document.getElementById("shadow-slider");
  if (slider) slider.value = SHADOW_HOURS.indexOf(hour);
}

function _syncShadowToggle() {
  const input = document.getElementById("shadow-toggle");
  if (!input) return;
  input.checked = _shadowVisible;
}

// ── Animation ─────────────────────────────────────────────

const ANIMATION_SPEED = 1000;

function _startAnimation(map) {
  if (_animationRunning) return;
  _animationRunning = true;
  document.getElementById("shadow-play").textContent = "⏸";

  async function tick() {
    if (!_animationRunning) return;
    const nextIdx = (SHADOW_HOURS.indexOf(currentShadowHour) + 1) % SHADOW_HOURS.length;
    await updateShadowLayer(map, SHADOW_HOURS[nextIdx]);
    if (_animationRunning) _animationTimer = setTimeout(tick, ANIMATION_SPEED);
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
  _shadowVisible = true;
  if (map.getLayer("shadow-layer"))
    map.setLayoutProperty("shadow-layer", "visibility", "visible");
  _syncShadowToggle();
}

function hideShadowLayer(map) {
  _shadowVisible = false;
  if (map.getLayer("shadow-layer"))
    map.setLayoutProperty("shadow-layer", "visibility", "none");
  _syncShadowToggle();
}

// ── UI Events ─────────────────────────────────────────────

function initShadowControls(map) {
  const slider  = document.getElementById("shadow-slider");
  const toggle  = document.getElementById("shadow-toggle");
  const playBtn = document.getElementById("shadow-play");
  const dateInput = document.getElementById("shadow-date");
  const currentBtn = document.getElementById("shadow-current");

  if (!slider || !toggle || !playBtn || !dateInput || !currentBtn) {
    console.warn("Shadow controls: DOM elements not found");
    return;
  }

  slider.max   = SHADOW_HOURS.length - 1;
  slider.value = SHADOW_HOURS.indexOf(currentShadowHour);
  _syncTimeDisplay(currentShadowHour);
  _populateShadowDateSelect(dateInput, new Date());
  _syncDateInput(new Date());
  _preloadShadowImages();

  slider.addEventListener("input", (e) => {
    _stopAnimation();
    updateShadowLayer(map, SHADOW_HOURS[Number(e.target.value)]);
  });

  dateInput.addEventListener("change", () => {
    _stopAnimation();
  });

  currentBtn.addEventListener("click", () => {
    _stopAnimation();
    _syncDateInput(new Date());
  });

  playBtn.addEventListener("click", () => {
    if (_animationRunning) _stopAnimation();
    else _startAnimation(map);
  });

  toggle.addEventListener("change", () => {
    if (toggle.checked) showShadowLayer(map);
    else hideShadowLayer(map);
  });

  _syncShadowToggle();
}
