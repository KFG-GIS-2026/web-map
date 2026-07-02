// ============================================================
// map.js – Map initialization, 3D buildings, sidebar,
//          boundary mask
// ============================================================
const pmtilesProtocol = new pmtiles.Protocol();
maplibregl.addProtocol("pmtiles", pmtilesProtocol.tile);

function parseInitialMapState() {
  const params = new URLSearchParams(window.location.search);
  const lngParam = params.get("lng");
  const latParam = params.get("lat");
  const lng = lngParam === null ? NaN : Number(lngParam);
  const lat = latParam === null ? NaN : Number(latParam);
  const zoomParam = params.get("z") ?? params.get("zoom");
  const zoom = zoomParam === null ? NaN : Number(zoomParam);
  const rawMode = (params.get("ansicht") || params.get("mode") || "").toLowerCase();
  const mode = rawMode === "komplex" || rawMode === "complex" ? "complex" : "simple";

  return {
    center: Number.isFinite(lng) && Number.isFinite(lat) ? [lng, lat] : [8.807, 49.39],
    zoom: Number.isFinite(zoom) ? zoom : 13,
    mode
  };
}

const INITIAL_MAP_STATE = parseInitialMapState();
window.__INITIAL_MAP_STATE = INITIAL_MAP_STATE;

const map = new maplibregl.Map({
  container: "map",
  style: MAP_STYLE,
  center: INITIAL_MAP_STATE.center,
  zoom: INITIAL_MAP_STATE.zoom,
  pitch: SIMPLE_CAMERA.pitch,
  bearing: SIMPLE_CAMERA.bearing,
  canvasContextAttributes: { antialias: true, preserveDrawingBuffer: true }
});

map.addControl(
  new maplibregl.NavigationControl({ visualizePitch: true, showZoom: true, showCompass: true }),
  "top-right"
);
map.addControl(
  new maplibregl.GeolocateControl({ positionOptions: { enableHighAccuracy: true }, trackUserLocation: true }),
  "top-right"
);

function buildCurrentMapLink(map) {
  const center = map.getCenter();
  const params = new URLSearchParams(window.location.search);
  params.set("lng", center.lng.toFixed(6));
  params.set("lat", center.lat.toFixed(6));
  params.set("z", map.getZoom().toFixed(2));
  params.set("ansicht", simpleMode ? "einfach" : "komplex");
  return `${window.location.origin}${window.location.pathname}?${params.toString()}`;
}

function setMapActionStatus(message) {
  const status = document.getElementById("map-action-status");
  if (!status) return;
  status.textContent = message || "";
  if (message) window.setTimeout(() => { status.textContent = ""; }, 2200);
}

async function copyCurrentMapLink(map) {
  const url = buildCurrentMapLink(map);
  try {
    await navigator.clipboard.writeText(url);
    setMapActionStatus("Link kopiert");
  } catch (err) {
    const textarea = document.createElement("textarea");
    textarea.value = url;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.left = "-9999px";
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    textarea.remove();
    setMapActionStatus("Link kopiert");
  }
}

function initMapActionControls(map) {
  const printButton = document.getElementById("map-print-button");
  const copyButton = document.getElementById("map-copy-link-button");
  const layer = document.getElementById("print-selection-layer");
  const box = document.getElementById("print-selection-box");
  const confirmButton = document.getElementById("print-selection-confirm");
  const cancelButton = document.getElementById("print-selection-cancel");
  const hint = document.getElementById("print-selection-hint");
  const mapContainer = map.getContainer();

  if (!printButton || !copyButton || !layer || !box || !confirmButton || !cancelButton) return;

  let start = null;
  let selection = null;

  function setBox(rect) {
    box.style.left = `${rect.left}px`;
    box.style.top = `${rect.top}px`;
    box.style.width = `${rect.width}px`;
    box.style.height = `${rect.height}px`;
    confirmButton.disabled = rect.width < 32 || rect.height < 32;
  }

  function resetSelection() {
    selection = null;
    start = null;
    setBox({ left: 0, top: 0, width: 0, height: 0 });
    confirmButton.disabled = true;
    if (hint) hint.textContent = "Bereich in der Karte aufziehen";
  }

  function enterPrintSelection() {
    resetSelection();
    layer.hidden = false;
    layer.setAttribute("aria-hidden", "false");
    printButton.setAttribute("aria-pressed", "true");
    map.dragPan.disable();
  }

  function exitPrintSelection() {
    layer.hidden = true;
    layer.setAttribute("aria-hidden", "true");
    printButton.setAttribute("aria-pressed", "false");
    if (!map.dragPan.isEnabled()) map.dragPan.enable();
    resetSelection();
  }

  function pointFromEvent(event) {
    const rect = mapContainer.getBoundingClientRect();
    return {
      x: Math.max(0, Math.min(rect.width, event.clientX - rect.left)),
      y: Math.max(0, Math.min(rect.height, event.clientY - rect.top))
    };
  }

  function rectFromPoints(a, b) {
    const left = Math.min(a.x, b.x);
    const top = Math.min(a.y, b.y);
    return {
      left,
      top,
      width: Math.abs(a.x - b.x),
      height: Math.abs(a.y - b.y)
    };
  }

  function printSelection() {
    if (!selection || selection.width < 32 || selection.height < 32) return;

    const printRect = { ...selection };
    const mapRect = mapContainer.getBoundingClientRect();
    const root = document.documentElement;

    exitPrintSelection();
    root.style.setProperty("--print-map-width", `${mapRect.width.toFixed(2)}px`);
    root.style.setProperty("--print-map-height", `${mapRect.height.toFixed(2)}px`);
    root.style.setProperty("--print-map-left", `${(-printRect.left).toFixed(2)}px`);
    root.style.setProperty("--print-map-top", `${(-printRect.top).toFixed(2)}px`);
    root.style.setProperty("--print-selection-width", `${printRect.width.toFixed(2)}px`);
    root.style.setProperty("--print-selection-height", `${printRect.height.toFixed(2)}px`);
    document.body.classList.add("map-print-active");

    let printStarted = false;
    let restored = false;

    const restoreAfterPrint = () => {
      if (restored) return;
      restored = true;
      window.removeEventListener("afterprint", restoreAfterPrint);
      document.body.classList.remove("map-print-active");
      root.style.removeProperty("--print-map-width");
      root.style.removeProperty("--print-map-height");
      root.style.removeProperty("--print-map-left");
      root.style.removeProperty("--print-map-top");
      root.style.removeProperty("--print-selection-width");
      root.style.removeProperty("--print-selection-height");
    };

    const startPrint = () => {
      if (printStarted) return;
      printStarted = true;
      window.addEventListener("afterprint", restoreAfterPrint, { once: true });
      window.print();
      window.setTimeout(() => {
        if (!document.body.classList.contains("map-print-active")) return;
        restoreAfterPrint();
      }, 2000);
    };

    requestAnimationFrame(() => window.setTimeout(startPrint, 120));
  }

  copyButton.addEventListener("click", () => copyCurrentMapLink(map));
  printButton.addEventListener("click", enterPrintSelection);
  cancelButton.addEventListener("click", exitPrintSelection);
  confirmButton.addEventListener("click", printSelection);

  layer.addEventListener("pointerdown", (event) => {
    if (event.target.closest(".print-selection-panel")) return;
    layer.setPointerCapture(event.pointerId);
    start = pointFromEvent(event);
    selection = { left: start.x, top: start.y, width: 0, height: 0 };
    setBox(selection);
    if (hint) hint.textContent = "Loslassen und Auswahl drucken";
  });

  layer.addEventListener("pointermove", (event) => {
    if (!start) return;
    selection = rectFromPoints(start, pointFromEvent(event));
    setBox(selection);
  });

  layer.addEventListener("pointerup", (event) => {
    if (!start) return;
    selection = rectFromPoints(start, pointFromEvent(event));
    setBox(selection);
    start = null;
    if (hint) hint.textContent = confirmButton.disabled
      ? "Bereich etwas groesser aufziehen"
      : "Auswahl drucken oder abbrechen";
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !layer.hidden) exitPrintSelection();
  });
}

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
// The mask sits above the shadow layer but below labels and POIs,
// so the outside shading still defines Neckargemünd when shadows are visible.
//
// Layer order after load:
//   basemap layers
//   → shadow-layer          (added in shadow.js before first label)
//   → boundary-mask-layer   (dark overlay outside Neckargemünd)
//   → boundary-line-layer   (green border)
//   → 3d-buildings
//   → label layers
//   → clusters / cluster-count  (added by pois.js)
//   [HTML markers are DOM elements, always on top]
async function addBoundaryMask() {
  try {
    const url = boundaryUrl("Neckargemuend_boundary.geojson");
    const res = await fetch(url);
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

    // Insert below labels; because the shadow layer already exists, this
    // places the boundary mask above the shadow raster.
    map.addLayer(
      {
        id: "boundary-mask-layer",
        type: "fill",
        source: "boundary-mask",
        paint: { "fill-color": "#1a1a2e", "fill-opacity": 0.2 }
      },
      firstSymbolId
    );

    // Boundary outline — also below labels
    map.addSource("boundary-line", { type: "geojson", data: boundary });
    map.addLayer(
      {
        id: "boundary-line-layer",
        type: "line",
        source: "boundary-line",
        paint: { "line-color": "#5e625f", "line-width": 1, "line-opacity": 0.5 }
      },
      firstSymbolId
    );

  } catch (err) {
    console.error("Boundary load error:", err);
  }
}

// ── Sidebar collapse ──────────────────────────────────────
let mobileActivePanel = null;

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

  function _setActionButtonState(buttonId, active) {
    const button = document.getElementById(buttonId);
    if (!button) return;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
  }

  function _closeMobilePanels() {
    // On mobile, closing mobile panels should also collapse the sidebar.
    // On desktop, leave the sidebar open by default and only close
    // the temporary mobile panels (shadow/mode).
    if (window.matchMedia("(max-width: 600px)").matches) {
      closeSidebar();
    }
    _closeMobileShadowPanel();
    _closeMobileModePanel();
    _setActionButtonState("mobile-action-sidebar", false);
    _setActionButtonState("mobile-action-shadow", false);
    _setActionButtonState("mobile-action-mode", false);
    mobileActivePanel = null;
  }

  function _openMobileShadowPanel() {
    if (simpleMode) {
      _openMobileModePanel();
      return;
    }
    const shadowBar = document.getElementById("shadow-bar");
    if (!shadowBar) return;
    shadowBar.classList.add("open");
    shadowBar.style.display = "flex";
  }

  function _closeMobileShadowPanel() {
    const shadowBar = document.getElementById("shadow-bar");
    if (!shadowBar) return;
    shadowBar.classList.remove("open");
    if (window.matchMedia("(max-width: 600px)").matches) {
      shadowBar.style.display = "none";
    } else {
      shadowBar.style.display = "flex";
    }
  }

  function _openMobileModePanel() {
    const panel = document.getElementById("mobile-mode-panel");
    if (!panel) return;
    panel.classList.remove("hidden");
    panel.setAttribute("aria-hidden", "false");
  }

  function _closeMobileModePanel() {
    const panel = document.getElementById("mobile-mode-panel");
    if (!panel) return;
    panel.classList.add("hidden");
    panel.setAttribute("aria-hidden", "true");
  }

  function _toggleMobilePanel(panel) {
    if (mobileActivePanel === panel) {
      _closeMobilePanels();
      return;
    }
    _closeMobilePanels();
    mobileActivePanel = panel;
    _setActionButtonState(`mobile-action-${panel}`, true);
    if (panel === "sidebar") openSidebar();
    if (panel === "shadow") _openMobileShadowPanel();
    if (panel === "mode") _openMobileModePanel();
  }

  window.addEventListener("resize", () => {
    // When switching to desktop size, ensure mobile-only panels are closed
    // but keep the sidebar open. When switching to mobile, collapse sidebar.
    if (!window.matchMedia("(max-width: 600px)").matches) {
      // desktop: close shadow/mode panels but keep sidebar
      _closeMobilePanels();
    } else {
      // mobile: ensure sidebar is collapsed to match mobile UX
      _closeMobilePanels();
    }
  });

  document.getElementById("mobile-action-sidebar")?.addEventListener("click", () => _toggleMobilePanel("sidebar"));
  document.getElementById("mobile-action-shadow")?.addEventListener("click", () => _toggleMobilePanel("shadow"));
  document.getElementById("mobile-action-mode")?.addEventListener("click", () => _toggleMobilePanel("mode"));

  _closeMobilePanels();
}

// ── Map load ──────────────────────────────────────────────
let addressSearchMarker = null;

function setAddressSearchStatus(message, isError = false) {
  const status = document.getElementById("address-search-status");
  if (!status) return;
  status.textContent = message || "";
  status.style.color = isError ? "#b33a2b" : "#66756b";
}

async function searchAddress(query) {
  const params = new URLSearchParams({
    format: "jsonv2",
    q: `${query}, Neckargemünd, Baden-Württemberg, Deutschland`,
    limit: "1",
    addressdetails: "1",
    countrycodes: "de",
    bounded: "1",
    viewbox: "8.73803182321166,49.41863840982511,8.9035906286068,49.3644124949337"
  });

  const res = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`);
  if (!res.ok) throw new Error(`Geocoder status ${res.status}`);
  return res.json();
}

function initAddressSearch(map) {
  const form = document.getElementById("address-search-form");
  const input = document.getElementById("address-search-input");
  if (!form || !input) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (simpleMode) {
      setAddressSearchStatus("Adresssuche ist in der komplexen Ansicht verfügbar.", true);
      return;
    }

    const query = input.value.trim();
    if (!query) {
      setAddressSearchStatus("Bitte eine Straße oder Adresse eingeben.", true);
      return;
    }

    setAddressSearchStatus("Adresse wird gesucht ...");
    try {
      const results = await searchAddress(query);
      const result = results[0];
      if (!result) {
        setAddressSearchStatus("Keine passende Adresse in Neckargemünd gefunden.", true);
        return;
      }

      const lng = Number(result.lon);
      const lat = Number(result.lat);
      if (!Number.isFinite(lng) || !Number.isFinite(lat)) {
        setAddressSearchStatus("Suchergebnis ohne gültige Koordinate.", true);
        return;
      }

      if (addressSearchMarker) addressSearchMarker.remove();
      addressSearchMarker = new maplibregl.Marker({ color: "#1a6b3c" })
        .setLngLat([lng, lat])
        .setPopup(new maplibregl.Popup({ offset: 24, closeButton: false }).setText(result.display_name))
        .addTo(map);

      map.easeTo({ center: [lng, lat], zoom: 17, duration: 900 });
      addressSearchMarker.togglePopup();
      setAddressSearchStatus("Adresse gefunden.");
    } catch (err) {
      console.error("Address search error:", err);
      setAddressSearchStatus("Adresssuche momentan nicht verfügbar.", true);
    }
  });
}

map.on("load", () => {
  // Order matters:
  // 1. shadow layer first (below the boundary mask)
  // 2. boundary mask (drawn over shadows, below labels)
  // 3. 3D buildings
  // 4. POI clusters (added last by pois.js, on top of buildings)
  createShadowLayer(map);
  addBoundaryMask().then(() => {
    add3DBuildings();
    initSidebar();
    initMapActionControls(map);
    initAddressSearch(map);
    initShadowControls(map);
    initDisplayMode(map);
    loadPOIs(map);
    initFilterControls(map);
    initClusterControls(map);
  });
});
