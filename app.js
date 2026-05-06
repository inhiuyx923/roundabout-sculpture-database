const records = window.ROUNDABOUT_SCULPTURES_ENRICHED || [];
const colors = { featured: "#d7ff00", normal: "#19a5ff", low_priority: "#a2a9ad", other: "#c58bff" };
const labels = { featured: "Curious", normal: "Archive", low_priority: "Limited", other: "Other" };
const state = { filter: "all", country: "all", city: "all", search: "", view: "grid" };
const markers = new Map();
const layer = L.layerGroup();
const $ = (id) => document.getElementById(id);

const map = L.map("map", { worldCopyJump: true, zoomControl: false, attributionControl: true }).setView([33, 10], 3);
L.control.zoom({ position: "topright" }).addTo(map);
L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
  maxZoom: 19,
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
}).addTo(map);
layer.addTo(map);

function titleFor(record) {
  if (record.title) return record.title;
  if (record.city && record.country) return `${record.city}, ${record.country}`;
  return record.original_name || `${record.latitude.toFixed(4)}, ${record.longitude.toFixed(4)}`;
}
function placeFor(record) { return `${record.city || record.local_area || "Unknown city"}, ${record.country || "Unknown country"}`; }
function markFor(record) { return labels[record.interest_level] || record.interest_label || "Other"; }
function searchable(record) {
  return [record.id, record.title, record.original_name, record.folder, markFor(record), record.country, record.region, record.city, record.local_area, record.description, record.latitude, record.longitude].join(" ").toLowerCase();
}
function matches(record) {
  return (state.filter === "all" || record.interest_level === state.filter) &&
    (state.country === "all" || record.country === state.country) &&
    (state.city === "all" || record.city === state.city) &&
    (!state.search || searchable(record).includes(state.search));
}
function countBy(items, key) {
  const counts = new Map();
  items.forEach((item) => {
    const value = item[key] || "Unknown";
    counts.set(value, (counts.get(value) || 0) + 1);
  });
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
}
function fillSelect(select, options, label, current) {
  select.innerHTML = `<option value="all">${label}</option>`;
  options.forEach(([name, count]) => {
    const option = document.createElement("option");
    option.value = name;
    option.textContent = `${name} (${count})`;
    select.appendChild(option);
  });
  select.value = options.some(([name]) => name === current) ? current : "all";
}
function updateLocationFilters() {
  fillSelect($("countrySelect"), countBy(records, "country"), "All countries", state.country);
  const source = state.country === "all" ? records : records.filter((record) => record.country === state.country);
  fillSelect($("citySelect"), countBy(source.filter((record) => record.city), "city"), "All cities", state.city);
  state.city = $("citySelect").value;
}
function markerIcon(record) {
  const color = colors[record.interest_level] || colors.other;
  return L.divIcon({
    className: "",
    html: `<span style="display:block;width:9px;height:9px;border-radius:50%;background:${color};box-shadow:0 0 12px ${color},0 0 2px #fff;border:1px solid rgba(255,255,255,.48)"></span>`,
    iconSize: [9, 9],
    iconAnchor: [5, 5],
  });
}
function popupHtml(record) {
  const desc = record.description ? `<div class="popup-desc">${record.description.slice(0, 360)}${record.description.length > 360 ? "..." : ""}</div>` : "";
  return `<div class="popup-title">${titleFor(record)}</div><div class="popup-meta">${markFor(record)} · ${record.folder}<br>${placeFor(record)}<br>${record.latitude.toFixed(6)}, ${record.longitude.toFixed(6)}</div>${desc}<a class="popup-link" href="${record.google_maps_url}" target="_blank" rel="noreferrer">Open in Google Maps</a>`;
}
function renderCards(visible) {
  const grid = $("cardGrid");
  grid.classList.toggle("list-mode", state.view === "list");
  grid.innerHTML = visible.slice(0, state.view === "list" ? 18 : 12).map((record) => {
    const color = colors[record.interest_level] || colors.other;
    const x = Math.abs(Math.round(record.longitude * 10)) % 90;
    const y = Math.abs(Math.round(record.latitude * 10)) % 80;
    return `<button class="record-card" type="button" data-id="${record.id}"><span class="card-visual" style="--x:${x + 5}%;--y:${y + 10}%"><span class="star">★</span></span><span class="card-body"><span class="mark" style="color:${color}"><span class="mark-dot"></span>${markFor(record)}</span><h3>${titleFor(record)}</h3><span class="card-place">⌖ ${placeFor(record)}</span><span class="card-meta">${record.id.toUpperCase()} · ${record.latitude.toFixed(3)}, ${record.longitude.toFixed(3)}</span></span></button>`;
  }).join("");
  grid.querySelectorAll(".record-card").forEach((button) => button.addEventListener("click", () => {
    const record = records.find((item) => item.id === button.dataset.id);
    if (!record) return;
    map.setView([record.latitude, record.longitude], 13);
    markers.get(record.id)?.openPopup();
  }));
}
function render() {
  const visible = records.filter(matches);
  layer.clearLayers();
  markers.clear();
  visible.forEach((record) => {
    const marker = L.marker([record.latitude, record.longitude], { icon: markerIcon(record) }).bindPopup(popupHtml(record));
    marker.addTo(layer);
    markers.set(record.id, marker);
  });
  renderCards(visible);
  $("visibleCount").textContent = visible.length.toLocaleString();
  $("resultButton").textContent = `${visible.length.toLocaleString()} RESULTS`;
  $("archiveCount").textContent = `— ${visible.length.toLocaleString()} sculptures`;
}

$("totalCount").textContent = records.length.toLocaleString();
$("mappedCount").textContent = `${records.length.toLocaleString()} locations mapped`;
$("countryCount").textContent = new Set(records.map((record) => record.country).filter(Boolean)).size.toLocaleString();
$("featuredCount").textContent = records.filter((record) => record.interest_level === "featured").length.toLocaleString();
$("countrySelect").addEventListener("change", (event) => { state.country = event.target.value; state.city = "all"; updateLocationFilters(); render(); });
$("citySelect").addEventListener("change", (event) => { state.city = event.target.value; render(); });
$("search").addEventListener("input", (event) => { state.search = event.target.value.trim().toLowerCase(); render(); });
document.querySelectorAll(".chip").forEach((button) => button.addEventListener("click", () => {
  document.querySelectorAll(".chip").forEach((chip) => chip.classList.remove("active"));
  button.classList.add("active");
  state.filter = button.dataset.filter;
  render();
}));
document.querySelectorAll(".view-toggle button").forEach((button) => button.addEventListener("click", () => {
  state.view = button.dataset.view || "grid";
  document.querySelectorAll(".view-toggle button").forEach((item) => {
    const active = item.dataset.view === state.view;
    item.classList.toggle("active", active);
    item.setAttribute("aria-pressed", String(active));
  });
  render();
}));
$("clearFilters").addEventListener("click", () => {
  state.filter = "all"; state.country = "all"; state.city = "all"; state.search = "";
  $("search").value = "";
  document.querySelectorAll(".chip").forEach((chip) => chip.classList.toggle("active", chip.dataset.filter === "all"));
  updateLocationFilters();
  render();
});
updateLocationFilters();
render();
