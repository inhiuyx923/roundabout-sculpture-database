
const records = window.ROUNDABOUT_SCULPTURES_ENRICHED || [];
const labels = { featured: "Curious", normal: "Archive", low_priority: "Limited", other: "Other" };
const colors = { featured: "#d7ff00", normal: "#19a5ff", low_priority: "#a2a9ad", other: "#c58bff" };
const state = { search: "", country: "all", city: "all", mark: "all", view: "grid", sort: "newest", sheet: false };
const $ = (id) => document.getElementById(id);
const esc = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" }[char]));
const attr = (value) => esc(value).replace(/`/g, "&#96;");
let activeMaps = [];

const collectionModels = [
  { title: "Forms in Motion", theme: "Movement, flow, and road rhythm.", filter: (r) => r.interest_level === "featured" },
  { title: "Municipal Dreams", theme: "Civic pride and local identity from around the world.", filter: (r) => r.interest_level === "normal" },
  { title: "Limited Visibility", theme: "Difficult, quiet, or partially documented sites.", filter: (r) => r.interest_level === "low_priority" },
  { title: "Dutch Roundabouts", theme: "A dense field study in the Netherlands.", filter: (r) => r.country === "Netherlands" },
  { title: "Mediterranean Traffic Islands", theme: "Public art across southern roads and resort towns.", filter: (r) => ["Spain", "Italy", "France", "Greece"].includes(r.country) },
  { title: "Unverified Signals", theme: "Places that still need deeper review.", filter: (r) => !r.description },
];

function titleFor(record) {
  if (record.title) return record.title;
  if (record.city && record.country) return `${record.city}, ${record.country}`;
  return record.original_name || `${record.latitude.toFixed(4)}, ${record.longitude.toFixed(4)}`;
}
function placeFor(record) { return `${record.city || record.local_area || "Unknown city"}, ${record.country || "Unknown country"}`; }
function markFor(record) { return labels[record.interest_level] || record.interest_label || "Other"; }
function yearFor(record) { return /^\d{4}$/.test(record.folder || "") ? record.folder : "Unknown"; }
function artistFor(record) { return record.artist || "Unknown artist"; }
function descriptionFor(record) {
  return record.description || `This record marks a roundabout sculpture in ${placeFor(record)}. The entry is part of a growing visual atlas that tracks how civic sculpture appears inside traffic infrastructure.`;
}
function visualStyle(record, extra = 0) {
  const x = (Math.abs(Math.round(record.longitude * 10)) + extra) % 90;
  const y = (Math.abs(Math.round(record.latitude * 10)) + extra) % 80;
  return `--x:${x + 5}%;--y:${y + 10}%`;
}
function searchable(record) { return [record.id, record.title, record.original_name, record.folder, markFor(record), record.country, record.region, record.city, record.local_area, record.description, record.latitude, record.longitude].join(" ").toLowerCase(); }
function filteredRecords() {
  let visible = records.filter((record) =>
    (state.mark === "all" || record.interest_level === state.mark) &&
    (state.country === "all" || record.country === state.country) &&
    (state.city === "all" || record.city === state.city) &&
    (!state.search || searchable(record).includes(state.search))
  );
  if (state.sort === "oldest") visible = visible.slice().sort((a, b) => yearFor(a).localeCompare(yearFor(b)));
  if (state.sort === "country") visible = visible.slice().sort((a, b) => placeFor(a).localeCompare(placeFor(b)));
  if (state.sort === "highlighted") visible = visible.slice().sort((a, b) => (a.interest_level === "featured" ? -1 : 1) - (b.interest_level === "featured" ? -1 : 1));
  return visible;
}
function countBy(items, key) {
  const counts = new Map();
  items.forEach((item) => {
    const value = item[key] || "Unknown";
    counts.set(value, (counts.get(value) || 0) + 1);
  });
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
}
function statsHtml(visible = filteredRecords()) {
  return `<div class="stats"><div class="stat"><strong>${records.length.toLocaleString()}</strong><span>Locations</span></div><div class="stat"><strong>${new Set(records.map((r) => r.country).filter(Boolean)).size}</strong><span>Countries</span></div><div class="stat"><strong>${records.filter((r) => r.interest_level === "featured").length.toLocaleString()}</strong><span>Highlighted</span></div><div class="stat"><strong>${visible.length.toLocaleString()}</strong><span>Visible</span></div></div>`;
}
function optionHtml(name, count, active) { return `<option value="${attr(name)}" ${active === name ? "selected" : ""}>${esc(name)} (${count})</option>`; }
function filterControlsHtml(prefix = "") {
  const countries = countBy(records, "country").map(([name, count]) => optionHtml(name, count, state.country)).join("");
  const citySource = state.country === "all" ? records.filter((r) => r.city) : records.filter((r) => r.country === state.country && r.city);
  const cities = countBy(citySource, "city").map(([name, count]) => optionHtml(name, count, state.city)).join("");
  const chips = [["all","All"],["featured","Curious"],["normal","Archive"],["low_priority","Limited"]].map(([key, label]) => `<button class="chip ${state.mark === key ? "active" : ""}" data-mark="${key}" type="button">${label}</button>`).join("");
  return `<div class="filter-panel"><label class="filter-label" for="${prefix}search">Search</label><div class="search-wrap"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"></circle><path d="m20 20-3.5-3.5"></path></svg><input id="${prefix}search" class="search" type="search" value="${attr(state.search)}" placeholder="Search title, country, city, artist..." /></div><div class="filter-row"><div><p class="filter-label">Country</p><select id="${prefix}country" class="select"><option value="all">All countries</option>${countries}</select></div><div><p class="filter-label">City</p><select id="${prefix}city" class="select"><option value="all">All cities</option>${cities}</select></div></div><p class="filter-label" style="margin-top:14px">Editorial mark</p><div class="chip-row">${chips}</div></div>`;
}
function cardHtml(record) {
  const color = colors[record.interest_level] || colors.other;
  return `<button class="record-card" type="button" data-detail="${attr(record.id)}"><span class="visual" style="${visualStyle(record)}"><span class="star">★</span></span><span class="card-body"><span class="mark" style="color:${color}"><span class="mark-dot"></span>${esc(markFor(record))}</span><h3>${esc(titleFor(record))}</h3><span class="card-place">⌖ ${esc(placeFor(record))}</span><span class="card-meta">By ${esc(artistFor(record))}<br>${esc(yearFor(record))} · ${esc(record.region || "Unclassified region")}</span></span></button>`;
}
function clearMaps() { activeMaps.forEach((map) => map.remove()); activeMaps = []; }
function initMap(id, list, options = {}) {
  const el = $(id); if (!el || !window.L) return;
  const map = L.map(id, { worldCopyJump: true, zoomControl: false, attributionControl: false }).setView(options.center || [33, 10], options.zoom || 3);
  L.control.zoom({ position: "topright" }).addTo(map);
  L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", { maxZoom: 19 }).addTo(map);
  list.forEach((record) => {
    const color = colors[record.interest_level] || colors.other;
    L.circleMarker([record.latitude, record.longitude], { radius: options.radius || 3.5, color, fillColor: color, fillOpacity: .86, weight: 1 }).bindPopup(`<div class="popup-title">${esc(titleFor(record))}</div><div class="popup-meta">${esc(markFor(record))}<br>${esc(placeFor(record))}</div><a class="popup-link" href="#sculpture/${attr(record.id)}">Open detail</a>`).addTo(map);
  });
  activeMaps.push(map);
}
function activateBindings(prefix = "", bindGlobal = true) {
  const search = $(`${prefix}search`), country = $(`${prefix}country`), city = $(`${prefix}city`);
  if (search) search.addEventListener("input", (event) => { state.search = event.target.value.trim().toLowerCase(); renderRoute(false); });
  if (country) country.addEventListener("change", (event) => { state.country = event.target.value; state.city = "all"; renderRoute(false); });
  if (city) city.addEventListener("change", (event) => { state.city = event.target.value; renderRoute(false); });
  if (bindGlobal) {
    document.querySelectorAll("[data-mark]").forEach((button) => button.addEventListener("click", () => { state.mark = button.dataset.mark; renderRoute(false); }));
    document.querySelectorAll("[data-detail]").forEach((button) => button.addEventListener("click", () => { location.hash = `#sculpture/${button.dataset.detail}`; }));
    document.querySelectorAll("[data-view]").forEach((button) => button.addEventListener("click", () => { state.view = button.dataset.view; renderRoute(false); }));
  }
  const sort = $("sortSelect"); if (sort) sort.addEventListener("change", (event) => { state.sort = event.target.value; renderRoute(false); });
  const clear = $("clearFilters"); if (clear) clear.addEventListener("click", () => { state.search = ""; state.country = "all"; state.city = "all"; state.mark = "all"; renderRoute(false); });
  const mobileFilter = $("mobileFilter"); if (mobileFilter) mobileFilter.addEventListener("click", () => toggleSheet(true));
  const backdrop = $("sheetBackdrop"); if (backdrop) backdrop.addEventListener("click", () => toggleSheet(false));
  const closeSheet = $("closeSheet"); if (closeSheet) closeSheet.addEventListener("click", () => toggleSheet(false));
}
function toggleSheet(open) { state.sheet = open; const sheet = $("mobileSheet"), backdrop = $("sheetBackdrop"); if (sheet) sheet.classList.toggle("open", open); if (backdrop) backdrop.classList.toggle("open", open); }
function renderAtlas() {
  const visible = filteredRecords();
  const featured = records.filter((r) => r.interest_level === "featured").slice(0, 10);
  $("appView").innerHTML = `<div class="atlas-page"><section class="atlas-hero"><div class="intro-panel"><div class="kicker"><span class="target-icon"></span> Global atlas</div><h1 class="page-title">Roundabout <span class="accent">Sculpture</span> Database</h1><p class="body-copy">The world's most comprehensive atlas of traffic-island sculpture, mapping public art at the intersection of movement and place.</p>${statsHtml(visible)}<details class="atlas-filter-drawer" open><summary>Filters</summary>${filterControlsHtml("atlas")}</details></div><div class="map-panel"><div id="atlasMap" class="map-canvas"></div><div class="map-badge"><span class="pin-dot"></span><span>${visible.length.toLocaleString()} locations mapped</span></div><div class="map-legend"><span>Sculptures per region</span><div class="legend-bar"></div><div class="legend-scale"><span>1</span><span>10</span><span>100</span><span>500+</span></div></div></div></section><div class="section-strip"><h2>Featured sculptures</h2><a class="link-arrow" href="#archive">View all sculptures →</a></div><div class="carousel">${featured.map(cardHtml).join("")}</div></div>`;
  activateBindings("atlas", true);
  setTimeout(() => initMap("atlasMap", visible.slice(0, 900)), 0);
}
function renderArchive() {
  const visible = filteredRecords();
  $("appView").innerHTML = `<div class="archive-page"><aside class="sidebar"><div class="filters"><div class="filter-head"><h2>Filters</h2><button id="clearFilters" class="clear-button" type="button">Clear all</button></div>${filterControlsHtml("archive")}</div><button class="result-button" type="button">${visible.length.toLocaleString()} RESULTS</button></aside><main class="archive-main"><div class="archive-head"><h1>Archive <span>- ${visible.length.toLocaleString()} sculptures</span></h1><div class="tools"><button id="mobileFilter" class="mobile-filter-button" type="button">☷ Filters</button><div class="toggle"><button class="${state.view === "grid" ? "active" : ""}" data-view="grid" type="button">Grid</button><button class="${state.view === "list" ? "active" : ""}" data-view="list" type="button">List</button></div><select id="sortSelect" class="select sort-select"><option value="newest" ${state.sort === "newest" ? "selected" : ""}>Newest first</option><option value="oldest" ${state.sort === "oldest" ? "selected" : ""}>Oldest first</option><option value="country" ${state.sort === "country" ? "selected" : ""}>Country A-Z</option><option value="highlighted" ${state.sort === "highlighted" ? "selected" : ""}>Highlighted</option></select></div></div><div class="card-grid ${state.view === "list" ? "list-mode" : ""}">${visible.slice(0, 60).map(cardHtml).join("")}</div></main><div id="sheetBackdrop" class="sheet-backdrop"></div><aside id="mobileSheet" class="mobile-sheet"><div class="filter-head"><h2>Filters</h2><button id="closeSheet" class="clear-button" type="button">Close ×</button></div>${filterControlsHtml("mobile")}</aside></div>`;
  activateBindings("archive", true); activateBindings("mobile", false); toggleSheet(state.sheet);
}
function detailRecord(id) { return records.find((record) => record.id === id) || records.find((record) => record.interest_level === "featured") || records[0]; }
function renderDetail(id) {
  const record = detailRecord(id);
  const related = records.filter((item) => item.id !== record.id && (item.country === record.country || item.interest_level === record.interest_level)).slice(0, 6);
  $("appView").innerHTML = `<div class="detail-page"><a class="back-link" href="#archive">← Back to Archive</a><section class="detail-grid"><div><div class="gallery-main visual" style="${visualStyle(record)}"></div><div class="thumb-row">${[0,1,2,3,4].map((i) => `<div class="thumb visual" style="${visualStyle(record, i * 13)}"></div>`).join("")}</div></div><div><div class="kicker"><span class="target-icon"></span> Sculpture</div><h1 class="detail-title">${esc(titleFor(record))}</h1><div class="detail-subtitle">⌖ ${esc(placeFor(record))}</div><p class="card-meta">By ${esc(artistFor(record))} · ${esc(yearFor(record))}</p><div class="metadata"><div class="meta-row"><span>Artist</span><strong>${esc(artistFor(record))}</strong></div><div class="meta-row"><span>Year</span><strong>${esc(yearFor(record))}</strong></div><div class="meta-row"><span>Type</span><strong>Roundabout sculpture</strong></div><div class="meta-row"><span>Material</span><strong>Unknown material</strong></div><div class="meta-row"><span>Editorial mark</span><strong style="color:${colors[record.interest_level]}">${esc(markFor(record))}</strong></div></div><div class="action-row"><a class="ghost-button" href="${attr(record.google_maps_url)}" target="_blank" rel="noreferrer">Open map</a><button class="ghost-button" type="button">Save</button><button class="ghost-button" type="button">Add note</button></div></div><aside class="detail-side"><div class="mini-map"><div id="detailMap" class="map-canvas"></div><div class="coord-box">${record.latitude.toFixed(4)}°, ${record.longitude.toFixed(4)}°<br><a class="popup-link" href="${attr(record.google_maps_url)}" target="_blank" rel="noreferrer">View on map ↗</a></div></div></aside></section><section class="detail-copy"><p class="essay">${esc(descriptionFor(record))}</p><div class="why"><h3>Why it matters</h3><p class="essay">This site helps reveal how public art becomes a navigational marker, a local symbol, and a small interruption in everyday movement.</p></div></section><div class="sources"><h3>Sources</h3><a href="${attr(record.google_maps_url)}" target="_blank" rel="noreferrer">Google Maps</a><a href="https://www.inhiu.com/roundabout-sculpture" target="_blank" rel="noreferrer">Project archive</a><a href="https://www.instagram.com/roundabout_scupture/" target="_blank" rel="noreferrer">Instagram</a></div><div class="section-strip"><h2>Related sculptures</h2><a class="link-arrow" href="#archive">View all →</a></div><div class="carousel">${related.map(cardHtml).join("")}</div></div>`;
  activateBindings();
  setTimeout(() => initMap("detailMap", [record], { center: [record.latitude, record.longitude], zoom: 12, radius: 8 }), 0);
}
function renderCollections() {
  const featured = collectionModels[0];
  $("appView").innerHTML = `<div class="collections-page"><section class="collections-hero"><div><div class="kicker">▧ Collections</div><h1 class="page-title">Curated views of <span class="accent">sculpture in motion.</span></h1><p class="body-copy">Collections bring together roundabout sculptures through shared themes, materials, and ideas, revealing patterns across place and purpose.</p>${statsHtml()}</div><article class="feature-collection"><div class="feature-copy"><div class="kicker">★ Featured collection</div><h2>${featured.title}</h2><p class="body-copy">${featured.theme}</p><p class="card-meta">${records.filter(featured.filter).length.toLocaleString()} sculptures · ${new Set(records.filter(featured.filter).map((r) => r.country)).size} countries</p></div><div class="visual" style="${visualStyle(records.find((r) => r.interest_level === "featured") || records[0])}"></div></article></section><div class="section-strip"><h2>Browse collections</h2><span></span></div><section class="collection-grid">${collectionModels.map((collection, index) => { const items = records.filter(collection.filter); const sample = items[0] || records[index]; return `<article class="collection-card"><div class="visual" style="${visualStyle(sample, index * 7)}"><span class="star">★</span></div><div class="card-body"><h3>${collection.title}</h3><p class="card-meta">${collection.theme}</p><div class="collection-meta"><span>${items.length.toLocaleString()} sculptures</span><span>${new Set(items.map((r) => r.country)).size} countries</span></div></div></article>`; }).join("")}</section><div class="section-strip"><h2>Essays and stories</h2><a class="link-arrow" href="https://www.inhiu.com/roundabout-sculpture" target="_blank" rel="noreferrer">Project stories →</a></div><section class="stories-grid"><article class="story-card"><h3>Traffic Islands as Civic Stages</h3><p class="card-meta">How roundabouts turn public art into everyday orientation.</p></article><article class="story-card"><h3>The Screenshot Method</h3><p class="card-meta">A visual archive built from street-view searching and manual review.</p></article><article class="story-card"><h3>Editorial Marks</h3><p class="card-meta">A practical language for curiosity, ordinary records, and limited visibility.</p></article></section></div>`;
}
function renderAbout() {
  $("appView").innerHTML = `<div class="about-page"><section class="about-hero"><div><a class="back-link" href="#atlas">← Back to Atlas</a><div class="kicker">About the project</div><h1 class="page-title">Mapping public art at the intersection of <span class="accent">movement and place.</span></h1><p class="body-copy">The Roundabout Sculpture Database is an index of traffic-island sculpture, documenting how artworks inhabit the everyday spaces where cities circulate.</p>${statsHtml()}</div><div class="about-map"><div id="aboutMap" class="map-canvas"></div></div></section><section class="about-grid"><article class="about-card"><h2>1. Origin Story</h2><p>Founded by a long-running fascination with artworks at the edge of roads, this project grew from manual street-view searching into a global research archive.</p></article><article class="about-card"><h2>2. Methodology</h2><p>Records are gathered from mapped locations, street-view review, public references, and manual classification. Each point is treated as a research lead.</p></article><article class="about-card"><h2>3. Data Policy</h2><p>Real data is preserved. Destructive database operations are avoided. New fields should be reviewed before becoming part of the public archive.</p><div class="policy-list"><span>Title <b>optional</b></span><span>Location <b>required</b></span><span>Status <b>reviewed</b></span></div></article><article class="about-card"><h2>4. Editorial Marks</h2><p>Curious marks distinctive finds, Archive marks standard records, and Limited marks weak visibility, incomplete documentation, or quiet cases.</p><div class="policy-list"><span>Curious <b style="color:var(--acid)">highlighted</b></span><span>Archive <b style="color:var(--blue)">standard</b></span><span>Limited <b>incomplete</b></span></div></article><article class="about-card"><h2>5. Image and Source Policy</h2><p>Future images should be attributed, traceable, and rights-aware. Street-view screenshots and public links need source context wherever possible.</p></article><article class="about-card"><h2>6. Contribution</h2><p>Researchers, artists, local residents, and institutions can help correct locations, identify artists, add images, and improve metadata.</p></article><article class="about-card contact-card"><div><h2>Contribution and Contact</h2><p>This project grows with help from people who notice public art in transit spaces.</p></div><div class="contact-box">Get in touch<br>hello@roundaboutsculptures.org</div></article></section></div>`;
  setTimeout(() => initMap("aboutMap", records.slice(0, 900)), 0);
}
function currentRoute() { const raw = location.hash.replace(/^#/, "") || "atlas"; const [name, id] = raw.split("/"); return { name, id }; }
function setActive(route) { document.querySelectorAll("[data-route]").forEach((link) => link.classList.toggle("active", link.dataset.route === route)); }
function renderRoute(resetSheet = true) {
  clearMaps(); if (resetSheet) state.sheet = false;
  const { name, id } = currentRoute();
  setActive(name === "sculpture" ? "archive" : name);
  if (name === "archive") renderArchive(); else if (name === "collections") renderCollections(); else if (name === "about") renderAbout(); else if (name === "sculpture") renderDetail(id); else renderAtlas();
}
window.addEventListener("hashchange", () => renderRoute(true));
renderRoute(true);
