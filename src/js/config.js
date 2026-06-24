// ============================================================
// config.js – shared configuration and type definitions
// ============================================================

// Base map style: OpenFreeMap bright (no API key required, OSM data)
const MAP_STYLE = "https://tiles.openfreemap.org/styles/bright";

// Image extent of the shadow raster in WGS84 coordinates
// Order: [NW, NE, SE, SW]
const SHADOW_COORDS = [
  [8.73803182321166, 49.41863840982511],
  [8.9035906286068, 49.41863840982511],
  [8.9035906286068, 49.3644124949337],
  [8.73803182321166, 49.3644124949337]
];

// POI categories: one GeoJSON file + one PNG icon per category.
// Each file in data/osm_poi/ is loaded separately and tagged with its
// category here. PNG icons are rendered with a white circular background.
const POI_CATEGORIES = [
  { cat: "playground", file: "Spielplatz_Punkte.geojson",    icon: "001-slide.png",       label: "Spielplatz",         color: "#FF7043" },
  { cat: "park",        file: "Park_Punkte.geojson",         icon: "002-park.png",        label: "Park",               color: "#66BB6A" },
  { cat: "bench",       file: "Sitzbank.geojson",            icon: "003-bank.png",        label: "Sitzbank",           color: "#8D6E63" },
  { cat: "drinking",    file: "Trinkwasserstelle.geojson",   icon: "004-water.png",       label: "Trinkwasser",        color: "#29B6F6" },
  { cat: "toilet",      file: "Toilete.geojson",             icon: "005-toilet.png",      label: "Toilette",           color: "#9575CD" },
  { cat: "church",      file: "Kirche.geojson",              icon: "006-church.png",      label: "Kirche",             color: "#795548" },
  { cat: "fountain",    file: "Brunnen.geojson",             icon: "007-fountain.png",    label: "Brunnen",            color: "#2196F3" },
  { cat: "library",     file: "Bücherei.geojson",            icon: "008-open-book.png",   label: "Bücherei",           color: "#AB47BC" },
  { cat: "museum",      file: "Museum.geojson",              icon: "009-museum-art.png",  label: "Museum",             color: "#FF9800" }
];

function getCategoryByKey(cat) {
  return POI_CATEGORIES.find((c) => c.cat === cat) || null;
}