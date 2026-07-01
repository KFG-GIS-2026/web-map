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
let _shadowSlot       = 0;
let _activeShadowLayerId = null;
let _activeShadowSourceId = null;
let _shadowTransitionId = 0;

const SHADOW_HOURS = Array.from({ length: 13 }, (_, i) => i + 8); // 8..20
const SHADOW_OPACITY = 0.55;
const SHADOW_FADE_MS = 260;
const SHADOW_SOURCE_LOAD_TIMEOUT_MS = 1600;
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
  _rebuildShadowSource(map, { fade: false });
}

function _rebuildShadowSourceLegacy(map) {
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

async function _rebuildShadowSource(map, options = {}) {
  const fade = options.fade !== false;
  const transitionId = ++_shadowTransitionId;
  const wasVisible = _isShadowLayerVisible(map);
  const nextSlot = _shadowSlot === 0 ? 1 : 0;
  const sourceId = `shadow-${nextSlot}`;
  const layerId = `shadow-layer-${nextSlot}`;
  const oldSourceId = _activeShadowSourceId;
  const oldLayerId = _activeShadowLayerId;

  _removeShadowLayerAndSource(map, layerId, sourceId);

  const url = getShadowUrl(currentShadowMonth, currentShadowDay, currentShadowHour);
  map.addSource(sourceId, {
    type: "raster",
    url: `pmtiles://${url}`,
    tileSize: 256
  });

  map.addLayer(
    {
      id: layerId,
      type: "raster",
      source: sourceId,
      paint: { "raster-opacity": fade && wasVisible ? 0 : SHADOW_OPACITY, "raster-fade-duration": 0 }
    },
    _getShadowBeforeLayerId(map)
  );

  map.setLayoutProperty(layerId, "visibility", wasVisible ? "visible" : "none");

  if (fade && wasVisible && oldLayerId && map.getLayer(oldLayerId)) {
    await new Promise((resolve) => requestAnimationFrame(resolve));
    await _fadeShadowLayers(map, oldLayerId, layerId, transitionId);
  } else if (oldLayerId || oldSourceId) {
    _removeShadowLayerAndSource(map, oldLayerId, oldSourceId);
  }

  if (transitionId !== _shadowTransitionId || !map.getLayer(layerId)) return false;

  _shadowSlot = nextSlot;
  _activeShadowLayerId = layerId;
  _activeShadowSourceId = sourceId;
  map.setPaintProperty(layerId, "raster-opacity", SHADOW_OPACITY);
  map.setLayoutProperty(layerId, "visibility", _shadowVisible ? "visible" : "none");
  _syncShadowToggle();
  return true;
}

function _getShadowBeforeLayerId(map) {
  const styleLayers = map.getStyle().layers;
  for (const layer of styleLayers) {
    if (
      layer.id === "boundary-mask-layer" ||
      layer.id === "boundary-line-layer" ||
      layer.id === "3d-buildings"
    ) {
      return layer.id;
    }
  }

  for (const layer of styleLayers) {
    if (layer.type === "symbol" && layer.layout?.["text-field"]) return layer.id;
  }
  return undefined;
}

function _removeShadowLayerAndSource(map, layerId, sourceId) {
  if (layerId && map.getLayer(layerId)) map.removeLayer(layerId);
  if (sourceId && map.getSource(sourceId)) map.removeSource(sourceId);
}

function _getShadowLayerIds(map) {
  return ["shadow-layer-0", "shadow-layer-1"].filter((layerId) => map.getLayer(layerId));
}

function _isShadowLayerVisible(map) {
  const layers = _getShadowLayerIds(map);
  if (!layers.length) return _shadowVisible;
  return layers.some((layerId) => map.getLayoutProperty(layerId, "visibility") === "visible");
}

function _waitForShadowSource(map, sourceId, transitionId) {
  return new Promise((resolve) => {
    let timeoutId = null;

    function cleanup(result) {
      map.off("sourcedata", check);
      map.off("idle", check);
      if (timeoutId) clearTimeout(timeoutId);
      resolve(result);
    }

    function check() {
      if (transitionId !== _shadowTransitionId || !map.getSource(sourceId)) {
        cleanup(false);
        return;
      }
      if (map.isSourceLoaded(sourceId)) cleanup(true);
    }

    timeoutId = setTimeout(() => cleanup(false), SHADOW_SOURCE_LOAD_TIMEOUT_MS);
    map.on("sourcedata", check);
    map.on("idle", check);
    check();
  });
}

function _fadeShadowLayers(map, oldLayerId, newLayerId, transitionId) {
  return new Promise((resolve) => {
    const startedAt = performance.now();

    function step(now) {
      if (transitionId !== _shadowTransitionId || !map.getLayer(newLayerId)) {
        resolve(false);
        return;
      }

      const t = Math.min((now - startedAt) / SHADOW_FADE_MS, 1);
      map.setPaintProperty(newLayerId, "raster-opacity", SHADOW_OPACITY * t);
      if (map.getLayer(oldLayerId)) {
        map.setPaintProperty(oldLayerId, "raster-opacity", SHADOW_OPACITY * (1 - t));
      }

      if (t < 1) {
        requestAnimationFrame(step);
      } else {
        if (map.getLayer(oldLayerId)) {
          const oldSourceId = oldLayerId.replace("shadow-layer", "shadow");
          _removeShadowLayerAndSource(map, oldLayerId, oldSourceId);
        }
        resolve(true);
      }
    }

    requestAnimationFrame(step);
  });
}

async function updateShadowLayer(map, hour) {
  currentShadowHour = hour;
  const updated = await _rebuildShadowSource(map);
  if (!updated) return false;
  _syncTimeDisplay(hour);
  _syncSlider(hour);
  if (typeof updatePOISource === "function") updatePOISource(map);
  return true;
}

async function updateShadowDate(map, month, day) {
  currentShadowMonth = month;
  currentShadowDay   = day;
  const updated = await _rebuildShadowSource(map);
  if (!updated) return false;
  if (typeof updatePOISource === "function") updatePOISource(map);
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
    updateShadowLayer(map, SHADOW_HOURS[nextIdx]).catch((err) => console.error("Shadow update error:", err));
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
  _getShadowLayerIds(map).forEach((layerId) => {
    map.setLayoutProperty(layerId, "visibility", "visible");
  });
  _syncShadowToggle();
}

function hideShadowLayer(map) {
  _shadowVisible = false;
  _getShadowLayerIds(map).forEach((layerId) => {
    map.setLayoutProperty(layerId, "visibility", "none");
  });
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
  _rebuildShadowSource(map, { fade: false });

  slider.addEventListener("input", (e) => {
    _stopAnimation();
    updateShadowLayer(map, SHADOW_HOURS[Number(e.target.value)]);
  });

  dateInput.addEventListener("change", () => {
    _stopAnimation();
    const [month, day] = dateInput.value.split("-").map(Number);
    updateShadowDate(map, month, day);
  });

  currentBtn.addEventListener("click", async () => {
    _stopAnimation();
    _syncDateInput(new Date());
    const updated = await _rebuildShadowSource(map);
    if (updated && typeof updatePOISource === "function") updatePOISource(map);
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
