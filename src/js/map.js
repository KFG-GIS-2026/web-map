// ============================================================
// map.js – Map initialization, style switching, sidebar logic
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

// ── Sidebar collapse ──────────────────────────────────────

function initSidebar() {
  const sidebar       = document.getElementById("sidebar");
  const openBtn       = document.getElementById("sidebar-open");
  const toggleBtn     = document.getElementById("sidebar-toggle");

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

  // Auto-collapse on mobile
  if (window.innerWidth < 600) closeSidebar();
}

// ── Map load ──────────────────────────────────────────────

map.on("load", () => {
  initSidebar();
  createShadowLayer(map);
  initShadowControls(map);
  loadPOIs(map);
  initFilterControls(map);
});

// ── Basemap switching ─────────────────────────────────────

document.getElementById("basemap-select").addEventListener("change", (e) => {
  map.setStyle(BASEMAPS[e.target.value]);
  map.once("styledata", () => {
    createShadowLayer(map);
    setupPOILayers(map);
    attachClusterEvents(map);
  });
});