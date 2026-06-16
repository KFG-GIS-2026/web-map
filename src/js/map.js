// ============================================================
// map.js – Map initialization, 3D buildings, sidebar logic
// ============================================================

const map = new maplibregl.Map({
  container: "map",
  style: MAP_STYLE,
  center: [8.8, 49.39],
  zoom: 13,
  pitch: 45,
  bearing: -17.6,
  canvasContextAttributes: { antialias: true }
});

map.addControl(
  new maplibregl.NavigationControl({ visualizePitch: true, showZoom: true, showCompass: true }),
  "top-right"
);
map.addControl(
  new maplibregl.GeolocateControl({ positionOptions: { enableHighAccuracy: true }, trackUserLocation: true }),
  "top-right"
);

// ── 3D Buildings ──────────────────────────────────────────
// Follows the official MapLibre example exactly.
// A separate vector source "openfreemap" is added so we have
// full control over layer order: shadow → buildings → labels.
function add3DBuildings() {
  if (map.getLayer("3d-buildings")) return;

  // Find first symbol layer with text to insert buildings below labels
  const layers = map.getStyle().layers;
  let labelLayerId;
  for (let i = 0; i < layers.length; i++) {
    if (layers[i].type === "symbol" && layers[i].layout["text-field"]) {
      labelLayerId = layers[i].id;
      break;
    }
  }

  if (!map.getSource("openfreemap")) {
    map.addSource("openfreemap", {
      url: "https://tiles.openfreemap.org/planet",
      type: "vector"
    });
  }

  map.addLayer(
    {
      id: "3d-buildings",
      source: "openfreemap",
      "source-layer": "building",
      type: "fill-extrusion",
      minzoom: 15,
      filter: ["!=", ["get", "hide_3d"], true],
      paint: {
        "fill-extrusion-color": [
          "interpolate", ["linear"], ["get", "render_height"],
          0, "lightgray", 200, "royalblue", 400, "lightblue"
        ],
        "fill-extrusion-height": [
          "interpolate", ["linear"], ["zoom"],
          15, 0,
          16, ["get", "render_height"]
        ],
        "fill-extrusion-base": ["coalesce", ["get", "render_min_height"], 0],
        "fill-extrusion-opacity": 1.0
      }
    },
    labelLayerId
  );
}

// ── Sidebar collapse ──────────────────────────────────────

function initSidebar() {
  const sidebar   = document.getElementById("sidebar");
  const openBtn   = document.getElementById("sidebar-open");
  const toggleBtn = document.getElementById("sidebar-toggle");

  function closeSidebar() {
    sidebar.classList.add("collapsed");
    openBtn.classList.add("visible");
  }
  function openSidebar() {
    sidebar.classList.remove("collapsed");
    openBtn.classList.remove("visible");
  }

  toggleBtn.addEventListener("click", closeSidebar);
  openBtn.addEventListener("click", openSidebar);

  if (window.innerWidth < 600) closeSidebar();
}

// ── Map load ──────────────────────────────────────────────

map.on("load", () => {
  createShadowLayer(map);   // shadow first — buildings rendered on top
  add3DBuildings();
  initSidebar();
  initShadowControls(map);
  loadPOIs(map);
  initFilterControls(map);
});