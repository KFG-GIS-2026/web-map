// ============================================================
// config.js – shared configuration and type definitions
// ============================================================

let simpleMode = true;

const COMPLEX_CAMERA = { pitch: 0, bearing: 0 };
const SIMPLE_CAMERA  = { pitch: 0, bearing: 0 };
const SHADOW_MIN_ZOOM = 15;

// Base map style: OpenFreeMap bright (no API key required, OSM data)
const MAP_STYLE = "https://tiles.openfreemap.org/styles/bright";

// ── External data repository ──────────────────────────────
// All GeoJSON data (POIs, boundary, symbols) is hosted separately on
// GitHub Pages to keep the map repo and data repo independent.
const DATA_BASE_URL = "https://kfg-gis-2026.github.io/web-map-data";

// Image extent of the shadow raster in WGS84 coordinates
// Order: [NW, NE, SE, SW]
const SHADOW_COORDS = [
  [8.73803182321166, 49.41863840982511],
  [8.9035906286068,  49.41863840982511],
  [8.9035906286068,  49.3644124949337 ],
  [8.73803182321166, 49.3644124949337 ]
];

// POI categories — icons and GeoJSON files are loaded from DATA_BASE_URL
const POI_CATEGORIES = [
  { cat: "playground", file: "Spielplatz_Punkte.geojson",  icon: "001-slide.png",      label: "Spielplatz",  color: "#FF7043" },
  { cat: "park",       file: "Park_Punkte.geojson",        icon: "002-park.png",       label: "Park",        color: "#66BB6A" },
  { cat: "bench",      file: "Sitzbank.geojson",           icon: "003-bank.png",       label: "Sitzbank",    color: "#8D6E63" },
  { cat: "drinking",   file: "Trinkwasserstelle.geojson",  icon: "004-water.png",      label: "Trinkwasser", color: "#29B6F6" },
  { cat: "toilet",     file: "Toilete.geojson",            icon: "005-toilet.png",     label: "Toilette",    color: "#9575CD" },
  { cat: "church",     file: "Kirche.geojson",             icon: "006-church.png",     label: "Kirche",      color: "#795548" },
  { cat: "fountain",   file: "Brunnen.geojson",            icon: "007-fountain.png",   label: "Brunnen",     color: "#2196F3" },
  { cat: "library",    file: "Bücherei.geojson",           icon: "008-open-book.png",  label: "Bücherei",    color: "#AB47BC" },
  { cat: "museum",     file: "Museum.geojson",             icon: "009-museum-art.png", label: "Museum",      color: "#FF9800" }
];

function getCategoryLabel(categoryOrCat) {
  const cat = typeof categoryOrCat === "string" ? categoryOrCat : categoryOrCat?.cat;
  return typeof t === "function" ? t(`category_${cat}`) : (getCategoryByKey(cat)?.label || "Ort");
}

function getCategoryByKey(cat) {
  return POI_CATEGORIES.find((c) => c.cat === cat) || null;
}

// Convenience helpers to build full URLs from the external data repo
function poiUrl(filename)    { return `${DATA_BASE_URL}/osm_poi/${filename}`; }
function symbolUrl(filename) { return `${DATA_BASE_URL}/poi_symbols/${filename}`; }
function boundaryUrl(filename) { return `${DATA_BASE_URL}/boundary/${filename}`; }
function shadowUrl(filename) { return `${DATA_BASE_URL}/shadows/${filename}`; }

function ensureShadowMinimumZoom(map) {
  if (!map || map.getZoom() >= SHADOW_MIN_ZOOM) return;
  map.easeTo({ zoom: SHADOW_MIN_ZOOM, duration: 500 });
}

function getInitialViewMode() {
  const stateMode = window.__INITIAL_MAP_STATE?.mode;
  return stateMode === "complex" ? "complex" : "simple";
}

// ── Display-mode helpers (used by config + map.js) ────────

const FALLBACK_TYPE = { key: "other", emoji: "📍", label: "Ort", cat: "other", color: "#607D8B" };

function getType(props) {
  return typeof TYPE_MAP !== "undefined"
    ? (TYPE_MAP.find((t) => t.match(props)) || FALLBACK_TYPE)
    : FALLBACK_TYPE;
}

function initDisplayMode(map) {
  const toggle      = document.getElementById("mode-toggle");
  const mobileToggle = document.getElementById("mobile-mode-toggle");
  const shadowBar   = document.getElementById("shadow-bar");
  const shadowBarOpen = document.getElementById("shadow-bar-open");
  const shadowDateSection = document.getElementById("shadow-date-section");
  const addressSearchSection = document.getElementById("address-search-section");
  const solarFilterSection = document.getElementById("solar-filter-section");
  const solarLegendSection = document.getElementById("solar-legend-section");
  const clusterControlSection = document.getElementById("cluster-control-section");
  const threeDHint  = document.getElementById("three-d-hint");
  const threeDHintToggle = document.getElementById("three-d-hint-toggle");

  if (!toggle || !shadowBar) return;

  function syncThreeDHintToggle() {
    if (!threeDHint || !threeDHintToggle) return;
    const isCollapsed = threeDHint.classList.contains("collapsed");
    threeDHintToggle.setAttribute("aria-expanded", String(!isCollapsed));
  }

  function setLabelState(isComplex) {
    document.querySelectorAll(".mode-label, .mobile-mode-label").forEach((label) => {
      const isSimple = label.dataset.mode === "simple";
      const active = isSimple ? !isComplex : isComplex;
      label.classList.toggle("active", active);
      label.classList.toggle("inactive", !active);
    });
  }

  function syncModeToggles(isComplex) {
    toggle.checked = isComplex;
    if (mobileToggle) mobileToggle.checked = isComplex;
  }

  function isMobileViewport() {
    return window.matchMedia("(max-width: 600px)").matches;
  }

  function setBuildingVisibility(visibility) {
    if (map.getLayer("3d-buildings"))
      map.setLayoutProperty("3d-buildings", "visibility", visibility);
  }

  function setMapPerspective(camera) {
    map.easeTo({ pitch: camera.pitch, bearing: camera.bearing, duration: 500 });
  }

  function setMapTiltEnabled(enabled) {
    if (enabled) {
      map.dragRotate.enable();
      map.touchZoomRotate.enableRotation();
    } else {
      map.dragRotate.disable();
      map.touchZoomRotate.disableRotation();
    }
  }

  function applyMode(isComplex) {
    simpleMode = !isComplex;
    document.body.classList.toggle("simple-mode", simpleMode);
    document.body.classList.toggle("complex-mode", isComplex);
    setLabelState(isComplex);
    syncModeToggles(isComplex);

    if (isComplex) {
      if (isMobileViewport()) {
        if (!shadowBar.classList.contains("open")) shadowBar.style.display = "none";
      } else {
        shadowBar.style.display = "flex";
      }
      shadowBarOpen?.classList.add("hidden");
      if (shadowDateSection) shadowDateSection.style.display = "grid";
      if (addressSearchSection) addressSearchSection.style.display = "block";
      if (solarFilterSection) solarFilterSection.style.display = "grid";
      if (solarLegendSection) solarLegendSection.style.display = "none";
      if (clusterControlSection) clusterControlSection.style.display = "grid";
      threeDHint?.classList.remove("hidden");
      showShadowLayer(map);
      if (typeof setShadowToCurrentTime === "function") setShadowToCurrentTime(map);
      setBuildingVisibility("visible");
      setMapTiltEnabled(true);
      setMapPerspective(COMPLEX_CAMERA);
    } else {
      shadowBar.style.display = "none";
      shadowBarOpen?.classList.add("hidden");
      if (shadowDateSection) shadowDateSection.style.display = "none";
      if (addressSearchSection) addressSearchSection.style.display = "none";
      if (solarFilterSection) solarFilterSection.style.display = "none";
      if (solarLegendSection) solarLegendSection.style.display = "grid";
      if (clusterControlSection) clusterControlSection.style.display = "none";
      threeDHint?.classList.add("hidden");
      if (typeof _stopAnimation === "function") _stopAnimation();
      hideShadowLayer(map);
      setBuildingVisibility("none");
      setMapTiltEnabled(false);
      setMapPerspective(SIMPLE_CAMERA);
    }

    if (typeof syncSimpleSolarLegendNote === "function") syncSimpleSolarLegendNote();
    if (typeof updatePOISource === "function") updatePOISource(map);
  }

  toggle.addEventListener("change", () => applyMode(toggle.checked));
  mobileToggle?.addEventListener("change", () => applyMode(mobileToggle.checked));

  threeDHintToggle?.addEventListener("click", () => {
    threeDHint?.classList.toggle("collapsed");
    syncThreeDHintToggle();
  });

  const initialComplex = getInitialViewMode() === "complex";
  applyMode(initialComplex);
  syncModeToggles(initialComplex);
  syncThreeDHintToggle();

  document.addEventListener("i18n:changed", () => {
    setLabelState(!simpleMode);
    syncThreeDHintToggle();
    if (typeof syncSimpleSolarLegendNote === "function") syncSimpleSolarLegendNote();
    if (typeof syncSolarActionButton === "function") syncSolarActionButton();
    if (typeof syncClusterButtons === "function") syncClusterButtons();
    if (typeof syncCategoryGroupButtons === "function") syncCategoryGroupButtons();
    if (typeof syncCurrentPopupHTML === "function") syncCurrentPopupHTML();
    if (typeof updatePOISource === "function") updatePOISource(map);
  });
}
