// ============================================================
// pois.js – POI data, markers, clusters
// ============================================================

const SOLAR_BENCH_DATA_URL = "data/neckargemuend_baenke_dummy.geojson";
const SOLAR_BENCH_THRESHOLD = 50;
const SOLAR_CLASS_SCHEMES = {
  bench: {
    breaks: [200, 350, 500, 750],
    ranges: ["bis 200", "200-350", "350-500", "500-750", "ueber 750"]
  },
  playground: {
    breaks: [200, 300, 450, 650],
    ranges: ["bis 200", "200-300", "300-450", "450-650", "ueber 650"]
  },
  park: {
    breaks: [150, 300, 400, 600],
    ranges: ["bis 150", "150-300", "300-400", "400-600", "ueber 600"]
  }
};
const SOLAR_CLASS_COLORS = ["#2F80ED", "#35C4B5", "#F2C94C", "#F2994A", "#EB5757"];
const SOLAR_CLASS_LABELS = [
  "veryLowSolar",
  "lowSolar",
  "mediumSolar",
  "highSolar",
  "veryHighSolar"
];
const SOLAR_VALUE_UNIT = "W/m²";
const BUILDING_CATEGORIES = new Set(["church", "library", "museum"]);
const POI_SOURCE_ID = "pois";
const BENCH_SOURCE_ID = "bench-pois";
const POI_PROXY_LAYER_ID = "poi-marker-proxy";
const BENCH_PROXY_LAYER_ID = "bench-marker-proxy";
const POI_CLUSTER_LAYER_ID = "clusters";
const POI_CLUSTER_COUNT_LAYER_ID = "cluster-count";
const BENCH_CLUSTER_LAYER_ID = "bench-clusters";
const BENCH_CLUSTER_COUNT_LAYER_ID = "bench-cluster-count";
const CLUSTER_LAYER_IDS = [
  POI_CLUSTER_COUNT_LAYER_ID,
  POI_CLUSTER_LAYER_ID,
  BENCH_CLUSTER_COUNT_LAYER_ID,
  BENCH_CLUSTER_LAYER_ID,
  POI_PROXY_LAYER_ID,
  BENCH_PROXY_LAYER_ID
];

let geojsonData = null;
let allMarkers  = [];   // { marker, el, id, cat }
let rafPending  = false;
let currentPopup = null;
let currentPopupFeature = null;
let currentPopupMap = null;
let allClusteringEnabled = true;
let benchClusteringEnabled = true;

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
}
  
// Returns the feature's real name, or null if it has none.
// Callers fall back to the category label when null.
function getFeatureName(props) {
  return props.name || props.ref || props["addr:housenumber"] || null;
}

// Load one category's GeoJSON file and tag each feature.
// Files must already be in WGS84 
async function loadCategoryGeoJSON(category) {
  const url = poiUrl(category.file);
  const res = await fetch(url);
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

function getSolarPropertyName(month = currentShadowMonth, day = currentShadowDay, hour = currentShadowHour) {
  return `${String(month).padStart(2, "0")}${String(day).padStart(2, "0")}_${String(hour).padStart(2, "0")}`;
}

function formatSolarDateLabelFor(month, day) {
  const dayLabel = typeof t === "function" ? t(day === 1 ? "beginning" : "middle") : (day === 1 ? "Anfang" : "Mitte");
  const fallbackMonth = SHADOW_DATE_MONTHS.find((entry) => entry.month === month)?.label || String(month).padStart(2, "0");
  const monthLabel = typeof t === "function" ? t(`month_${month}`) : fallbackMonth;
  return `${dayLabel} ${monthLabel}`;
}

function getSimpleSolarDate() {
  if (typeof _getNextAllowedShadowDate === "function") {
    return _getNextAllowedShadowDate(new Date());
  }
  return { month: currentShadowMonth, day: currentShadowDay };
}

function getSimpleSolarDateLabel() {
  const date = getSimpleSolarDate();
  return formatSolarDateLabelFor(date.month, date.day);
}

function getComplexSolarValue(props) {
  const value = Number(props[getSolarPropertyName()]);
  return Number.isFinite(value) ? value : null;
}

function getDailyAverageSolarValue(props) {
  const date = getSimpleSolarDate();
  const hours = Array.isArray(SHADOW_HOURS) ? SHADOW_HOURS : [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];
  const values = hours
    .map((hour) => Number(props[getSolarPropertyName(date.month, date.day, hour)]))
    .filter(Number.isFinite);

  if (!values.length) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function getSolarValue(props) {
  return simpleMode ? getDailyAverageSolarValue(props) : getComplexSolarValue(props);
}

function hasSolarValue(props) {
  return getSolarValue(props) !== null;
}

function shouldShowSolarValue(props) {
  return props._cat === "bench" || props._cat === "playground" || props._cat === "park";
}

function getSolarClassInfo(props) {
  const value = getSolarValue(props);
  const scheme = SOLAR_CLASS_SCHEMES[props._cat];
  if (value === null || !scheme) return null;

  const classIndex = scheme.breaks.findIndex((limit) => value <= limit);
  const index = classIndex === -1 ? SOLAR_CLASS_COLORS.length - 1 : classIndex;
  return {
    value,
    index,
    color: SOLAR_CLASS_COLORS[index],
    label: typeof t === "function" ? t(SOLAR_CLASS_LABELS[index]) : SOLAR_CLASS_LABELS[index],
    range: scheme.ranges[index]
  };
}

function getSolarMarkerColor(props) {
  return getSolarClassInfo(props)?.color || "#ffffff";
}

function getActiveSolarClasses() {
  return new Set(
    Array.from(document.querySelectorAll(".solar-class-cb:checked")).map((cb) => Number(cb.dataset.solarClass))
  );
}

function isSolarClassVisible(feature, activeSolarClasses = getActiveSolarClasses()) {
  const info = getSolarClassInfo(feature.properties);
  return !info || activeSolarClasses.has(info.index);
}

function formatSolarDateLabel() {
  return formatSolarDateLabelFor(currentShadowMonth, currentShadowDay);
}

function getSolarValueText(props) {
  const solarValue = getSolarValue(props);
  if (solarValue === null) return null;

  const formattedValue = solarValue.toLocaleString("de-DE", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 1
  });
  if (simpleMode) {
    return `${t("dailyAverage", { date: getSimpleSolarDateLabel() })}: ${formattedValue} ${SOLAR_VALUE_UNIT}`;
  }
  const hour = String(currentShadowHour).padStart(2, "0");
  return `${t("solarAtTime", { date: formatSolarDateLabel(), hour })}: ${formattedValue} ${SOLAR_VALUE_UNIT}`;
}

function getSolarPopupHTML(props) {
  const info = getSolarClassInfo(props);
  const hour = String(currentShadowHour).padStart(2, "0");
  const simpleDateLabel = getSimpleSolarDateLabel();

  if (!info) {
    const missingText = simpleMode
      ? t("noDailySolar", { date: simpleDateLabel })
      : t("noHourlySolar", { date: formatSolarDateLabel(), hour });
    return `
      <div class="solar-popup solar-popup-empty" data-solar-value>
        <strong>${t("noSolarData")}</strong>
        <span>${missingText}</span>
      </div>`;
  }

  const formattedValue = info.value.toLocaleString("de-DE", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 1
  });

  return `
    <div class="solar-popup" data-solar-value>
      <div class="solar-popup-head">
        <span class="solar-popup-swatch" style="background:${info.color}"></span>
        <strong>${info.label}</strong>
      </div>
      <div class="solar-popup-meta">${simpleMode ? t("dailyAverage", { date: simpleDateLabel }) : t("solarAtTime", { date: formatSolarDateLabel(), hour })}: <strong>${formattedValue} ${SOLAR_VALUE_UNIT}</strong></div>
    </div>`;
}

function getSolarDetailLinkHTML(props, map) {
  if (!simpleMode || !shouldShowSolarValue(props) || !getSolarClassInfo(props)) return "";
  const href = typeof buildMapLink === "function"
    ? buildMapLink(map, { mode: "complex", popupId: props._id, skipIntro: true })
    : "#";

  return `
    <a class="popup-detail-link" href="${escapeHTML(href)}">
      ${t("detailComplex")}
    </a>`;
}

function isSolarBenchVisible(feature) {
  if (feature.properties._source !== "solar-benches") return true;
  if (simpleMode) return false;

  const solarValue = Number(feature.properties[getSolarPropertyName()]);
  return Number.isFinite(solarValue) && solarValue <= SOLAR_BENCH_THRESHOLD;
}

// Return only features from currently active filter categories
function getFilteredGeoJSON() {
  if (!geojsonData) return { type: "FeatureCollection", features: [] };
  const active = new Set(
    Array.from(document.querySelectorAll(".filter-cb:checked")).map((cb) => cb.dataset.cat)
  );
  const activeSolarClasses = simpleMode ? null : getActiveSolarClasses();
  return {
    ...geojsonData,
    features: geojsonData.features.filter((f) => (
      active.has(f.properties._cat) &&
      isSolarBenchVisible(f) &&
      (simpleMode || isSolarClassVisible(f, activeSolarClasses))
    ))
  };
}

function makeFeatureCollection(features) {
  return { type: "FeatureCollection", features };
}

function getPOISourceSlices() {
  const features = getFilteredGeoJSON().features;
  if (allClusteringEnabled && benchClusteringEnabled) return { main: features, benches: [] };

  return {
    main: features.filter((f) => f.properties._cat !== "bench"),
    benches: features.filter((f) => f.properties._cat === "bench")
  };
}

function usesSeparateBenchSource() {
  return !(allClusteringEnabled && benchClusteringEnabled);
}

// Circle marker with PNG icon; solar POIs get a data-driven background color.
function createMarkerEl(category, props) {
  const el = document.createElement("div");
  el.className = "poi-marker";
  el.style.backgroundColor = getSolarMarkerColor(props);
  const img = document.createElement("img");
  img.src = symbolUrl(category.icon);
  img.alt = getCategoryLabel(category);
  img.className = "poi-marker-icon";
  el.appendChild(img);
  return el;
}

function escapeHTML(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function getWebsiteUrl(props) {
  return props.website || props["contact:website"] || null;
}

function formatAddress(props) {
  const street = [props["addr:street"], props["addr:housenumber"]].filter(Boolean).join(" ");
  const city = [props["addr:postcode"], props["addr:city"]].filter(Boolean).join(" ");
  const suburb = props["addr:suburb"];
  return [street, city, suburb].filter(Boolean).join(", ");
}

function formatOSMValue(value) {
  const keys = {
    yes: "yes",
    no: "no",
    limited: "limited",
    christian: "christian",
    protestant: "protestant",
    roman_catholic: "roman_catholic",
    catholic: "catholic",
    oecumenic: "oecumenic",
    place_of_worship: "place_of_worship",
    library: "category_library",
    museum: "category_museum",
    chapel: "chapel",
    church: "church",
    residential: "residential",
    building: "historic_building",
    sandstone: "sandstone"
  };
  return keys[value] && typeof t === "function" ? t(keys[value]) : String(value).replace(/_/g, " ");
}

function addDetail(extra, label, value) {
  if (value === undefined || value === null || value === "") return;
  extra.push(`<span class="popup-detail-label">${escapeHTML(label)}:</span> ${escapeHTML(value)}`);
}

function addBuildingDetails(extra, props, category) {
  const isChurch = category?.cat === "church";
  addDetail(extra, t("address"), formatAddress(props));
  addDetail(extra, t("costAccess"), props["beschränkung"] || props["beschrÃ¤nkung"] || props["beschraenkung"]);
  if (props.wheelchair) addDetail(extra, t("wheelchair"), formatOSMValue(props.wheelchair));
  if (props["toilets:wheelchair"]) addDetail(extra, t("wheelchairToilet"), formatOSMValue(props["toilets:wheelchair"]));
  if (!isChurch) addDetail(extra, t("operator"), props.operator);
  if (props.denomination) addDetail(extra, t("denomination"), formatOSMValue(props.denomination));
  if (props.religion) addDetail(extra, t("religion"), formatOSMValue(props.religion));
  if (!isChurch && props.historic) addDetail(extra, t("historic"), formatOSMValue(props.historic));
  if (!isChurch && props.building) addDetail(extra, t("buildingType"), formatOSMValue(props.building));
  if (props["building:material"]) addDetail(extra, t("material"), formatOSMValue(props["building:material"]));
  if (props["building:use"]) addDetail(extra, t("use"), formatOSMValue(props["building:use"]));

  const website = isChurch ? null : getWebsiteUrl(props);
  if (website) {
    extra.push(`<a href="${escapeHTML(website)}" target="_blank" rel="noopener" style="color:#1a6b3c">${t("website")}</a>`);
  }
  if (!isChurch && props.wikipedia) addDetail(extra, "Wikipedia", props.wikipedia);
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
  if (category.cat !== "bench" && props.seats) extra.push(`🪑 Sitzplätze: ${props.seats}`);
  if (category.cat !== "bench" && props.material) extra.push(`🪵 Material: ${props.material}`);
  if (props.description) extra.push(`ℹ️ ${props.description}`);

  if (category.cat === "bench" || category.cat === "playground" || category.cat === "park") {
    extra.push(getSolarPopupHTML(props));
  }

  const titleHTML = name
    ? `<strong style="font-size:14px">${name}</strong>
       <br><span style="color:#888;font-size:12px">📌 ${category.label}</span>`
    : `<strong style="font-size:14px">${category.label}</strong>`;

  const extraHTML = extra.length
    ? `<hr style="margin:6px 0;border:none;border-top:1px solid #eee">${extra.join("<br>")}`
    : "";

  return `
    <div style="font-family:sans-serif;font-size:13px;line-height:1.6;text-align:center">
      <img src="${symbolUrl(category.icon)}"
           style="width:28px;height:28px;display:block;margin:0 auto 6px" />
      ${titleHTML}
      <div style="text-align:left">${extraHTML}</div>
    </div>`;
}

function buildEnhancedPopupHTML(category, props, map) {
  const name = props._name;
  const extra = [];
  const solarHTML = category.cat === "bench" || category.cat === "playground" || category.cat === "park"
    ? getSolarPopupHTML(props)
    : "";

  if (solarHTML) extra.push(solarHTML);

  if (props.opening_hours) addDetail(extra, t("openingHours"), props.opening_hours);
  if (BUILDING_CATEGORIES.has(category.cat)) {
    addBuildingDetails(extra, props, category);
  } else {
    if (props.wheelchair === "yes") extra.push(t("wheelchairAccessible"));
    const website = getWebsiteUrl(props);
    if (website) extra.push(`<a href="${escapeHTML(website)}" target="_blank" rel="noopener" style="color:#1a6b3c">${t("website")}</a>`);
  }
  if (category.cat !== "bench" && props.seats) addDetail(extra, t("seats"), props.seats);
  if (category.cat !== "bench" && props.material) addDetail(extra, t("material"), props.material);
  if (props.description) addDetail(extra, t("info"), props.description);
  const detailLinkHTML = getSolarDetailLinkHTML(props, map);
  if (detailLinkHTML) extra.push(detailLinkHTML);

  const titleHTML = name
    ? `<strong style="font-size:14px">${escapeHTML(name)}</strong>
       <br><span style="color:#888;font-size:12px">${escapeHTML(getCategoryLabel(category))}</span>`
    : `<strong style="font-size:14px">${escapeHTML(getCategoryLabel(category))}</strong>`;

  const extraHTML = extra.length
    ? `<hr style="margin:6px 0;border:none;border-top:1px solid #eee">${extra.join("<br>")}`
    : "";

  return `
    <div style="font-family:sans-serif;font-size:13px;line-height:1.6;text-align:center">
      <img src="${symbolUrl(category.icon)}"
           style="width:28px;height:28px;display:block;margin:0 auto 6px" />
      ${titleHTML}
      <div style="text-align:left">${extraHTML}</div>
    </div>`;
}

function updateSolarPopupValue(popup, feature) {
  if (!popup || !feature || !shouldShowSolarValue(feature.properties)) return;

  const container = popup.getElement();
  const valueEl = container?.querySelector("[data-solar-value]");
  if (!valueEl) return;

  valueEl.outerHTML = getSolarPopupHTML(feature.properties);
}

function syncCurrentPopupSolarValue() {
  updateSolarPopupValue(currentPopup, currentPopupFeature);
}

function syncCurrentPopupHTML() {
  if (!currentPopup || !currentPopupFeature || !currentPopupMap) return;
  const category = getCategoryByKey(currentPopupFeature.properties._cat);
  if (!category) return;
  currentPopup.setHTML(buildEnhancedPopupHTML(category, currentPopupFeature.properties, currentPopupMap));
}

function syncMarkerSolarStyles() {
  allMarkers.forEach(({ el, feature }) => {
    el.style.backgroundColor = getSolarMarkerColor(feature.properties);
  });
}

function syncSolarActionButton() {
  const button = document.getElementById("solar-hide-high");
  if (!button) return;

  const highHidden = Array.from(document.querySelectorAll(".solar-class-cb"))
    .filter((cb) => Number(cb.dataset.solarClass) >= 3)
    .every((cb) => !cb.checked);

  button.setAttribute("aria-pressed", String(highHidden));
  button.textContent = highHidden ? t("showAllSolar") : t("showCoolerOnly");
}

function syncSimpleSolarLegendNote() {
  const note = document.getElementById("simple-solar-date-note");
  if (!note) return;
  const dateLabel = escapeHTML(getSimpleSolarDateLabel());
  note.innerHTML = getLanguage() === "en"
    ? `Colors show the daily average sun exposure for <strong>${dateLabel}</strong>. Date and time can be adjusted in advanced view.`
    : `Farben zeigen den Tagesdurchschnitt der Sonnenbelastung für <strong>${dateLabel}</strong>. Datum und Uhrzeit können in der komplexen Ansicht angepasst werden.`;
}

function getCategoryGroupCheckboxes(group) {
  const cats = (group.dataset.categoryCats || "").split(/\s+/).filter(Boolean);
  return cats
    .map((cat) => document.querySelector(`.filter-cb[data-cat="${cat}"]`))
    .filter(Boolean);
}

function syncCategoryGroupButtons() {
  document.querySelectorAll(".category-group").forEach((group) => {
    const button = group.querySelector(".category-group-toggle");
    const state = group.querySelector(".category-group-state");
    const checkboxes = getCategoryGroupCheckboxes(group);
    const hasAnyChecked = checkboxes.some((cb) => cb.checked);

    if (button) button.setAttribute("aria-pressed", String(hasAnyChecked));
    if (state) state.textContent = hasAnyChecked ? t("hide") : t("show");
  });
}

// Create all markers (initially hidden, shown via syncMarkers)
function createMarkers(map) {
  allMarkers.forEach(({ marker }) => marker.remove());
  allMarkers = [];
  if (currentPopup) currentPopup.remove();
  currentPopup = null;
  currentPopupFeature = null;

  geojsonData.features.forEach((f) => {
    const category = getCategoryByKey(f.properties._cat);
    if (!category) return;

    const el    = createMarkerEl(category, f.properties);
    const popup = new maplibregl.Popup({ offset: 18, maxWidth: "260px", closeButton: true })
      .setHTML(buildEnhancedPopupHTML(category, f.properties, map));

    const marker = new maplibregl.Marker({ element: el, anchor: "center" })
      .setLngLat(f.geometry.coordinates)
      .setPopup(popup)
      .addTo(map);

    popup.on("open", () => {
      if (currentPopup && currentPopup !== popup) currentPopup.remove();
      currentPopup = popup;
      currentPopupFeature = f;
      currentPopupMap = map;
      popup.setHTML(buildEnhancedPopupHTML(category, f.properties, map));
      updateSolarPopupValue(popup, f);
    });

    popup.on("close", () => {
      if (currentPopup === popup) {
        currentPopup = null;
        currentPopupFeature = null;
        currentPopupMap = null;
      }
    });

    el.style.display = "none";
    allMarkers.push({ marker, el, id: f.properties._id, cat: f.properties._cat, feature: f });
  });
}

function openLinkedPopupFromURL(map) {
  const popupId = window.__INITIAL_MAP_STATE?.popupId;
  if (!popupId) return;

  const item = allMarkers.find(({ id }) => String(id) === String(popupId));
  if (!item) return;

  const coordinates = item.feature.geometry.coordinates;
  map.easeTo({ center: coordinates, duration: 450 });

  window.setTimeout(() => {
    const popup = item.marker.getPopup();
    if (popup && !popup.isOpen()) item.marker.togglePopup();
    const url = new URL(window.location.href);
    url.searchParams.delete("poi");
    url.searchParams.delete("skipIntro");
    window.history.replaceState({}, "", url);
    window.__INITIAL_MAP_STATE.popupId = "";
  }, 500);
}

// Show/hide individual markers based on cluster state and active filters
function syncMarkers(map) {
  if (!map.getSource(POI_SOURCE_ID) || !map.isSourceLoaded(POI_SOURCE_ID)) return;
  if (map.getSource(BENCH_SOURCE_ID) && !map.isSourceLoaded(BENCH_SOURCE_ID)) return;

  const unclusteredIds = new Set(
    map.querySourceFeatures(POI_SOURCE_ID, { filter: ["!", ["has", "point_count"]] })
      .map((f) => f.properties._id)
  );

  if (map.getSource(BENCH_SOURCE_ID)) {
    map.querySourceFeatures(BENCH_SOURCE_ID, { filter: ["!", ["has", "point_count"]] })
      .forEach((f) => unclusteredIds.add(f.properties._id));
  }

  const activeCats = new Set(
    Array.from(document.querySelectorAll(".filter-cb:checked")).map((cb) => cb.dataset.cat)
  );

  allMarkers.forEach(({ el, id, cat }) => {
    el.style.display = (activeCats.has(cat) && unclusteredIds.has(id)) ? "flex" : "none";
  });
}

function addMarkerProxyLayer(map, layerId, sourceId) {
  if (map.getLayer(layerId)) return;
  map.addLayer({
    id: layerId,
    type: "circle",
    source: sourceId,
    filter: ["!", ["has", "point_count"]],
    paint: {
      "circle-radius": 1,
      "circle-opacity": 0
    }
  });
}

function createSourceOptions(features, clusteringEnabled) {
  const options = {
    type: "geojson",
    data: makeFeatureCollection(features)
  };

  if (clusteringEnabled) {
    options.cluster = true;
    options.clusterMaxZoom = 14;
    options.clusterRadius = 50;
  }

  return options;
}

function addClusterLayers(map, layerId, countLayerId, sourceId, color) {
  map.addLayer({
    id: layerId,
    type: "circle",
    source: sourceId,
    filter: ["has", "point_count"],
    paint: {
      "circle-color": color,
      "circle-radius": ["step", ["get", "point_count"], 18, 10, 22, 30, 28],
      "circle-stroke-width": 3,
      "circle-stroke-color": "#fff",
      "circle-opacity": 0.92
    }
  });

  map.addLayer({
    id: countLayerId,
    type: "symbol",
    source: sourceId,
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

function removePOILayersAndSources(map) {
  CLUSTER_LAYER_IDS.forEach((layerId) => {
    if (map.getLayer(layerId)) map.removeLayer(layerId);
  });
  if (map.getSource(BENCH_SOURCE_ID)) map.removeSource(BENCH_SOURCE_ID);
  if (map.getSource(POI_SOURCE_ID)) map.removeSource(POI_SOURCE_ID);
}

function setupPOILayers(map) {
  removePOILayersAndSources(map);
  const slices = getPOISourceSlices();

  map.addSource(POI_SOURCE_ID, createSourceOptions(slices.main, allClusteringEnabled));

  addMarkerProxyLayer(map, POI_PROXY_LAYER_ID, POI_SOURCE_ID);

  if (allClusteringEnabled)
    addClusterLayers(map, POI_CLUSTER_LAYER_ID, POI_CLUSTER_COUNT_LAYER_ID, POI_SOURCE_ID, "#2d7a45");

  if (usesSeparateBenchSource()) {
    map.addSource(BENCH_SOURCE_ID, createSourceOptions(slices.benches, benchClusteringEnabled));
    addMarkerProxyLayer(map, BENCH_PROXY_LAYER_ID, BENCH_SOURCE_ID);
    if (benchClusteringEnabled)
      addClusterLayers(map, BENCH_CLUSTER_LAYER_ID, BENCH_CLUSTER_COUNT_LAYER_ID, BENCH_SOURCE_ID, "#8D6E63");
  }
}

function updatePOISourceData(map) {
  const mainSource = map.getSource(POI_SOURCE_ID);
  if (!mainSource) return false;

  const slices = getPOISourceSlices();
  const hasBenchSource = Boolean(map.getSource(BENCH_SOURCE_ID));
  const needsBenchSource = usesSeparateBenchSource();

  if (needsBenchSource && !hasBenchSource) return false;

  mainSource.setData(makeFeatureCollection(slices.main));
  if (hasBenchSource) {
    map.getSource(BENCH_SOURCE_ID).setData(makeFeatureCollection(slices.benches));
  }
  return true;
}

function updatePOISource(map, options = {}) {
  if (!geojsonData) return;
  if (options.rebuild || !updatePOISourceData(map)) {
    setupPOILayers(map);
  }
  syncMarkerSolarStyles();
  syncCurrentPopupSolarValue();
}

function syncClusterButtons() {
  const button = document.getElementById("cluster-toggle");
  if (!button) return;

  button.setAttribute("aria-pressed", String(allClusteringEnabled));
  button.textContent = allClusteringEnabled
    ? t("clusterSeparate")
    : t("clusterCombine");
}

function getRenderedClusterAtPoint(map, point) {
  const clusterLayers = [POI_CLUSTER_LAYER_ID, BENCH_CLUSTER_LAYER_ID].filter((layerId) =>
    map.getLayer(layerId)
  );
  if (!clusterLayers.length) return null;

  const feature = map.queryRenderedFeatures(point, { layers: clusterLayers })[0];
  if (!feature) return null;

  return {
    feature,
    sourceId: feature.layer.id === BENCH_CLUSTER_LAYER_ID ? BENCH_SOURCE_ID : POI_SOURCE_ID
  };
}

// Zoom into cluster on click
function attachClusterEvents(map) {
  map.on("click", async (e) => {
    const cluster = getRenderedClusterAtPoint(map, e.point);
    if (!cluster) return;

    try {
      const zoom = await map.getSource(cluster.sourceId).getClusterExpansionZoom(cluster.feature.properties.cluster_id);
      map.easeTo({ center: cluster.feature.geometry.coordinates, zoom: zoom + 0.5 });
    } catch (err) { console.error("Cluster zoom error:", err); }
  });

  map.on("mousemove", (e) => {
    map.getCanvas().style.cursor = getRenderedClusterAtPoint(map, e.point) ? "pointer" : "";
  });
}

// Load all GeoJSON files and initialize layers + markers
function loadPOIs(map) {
  loadAllPOIs()
    .then((merged) => {
      geojsonData = merged;
      setupPOILayers(map);
      createMarkers(map);
      openLinkedPopupFromURL(map);
      syncClusterButtons();
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
      syncCategoryGroupButtons();
      updatePOISource(map);
    });
  });

  document.querySelectorAll(".category-group-toggle").forEach((button) => {
    button.addEventListener("click", () => {
      const group = button.closest(".category-group");
      const checkboxes = group ? getCategoryGroupCheckboxes(group) : [];
      const shouldShow = !checkboxes.some((cb) => cb.checked);

      checkboxes.forEach((cb) => {
        cb.checked = shouldShow;
      });

      syncCategoryGroupButtons();
      updatePOISource(map);
    });
  });

  document.querySelectorAll(".solar-class-cb").forEach((cb) => {
    cb.addEventListener("change", () => {
      syncSolarActionButton();
      updatePOISource(map);
    });
  });

  const hideHighSolarBtn = document.getElementById("solar-hide-high");
  hideHighSolarBtn?.addEventListener("click", () => {
    const highHidden = Array.from(document.querySelectorAll(".solar-class-cb"))
      .filter((cb) => Number(cb.dataset.solarClass) >= 3)
      .every((cb) => !cb.checked);

    document.querySelectorAll(".solar-class-cb").forEach((cb) => {
      cb.checked = highHidden || Number(cb.dataset.solarClass) < 3;
    });

    syncSolarActionButton();
    updatePOISource(map);
  });

  syncSolarActionButton();
  syncSimpleSolarLegendNote();
  syncCategoryGroupButtons();
}

function initClusterControls(map) {
  const clusterBtn = document.getElementById("cluster-toggle");
  if (!clusterBtn) return;

  syncClusterButtons();

  clusterBtn.addEventListener("click", () => {
    allClusteringEnabled = !allClusteringEnabled;
    benchClusteringEnabled = allClusteringEnabled;
    syncClusterButtons();
    updatePOISource(map, { rebuild: true });
  });
}
