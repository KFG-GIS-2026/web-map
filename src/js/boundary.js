// ============================================================
// boundary.js - municipality boundary and outside mask
// ============================================================

const MUNICIPALITY_BOUNDARY_URL = "data/insel_ng.geojson";

function getMunicipalityOuterRings(geojson) {
  const rings = [];

  geojson.features.forEach((feature) => {
    const geometry = feature.geometry;
    if (!geometry) return;

    if (geometry.type === "Polygon") {
      rings.push(geometry.coordinates[0]);
    }

    if (geometry.type === "MultiPolygon") {
      geometry.coordinates.forEach((polygon) => {
        rings.push(polygon[0]);
      });
    }
  });

  return rings;
}

function createOutsideMaskGeoJSON(boundaryGeoJSON) {
  const worldRing = [
    [-180, -85],
    [180, -85],
    [180, 85],
    [-180, 85],
    [-180, -85]
  ];

  return {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        properties: {},
        geometry: {
          type: "Polygon",
          coordinates: [worldRing, ...getMunicipalityOuterRings(boundaryGeoJSON)]
        }
      }
    ]
  };
}

function getBoundaryLayerPosition(map) {
  return map.getLayer("clusters") ? "clusters" : undefined;
}

function loadMunicipalityBoundary(map) {
  fetch(MUNICIPALITY_BOUNDARY_URL)
    .then((response) => response.json())
    .then((boundaryGeoJSON) => {
      const maskGeoJSON = createOutsideMaskGeoJSON(boundaryGeoJSON);
      const beforeLayerId = getBoundaryLayerPosition(map);

      if (!map.getSource("municipality-boundary")) {
        map.addSource("municipality-boundary", {
          type: "geojson",
          data: boundaryGeoJSON
        });
      }

      if (!map.getSource("municipality-mask")) {
        map.addSource("municipality-mask", {
          type: "geojson",
          data: maskGeoJSON
        });
      }

      if (!map.getLayer("municipality-mask")) {
        map.addLayer({
          id: "municipality-mask",
          type: "fill",
          source: "municipality-mask",
          paint: {
            "fill-color": "#8f8f8f",
            "fill-opacity": 0.25
          }
        }, beforeLayerId);
      }

      if (!map.getLayer("municipality-outline")) {
        map.addLayer({
          id: "municipality-outline",
          type: "line",
          source: "municipality-boundary",
          paint: {
            "line-color": "#111111",
            "line-width": [
              "interpolate",
              ["linear"],
              ["zoom"],
              10, 0.6,
              14, 1.1,
              17, 1.8
            ],
            "line-opacity": 0.1
          }
        }, beforeLayerId);
      }
    })
    .catch((error) => console.error("Municipality boundary load error:", error));
}
