const DEFAULT_CENTER = {
  lat: 33.5731,
  lon: -7.5898,
  label: "Casablanca",
};

const PLACE_FALLBACKS = {
  casablanca: { lat: 33.5731, lon: -7.5898, label: "Casablanca" },
  rabat: { lat: 34.0209, lon: -6.8416, label: "Rabat" },
  marrakech: { lat: 31.6295, lon: -7.9811, label: "Marrakech" },
  fes: { lat: 34.0181, lon: -5.0078, label: "Fes" },
  "fès": { lat: 34.0181, lon: -5.0078, label: "Fes" },
  tanger: { lat: 35.7595, lon: -5.834, label: "Tanger" },
  agadir: { lat: 30.4278, lon: -9.5981, label: "Agadir" },
  paris: { lat: 48.8566, lon: 2.3522, label: "Paris" },
  lyon: { lat: 45.764, lon: 4.8357, label: "Lyon" },
  marseille: { lat: 43.2965, lon: 5.3698, label: "Marseille" },
  "new york": { lat: 40.7128, lon: -74.006, label: "New York" },
  "los angeles": { lat: 34.0522, lon: -118.2437, label: "Los Angeles" },
};

const DEMO_HOSPITALS = [
  {
    name: "CHU Ibn Rochd",
    lat: 33.5801,
    lon: -7.6197,
    type: "hospital",
    address: "Boulevard Al Massira Al Khadra, Casablanca",
    phone: "+212522481481",
    opening: "24/7",
    emergency: true,
    website: "https://www.chuibnrochd.ma",
  },
  {
    name: "Hopital 20 Aout 1953",
    lat: 33.582,
    lon: -7.6179,
    type: "hospital",
    address: "Quartier des Hopitaux, Casablanca",
    phone: "+212522480000",
    opening: "24/7",
    emergency: true,
    website: "",
  },
  {
    name: "Hopital Cheikh Khalifa",
    lat: 33.5543,
    lon: -7.6713,
    type: "hospital",
    address: "Hay Hassani, Casablanca",
    phone: "+212529004400",
    opening: "24/7",
    emergency: true,
    website: "https://www.hck.ma",
  },
  {
    name: "Clinique Internationale Casablanca",
    lat: 33.594,
    lon: -7.6506,
    type: "clinic",
    address: "Ain Diab, Casablanca",
    phone: "+212522367777",
    opening: "08:00-20:00",
    emergency: false,
    website: "",
  },
  {
    name: "Hopital Moulay Youssef",
    lat: 33.6003,
    lon: -7.6088,
    type: "hospital",
    address: "Boulevard Moulay Youssef, Casablanca",
    phone: "+212522270000",
    opening: "24/7",
    emergency: true,
    website: "",
  },
  {
    name: "Clinique Al Azhar",
    lat: 33.5604,
    lon: -7.6344,
    type: "clinic",
    address: "Maarif, Casablanca",
    phone: "+212522990000",
    opening: "08:00-22:00",
    emergency: false,
    website: "",
  },
];

const app = {
  center: { ...DEFAULT_CENTER },
  origin: { ...DEFAULT_CENTER },
  hospitals: [],
  selectedId: null,
  filter: "all",
  radius: 12,
  sort: "distance",
  prioritizeOpen: false,
  source: "Demo",
  busy: false,
};

const dom = {};

document.addEventListener("DOMContentLoaded", () => {
  cacheDom();
  bindEvents();
  app.hospitals = buildDemoHospitals(DEFAULT_CENTER);
  app.selectedId = app.hospitals[0]?.id ?? null;
  render();
  setStatus("Zone initiale chargee en mode demo.");
});

function cacheDom() {
  dom.searchForm = document.querySelector("#searchForm");
  dom.placeInput = document.querySelector("#placeInput");
  dom.locateBtn = document.querySelector("#locateBtn");
  dom.exportBtn = document.querySelector("#exportBtn");
  dom.radiusRange = document.querySelector("#radiusRange");
  dom.radiusValue = document.querySelector("#radiusValue");
  dom.sortSelect = document.querySelector("#sortSelect");
  dom.openToggle = document.querySelector("#openToggle");
  dom.statusCard = document.querySelector("#statusCard span");
  dom.dataStatus = document.querySelector("#dataStatus");
  dom.regionTitle = document.querySelector("#regionTitle");
  dom.openMapLink = document.querySelector("#openMapLink");
  dom.mapVisual = document.querySelector("#mapVisual");
  dom.markersLayer = document.querySelector("#markersLayer");
  dom.resultsList = document.querySelector("#resultsList");
  dom.sourcePill = document.querySelector("#sourcePill");
  dom.resultCount = document.querySelector("#resultCount");
  dom.nearestDistance = document.querySelector("#nearestDistance");
  dom.emergencyCount = document.querySelector("#emergencyCount");
  dom.avgDistance = document.querySelector("#avgDistance");
  dom.toast = document.querySelector("#toast");
}

function bindEvents() {
  dom.searchForm.addEventListener("submit", handleSearch);
  dom.locateBtn.addEventListener("click", locateUser);
  dom.exportBtn.addEventListener("click", exportCsv);

  dom.radiusRange.addEventListener("input", (event) => {
    app.radius = Number(event.target.value);
    dom.radiusValue.textContent = String(app.radius);
  });

  dom.radiusRange.addEventListener("change", () => refreshHospitals());

  dom.sortSelect.addEventListener("change", (event) => {
    app.sort = event.target.value;
    render();
  });

  dom.openToggle.addEventListener("change", (event) => {
    app.prioritizeOpen = event.target.checked;
    render();
  });

  document.querySelectorAll(".segment").forEach((button) => {
    button.addEventListener("click", () => {
      app.filter = button.dataset.filter;
      document.querySelectorAll(".segment").forEach((item) => {
        item.classList.toggle("is-active", item === button);
      });
      render();
    });
  });

  dom.resultsList.addEventListener("click", (event) => {
    const action = event.target.closest("[data-action]");
    if (action) {
      event.stopPropagation();
      handleCardAction(action);
      return;
    }

    const card = event.target.closest(".hospital-card");
    if (card) {
      selectHospital(card.dataset.id);
    }
  });

  dom.markersLayer.addEventListener("click", (event) => {
    const marker = event.target.closest(".hospital-marker");
    if (marker) {
      selectHospital(marker.dataset.id);
    }
  });
}

async function handleSearch(event) {
  event.preventDefault();
  const query = dom.placeInput.value.trim();
  if (!query) {
    showToast("Saisis une ville, un quartier ou une adresse.");
    return;
  }

  setBusy(true, "Recherche du point de depart...");

  try {
    const place = await geocodePlace(query);
    app.center = place;
    app.origin = place;
    await refreshHospitals(`Recherche autour de ${place.label}`);
  } catch (error) {
    console.warn(error);
    setStatus("Lieu introuvable. Donnees de demonstration conservees.");
    showToast("Lieu introuvable. Essaie une adresse plus precise.");
  } finally {
    setBusy(false);
  }
}

async function locateUser() {
  if (!navigator.geolocation) {
    showToast("La geolocalisation n'est pas disponible dans ce navigateur.");
    return;
  }

  setBusy(true, "Localisation en cours...");

  navigator.geolocation.getCurrentPosition(
    async (position) => {
      const located = {
        lat: position.coords.latitude,
        lon: position.coords.longitude,
        label: "Votre position",
      };
      app.center = located;
      app.origin = located;
      dom.placeInput.value = "";
      try {
        await refreshHospitals("Recherche autour de votre position");
      } finally {
        setBusy(false);
      }
    },
    (error) => {
      console.warn(error);
      setBusy(false);
      setStatus("Autorisation GPS non accordee.");
      showToast("Autorise la position pour afficher les hopitaux proches.");
    },
    {
      enableHighAccuracy: true,
      timeout: 12000,
      maximumAge: 60000,
    },
  );
}

async function refreshHospitals(message = "Recherche des etablissements...") {
  setBusy(true, message);

  try {
    const hospitals = await fetchHospitals(app.center, app.radius);
    if (!hospitals.length) {
      app.hospitals = [];
      app.source = "OpenStreetMap";
      app.selectedId = null;
      setStatus("Aucun hopital public trouve dans ce rayon.");
      showToast("Aucun resultat public dans ce rayon.");
    } else {
      app.hospitals = hospitals;
      app.source = "OpenStreetMap";
      app.selectedId = hospitals[0].id;
      setStatus(`${hospitals.length} resultats OpenStreetMap charges.`);
    }
  } catch (error) {
    console.warn(error);
    app.hospitals = buildDemoHospitals(app.center);
    app.source = "Demo";
    app.selectedId = app.hospitals[0]?.id ?? null;
    setStatus("API indisponible. Mode demo active.");
    showToast("Le reseau public est indisponible. Mode demo active.");
  } finally {
    setBusy(false);
    render();
  }
}

async function geocodePlace(query) {
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("limit", "1");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("accept-language", "fr");
  url.searchParams.set("q", query);

  try {
    const response = await fetchWithTimeout(url.toString(), {}, 12000);
    if (!response.ok) {
      throw new Error(`Nominatim ${response.status}`);
    }
    const data = await response.json();
    const first = data[0];
    if (first) {
      return {
        lat: Number(first.lat),
        lon: Number(first.lon),
        label: formatPlaceLabel(first),
      };
    }
  } catch (error) {
    const fallback = PLACE_FALLBACKS[normalizeKey(query)];
    if (fallback) {
      return { ...fallback };
    }
    throw error;
  }

  const fallback = PLACE_FALLBACKS[normalizeKey(query)];
  if (fallback) {
    return { ...fallback };
  }
  throw new Error("Place not found");
}

async function fetchHospitals(center, radiusKm) {
  const radiusMeters = Math.round(radiusKm * 1000);
  const query = `
    [out:json][timeout:25];
    (
      node["amenity"~"hospital|clinic"](around:${radiusMeters},${center.lat},${center.lon});
      way["amenity"~"hospital|clinic"](around:${radiusMeters},${center.lat},${center.lon});
      relation["amenity"~"hospital|clinic"](around:${radiusMeters},${center.lat},${center.lon});
      node["healthcare"~"hospital|clinic"](around:${radiusMeters},${center.lat},${center.lon});
      way["healthcare"~"hospital|clinic"](around:${radiusMeters},${center.lat},${center.lon});
      relation["healthcare"~"hospital|clinic"](around:${radiusMeters},${center.lat},${center.lon});
    );
    out center tags 80;
  `;

  const endpoints = [
    "https://overpass-api.de/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter",
  ];

  let lastError;

  for (const endpoint of endpoints) {
    try {
      const body = new URLSearchParams({ data: query });
      const response = await fetchWithTimeout(
        endpoint,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
          },
          body,
        },
        20000,
      );
      if (!response.ok) {
        throw new Error(`Overpass ${response.status}`);
      }
      const data = await response.json();
      return normalizeHospitals(data.elements ?? [], center);
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError ?? new Error("Overpass unavailable");
}

function normalizeHospitals(elements, center) {
  const seen = new Set();

  return elements
    .map((element) => {
      const tags = element.tags ?? {};
      const lat = element.lat ?? element.center?.lat;
      const lon = element.lon ?? element.center?.lon;
      if (!lat || !lon) {
        return null;
      }

      const rawName = tags["name:fr"] || tags.name || tags.operator || "";
      const name = rawName.trim() || "Etablissement de sante";
      const key = `${normalizeKey(name)}:${Number(lat).toFixed(4)}:${Number(lon).toFixed(4)}`;
      if (seen.has(key)) {
        return null;
      }
      seen.add(key);

      const type = inferType(tags);
      const address = buildAddress(tags);
      const emergency = tags.emergency === "yes" || /urgence|emergency/i.test(`${tags.name ?? ""} ${tags.healthcare ?? ""}`);
      const opening = tags.opening_hours || (emergency ? "24/7" : "");
      const phone = tags.phone || tags["contact:phone"] || "";
      const website = tags.website || tags["contact:website"] || "";

      return {
        id: `osm-${element.type}-${element.id}`,
        name,
        lat: Number(lat),
        lon: Number(lon),
        type,
        address,
        phone,
        website,
        opening,
        emergency,
        source: "OpenStreetMap",
        distance: distanceKm(center.lat, center.lon, Number(lat), Number(lon)),
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.distance - b.distance);
}

function inferType(tags) {
  const value = `${tags.healthcare ?? ""} ${tags.amenity ?? ""}`.toLowerCase();
  if (value.includes("clinic")) {
    return "clinic";
  }
  return "hospital";
}

function buildAddress(tags) {
  const parts = [
    tags["addr:housenumber"],
    tags["addr:street"],
    tags["addr:suburb"],
    tags["addr:city"],
  ].filter(Boolean);
  return parts.join(", ") || tags["addr:full"] || tags.description || "";
}

function buildDemoHospitals(center) {
  const isDefault = distanceKm(center.lat, center.lon, DEFAULT_CENTER.lat, DEFAULT_CENTER.lon) < 25;
  const list = isDefault
    ? DEMO_HOSPITALS
    : createGenericDemo(center.label);

  return list
    .map((hospital, index) => {
      const lat = isDefault ? hospital.lat : center.lat + hospital.latOffset;
      const lon = isDefault ? hospital.lon : center.lon + hospital.lonOffset;
      return {
        ...hospital,
        id: `demo-${index}`,
        lat,
        lon,
        source: "Demo",
        distance: distanceKm(center.lat, center.lon, lat, lon),
      };
    })
    .sort((a, b) => a.distance - b.distance);
}

function createGenericDemo(label) {
  const place = label || "la zone";
  return [
    {
      name: `Centre Hospitalier ${place}`,
      latOffset: 0.018,
      lonOffset: -0.024,
      type: "hospital",
      address: `Secteur central, ${place}`,
      phone: "",
      opening: "24/7",
      emergency: true,
      website: "",
    },
    {
      name: `Hopital General ${place}`,
      latOffset: -0.025,
      lonOffset: 0.018,
      type: "hospital",
      address: `Avenue principale, ${place}`,
      phone: "",
      opening: "24/7",
      emergency: true,
      website: "",
    },
    {
      name: `Clinique Atlas Sante`,
      latOffset: 0.012,
      lonOffset: 0.032,
      type: "clinic",
      address: `Quartier medical, ${place}`,
      phone: "",
      opening: "08:00-22:00",
      emergency: false,
      website: "",
    },
    {
      name: `Clinique Urgence Plus`,
      latOffset: -0.016,
      lonOffset: -0.036,
      type: "clinic",
      address: `Boulevard nord, ${place}`,
      phone: "",
      opening: "24/7",
      emergency: true,
      website: "",
    },
  ];
}

function render() {
  const hospitals = getVisibleHospitals();
  const selected = hospitals.find((hospital) => hospital.id === app.selectedId) ?? hospitals[0] ?? null;
  if (selected && app.selectedId !== selected.id) {
    app.selectedId = selected.id;
  }

  dom.regionTitle.textContent = app.center.label;
  dom.openMapLink.href = osmRegionUrl(app.center, app.radius);
  dom.sourcePill.textContent = app.source;
  dom.dataStatus.innerHTML = `<i data-lucide="database"></i>${app.source === "Demo" ? "Mode demo" : "OpenStreetMap"}`;

  renderMetrics(hospitals);
  renderMarkers(hospitals);
  renderResults(hospitals);
  refreshIcons();
}

function getVisibleHospitals() {
  const filtered = app.hospitals.filter((hospital) => {
    if (app.filter === "all") return true;
    if (app.filter === "emergency") return hospital.emergency;
    return hospital.type === app.filter;
  });

  filtered.sort((a, b) => {
    if (app.prioritizeOpen) {
      const openDelta = Number(isAlwaysOpen(b)) - Number(isAlwaysOpen(a));
      if (openDelta) return openDelta;
    }

    if (app.sort === "name") {
      return a.name.localeCompare(b.name, "fr");
    }

    if (app.sort === "emergency") {
      const emergencyDelta = Number(b.emergency) - Number(a.emergency);
      if (emergencyDelta) return emergencyDelta;
    }

    return a.distance - b.distance;
  });

  return filtered;
}

function renderMetrics(hospitals) {
  const count = hospitals.length;
  const emergencyCount = hospitals.filter((hospital) => hospital.emergency).length;
  const avgDistance =
    count > 0 ? hospitals.reduce((sum, hospital) => sum + hospital.distance, 0) / count : null;

  dom.resultCount.textContent = String(count);
  dom.nearestDistance.textContent = count ? formatDistance(hospitals[0].distance) : "--";
  dom.emergencyCount.textContent = String(emergencyCount);
  dom.avgDistance.textContent = avgDistance ? formatDistance(avgDistance) : "--";
}

function renderMarkers(hospitals) {
  dom.markersLayer.innerHTML = "";
  dom.mapVisual.classList.toggle("is-dense", hospitals.length > 35);
  const bounds = getMapBounds();

  hospitals.forEach((hospital, index) => {
    const marker = document.createElement("button");
    marker.type = "button";
    marker.className = `hospital-marker${hospital.id === app.selectedId ? " is-selected" : ""}`;
    marker.dataset.id = hospital.id;
    marker.style.left = `${toX(hospital.lon, bounds)}%`;
    marker.style.top = `${toY(hospital.lat, bounds)}%`;
    marker.title = hospital.name;
    marker.setAttribute("aria-label", hospital.name);
    marker.innerHTML = `<span>${index + 1}</span>`;
    dom.markersLayer.append(marker);
  });
}

function renderResults(hospitals) {
  if (!hospitals.length) {
    dom.resultsList.innerHTML = `
      <div class="empty-state">
        <div>
          <strong>Aucun resultat</strong>
          <span>Elargis le rayon ou change de zone.</span>
        </div>
      </div>
    `;
    return;
  }

  dom.resultsList.innerHTML = hospitals
    .map((hospital) => {
      const selected = hospital.id === app.selectedId ? " is-selected" : "";
      const callDisabled = hospital.phone ? "" : ' aria-disabled="true"';
      return `
        <article class="hospital-card${selected}" data-id="${escapeHtml(hospital.id)}">
          <div class="card-top">
            <h3>${escapeHtml(hospital.name)}</h3>
            <span class="distance-badge">${formatDistance(hospital.distance)}</span>
          </div>
          <div class="meta-line">
            <i data-lucide="map-pin"></i>
            <span>${escapeHtml(hospital.address || "Adresse non renseignee")}</span>
          </div>
          <div class="meta-line">
            <i data-lucide="clock"></i>
            <span>${escapeHtml(hospital.opening || "Horaires non renseignes")}</span>
          </div>
          <div class="tag-row">
            <span class="tag">${hospital.type === "clinic" ? "Clinique" : "Hopital"}</span>
            ${hospital.emergency ? '<span class="tag is-red">Urgence</span>' : ""}
            ${isAlwaysOpen(hospital) ? '<span class="tag is-amber">24/7</span>' : ""}
            <span class="tag">${escapeHtml(hospital.source)}</span>
          </div>
          <div class="card-actions">
            <button class="card-action primary" type="button" data-action="gps" data-id="${escapeHtml(hospital.id)}">
              <i data-lucide="navigation"></i>
              GPS
            </button>
            <button class="card-action" type="button" data-action="call" data-id="${escapeHtml(hospital.id)}"${callDisabled}>
              <i data-lucide="phone"></i>
              Appeler
            </button>
            <button class="card-action" type="button" data-action="copy" data-id="${escapeHtml(hospital.id)}">
              <i data-lucide="copy"></i>
              Copier
            </button>
          </div>
        </article>
      `;
    })
    .join("");
}

function handleCardAction(action) {
  const hospital = app.hospitals.find((item) => item.id === action.dataset.id);
  if (!hospital) return;

  if (action.dataset.action === "gps") {
    window.open(directionsUrl(hospital), "_blank", "noopener,noreferrer");
    return;
  }

  if (action.dataset.action === "call") {
    if (hospital.phone) {
      window.location.href = `tel:${hospital.phone}`;
    }
    return;
  }

  if (action.dataset.action === "copy") {
    const summary = `${hospital.name} - ${formatDistance(hospital.distance)} - ${hospital.address || "Adresse non renseignee"} - GPS: ${directionsUrl(hospital)}`;
    navigator.clipboard
      ?.writeText(summary)
      .then(() => showToast("Fiche hopital copiee."))
      .catch(() => showToast(summary));
  }
}

function selectHospital(id) {
  app.selectedId = id;
  render();
  const card = dom.resultsList.querySelector(`[data-id="${CSS.escape(id)}"]`);
  card?.scrollIntoView({ block: "nearest", behavior: "smooth" });
}

function exportCsv() {
  const hospitals = getVisibleHospitals();
  if (!hospitals.length) {
    showToast("Aucun resultat a exporter.");
    return;
  }

  const headers = ["Nom", "Type", "Distance km", "Adresse", "Telephone", "Ouverture", "Urgence", "GPS"];
  const rows = hospitals.map((hospital) => [
    hospital.name,
    hospital.type,
    hospital.distance.toFixed(2),
    hospital.address,
    hospital.phone,
    hospital.opening,
    hospital.emergency ? "Oui" : "Non",
    directionsUrl(hospital),
  ]);
  const csv = [headers, ...rows].map((row) => row.map(csvCell).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `mediroute-hopitaux-${Date.now()}.csv`;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  showToast("Export CSV pret.");
}

function setBusy(isBusy, message) {
  app.busy = isBusy;
  [dom.locateBtn, dom.exportBtn, dom.searchForm.querySelector("button")].forEach((button) => {
    button.disabled = isBusy;
  });

  if (message) {
    setStatus(message);
  }
}

function setStatus(message) {
  dom.statusCard.textContent = message;
}

function showToast(message) {
  dom.toast.textContent = message;
  dom.toast.classList.add("is-visible");
  window.clearTimeout(showToast.timeout);
  showToast.timeout = window.setTimeout(() => {
    dom.toast.classList.remove("is-visible");
  }, 3200);
}

function fetchWithTimeout(resource, options = {}, timeoutMs = 12000) {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), timeoutMs);
  return fetch(resource, {
    ...options,
    signal: controller.signal,
  }).finally(() => window.clearTimeout(timeout));
}

function distanceKm(lat1, lon1, lat2, lon2) {
  const radius = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return radius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function toRad(value) {
  return (value * Math.PI) / 180;
}

function formatDistance(value) {
  if (value < 1) {
    return `${Math.round(value * 1000)} m`;
  }
  return `${value.toFixed(value < 10 ? 1 : 0)} km`;
}

function isAlwaysOpen(hospital) {
  return /24\/7|24h|00:00-24:00|Mo-Su/i.test(hospital.opening || "");
}

function directionsUrl(hospital) {
  const destination = `${hospital.lat},${hospital.lon}`;
  const origin = app.origin ? `${app.origin.lat},${app.origin.lon}` : "";
  const url = new URL("https://www.google.com/maps/dir/");
  url.searchParams.set("api", "1");
  if (origin) {
    url.searchParams.set("origin", origin);
  }
  url.searchParams.set("destination", destination);
  url.searchParams.set("travelmode", "driving");
  return url.toString();
}

function osmRegionUrl(center, radiusKm) {
  const latDelta = radiusKm / 111;
  const lonDelta = radiusKm / Math.max(30, 111 * Math.cos(toRad(center.lat)));
  const bbox = [
    center.lon - lonDelta,
    center.lat - latDelta,
    center.lon + lonDelta,
    center.lat + latDelta,
  ].join(",");
  return `https://www.openstreetmap.org/export#map=13/${center.lat}/${center.lon}&bbox=${bbox}`;
}

function getMapBounds() {
  const latDelta = app.radius / 111;
  const lonDelta = app.radius / Math.max(30, 111 * Math.cos(toRad(app.center.lat)));
  return {
    minLat: app.center.lat - latDelta,
    maxLat: app.center.lat + latDelta,
    minLon: app.center.lon - lonDelta,
    maxLon: app.center.lon + lonDelta,
  };
}

function toX(lon, bounds) {
  return clamp(((lon - bounds.minLon) / (bounds.maxLon - bounds.minLon)) * 100, 4, 96);
}

function toY(lat, bounds) {
  return clamp(100 - ((lat - bounds.minLat) / (bounds.maxLat - bounds.minLat)) * 100, 4, 96);
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function formatPlaceLabel(place) {
  const address = place.address ?? {};
  return (
    address.city ||
    address.town ||
    address.village ||
    address.county ||
    address.state ||
    place.display_name?.split(",")[0] ||
    "Zone selectionnee"
  );
}

function normalizeKey(value) {
  return String(value)
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function csvCell(value) {
  const text = String(value ?? "");
  return `"${text.replace(/"/g, '""')}"`;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function refreshIcons() {
  if (window.lucide?.createIcons) {
    window.lucide.createIcons();
  }
}
