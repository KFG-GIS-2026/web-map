// ============================================================
// pois.js – POI data, markers, clusters
// ============================================================

let geojsonData = null;
let allMarkers  = [];   // { marker, el, id, cat }
let rafPending  = false;

// Returns the feature's real name, or null if it has none.
// Callers fall back to the category label when null.
function getFeatureName(props) {
  return props.name || props.ref || props["addr:housenumber"] || null;
}

// Load one category's GeoJSON file and tag each feature.
// Files must already be in WGS84 — run reproject_geojson.py first
// if exported from QGIS in EPSG:25832.
async function loadCategoryGeoJSON(category) {
  const res = await fetch(`data/osm_poi/${category.file}`);
  if (!res.ok) {
    console.error(`Could not load ${category.file}:`, res.status);
    return [];
  }
  const raw = await res.json();
  const features = (raw.features || []).filter(
    (f) => f.geometry && f.geometry.type === "Point"
  );

  features.forEach((f, i) => {
    f.properties._cat   = category.cat;
    f.properties._label = category.label;
    f.properties._icon  = category.icon;
    f.properties._id    = f.properties["@id"] || `${category.cat}-${i}`;
    f.properties._name  = getFeatureName(f.properties); // may be null
  });

  return features;
}

// Load all category files in parallel and merge into one FeatureCollection
async function loadAllPOIs() {
  const results = await Promise.all(POI_CATEGORIES.map(loadCategoryGeoJSON));
  return { type: "FeatureCollection", features: results.flat() };
}

// Return only features from currently active filter categories
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

// White circle marker with PNG icon
function createMarkerEl(category) {
  const el = document.createElement("div");
  el.className = "poi-marker";
  const img = document.createElement("img");
  img.src = `data/poi_symbols/${category.icon}`;
  img.alt = category.label;
  img.className = "poi-marker-icon";
  el.appendChild(img);
  return el;
}

// Build popup HTML.
// If the feature has a real name: show name (bold) + category below.
// If not: show only the category as the title — no "Unbenannter Ort".
function buildPopupHTML(category, props) {
  const name = props._name;

  const extra = [];
  if (props.opening_hours) extra.push(`🕐 ${props.opening_hours}`);
  if (props.wheelchair === "yes") extra.push("♿ Rollstuhlgerecht");
  if (props.website)
    extra.push(`<a href="${props.website}" target="_blank" style="color:#1a6b3c">🔗 Website</a>`);
  if (props.seats) extra.push(`🪑 Sitzplätze: ${props.seats}`);
  if (props.material) extra.push(`🪵 Material: ${props.material}`);
  if (props.description) extra.push(`ℹ️ ${props.description}`);

  const titleHTML = name
    ? `<strong style="font-size:14px">${name}</strong>
       <br><span style="color:#888;font-size:12px">📌 ${category.label}</span>`
    : `<strong style="font-size:14px">${category.label}</strong>`;

  const extraHTML = extra.length
    ? `<hr style="margin:6px 0;border:none;border-top:1px solid #eee">${extra.join("<br>")}`
    : "";

  return `
    <div style="font-family:sans-serif;font-size:13px;line-height:1.6;text-align:center">
      <img src="data/poi_symbols/${category.icon}"
           style="width:28px;height:28px;display:block;margin:0 auto 6px" />
      ${titleHTML}
      <div style="text-align:left">${extraHTML}</div>
    </div>`;
}

// Create all markers (initially hidden, shown via syncMarkers)
function createMarkers(map) {
  allMarkers.forEach(({ marker }) => marker.remove());
  allMarkers = [];

  geojsonData.features.forEach((f) => {
    const category = getCategoryByKey(f.properties._cat);
    if (!category) return;

    const el    = createMarkerEl(category);
    const popup = new maplibregl.Popup({ offset: 18, maxWidth: "240px", closeButton: false })
      .setHTML(buildPopupHTML(category, f.properties));

    const marker = new maplibregl.Marker({ element: el, anchor: "center" })
      .setLngLat(f.geometry.coordinates)
      .setPopup(popup)
      .addTo(map);

    el.style.display = "none";
    allMarkers.push({ marker, el, id: f.properties._id, cat: f.properties._cat });
  });
}

// Show/hide individual markers based on cluster state and active filters
function syncMarkers(map) {
  if (!map.getSource("pois") || !map.isSourceLoaded("pois")) return;

  const unclusteredIds = new Set(
    map.querySourceFeatures("pois", { filter: ["!", ["has", "point_count"]] })
      .map((f) => f.properties._id)
  );
  const activeCats = new Set(
    Array.from(document.querySelectorAll(".filter-cb:checked")).map((cb) => cb.dataset.cat)
  );

  allMarkers.forEach(({ el, id, cat }) => {
    el.style.display = (activeCats.has(cat) && unclusteredIds.has(id)) ? "flex" : "none";
  });
}

// Create the GeoJSON source and cluster circle/label layers
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
      id: "clusters", type: "circle", source: "pois",
      filter: ["has", "point_count"],
      paint: {
        "circle-color": "#2d7a45",
        "circle-radius": ["step", ["get", "point_count"], 18, 10, 22, 30, 28],
        "circle-stroke-width": 3,
        "circle-stroke-color": "#fff",
        "circle-opacity": 0.92
      }
    });
  }

  if (!map.getLayer("cluster-count")) {
    map.addLayer({
      id: "cluster-count", type: "symbol", source: "pois",
      filter: ["has", "point_count"],
      layout: {
        "text-field": ["get", "point_count_abbreviated"],
        "text-font": ["Noto Sans Bold", "Noto Sans Regular"],
        "text-size": 14,
        "text-allow-overlap": true
      },
      paint: { "text-color": "#fff" }
    });
  }
}

// Zoom into cluster on click
function attachClusterEvents(map) {
  map.on("click", "clusters", async (e) => {
    const f = map.queryRenderedFeatures(e.point, { layers: ["clusters"] })[0];
    if (!f) return;
    try {
      const zoom = await map.getSource("pois").getClusterExpansionZoom(f.properties.cluster_id);
      map.easeTo({ center: f.geometry.coordinates, zoom: zoom + 0.5 });
    } catch (err) { console.error("Cluster zoom error:", err); }
  });
  map.on("mouseenter", "clusters", () => { map.getCanvas().style.cursor = "pointer"; });
  map.on("mouseleave", "clusters", () => { map.getCanvas().style.cursor = ""; });
}

// Load all GeoJSON files and initialize layers + markers
function loadPOIs(map) {
  loadAllPOIs()
    .then((merged) => {
      geojsonData = merged;
      setupPOILayers(map);
      createMarkers(map);
      attachClusterEvents(map);
      map.on("render", () => {
        if (rafPending) return;
        rafPending = true;
        requestAnimationFrame(() => { syncMarkers(map); rafPending = false; });
      });
    })
    .catch((err) => console.error("POI load error:", err));
}

// Update source data when filter checkboxes change
function initFilterControls(map) {
  document.querySelectorAll(".filter-cb").forEach((cb) => {
    cb.addEventListener("change", () => {
      if (map.getSource("pois")) map.getSource("pois").setData(getFilteredGeoJSON());
    });
  });
}