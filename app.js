const MAPTILER_KEY = "KO43aEajGhsdMubLPP2X";

const basemaps = {
  streets:   `https://api.maptiler.com/maps/streets-v2/style.json?key=${MAPTILER_KEY}`,
  satellite: `https://api.maptiler.com/maps/hybrid/style.json?key=${MAPTILER_KEY}`
};

// Shadow image extent in WGS84 coordinates
const SHADOW_COORDS = [
  [8.793322316, 49.385219820],
  [8.797466933, 49.385219820],
  [8.797466933, 49.382514018],
  [8.793322316, 49.382514018]
];

let shadowVisible = true;
let currentShadowHour = null;

// Typ-Definitionen mit je eigener Farbe
const TYPE_MAP = [
  { key: "fountain",         match: (p) => p.amenity === "fountain",         emoji: "⛲", label: "Brunnen",             cat: "fountain",   color: "#2196F3" },
  { key: "drinking_water",   match: (p) => p.amenity === "drinking_water",    emoji: "🚰", label: "Trinkwasser",         cat: "drinking",   color: "#29B6F6" },
  { key: "bench",            match: (p) => p.amenity === "bench",             emoji: "🪑", label: "Bank",                cat: "bench",      color: "#8D6E63" },
  { key: "library",          match: (p) => p.amenity === "library",           emoji: "📚", label: "Bibliothek",          cat: "building",   color: "#AB47BC" },
  { key: "community_centre", match: (p) => p.amenity === "community_centre",  emoji: "🏛️", label: "Gemeinschaftszentr.", cat: "building",   color: "#FF9800" },
  { key: "playground",       match: (p) => p.leisure === "playground",        emoji: "🛝", label: "Spielplatz",          cat: "playground", color: "#FF7043" },
  { key: "park",             match: (p) => p.leisure === "park",              emoji: "🏞️", label: "Park",                cat: "park",       color: "#66BB6A" },
  { key: "forest",           match: (p) => p.landuse === "forest",            emoji: "🌲", label: "Wald",                cat: "forest",     color: "#2E7D32" },
  { key: "water",            match: (p) => p.natural === "water",             emoji: "💧", label: "Wasserfläche",        cat: "water",      color: "#1E88E5" },
  { key: "river",            match: (p) => p.waterway === "river",            emoji: "🌊", label: "Fluss",               cat: "water",      color: "#039BE5" },
  { key: "bus_stop",         match: (p) => p.highway === "bus_stop",          emoji: "🚌", label: "Bushaltestelle",      cat: "busstop",    color: "#FFB300" },
];
const FALLBACK = { key: "other", emoji: "📍", label: "Ort", cat: "other", color: "#607D8B" };

function getType(props) {
  return TYPE_MAP.find((t) => t.match(props)) || FALLBACK;
}

// GeoJSON annotieren + _id vergeben
function annotateGeoJSON(geojson) {
  geojson.features.forEach((f, i) => {
    const t = getType(f.properties);
    f.properties._icon  = t.key;
    f.properties._cat   = t.cat;
    f.properties._label = t.label;
    f.properties._id    = f.properties["@id"] || `poi-${i}`;
  });
  return geojson;
}

// Gefiltertes GeoJSON für die Source (Cluster zählt nur noch aktive POIs)
function getFilteredGeoJSON() {
  if (!geojsonData) return { type: "FeatureCollection", features: [] };
  const active = new Set(
    Array.from(document.querySelectorAll(".filter-cb:checked")).map((cb) => cb.dataset.cat)
  );
  return {
    ...geojsonData,
    features: geojsonData.features.filter((f) => active.has(f.properties._cat))
  };
}

// --- State ---
let geojsonData = null;
let allMarkers  = []; // { marker, el, id, cat }
let rafPending  = false;

// HTML-Marker Element erstellen (farbiger Kreis + Emoji)
function createMarkerEl(t) {
  const el = document.createElement("div");
  el.className = "poi-marker";
  el.style.backgroundColor = t.color;
  el.textContent = t.emoji;
  return el;
}

function getInitialShadowHour() {
  const hour = new Date().getHours();

  if (hour < 6) return 6;
  if (hour > 20) return 20;

  return hour;
}

function getShadowFile(hour) {
  return `data/shadows/shadow_${String(hour).padStart(2, "0")}00.png`;
}

function updateShadowLabel(hour) {
  document.getElementById("shadow-time").textContent =
    `${String(hour).padStart(2, "0")}:00`;
}

function createShadowLayer() {

  const initialHour = getInitialShadowHour();

  currentShadowHour = initialHour;

  map.addSource("shadow", {
    type: "image",
    url: getShadowFile(initialHour),
    coordinates: SHADOW_COORDS
  });

  map.addLayer({
    id: "shadow-layer",
    type: "raster",
    source: "shadow",
    paint: {
      "raster-opacity": 0.85
    }
  });

  document.getElementById("shadow-slider").value = initialHour;

  updateShadowLabel(initialHour);
}

function setShadowHour(hour) {

  currentShadowHour = hour;

  updateShadowLabel(hour);

  const source = map.getSource("shadow");

  if (!source) return;

  source.updateImage({
    url: getShadowFile(hour),
    coordinates: SHADOW_COORDS
  });
}

function showShadowLayer() {

  shadowVisible = true;

  if (map.getLayer("shadow-layer")) {
    map.setLayoutProperty(
      "shadow-layer",
      "visibility",
      "visible"
    );
  }
}

function hideShadowLayer() {

  shadowVisible = false;

  if (map.getLayer("shadow-layer")) {
    map.setLayoutProperty(
      "shadow-layer",
      "visibility",
      "none"
    );
  }
}
// Alle HTML-Marker anlegen
function createMarkers() {
  allMarkers.forEach(({ marker }) => marker.remove());
  allMarkers = [];

  geojsonData.features.forEach((f) => {
    if (f.geometry.type !== "Point") return;

    const t    = getType(f.properties);
    const el   = createMarkerEl(t);
    const name = f.properties.name || f.properties.ref || "Unbenannter Ort";

    const extra = [];
    if (f.properties.opening_hours) extra.push(`🕐 ${f.properties.opening_hours}`);
    if (f.properties.wheelchair === "yes") extra.push("♿ Rollstuhlgerecht");
    if (f.properties.website)
      extra.push(`<a href="${f.properties.website}" target="_blank" style="color:#1a6b3c">🔗 Website</a>`);
    if (f.properties.leaf_type) extra.push(`🍃 Laubtyp: ${f.properties.leaf_type}`);

    const popup = new maplibregl.Popup({ offset: 18, maxWidth: "240px", closeButton: false })
      .setHTML(`
        <div style="font-family:sans-serif;font-size:13px;line-height:1.6">
          <div style="font-size:26px;text-align:center;margin-bottom:2px">${t.emoji}</div>
          <strong style="font-size:14px">${name}</strong><br>
          <span style="color:#666">📌 ${t.label}</span>
          ${extra.length ? "<hr style='margin:5px 0;border-color:#eee'>" + extra.join("<br>") : ""}
        </div>
      `);

    const marker = new maplibregl.Marker({ element: el, anchor: "center" })
      .setLngLat(f.geometry.coordinates)
      .setPopup(popup)
      .addTo(map);

    // Marker standardmäßig verstecken bis syncMarkers läuft
    el.style.display = "none";

    allMarkers.push({ marker, el, id: f.properties._id, cat: f.properties._cat });
  });
}

// Marker-Sichtbarkeit mit Cluster-Zustand abgleichen
function syncMarkers() {
  if (!map.getSource("pois") || !map.isSourceLoaded("pois")) return;

  // IDs aller aktuell NICHT geclusterten Features holen
  const unclusteredIds = new Set(
    map.querySourceFeatures("pois", {
      filter: ["!", ["has", "point_count"]]
    }).map((f) => f.properties._id)
  );

  const activeCats = new Set(
    Array.from(document.querySelectorAll(".filter-cb:checked")).map((cb) => cb.dataset.cat)
  );

  allMarkers.forEach(({ el, id, cat }) => {
    const show = activeCats.has(cat) && unclusteredIds.has(id);
    el.style.display = show ? "flex" : "none";
  });
}

// Cluster-Layer
function setupLayers() {
  // POI Source mit Clustering
  if (!map.getSource("pois")) {
    map.addSource("pois", {
      type: "geojson",
      data: getFilteredGeoJSON(),
      cluster: true,
      clusterMaxZoom: 14,
      clusterRadius: 50
    });
  }

  // Cluster-Kreise via circle-Layer (kein Sprite nötig)
  if (!map.getLayer("clusters")) {
    map.addLayer({
      id: "clusters",
      type: "circle",
      source: "pois",
      filter: ["has", "point_count"],
      paint: {
        "circle-color": "#2d7a45",
        "circle-radius": [
          "step", ["get", "point_count"],
          18,  // < 10
          10, 22,  // 10–29
          30, 28   // ≥ 30
        ],
        "circle-stroke-width": 3,
        "circle-stroke-color": "#ffffff",
        "circle-opacity": 0.92
      }
    });
  }

  // Cluster-Zahl
  if (!map.getLayer("cluster-count")) {
    map.addLayer({
      id: "cluster-count",
      type: "symbol",
      source: "pois",
      filter: ["has", "point_count"],
      layout: {
        "text-field": ["get", "point_count_abbreviated"],
        "text-font": ["Open Sans Bold", "Arial Unicode MS Bold"],
        "text-size": 14,
        "text-allow-overlap": true
      },
      paint: { "text-color": "#ffffff" }
    });
  }
}

function attachClusterEvents() {
  // Klick auf Cluster → reinzoomen
  map.on("click", "clusters", (e) => {
    const f = map.queryRenderedFeatures(e.point, { layers: ["clusters"] })[0];
    if (!f) return;
    map.getSource("pois").getClusterExpansionZoom(f.properties.cluster_id, (err, zoom) => {
      if (!err) map.easeTo({ center: f.geometry.coordinates, zoom: zoom + 0.5 });
    });
  });
  map.on("mouseenter", "clusters", () => { map.getCanvas().style.cursor = "pointer"; });
  map.on("mouseleave", "clusters", () => { map.getCanvas().style.cursor = ""; });
}

// --- Karte initialisieren ---
const map = new maplibregl.Map({
  container: "map",
  style: basemaps.streets,
  center: [8.8, 49.39],
  zoom: 13,
  pitch: 45,
  bearing: -17.6,
  canvasContextAttributes: { antialias: true }
});

map.addControl(
  new maplibregl.NavigationControl({
    visualizePitch: true,
    showZoom: true,
    showCompass: true
  }),
  "bottom-right"
);

map.addControl(
  new maplibregl.GeolocateControl({
    positionOptions: {
      enableHighAccuracy: true
    },
    trackUserLocation: true
  }),
  "bottom-right"
);

map.on("load", () => {
  createShadowLayer();
  fetch("data/pois.geojson")
    .then((r) => r.json())
    .then((raw) => {
      geojsonData = annotateGeoJSON(raw);
      setupLayers();
      createMarkers();
      attachClusterEvents();

      // Marker-Sync bei jedem Render-Frame (gedrosselt via RAF)
      map.on("render", () => {
        if (rafPending) return;
        rafPending = true;
        requestAnimationFrame(() => { syncMarkers(); rafPending = false; });
      });
    })
    .catch((err) => console.error("GeoJSON Ladefehler:", err));
});

// Kartenstil wechseln
document.getElementById("basemap-select").addEventListener("change", (e) => {
  map.setStyle(basemaps[e.target.value]);
  map.once("styledata", () => {
    setupLayers();
    attachClusterEvents();
  });
});

// Filter: Source-Daten neu setzen → Cluster zählt korrekt neu
document.querySelectorAll(".filter-cb").forEach((cb) => {
  cb.addEventListener("change", () => {
    if (map.getSource("pois")) {
      map.getSource("pois").setData(getFilteredGeoJSON());
    }
  });
});

// =========================
// Shadow controls
// =========================

document
  .getElementById("shadow-toggle")
  .addEventListener("click", () => {

    document
      .getElementById("shadow-panel")
      .classList.toggle("hidden");
  });

document
  .getElementById("shadow-hide")
  .addEventListener("click", () => {

    hideShadowLayer();

    document
      .getElementById("shadow-panel")
      .classList.add("hidden");
  });

document
  .getElementById("shadow-slider")
  .addEventListener("input", (e) => {

    const hour = Number(e.target.value);

    showShadowLayer();

    setShadowHour(hour);
  });