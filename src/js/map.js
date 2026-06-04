// ============================================================
// map.js
// ============================================================

const map = new maplibregl.Map({
  container: "map",
  style: BASEMAPS.streets,
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

function add3DBuildings() {
  if (map.getLayer("building-3d")) return;
  const layers = map.getStyle().layers;
  let labelLayerId;
  for (const l of layers) {
    if (l.type === "symbol" && l.layout?.["text-field"]) { labelLayerId = l.id; break; }
  }
  const sources = map.getStyle().sources;
  let buildingSource;
  for (const id of Object.keys(sources)) {
    if (sources[id].type === "vector" && layers.some(l => l.source === id && l["source-layer"] === "building")) {
      buildingSource = id; break;
    }
  }
  if (!buildingSource) return;

  map.addLayer({
    id: "building-3d",
    type: "fill-extrusion",
    source: buildingSource,
    "source-layer": "building",
    minzoom: 14,
    filter: ["!=", ["get", "hide_3d"], true],
    paint: {
      "fill-extrusion-color": ["interpolate", ["linear"], ["get", "render_height"], 0, "#e8e0d8", 100, "#d0c8be"],
      "fill-extrusion-height": ["interpolate", ["linear"], ["zoom"], 14, 0, 16, ["coalesce", ["get", "render_height"], 10]],
      "fill-extrusion-base": ["case", [">=", ["zoom"], 16], ["coalesce", ["get", "render_min_height"], 0], 0],
      "fill-extrusion-opacity": 1.0
    }
  }, labelLayerId);
}

map.on("load", () => {
  add3DBuildings();
  createShadowLayer(map);
  initShadowControls(map);
  loadPOIs(map);
  initFilterControls(map);
});

document.getElementById("basemap-select").addEventListener("change", (e) => {
  map.setStyle(BASEMAPS[e.target.value]);
  map.once("styledata", () => {
    add3DBuildings();
    createShadowLayer(map);
    setupPOILayers(map);
    attachClusterEvents(map);
  });
});