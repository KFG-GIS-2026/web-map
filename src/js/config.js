// ============================================================
// config.js – shared configuration and type definitions
// ============================================================

let simpleMode = false;

const COMPLEX_CAMERA = {
  pitch: 45,
  bearing: -17.6
};

const SIMPLE_CAMERA = {
  pitch: 0,
  bearing: 0
};

// Base map style: OpenFreeMap bright (no API key required, OSM data)
const MAP_STYLE = "https://tiles.openfreemap.org/styles/bright";

// Image extent of the shadow raster in WGS84 coordinates
// Order: [NW, NE, SE, SW]
const SHADOW_COORDS = [
  [8.793322316, 49.385219820],
  [8.797466933, 49.385219820],
  [8.797466933, 49.382514018],
  [8.793322316, 49.382514018]
];

// POI types with category, color and emoji
const TYPE_MAP = [
  { key: "fountain",         match: (p) => p.amenity === "fountain",        emoji: "⛲", label: "Brunnen",             cat: "fountain",   color: "#2196F3" },
  { key: "drinking_water",   match: (p) => p.amenity === "drinking_water",   emoji: "🚰", label: "Trinkwasser",         cat: "drinking",   color: "#29B6F6" },
  { key: "bench",            match: (p) => p.amenity === "bench",            emoji: "🪑", label: "Bank",                cat: "bench",      color: "#8D6E63" },
  { key: "library",          match: (p) => p.amenity === "library",          emoji: "📚", label: "Bibliothek",          cat: "building",   color: "#AB47BC" },
  { key: "community_centre", match: (p) => p.amenity === "community_centre", emoji: "🏛️", label: "Gemeinschaftszentr.", cat: "building",   color: "#FF9800" },
  { key: "playground",       match: (p) => p.leisure === "playground",       emoji: "🛝", label: "Spielplatz",          cat: "playground", color: "#FF7043" },
  { key: "park",             match: (p) => p.leisure === "park",             emoji: "🏞️", label: "Park",                cat: "park",       color: "#66BB6A" },
  { key: "forest",           match: (p) => p.landuse === "forest",           emoji: "🌲", label: "Wald",                cat: "forest",     color: "#2E7D32" },
  { key: "water",            match: (p) => p.natural === "water",            emoji: "💧", label: "Wasserfläche",        cat: "water",      color: "#1E88E5" },
  { key: "river",            match: (p) => p.waterway === "river",           emoji: "🌊", label: "Fluss",               cat: "water",      color: "#039BE5" },
  { key: "bus_stop",         match: (p) => p.highway === "bus_stop",         emoji: "🚌", label: "Bushaltestelle",      cat: "busstop",    color: "#FFB300" },
];

const FALLBACK_TYPE = { key: "other", emoji: "📍", label: "Ort", cat: "other", color: "#607D8B" };

function getType(props) {
  return TYPE_MAP.find((t) => t.match(props)) || FALLBACK_TYPE;
}


function initDisplayMode(map) {
  const toggle = document.getElementById("mode-toggle");
  const simpleLabel = document.querySelector(".mode-label:first-child");
  const complexLabel = document.querySelector(".mode-label:last-child");
  const shadowBar = document.getElementById("shadow-bar");
  const shadowPanel = document.getElementById("shadow-panel");

  if (!toggle || !shadowBar) return;

  function setLabelState(isComplex) {
    simpleLabel?.classList.toggle("active", !isComplex);
    simpleLabel?.classList.toggle("inactive", isComplex);
    complexLabel?.classList.toggle("active", isComplex);
    complexLabel?.classList.toggle("inactive", !isComplex);
  }

  function setBuildingVisibility(visibility) {
    if (map.getLayer("3d-buildings")) {
      map.setLayoutProperty("3d-buildings", "visibility", visibility);
    }
  }

  function setMapPerspective(camera) {
    map.easeTo({
      pitch: camera.pitch,
      bearing: camera.bearing,
      duration: 500
    });
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
      shadowPanel?.classList.remove("hidden");
      showShadowLayer(map);
      setBuildingVisibility("visible");
      setMapTiltEnabled(true);
      setMapPerspective(COMPLEX_CAMERA);
    } else {
      shadowBar.style.display = "none";
      shadowPanel?.classList.add("hidden");
      hideShadowLayer(map);
      setBuildingVisibility("none");
      setMapTiltEnabled(false);
      setMapPerspective(SIMPLE_CAMERA);
    }
  }

  toggle.addEventListener("change", () => {
    applyMode(toggle.checked);
  });

  applyMode(!simpleMode);
}
