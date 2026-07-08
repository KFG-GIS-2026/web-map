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
  const mode = rawMode === "komplex" || rawMode === "complex" || rawMode === "advanced" ? "complex" : "simple";
  const popupId = params.get("poi") || "";

  return {
    center: Number.isFinite(lng) && Number.isFinite(lat) ? [lng, lat] : [8.807, 49.39],
    zoom: Number.isFinite(zoom) ? zoom : 13,
    mode,
    popupId
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
  attributionControl: false,
  canvasContextAttributes: { antialias: true }
});

map.addControl(
  new maplibregl.AttributionControl({
    compact: true
  }),
  "bottom-right"
);

function collapseMapAttribution() {
  document.querySelectorAll(".maplibregl-ctrl-attrib").forEach((control) => {
    control.classList.add("maplibregl-compact");
    control.classList.remove("maplibregl-compact-show");
    control.querySelector("button")?.setAttribute("aria-expanded", "false");
  });
}

function placeGitHubLinkWithAttribution() {
  const link = document.getElementById("gh-link");
  const attribution = document.querySelector(".maplibregl-ctrl-attrib");
  const corner = document.querySelector(".maplibregl-ctrl-bottom-right");
  if (!link || !attribution || !corner) return;

  let group = document.getElementById("map-footer-controls");
  if (!group) {
    group = document.createElement("div");
    group.id = "map-footer-controls";
    group.className = "maplibregl-ctrl";
  }

  if (link.parentElement !== group) group.appendChild(link);
  if (attribution.parentElement !== group) group.appendChild(attribution);
  if (group.parentElement !== corner) corner.appendChild(group);
}

function syncMapFooterControls() {
  placeGitHubLinkWithAttribution();
  collapseMapAttribution();
}

requestAnimationFrame(syncMapFooterControls);
map.once("load", () => requestAnimationFrame(syncMapFooterControls));

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
  params.set("lang", getLanguage());
  const popupId = typeof getCurrentPopupFeatureId === "function" ? getCurrentPopupFeatureId() : "";
  if (popupId) params.set("poi", popupId);
  else params.delete("poi");
  return `${window.location.origin}${window.location.pathname}?${params.toString()}`;
}

function buildMapLink(map, options = {}) {
  const center = map.getCenter();
  const params = new URLSearchParams(window.location.search);
  params.set("lng", center.lng.toFixed(6));
  params.set("lat", center.lat.toFixed(6));
  params.set("z", map.getZoom().toFixed(2));
  params.set("ansicht", options.mode === "complex" ? "komplex" : (simpleMode ? "einfach" : "komplex"));
  params.set("lang", getLanguage());

  if (options.popupId) params.set("poi", options.popupId);
  else params.delete("poi");
  if (options.skipIntro) params.set("skipIntro", "1");

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
    setMapActionStatus(t("linkCopied"));
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
    setMapActionStatus(t("linkCopied"));
  }
}

function initMapActionControls(map) {
  const copyButton = document.getElementById("map-copy-link-button");
  if (!copyButton) return;

  copyButton.addEventListener("click", () => copyCurrentMapLink(map));
}

function initGlobalButtonBehavior() {
  document.addEventListener("click", (event) => {
    const threeDHint = document.getElementById("three-d-hint");
    const toggle = document.getElementById("three-d-hint-toggle");
    if (!threeDHint || !toggle || toggle.contains(event.target)) return;
    threeDHint.classList.add("collapsed");
    toggle.setAttribute("aria-expanded", "false");
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
  const languageControl = document.getElementById("language-control");
  const mobileLanguageSlot = document.getElementById("mobile-language-slot");
  const languageHome = languageControl?.parentElement || null;
  const languageNextSibling = languageControl?.nextSibling || null;

  function syncMobileLanguagePlacement() {
    if (!languageControl || !mobileLanguageSlot || !languageHome) return;
    if (window.matchMedia("(max-width: 600px)").matches) {
      if (languageControl.parentElement !== mobileLanguageSlot) mobileLanguageSlot.appendChild(languageControl);
      return;
    }

    if (languageControl.parentElement === languageHome) return;
    if (languageNextSibling && languageNextSibling.parentElement === languageHome) {
      languageHome.insertBefore(languageControl, languageNextSibling);
    } else {
      languageHome.appendChild(languageControl);
    }
  }

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
  syncMobileLanguagePlacement();
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
    if (simpleMode || window.matchMedia("(max-width: 600px)").matches) {
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
    syncMobileLanguagePlacement();
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

  map.on("click", () => {
    if (!window.matchMedia("(max-width: 600px)").matches) return;
    if (mobileActivePanel !== "mode") return;
    _closeMobilePanels();
  });

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
    q: `${query}, ${t("nominatimQuerySuffix")}`,
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
      setAddressSearchStatus(t("addressComplexOnly"), true);
      return;
    }

    const query = input.value.trim();
    if (!query) {
      setAddressSearchStatus(t("addressMissing"), true);
      return;
    }

    setAddressSearchStatus(t("addressSearching"));
    try {
      const results = await searchAddress(query);
      const result = results[0];
      if (!result) {
        setAddressSearchStatus(t("addressNotFound"), true);
        return;
      }

      const lng = Number(result.lon);
      const lat = Number(result.lat);
      if (!Number.isFinite(lng) || !Number.isFinite(lat)) {
        setAddressSearchStatus(t("addressInvalid"), true);
        return;
      }

      if (addressSearchMarker) addressSearchMarker.remove();
      addressSearchMarker = new maplibregl.Marker({ color: "#1a6b3c" })
        .setLngLat([lng, lat])
        .setPopup(new maplibregl.Popup({ offset: 24, closeButton: false }).setText(result.display_name))
        .addTo(map);

      map.easeTo({ center: [lng, lat], zoom: 17, duration: 900 });
      addressSearchMarker.togglePopup();
      setAddressSearchStatus(t("addressFound"));
    } catch (err) {
      console.error("Address search error:", err);
      setAddressSearchStatus(t("addressUnavailable"), true);
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
    initGlobalButtonBehavior();
    initAddressSearch(map);
    initShadowControls(map);
    initDisplayMode(map);
    loadPOIs(map);
    initFilterControls(map);
    initClusterControls(map);
  });
});
