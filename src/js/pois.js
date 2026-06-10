// ============================================================
// pois.js – POI data, markers, clusters
// ============================================================

let geojsonData = null;
let allMarkers  = [];   // { marker, el, id, cat }
let rafPending  = false;

// Annotate GeoJSON: _icon, _cat, _label, _id
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

// Return only active categories (for cluster source)
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

// Create HTML element for a marker
function createMarkerEl(t) {
  const el = document.createElement("div");
  el.className = "poi-marker";
  el.style.backgroundColor = t.color;
  el.textContent = t.emoji;
  return el;
}

// Create all markers (initially hidden)
function createMarkers(map) {
  allMarkers.forEach(({ marker }) => marker.remove());
  allMarkers = [];

  geojsonData.features.forEach((f) => {
    if (f.geometry.type !== "Point") return;

    const t    = getType(f.properties);
    const el   = createMarkerEl(t);
    const name = f.properties.name || f.properties.ref || "Unnamed place";

    const extra = [];
    if (f.properties.opening_hours) extra.push(`🕐 ${f.properties.opening_hours}`);
    if (f.properties.wheelchair === "yes") extra.push("♿ Wheelchair accessible");
    if (f.properties.website)
      extra.push(`<a href="${f.properties.website}" target="_blank" style="color:#1a6b3c">🔗 Website</a>`);
    if (f.properties.leaf_type) extra.push(`🍃 Leaf type: ${f.properties.leaf_type}`);

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

    el.style.display = "none";
    allMarkers.push({ marker, el, id: f.properties._id, cat: f.properties._cat });
  });
}

// Sync marker visibility with cluster state
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
    const show = activeCats.has(cat) && unclusteredIds.has(id);
    el.style.display = show ? "flex" : "none";
  });
}

// Create source + cluster layers
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
        "text-font":  ["Open Sans Bold", "Arial Unicode MS Bold"],
        "text-size":  14,
        "text-allow-overlap": true
      },
      paint: { "text-color": "#ffffff" }
    });
  }
}

// Click on cluster → zoom in
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

// Load GeoJSON & initialize everything
function loadPOIs(map) {
  fetch("data/pois.geojson")
    .then((r) => r.json())
    .then((raw) => {
      geojsonData = annotateGeoJSON(raw);
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

// Filter checkboxes: update source data
function initFilterControls(map) {
  document.querySelectorAll(".filter-cb").forEach((cb) => {
    cb.addEventListener("change", () => {
      if (map.getSource("pois")) {
        map.getSource("pois").setData(getFilteredGeoJSON());
      }
    });
  });
}
