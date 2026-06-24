// ============================================================
// pois.js – POI data, markers, clusters
// ============================================================

const SOLAR_BENCH_DATA_URL = "data/neckargemuend_baenke_dummy.geojson";
const SOLAR_BENCH_THRESHOLD = 50;

let geojsonData = null;
let allMarkers  = [];   // { marker, el, id, cat }
let rafPending  = false;

// Annotate GeoJSON features with type info
function annotateGeoJSON(geojson, options = {}) {
  const source = options.source || "pois";
  const idPrefix = options.idPrefix || "";

  geojson.features.forEach((f, i) => {
    if (source === "solar-benches" && !f.properties.amenity) {
      f.properties.amenity = "bench";
    }

    const t = getType(f.properties);
    f.properties._icon  = t.key;
    f.properties._cat   = t.cat;
    f.properties._label = t.label;
    f.properties._source = source;
    f.properties._id    = idPrefix + (f.properties["@id"] || f.properties.id || `poi-${i}`);
  });
  return geojson;
}

function getSolarPropertyName(hour) {
  return `solar_${String(hour).padStart(2, "0")}`;
}

function isSolarBenchVisible(feature) {
  if (feature.properties._source !== "solar-benches") return true;
  if (simpleMode) return false;

  const solarValue = Number(feature.properties[getSolarPropertyName(currentShadowHour)]);
  return Number.isFinite(solarValue) && solarValue <= SOLAR_BENCH_THRESHOLD;
}

// Return only features from currently active filter categories
function getFilteredGeoJSON() {
  if (!geojsonData) return { type: "FeatureCollection", features: [] };
  const active = new Set(
    Array.from(document.querySelectorAll(".filter-cb:checked")).map((cb) => cb.dataset.cat)
  );
  return {
    ...geojsonData,
    features: geojsonData.features.filter((f) => (
      active.has(f.properties._cat) && isSolarBenchVisible(f)
    ))
  };
}

// Create the DOM element for a map marker
function createMarkerEl(t) {
  const el = document.createElement("div");
  el.className = "poi-marker";
  el.style.backgroundColor = t.color;
  el.textContent = t.emoji;
  return el;
}

function getSolarPopupText(f) {
  const solarProperty = getSolarPropertyName(currentShadowHour);
  const solarValue = f.properties[solarProperty];
  if (solarValue === undefined || solarValue === null) return "";

  return `Solarwert ${String(currentShadowHour).padStart(2, "0")}:00 Uhr: ${solarValue}`;
}

function updateSolarPopupValue(popup, f) {
  if (f.properties._source !== "solar-benches") return;

  const popupEl = popup.getElement();
  const solarEl = popupEl?.querySelector(".solar-popup-value");
  if (solarEl) solarEl.textContent = getSolarPopupText(f);
}

// Create all markers (initially hidden, shown via syncMarkers)
function createMarkers(map) {
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

    if (f.properties._source === "solar-benches")
      extra.push('<span class="solar-popup-value"></span>');

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

    popup.on("open", () => {
      updateSolarPopupValue(popup, f);
    });

    el.style.display = "none";
    allMarkers.push({ marker, el, id: f.properties._id, cat: f.properties._cat, feature: f });
  });
}

// Show/hide markers based on zoom cluster state and active filters
function syncMarkers(map) {
  if (!map.getSource("pois") || !map.isSourceLoaded("pois")) return;

  const unclusteredIds = new Set(
    map.querySourceFeatures("pois", {
      filter: ["!", ["has", "point_count"]]
    }).map((f) => f.properties._id)
  );

  const activeCats = new Set(
    Array.from(document.querySelectorAll(".filter-cb:checked")).map((cb) => cb.dataset.cat)
  );

  allMarkers.forEach(({ el, id, cat }) => {
    el.style.display = (activeCats.has(cat) && unclusteredIds.has(id)) ? "flex" : "none";
  });
}

function updatePOISource(map) {
  if (map.getSource("pois")) {
    map.getSource("pois").setData(getFilteredGeoJSON());
  }

  allMarkers.forEach(({ marker, feature }) => {
    const popup = marker.getPopup();
    if (popup?.isOpen?.()) {
      if (!isSolarBenchVisible(feature)) popup.remove();
      else updateSolarPopupValue(popup, feature);
    }
  });
}

// Create the GeoJSON source and cluster layers
function setupPOILayers(map) {
  if (!map.getSource("pois")) {
    map.addSource("pois", {
      type: "geojson",
      data: getFilteredGeoJSON(),
      cluster: true,
      clusterMaxZoom: 14,
      clusterRadius: 50
    });
  }

  if (!map.getLayer("clusters")) {
    map.addLayer({
      id:     "clusters",
      type:   "circle",
      source: "pois",
      filter: ["has", "point_count"],
      paint: {
        "circle-color": "#2d7a45",
        "circle-radius": ["step", ["get", "point_count"], 18, 10, 22, 30, 28],
        "circle-stroke-width": 3,
        "circle-stroke-color": "#ffffff",
        "circle-opacity": 0.92
      }
    });
  }

  if (!map.getLayer("cluster-count")) {
    map.addLayer({
      id:     "cluster-count",
      type:   "symbol",
      source: "pois",
      filter: ["has", "point_count"],
      layout: {
        "text-field": ["get", "point_count_abbreviated"],
        // Use fonts available in OpenFreeMap (Noto Sans, not Open Sans)
        "text-font":  ["Noto Sans Bold", "Noto Sans Regular"],
        "text-size":  14,
        "text-allow-overlap": true
      },
      paint: { "text-color": "#ffffff" }
    });
  }
}

// Zoom into cluster on click
function attachClusterEvents(map) {
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

// Load GeoJSON file and initialize all POI layers and markers
function loadPOIs(map) {
  const poiData = fetch("data/pois.geojson").then((r) => r.json());
  const solarBenchData = fetch(SOLAR_BENCH_DATA_URL)
    .then((r) => r.json())
    .catch((err) => {
      console.warn("Solar bench GeoJSON load error:", err);
      return { type: "FeatureCollection", features: [] };
    });

  Promise.all([poiData, solarBenchData])
    .then(([rawPOIs, rawSolarBenches]) => {
      const annotatedPOIs = annotateGeoJSON(rawPOIs);
      const annotatedSolarBenches = annotateGeoJSON(rawSolarBenches, {
        source: "solar-benches",
        idPrefix: "solar-bench-"
      });

      geojsonData = {
        type: "FeatureCollection",
        features: [
          ...annotatedPOIs.features,
          ...annotatedSolarBenches.features
        ]
      };

      setupPOILayers(map);
      createMarkers(map);
      attachClusterEvents(map);

      map.on("render", () => {
        if (rafPending) return;
        rafPending = true;
        requestAnimationFrame(() => { syncMarkers(map); rafPending = false; });
      });
    })
    .catch((err) => console.error("GeoJSON load error:", err));
}

// Update source data when filter checkboxes change
function initFilterControls(map) {
  document.querySelectorAll(".filter-cb").forEach((cb) => {
    cb.addEventListener("change", () => {
      updatePOISource(map);
    });
  });
}
