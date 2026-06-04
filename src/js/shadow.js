// ============================================================
// shadow.js – Schattenlayer + Zeitsteuerung
// ============================================================

let currentShadowHour = 16;

function getShadowImage(hour) {
  return `data/shadows/shadow_${hour}00.png`;
}

function createShadowLayer(map) {
  if (map.getLayer("shadow-layer")) {
    map.removeLayer("shadow-layer");
  }

  if (map.getSource("shadow")) {
    map.removeSource("shadow");
  }

  map.addSource("shadow", {
    type: "image",
    url: getShadowImage(currentShadowHour),
    coordinates: SHADOW_COORDS
  });

  // Schatten UNTER den Gebäuden
  let beforeLayerId = null;

  const layers = map.getStyle().layers;

  for (const layer of layers) {
    if (
      layer.type === "fill-extrusion" ||
      layer.id === "building-3d"
    ) {
      beforeLayerId = layer.id;
      break;
    }
  }

  map.addLayer(
    {
      id: "shadow-layer",
      type: "raster",
      source: "shadow",
      paint: {
        "raster-opacity": 0.55,
        "raster-fade-duration": 0
      }
    },
    beforeLayerId
  );
}

function updateShadowLayer(map, hour) {
  currentShadowHour = hour;

  const source = map.getSource("shadow");

  if (!source) return;

  source.updateImage({
    url: getShadowImage(hour),
    coordinates: SHADOW_COORDS
  });

  updateShadowTime(hour);
}

function updateShadowTime(hour) {
  const el = document.getElementById("shadow-time");

  if (!el) return;

  el.textContent = `${hour}:00 Uhr`;
}

function initShadowControls(map) {
  const slider = document.getElementById("shadow-slider");
  const panel = document.getElementById("shadow-panel");
  const toggle = document.getElementById("shadow-bar-toggle");
  const hide = document.getElementById("shadow-hide");

  if (!slider || !panel || !toggle || !hide) return;

  slider.value = currentShadowHour;

  updateShadowTime(currentShadowHour);

  slider.addEventListener("input", (e) => {
    updateShadowLayer(map, Number(e.target.value));
  });

  toggle.addEventListener("click", () => {
    panel.classList.toggle("hidden");
  });

  hide.addEventListener("click", () => {
    panel.classList.add("hidden");
  });
}