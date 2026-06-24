// ============================================================
// map.js – Map initialization, 3D buildings, sidebar,
//          boundary mask
// ============================================================

const map = new maplibregl.Map({
  container: "map",
  style: MAP_STYLE,
  center: [8.8, 49.39],
  zoom: 13,
  pitch: SIMPLE_CAMERA.pitch,
  bearing: SIMPLE_CAMERA.bearing,
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
function add3DBuildings() {
  if (map.getLayer("3d-buildings")) return;

  const layers = map.getStyle().layers;
  let labelLayerId;
  for (let i = 0; i < layers.length; i++) {
    if (layers[i].type === "symbol" && layers[i].layout["text-field"]) {
      labelLayerId = layers[i].id;
      break;
    }
  }

  if (!map.getSource("openfreemap")) {
    map.addSource("openfreemap", { url: "https://tiles.openfreemap.org/planet", type: "vector" });
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
          "interpolate", ["linear"], ["zoom"], 15, 0, 16, ["get", "render_height"]
        ],
        "fill-extrusion-base": ["coalesce", ["get", "render_min_height"], 0],
        "fill-extrusion-opacity": 1.0
      }
    },
    labelLayerId
  );
}

// ── Boundary mask (island effect) ────────────────────────
// The mask sits directly above the basemap tiles but below the
// shadow layer, POI clusters, and labels — so none of those
// are covered by the dark overlay.
//
// Layer order after load:
//   basemap layers
//   → boundary-mask-layer   (dark overlay outside Neckargemünd)
//   → boundary-line-layer   (green border)
//   → shadow-layer          (added in shadow.js before first label)
//   → 3d-buildings
//   → label layers
//   → clusters / cluster-count  (added by pois.js)
//   [HTML markers are DOM elements, always on top]
async function addBoundaryMask() {
  try {
    const res = await fetch("data/boundary/Neckargemuend_boundary.geojson");
    const boundary = await res.json();

    const boundaryFeature = boundary.features[0];
    const boundaryCoords  = boundaryFeature.geometry.coordinates;

    // World bounding box as the outer ring — boundary polygon as the hole
    const worldBox = [
      [-180, -90], [180, -90], [180, 90], [-180, 90], [-180, -90]
    ];
    const holeRing = boundaryFeature.geometry.type === "MultiPolygon"
      ? boundaryCoords[0][0]
      : boundaryCoords[0];

    const maskFeature = {
      type: "Feature",
      geometry: { type: "Polygon", coordinates: [worldBox, holeRing] },
      properties: {}
    };

    // Find the first symbol layer — insert mask BEFORE it so labels
    // and POI clusters remain on top
    const layers = map.getStyle().layers;
    let firstSymbolId;
    for (const layer of layers) {
      if (layer.type === "symbol" && layer.layout?.["text-field"]) {
        firstSymbolId = layer.id;
        break;
      }
    }

    map.addSource("boundary-mask", {
      type: "geojson",
      data: { type: "FeatureCollection", features: [maskFeature] }
    });

    // Insert below labels (and therefore below shadow + POIs)
    map.addLayer(
      {
        id: "boundary-mask-layer",
        type: "fill",
        source: "boundary-mask",
        paint: { "fill-color": "#1a1a2e", "fill-opacity": 0.4 }
      },
      firstSymbolId  // inserted before labels → under shadow, POIs, labels
    );

    // Boundary outline — also below labels
    map.addSource("boundary-line", { type: "geojson", data: boundary });
    map.addLayer(
      {
        id: "boundary-line-layer",
        type: "line",
        source: "boundary-line",
        paint: { "line-color": "#1a6b3c", "line-width": 2, "line-opacity": 0.7 }
      },
      firstSymbolId
    );

  } catch (err) {
    console.error("Boundary load error:", err);
  }
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
  // Order matters:
  // 1. boundary mask first (goes under everything else)
  // 2. shadow layer (inserted before first label in shadow.js)
  // 3. 3D buildings (on top of shadow)
  // 4. POI clusters (added last by pois.js, on top of buildings)
  addBoundaryMask().then(() => {
    createShadowLayer(map);
    add3DBuildings();
    initSidebar();
    initShadowControls(map);
    loadPOIs(map);
    initFilterControls(map);
  });
});
