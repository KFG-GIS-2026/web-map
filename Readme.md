# Kühle Karte Neckargemünd

## lokale Entwicklung

- vs code mit Live Server extension
- index.html --> open with live server

Browser öffnet sich automatisch auf localhost und Codeänderungen werden automatisch neu geladen

## Code-Struktur und Dateifunktionen

### `index.html` – Das Grundgerüst

- Hier sind alle Grundelemente der Karte definiert


Beispiel

```html
<div id="shadow-bar">
  <button id="shadow-bar-toggle">🕒 Schatten</button>
  <div id="shadow-panel" class="hidden">
    <span id="shadow-time">12:00 Uhr</span>
    <button id="shadow-play">▶</button>
    <input type="range" id="shadow-slider" min="0" max="14" />
  </div>
</div>
```

Hier wird definiert: Es gibt eine Leiste (`div`), darin einen Button zum Öffnen, eine Zeitanzeige, einen Play-Button und einen Schieberegler. Was diese Elemente *tun* und *aussehen*, regeln die anderen Dateien.
 
### `src/css/style.css` – Das Aussehen

Hier wird das Styling wie Farbe, Größe etc bestimmt

Beispiel

```css
#shadow-bar {
  position: absolute;
  bottom: 56px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(255,255,255,0.96);
  border-radius: 32px;
  box-shadow: 0 4px 24px rgba(0,0,0,0.18);
}
 
#shadow-play {
  background: #1a6b3c;
  color: #fff;
  border-radius: 50%;
  width: 36px;
  height: 36px;
}
```

Die `id`-Selektoren (`#shadow-bar`, `#shadow-play`) verknüpfen das CSS direkt mit den gleichnamigen `id`-Attributen im HTML.


### JavaScript  `src/js/shadow.js` - Die Interaktivität und Logik
Lädt die Schattenbilder auf die Karte und steuert die Zeitanimation. Wenn man den Slider bewegt oder auf Play drückt, wechselt dieses Script das angezeigte PNG.

Beispiel
 
```js
// When the slider moves: stop animation, update shadow to selected hour
slider.addEventListener("input", (e) => {
  _stopAnimation();
  updateShadowLayer(map, SHADOW_HOURS[Number(e.target.value)]);
});
```
Lädt die Schattenbilder auf die Karte und steuert die Zeitanimation. Wenn man den Slider bewegt oder auf Play drückt, wechselt dieses Script das angezeigte PNG.


#### `map.js`
Der Einstiegspunkt: Initialisiert die Karte, fügt die Navigationssteuerung hinzu, startet alle anderen Module und regelt das Ein- und Ausklappen der Sidebar.
 
---
 
## Die Karte: MapLibre GL JS
 
Die Karte selbst wird mit der Open-Source-Bibliothek **MapLibre GL JS** gerendert. Sie ermöglicht flüssige, interaktive Karten im Browser.
 
```js
// Create the map and center it on Neckargemünd
const map = new maplibregl.Map({
  container: "map",     // id of the <div> in index.html
  style: BASEMAPS.streets,
  center: [8.8, 49.39],
  zoom: 13,
  pitch: 45
});
```

Weitere Maplibre-Beispiele in Dokumentation
**[maplibre.org/maplibre-gl-js/docs/examples/](https://maplibre.org/maplibre-gl-js/docs/examples/)**

```js
map.addControl(
  new maplibregl.NavigationControl({ visualizePitch: true, showZoom: true, showCompass: true }),
  "top-right"
);
map.addControl(
  new maplibregl.GeolocateControl({ positionOptions: { enableHighAccuracy: true }, trackUserLocation: true }),
  "top-right"
);
```


