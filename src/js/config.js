// ============================================================
// config.js – shared configuration and type definitions
// ============================================================

let simpleMode = false;

const COMPLEX_CAMERA = { pitch: 0, bearing: 0 };
const SIMPLE_CAMERA  = { pitch: 0, bearing: 0 };

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

function getCategoryByKey(cat) {
  return POI_CATEGORIES.find((c) => c.cat === cat) || null;
}

// Convenience helpers to build full URLs from the external data repo
function poiUrl(filename)    { return `${DATA_BASE_URL}/osm_poi/${filename}`; }
function symbolUrl(filename) { return `${DATA_BASE_URL}/poi_symbols/${filename}`; }
function boundaryUrl(filename) { return `${DATA_BASE_URL}/boundary/${filename}`; }
function shadowUrl(filename) { return `${DATA_BASE_URL}/shadows/${filename}`; }

// ── Display-mode helpers (used by config + map.js) ────────

const FALLBACK_TYPE = { key: "other", emoji: "📍", label: "Ort", cat: "other", color: "#607D8B" };

function getType(props) {
  return typeof TYPE_MAP !== "undefined"
    ? (TYPE_MAP.find((t) => t.match(props)) || FALLBACK_TYPE)
    : FALLBACK_TYPE;
}

function initDisplayMode(map) {
  const toggle      = document.getElementById("mode-toggle");
  const simpleLabel = document.querySelector(".mode-label:first-child");
  const complexLabel = document.querySelector(".mode-label:last-child");
  const shadowBar   = document.getElementById("shadow-bar");
  const shadowDateSection = document.getElementById("shadow-date-section");
  const threeDHint  = document.getElementById("three-d-hint");
  const threeDHintToggle = document.getElementById("three-d-hint-toggle");

  if (!toggle || !shadowBar) return;

  function syncThreeDHintToggle() {
    if (!threeDHint || !threeDHintToggle) return;
    const isCollapsed = threeDHint.classList.contains("collapsed");
    const label = threeDHintToggle.querySelector(".three-d-toggle-label");
    if (label) label.innerHTML = isCollapsed ? "❮ 3D" : "❯";
    threeDHintToggle.setAttribute("aria-expanded", String(!isCollapsed));
  }

  function setLabelState(isComplex) {
    simpleLabel?.classList.toggle("active",   !isComplex);
    simpleLabel?.classList.toggle("inactive",  isComplex);
    complexLabel?.classList.toggle("active",   isComplex);
    complexLabel?.classList.toggle("inactive", !isComplex);
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
    toggle.checked = isComplex;
    setLabelState(isComplex);

    if (isComplex) {
      shadowBar.style.display = "flex";
      if (shadowDateSection) shadowDateSection.style.display = "grid";
      threeDHint?.classList.remove("hidden");
      showShadowLayer(map);
      setBuildingVisibility("visible");
      setMapTiltEnabled(true);
      setMapPerspective(COMPLEX_CAMERA);
    } else {
      shadowBar.style.display = "none";
      if (shadowDateSection) shadowDateSection.style.display = "none";
      threeDHint?.classList.add("hidden");
      if (typeof _stopAnimation === "function") _stopAnimation();
      hideShadowLayer(map);
      setBuildingVisibility("none");
      setMapTiltEnabled(false);
      setMapPerspective(SIMPLE_CAMERA);
    }

    if (typeof updatePOISource === "function") updatePOISource(map);
  }

  toggle.addEventListener("change", () => applyMode(toggle.checked));

  threeDHintToggle?.addEventListener("click", () => {
    threeDHint?.classList.toggle("collapsed");
    syncThreeDHintToggle();
  });

  applyMode(!simpleMode);
  syncThreeDHintToggle();
}
