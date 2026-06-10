// ============================================================
// config.js – shared configuration and type defintions
// ============================================================

const MAPTILER_KEY = "KO43aEajGhsdMubLPP2X";

const BASEMAPS = {
  streets:   `https://api.maptiler.com/maps/streets-v2/style.json?key=${MAPTILER_KEY}`,
  satellite: `https://api.maptiler.com/maps/hybrid/style.json?key=${MAPTILER_KEY}`
};

// imagearea of shadowgrid in WGS84
const SHADOW_COORDS = [
  [8.793322316, 49.385219820],
  [8.797466933, 49.385219820],
  [8.797466933, 49.382514018],
  [8.793322316, 49.382514018]
];

// POI-Types with category and color
const TYPE_MAP = [
  { key: "fountain",         match: (p) => p.amenity === "fountain",        emoji: "⛲", label: "Brunnen",             cat: "fountain",   color: "#2196F3" },
  { key: "drinking_water",   match: (p) => p.amenity === "drinking_water",   emoji: "🚰", label: "Trinkwasser",         cat: "drinking",   color: "#29B6F6" },
  { key: "bench",            match: (p) => p.amenity === "bench",            emoji: "🪑", label: "Bank",                cat: "bench",      color: "#8D6E63" },
  { key: "library",          match: (p) => p.amenity === "library",          emoji: "📚", label: "Bibliothek",          cat: "building",   color: "#AB47BC" },
  { key: "community_centre", match: (p) => p.amenity === "community_centre", emoji: "🏛️", label: "Gemeinschaftszentr.", cat: "building",   color: "#FF9800" },
  { key: "playground",       match: (p) => p.leisure === "playground",       emoji: "🛝", label: "Spielplatz",          cat: "playground", color: "#FF7043" },
  { key: "park",             match: (p) => p.leisure === "park",             emoji: "🏞️", label: "Park",                cat: "park",       color: "#66BB6A" },
  { key: "forest",           match: (p) => p.landuse === "forest",           emoji: "🌲", label: "Wald",                cat: "forest",     color: "#2E7D32" },
  { key: "water",            match: (p) => p.natural === "water",            emoji: "💧", label: "Wasserfläche",        cat: "water",      color: "#1E88E5" },
  { key: "river",            match: (p) => p.waterway === "river",           emoji: "🌊", label: "Fluss",               cat: "water",      color: "#039BE5" },
  { key: "bus_stop",         match: (p) => p.highway === "bus_stop",         emoji: "🚌", label: "Bushaltestelle",      cat: "busstop",    color: "#FFB300" },
];

const FALLBACK_TYPE = { key: "other", emoji: "📍", label: "Ort", cat: "other", color: "#607D8B" };

function getType(props) {
  return TYPE_MAP.find((t) => t.match(props)) || FALLBACK_TYPE;
}