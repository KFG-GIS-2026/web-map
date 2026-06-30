// ============================================================
// shadow.js – Shadow layer + time control with animation
// Now using pmtiles raster tilesets instead of single PNG images
// ============================================================
// Layer order in the map style:
//   ... basemap fill layers ... → shadow-layer → boundary mask → 3d-buildings → label layers
// The shadow is inserted before the first symbol/label layer.
// addBoundaryMask() in map.js then inserts the outside shading above it.
// ============================================================

let currentShadowHour  = 12;
let currentShadowMonth = 6;
let currentShadowDay   = 1;

let _animationTimer   = null;
let _animationRunning = false;
let _shadowVisible    = false;

const SHADOW_HOURS = Array.from({ length: 13 }, (_, i) => i + 8); // 8..20
const SHADOW_DATE_MONTHS = [
  { month: 5, label: "Mai" },
  { month: 6, label: "Juni" },
  { month: 7, label: "Juli" },
  { month: 8, label: "August" },
  { month: 9, label: "September" }
];
const SHADOW_DATE_DAYS = [1, 15];

// ── URL helpers ────────────────────────────────────────────

function getShadowUrl(month, day, hour) {
  const h = String(hour).padStart(2, "0");
  return `${DATA_BASE_URL}/shadows/${month}_${day}/shadow_${h}00.pmtiles`;
}

// ── Date select helpers ────────────────────────────────────

function _formatDateValue(month, day) {
  return `${month}-${day}`;
}

function _formatDateLabel(monthLabel, day) {
  return `${day === 1 ? "Anfang" : "Mitte"} ${monthLabel}`;
}

function _getAllowedShadowDates(year) {
  return SHADOW_DATE_MONTHS.flatMap(({ month, label }) =>
    SHADOW_DATE_DAYS.map((day) => ({
      value: _formatDateValue(month, day),
      label: _formatDateLabel(label, day),
      month,
      day,
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
  if (!input) return;
  const next = _getNextAllowedShadowDate(date);
  input.value = next.value;
  currentShadowMonth = next.month;
  currentShadowDay   = next.day;
}

// ── Source / Layer management ──────────────────────────────
// pmtiles sources cannot be swapped in-place like image sources via
// updateImage(). Instead, the source + layer are removed and re-added
// whenever the hour or date changes.

function createShadowLayer(map) {
  _rebuildShadowSource(map);
}

function _rebuildShadowSource(map) {
  const wasVisible = map.getLayer("shadow-layer")
    ? map.getLayoutProperty("shadow-layer", "visibility") === "visible"
    : _shadowVisible;

  if (map.getLayer("shadow-layer")) map.removeLayer("shadow-layer");
  if (map.getSource("shadow"))      map.removeSource("shadow");

  const url = getShadowUrl(currentShadowMonth, currentShadowDay, currentShadowHour);

  map.addSource("shadow", {
    type: "raster",
    url: `pmtiles://${url}`,
    tileSize: 256
  });

  // Insert shadow directly below the lowest layer that must stay above it.
  // On rebuild (hour/date change), 3d-buildings and boundary-mask-layer
  // already exist, so we must anchor against THEM, not against "the first
  // label layer" — otherwise re-adding shadow-layer pushes it above
  // 3d-buildings (since that layer is by then sitting right below labels).
  const styleLayers = map.getStyle().layers;
  let beforeLayerId;
  for (const layer of styleLayers) {
    if (
      layer.id === "boundary-mask-layer" ||
      layer.id === "boundary-line-layer" ||
      layer.id === "3d-buildings"
    ) {
      beforeLayerId = layer.id;
      break;
    }
  }
  // Fallback for the very first call, before boundary/3D layers exist yet:
  // insert before the first label layer instead.
  if (!beforeLayerId) {
    for (const layer of styleLayers) {
      if (layer.type === "symbol" && layer.layout?.["text-field"]) {
        beforeLayerId = layer.id;
        break;
      }
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

  map.setLayoutProperty("shadow-layer", "visibility", wasVisible ? "visible" : "none");
  _syncShadowToggle();
}

async function updateShadowLayer(map, hour) {
  currentShadowHour = hour;
  _rebuildShadowSource(map);
  _syncTimeDisplay(hour);
  _syncSlider(hour);
  if (typeof updatePOISource === "function") updatePOISource(map);
  return true;
}

function updateShadowDate(map, month, day) {
  currentShadowMonth = month;
  currentShadowDay   = day;
  _rebuildShadowSource(map);
  if (typeof updatePOISource === "function") updatePOISource(map);
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
  const slider     = document.getElementById("shadow-slider");
  const toggle      = document.getElementById("shadow-toggle");
  const playBtn     = document.getElementById("shadow-play");
  const dateInput   = document.getElementById("shadow-date");
  const currentBtn  = document.getElementById("shadow-current");

  if (!slider || !toggle || !playBtn || !dateInput || !currentBtn) {
    console.warn("Shadow controls: DOM elements not found");
    return;
  }

  slider.max   = SHADOW_HOURS.length - 1;
  slider.value = SHADOW_HOURS.indexOf(currentShadowHour);
  _syncTimeDisplay(currentShadowHour);

  _populateShadowDateSelect(dateInput, new Date());
  _syncDateInput(new Date());

  slider.addEventListener("input", (e) => {
    _stopAnimation();
    updateShadowLayer(map, SHADOW_HOURS[Number(e.target.value)]);
  });

  dateInput.addEventListener("change", () => {
    _stopAnimation();
    const [month, day] = dateInput.value.split("-").map(Number);
    updateShadowDate(map, month, day);
  });

  currentBtn.addEventListener("click", () => {
    _stopAnimation();
    _syncDateInput(new Date());
    _rebuildShadowSource(map);
    if (typeof updatePOISource === "function") updatePOISource(map);
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