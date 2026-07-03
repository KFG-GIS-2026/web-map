// ============================================================
// i18n.js - small runtime translation layer
// ============================================================

const TRANSLATIONS = {
  de: {
    appTitle: "Kühle Karte Neckargemünd",
    simple: "Einfach",
    complex: "Komplex",
    sidebarMain: "Kühle-Orte-Karte",
    sidebarToggle: "Legende ein-/ausblenden",
    languageLabel: "Sprache",
    chooseLanguage: "Sprache auswählen",
    solarLoad: "Sonnenbelastung",
    solarSimpleTooltip: "In der einfachen Ansicht zeigen die Farben den Tagesdurchschnitt für den zeitlich passendsten Tag. Datum und Uhrzeit können in der komplexen Ansicht eingestellt werden.",
    solarComplexTooltip: "Die Farben zeigen die aktuelle Sonnenbelastung von Parks, Sitzbänken und Spielplätzen zum gewählten Zeitpunkt: Blau ist kühler, Rot ist belasteter. Angenäherte Werte bei wolkenfreiem Himmel.",
    solarComplexNote: "",
    veryLowShort: "sehr gering",
    lowShort: "gering",
    mediumShort: "mittel",
    highShort: "hoch",
    veryHighShort: "sehr hoch",
    veryLowSolar: "sehr geringe Sonnenbelastung",
    lowSolar: "geringe Sonnenbelastung",
    mediumSolar: "mittlere Sonnenbelastung",
    highSolar: "hohe Sonnenbelastung",
    veryHighSolar: "sehr hohe Sonnenbelastung",
    showAllSolar: "Alle Sonnenklassen anzeigen",
    showCoolerOnly: "Nur kühlere Orte anzeigen",
    timePoint: "Zeitpunkt",
    timePointTooltip: "Zeitpunkt für die Schattenmodellierung und für die Solarwerte der POIs",
    date: "Datum",
    chooseDate: "Datum auswählen",
    current: "aktuell",
    currentTitle: "Auf den zeitlich passendsten Zeitpunkt springen",
    leisure: "Freizeit & Erholung",
    water: "Wasser",
    buildings: "Gebäude",
    hide: "ausblenden",
    show: "einblenden",
    disclaimer: "Alle Angaben ohne Gewähr. Die Angaben basieren auf öffentlichen Daten.",
    category_playground: "Spielplatz",
    category_park: "Park",
    category_bench: "Sitzbank",
    category_drinking: "Trinkwasser",
    category_toilet: "Toilette",
    category_church: "Kirche",
    category_fountain: "Brunnen",
    category_library: "Bücherei",
    category_museum: "Museum",
    category_other: "Ort",
    clusterCombine: "Orte beim Zoomen zusammenfassen",
    clusterSeparate: "Orte beim Zoomen nicht zusammenfassen",
    addressSearch: "Adresssuche",
    addressPlaceholder: "Straße, Hausnummer",
    search: "Suchen",
    openLegend: "Legende öffnen",
    help: "Hilfe",
    openHelp: "Hilfe öffnen",
    shadowControlOpen: "Zeit- und Schattensteuerung öffnen",
    mobileQuick: "Mobile Schnellzugriff",
    openShadow: "Schatten öffnen",
    modeChoice: "Modusauswahl",
    mapActions: "Kartenaktionen",
    copyLink: "Link zur aktuellen Ansicht kopieren",
    linkCopied: "Link kopiert",
    helpKicker: "Kurzüberblick",
    closeHelp: "Hilfe schließen",
    whatMapShows: "Was zeigt die Karte?",
    helpIntro: "Die Karte hilft dabei, kühle Orte, Wasserstellen, Sitzmöglichkeiten und öffentliche Orte in Neckargemünd zu finden. In der Sidebar können die Symbole ein- und ausgeblendet werden; ein Klick auf einen Punkt öffnet Detailinformationen.",
    symbolExamples: "Beispiele für Kartensymbole",
    modeHelpTitle: "Einfach und Komplex",
    modeHelpText: "Im einfachen Modus bleibt die Karte reduziert. Im komplexen Modus erscheinen zusätzliche Werkzeuge wie Schatten, Zeitpunkt, 3D-Hinweis und Demo-Schalter.",
    shadowTimeTitle: "Schatten und Uhrzeit",
    shadowTimeText: "Unten steuert der Uhrzeitregler die Werte für die jeweilige Stunde. Der Play-Button startet den Durchlauf; der Schalter „Schatten“ blendet die modellierten Schatten ein oder aus.",
    dateHelpText: "Unter „Zeitpunkt“ wird das Datum für Schattenmodellierung und Solarwerte gewählt. Zur Auswahl stehen Anfang und Mitte der Monate Mai bis September; „aktuell“ springt zum zeitlich passendsten Datum und zur aktuellen Stunde.",
    infoButtons: "Info-Buttons",
    infoButtonsText: "Kleine „i“-Buttons stehen direkt neben erklärungsbedürftigen Funktionen. Per Hover oder Klick erscheint ein kurzer Hinweis zur jeweiligen Einstellung.",
    shortHint: "kurze Zusatzinfo",
    start: "Loslegen",
    rotate3d: "3D drehen",
    rotate3dText: "Rechte Maustaste halten u. ziehen.",
    shadow: "Schatten",
    shadowTitle: "Schatten ein-/ausblenden",
    shadowTooltip: "Modellierter Schattenwurf zur angegebenen Zeit. Angenäherte Werte bei wolkenfreiem Himmel. Der Zeitpunkt kann unter \"Zeitpunkt\" in der Sidebar geändert werden.",
    closeTimeline: "Zeitleiste schließen",
    playTitle: "Animation starten/stoppen",
    timeUnit: "Uhr",
    beginning: "Anfang",
    middle: "Mitte",
    month_5: "Mai",
    month_6: "Juni",
    month_7: "Juli",
    month_8: "August",
    month_9: "September",
    noSolarData: "Keine Sonnenbelastungsdaten",
    noDailySolar: "Keine Tagesdurchschnittsdaten für {date}",
    noHourlySolar: "Keine Daten für {date}, {hour}:00 Uhr",
    dailyAverage: "Tagesdurchschnitt {date}",
    solarAtTime: "{date}, {hour}.00 Uhr",
    detailComplex: "Details in komplexer Ansicht",
    openingHours: "Öffnungszeiten",
    address: "Adresse",
    costAccess: "Kosten/Zugang",
    wheelchair: "Barrierefreiheit",
    wheelchairToilet: "Rollstuhl-WC",
    operator: "Betreiber",
    denomination: "Konfession",
    religion: "Religion",
    historic: "Historisch",
    buildingType: "Gebäudetyp",
    material: "Material",
    use: "Nutzung",
    seats: "Sitzplätze",
    info: "Info",
    website: "Website",
    wheelchairAccessible: "Rollstuhlgerecht",
    yes: "ja",
    no: "nein",
    limited: "eingeschränkt",
    christian: "christlich",
    protestant: "evangelisch",
    roman_catholic: "römisch-katholisch",
    catholic: "katholisch",
    oecumenic: "ökumenisch",
    place_of_worship: "Gotteshaus",
    chapel: "Kapelle",
    church: "Kirche",
    residential: "Wohnnutzung",
    historic_building: "historisches Gebäude",
    sandstone: "Sandstein",
    addressComplexOnly: "Adresssuche ist in der komplexen Ansicht verfügbar.",
    addressMissing: "Bitte eine Straße oder Adresse eingeben.",
    addressSearching: "Adresse wird gesucht ...",
    addressNotFound: "Keine passende Adresse in Neckargemünd gefunden.",
    addressInvalid: "Suchergebnis ohne gültige Koordinate.",
    addressFound: "Adresse gefunden.",
    addressUnavailable: "Adresssuche momentan nicht verfügbar.",
    nominatimQuerySuffix: "Neckargemünd, Baden-Württemberg, Deutschland"
  },
  en: {
    appTitle: "Cool Places Map Neckargemünd",
    simple: "Simple",
    complex: "Advanced",
    sidebarMain: "Cool Places Map",
    sidebarToggle: "Show/hide legend",
    languageLabel: "Language",
    chooseLanguage: "Choose language",
    solarLoad: "Sun exposure",
    solarSimpleTooltip: "In simple view, colors show the daily average for the closest available reference date. Date and time can be adjusted more precisely in advanced view.",
    solarComplexTooltip: "Colors show current sun exposure for parks, benches and playgrounds at the selected time: blue is cooler, red is more exposed. Approximate values for a cloudless sky.",
    solarComplexNote: "",
    veryLowShort: "very low",
    lowShort: "low",
    mediumShort: "medium",
    highShort: "high",
    veryHighShort: "very high",
    veryLowSolar: "very low sun exposure",
    lowSolar: "low sun exposure",
    mediumSolar: "medium sun exposure",
    highSolar: "high sun exposure",
    veryHighSolar: "very high sun exposure",
    showAllSolar: "Show all sun classes",
    showCoolerOnly: "Show cooler places only",
    timePoint: "Time",
    timePointTooltip: "the time used for shadow modelling and POI solar values",
    date: "Date",
    chooseDate: "Choose date",
    current: "current",
    currentTitle: "Jump to the closest current time",
    leisure: "Leisure & Recreation",
    water: "Water",
    buildings: "Buildings",
    hide: "hide",
    show: "show",
    disclaimer: "No warranty is given. Information is based on public data.",
    category_playground: "Playground",
    category_park: "Park",
    category_bench: "Bench",
    category_drinking: "Drinking water",
    category_toilet: "Toilet",
    category_church: "Church",
    category_fountain: "Fountain",
    category_library: "Library",
    category_museum: "Museum",
    category_other: "Place",
    clusterCombine: "Group places when zooming",
    clusterSeparate: "Do not group places when zooming",
    addressSearch: "Address search",
    addressPlaceholder: "Street, house number",
    search: "Search",
    openLegend: "Open legend",
    help: "Help",
    openHelp: "Open help",
    shadowControlOpen: "Open time and shadow controls",
    mobileQuick: "Mobile quick access",
    openShadow: "Open shadow controls",
    modeChoice: "Mode selection",
    mapActions: "Map actions",
    copyLink: "Copy link to current view",
    linkCopied: "Link copied",
    helpKicker: "Quick overview",
    closeHelp: "Close help",
    whatMapShows: "What does the map show?",
    helpIntro: "The map helps find cool places, water points, seating and public places in Neckargemünd. Symbols can be shown or hidden in the sidebar; clicking a point opens details.",
    symbolExamples: "Examples of map symbols",
    modeHelpTitle: "Simple and Advanced",
    modeHelpText: "Simple mode keeps the map reduced. Advanced mode adds tools such as shadows, time controls, the 3D hint and clustering options.",
    shadowTimeTitle: "Shadows and Time",
    shadowTimeText: "The time slider at the bottom controls the values for each hour. The play button starts the animation; the “Shadow” switch shows or hides the modelled shadows.",
    dateHelpText: "Under “Time”, the date for shadow modelling and solar values is selected. Early and mid-month dates from May to September are available; “current” jumps to the closest date and current hour.",
    infoButtons: "Info Buttons",
    infoButtonsText: "Small “i” buttons sit next to functions that need a short explanation. Hover or click to show a brief hint for the setting.",
    shortHint: "short hint",
    start: "Start",
    rotate3d: "Rotate 3D",
    rotate3dText: "Hold right mouse button and drag.",
    shadow: "Shadow",
    shadowTitle: "Show/hide shadow",
    shadowTooltip: "Modelled shadow for the selected time. Approximate values under clear-sky conditions. The time can be changed under “Time” in the sidebar.",
    closeTimeline: "Close timeline",
    playTitle: "Start/stop animation",
    timeUnit: "",
    beginning: "Early",
    middle: "Mid",
    month_5: "May",
    month_6: "June",
    month_7: "July",
    month_8: "August",
    month_9: "September",
    noSolarData: "No sun exposure data",
    noDailySolar: "No daily average data for {date}",
    noHourlySolar: "No data for {date}, {hour}:00",
    dailyAverage: "Daily average {date}",
    solarAtTime: "{date}, {hour}:00",
    detailComplex: "Details in advanced view",
    openingHours: "Opening hours",
    address: "Address",
    costAccess: "Cost/access",
    wheelchair: "Accessibility",
    wheelchairToilet: "Wheelchair-accessible toilet",
    operator: "Operator",
    denomination: "Denomination",
    religion: "Religion",
    historic: "Historic",
    buildingType: "Building type",
    material: "Material",
    use: "Use",
    seats: "Seats",
    info: "Info",
    website: "Website",
    wheelchairAccessible: "Wheelchair accessible",
    yes: "yes",
    no: "no",
    limited: "limited",
    christian: "Christian",
    protestant: "Protestant",
    roman_catholic: "Roman Catholic",
    catholic: "Catholic",
    oecumenic: "ecumenical",
    place_of_worship: "place of worship",
    chapel: "chapel",
    church: "church",
    residential: "residential use",
    historic_building: "historic building",
    sandstone: "sandstone",
    addressComplexOnly: "Address search is available in advanced view.",
    addressMissing: "Please enter a street or address.",
    addressSearching: "Searching for address ...",
    addressNotFound: "No matching address found in Neckargemünd.",
    addressInvalid: "Search result has no valid coordinate.",
    addressFound: "Address found.",
    addressUnavailable: "Address search is currently unavailable.",
    nominatimQuerySuffix: "Neckargemünd, Baden-Württemberg, Germany"
  }
};

function getInitialLanguage() {
  const params = new URLSearchParams(window.location.search);
  const urlLang = (params.get("lang") || "").toLowerCase();
  if (urlLang === "en" || urlLang === "de") return urlLang;
  return localStorage.getItem("kfg-map-language") === "en" ? "en" : "de";
}

let currentLanguage = getInitialLanguage();

function t(key, vars = {}) {
  const text = TRANSLATIONS[currentLanguage]?.[key] ?? TRANSLATIONS.de[key] ?? key;
  return Object.entries(vars).reduce((value, [name, replacement]) =>
    value.replaceAll(`{${name}}`, replacement), text);
}

function getLanguage() {
  return currentLanguage;
}

function setLanguage(lang) {
  currentLanguage = lang === "en" ? "en" : "de";
  localStorage.setItem("kfg-map-language", currentLanguage);
  const url = new URL(window.location.href);
  url.searchParams.set("lang", currentLanguage);
  window.history.replaceState({}, "", url);
  document.documentElement.lang = currentLanguage;
  applyStaticTranslations();
  syncLanguageButtons();
  document.dispatchEvent(new CustomEvent("i18n:changed"));
}

function syncLanguageButtons() {
  document.querySelectorAll(".language-option").forEach((button) => {
    const active = button.dataset.lang === currentLanguage;
    button.setAttribute("aria-pressed", String(active));
  });
}

function setText(selector, key) {
  document.querySelectorAll(selector).forEach((el) => { el.textContent = t(key); });
}

function setAttr(selector, attr, key) {
  document.querySelectorAll(selector).forEach((el) => { el.setAttribute(attr, t(key)); });
}

function applyStaticTranslations() {
  document.title = t("appTitle");
  document.documentElement.lang = currentLanguage;

  setText(".mode-label[data-mode='simple'], .mobile-mode-label[data-mode='simple']", "simple");
  setText(".mode-label[data-mode='complex'], .mobile-mode-label[data-mode='complex']", "complex");
  setText(".sidebar-title-main", "sidebarMain");
  setText("#solar-legend-section .section-title-text", "solarLoad");
  setText("#solar-filter-section .section-title-text", "solarLoad");
  setText("#shadow-date-section .section-title-text", "timePoint");
  setText(".shadow-date-control span", "date");
  setText("#shadow-current", "current");
  setText(".simple-solar-legend-item:nth-child(1) span:last-child", "veryLowShort");
  setText(".simple-solar-legend-item:nth-child(2) span:last-child", "lowShort");
  setText(".simple-solar-legend-item:nth-child(3) span:last-child", "mediumShort");
  setText(".simple-solar-legend-item:nth-child(4) span:last-child", "highShort");
  setText(".simple-solar-legend-item:nth-child(5) span:last-child", "veryHighShort");
  setText(".solar-class-labels span:first-child", "veryLowShort");
  setText(".solar-class-labels span:last-child", "veryHighShort");
  setText(".category-group[data-category-cats='playground park bench'] .category-group-toggle span:first-child", "leisure");
  setText(".category-group[data-category-cats='drinking fountain toilet'] .category-group-toggle span:first-child", "water");
  setText(".category-group[data-category-cats='church library museum'] .category-group-toggle span:first-child", "buildings");
  setText(".sidebar-disclaimer", "disclaimer");
  setText("#lbl-playground .filter-label", "category_playground");
  setText("#lbl-park .filter-label", "category_park");
  setText("#lbl-bench .filter-label", "category_bench");
  setText("#lbl-drinking .filter-label", "category_drinking");
  setText("#lbl-fountain .filter-label", "category_fountain");
  setText("#lbl-toilet .filter-label", "category_toilet");
  setText("#lbl-church .filter-label", "category_church");
  setText("#lbl-library .filter-label", "category_library");
  setText("#lbl-museum .filter-label", "category_museum");
  setText("#address-search-section summary span", "addressSearch");
  setText("#address-search-form button", "search");
  setText("#help-open span:last-child", "help");
  setText("#mobile-mode-panel .mobile-panel-header", "modeChoice");
  setText(".help-kicker", "helpKicker");
  setText("#help-title", "appTitle");
  setText(".help-intro h3", "whatMapShows");
  setText(".help-intro p:not(.help-disclaimer)", "helpIntro");
  setText(".help-disclaimer", "disclaimer");
  setText(".help-card:nth-child(1) h3", "modeHelpTitle");
  setText(".help-card:nth-child(1) p", "modeHelpText");
  setText(".help-mode-figure span:first-child", "simple");
  setText(".help-mode-figure span:last-child", "complex");
  setText(".help-card:nth-child(2) h3", "shadowTimeTitle");
  setText(".help-card:nth-child(2) p", "shadowTimeText");
  setText(".help-card:nth-child(3) h3", "timePoint");
  setText(".help-card:nth-child(3) p", "dateHelpText");
  const dateFigureSpans = document.querySelectorAll(".help-date-figure span");
  if (dateFigureSpans[0]) dateFigureSpans[0].textContent = `${t("beginning")} ${t("month_5")}`;
  if (dateFigureSpans[1]) dateFigureSpans[1].textContent = `${t("middle")} ${t("month_6")}`;
  setText(".help-date-figure button", "current");
  setText(".help-card:nth-child(4) h3", "infoButtons");
  setText(".help-card:nth-child(4) p", "infoButtonsText");
  setText(".help-info-demo-tooltip", "shortHint");
  setText("#help-start", "start");
  setText(".three-d-hint-text strong", "rotate3d");
  setText(".three-d-hint-text span", "rotate3dText");
  setText(".shadow-toggle-label", "shadow");

  document.querySelector("#solar-legend-section .info-tooltip").textContent = t("solarSimpleTooltip");
  document.querySelector("#solar-filter-section .info-tooltip").textContent = t("solarComplexTooltip");
  const solarFilterNote = document.querySelector("#solar-filter-section .solar-filter-note");
  solarFilterNote.textContent = "";
  solarFilterNote.hidden = true;
  document.querySelector("#shadow-date-section .info-tooltip").textContent = t("timePointTooltip");
  document.querySelector("#shadow-toggle-control .info-tooltip").textContent = t("shadowTooltip");

  setAttr("#sidebar-toggle", "title", "sidebarToggle");
  setAttr("#sidebar-toggle", "aria-label", "sidebarToggle");
  setAttr("#language-control", "aria-label", "chooseLanguage");
  setAttr("#shadow-date", "title", "chooseDate");
  setAttr("#shadow-current", "title", "currentTitle");
  setAttr("#address-search-input", "placeholder", "addressPlaceholder");
  setAttr("#address-search-input", "aria-label", "addressSearch");
  setAttr("#sidebar-open", "title", "openLegend");
  setAttr("#sidebar-open", "aria-label", "openLegend");
  setAttr("#help-open", "aria-label", "openHelp");
  setAttr("#shadow-bar-open", "aria-label", "shadowControlOpen");
  setAttr("#shadow-bar-open", "title", "shadowControlOpen");
  setAttr("#shadow-bar-open", "data-tooltip", "shadowControlOpen");
  setAttr("#mobile-mode-panel", "aria-label", "modeChoice");
  setAttr("#mobile-action-bar", "aria-label", "mobileQuick");
  setAttr("#mobile-action-sidebar", "aria-label", "openLegend");
  setAttr("#mobile-action-shadow", "aria-label", "openShadow");
  setAttr("#mobile-action-mode", "aria-label", "modeChoice");
  setAttr("#map-action-controls", "aria-label", "mapActions");
  setAttr("#map-copy-link-button", "title", "copyLink");
  setAttr("#map-copy-link-button", "aria-label", "copyLink");
  setAttr("#help-close", "aria-label", "closeHelp");
  setAttr(".help-symbol-strip", "aria-label", "symbolExamples");
  setAttr("#shadow-toggle", "title", "shadowTitle");
  setAttr("#shadow-play", "title", "playTitle");
  setAttr("#shadow-bar-close", "title", "closeTimeline");
  setAttr("#shadow-bar-close", "aria-label", "closeTimeline");

  document.querySelectorAll(".solar-class-chip").forEach((el, index) => {
    el.title = [t("veryLowSolar"), t("lowSolar"), t("mediumSolar"), t("highSolar"), t("veryHighSolar")][index];
  });
}

document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".language-option").forEach((button) => {
    button.addEventListener("click", () => setLanguage(button.dataset.lang));
  });
  syncLanguageButtons();
  applyStaticTranslations();
});
