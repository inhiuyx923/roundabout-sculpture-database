
const records = window.ROUNDABOUT_SCULPTURES_ENRICHED || [];
const labels = { featured: "Curious", normal: "Archive", low_priority: "Limited", other: "Other" };
const colors = { featured: "#d7ff00", normal: "#19a5ff", low_priority: "#a2a9ad", other: "#c58bff" };
const state = {
  search: "",
  country: "all",
  city: "all",
  mark: "all",
  motif: "all",
  animalTag: "all",
  shape: "all",
  colorTag: "all",
  religionTag: "all",
  sportTag: "all",
  transportationTag: "all",
  expandedTags: {
    animalTag: true,
    shape: true,
    colorTag: true,
    religionTag: true,
    sportTag: true,
    transportationTag: true
  },
  view: "grid",
  sort: "newest",
  sheet: false
};
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

const taxonomy = {
  motif: { label: "Motif", items: [["architecture", "Architecture"], ["art", "art"], ["clock", "clock"], ["coastlife", "coastlife"], ["farm", "farm"], ["flag", "flag"], ["food", "Food"], ["hand", "hand"], ["human", "human"], ["industrial", "industrial"], ["kid", "kid"], ["music", "music"], ["number", "number"], ["paint", "paint"], ["plant", "Plant"], ["product", "product"], ["rocket", "rocket"], ["santa", "santa"], ["war", "War"]] },
  animalTag: { label: "Animal", items: [["animal", "animal"], ["bear", "bear"], ["bird", "bird"], ["bull", "bull"], ["camel", "camel"], ["cat", "cat"], ["chicken", "chicken"], ["dinosaur", "dinosaur"], ["dog", "dog"], ["donkey", "donkey"], ["dragon", "dragon"], ["elephant", "elephant"], ["fish", "fish"], ["horse", "horse"], ["lion", "lion"], ["monster", "monster"], ["seahorse", "seahorse"], ["sheep", "sheep"], ["shrimp", "shrimp"], ["snail", "snail"], ["tiger", "tiger"]] },
  shape: { label: "Shape", items: [["ball", "ball"], ["bowlshape", "bowlshape"], ["circle", "circle"], ["cross", "cross"], ["cube", "cube"], ["earth", "earth"], ["square", "square"], ["star", "star"], ["triangle", "triangle"], ["verticle", "verticle"], ["yshape", "Yshape"]] },
  colorTag: { label: "Color", items: [["black", "black"], ["blue", "blue"], ["brown", "brown"], ["colorful", "colorful"], ["golden", "golden"], ["green", "green"], ["grey", "grey"], ["orange", "orange"], ["pink", "pink"], ["red", "red"], ["silver", "silver"]] },
  religionTag: { label: "Religion", items: [["religion", "Religion"], ["jesus", "jesus"]] },
  sportTag: { label: "Sport", items: [["sport", "Sport"], ["basketball", "basketball"], ["bicycle", "bicycle"], ["football", "football"], ["sword", "sword"], ["torch", "torch"], ["traffic", "traffic"]] },
  transportationTag: { label: "Transportation", items: [["transportation", "Transportation"], ["boat", "boat"], ["cablecar", "cablecar"], ["car", "car"], ["plane", "plane"], ["train", "train"]] }
};

const keywordRules = {
  motif: [["architecture", ["architecture", "building", "bridge", "tower", "gate"]], ["art", ["art", "sculpture", "abstract", "statue"]], ["clock", ["clock", "time"]], ["coastlife", ["coast", "coastal", "sea", "ocean", "fish", "shrimp", "seahorse", "boat"]], ["farm", ["farm", "horse", "bull", "cow", "sheep", "field"]], ["flag", ["flag"]], ["food", ["food", "fruit", "apple", "wine", "grape"]], ["hand", ["hand"]], ["human", ["human", "person", "people", "man", "woman"]], ["industrial", ["industrial", "factory", "machine", "gear"]], ["kid", ["kid", "child", "children"]], ["music", ["music", "musical"]], ["number", ["number", "letter", "text", "sign"]], ["paint", ["paint", "painted", "colorful", "colourful"]], ["plant", ["plant", "tree", "flower", "palm", "garden"]], ["product", ["product", "logo", "brand"]], ["rocket", ["rocket"]], ["santa", ["santa"]], ["war", ["war", "soldier", "battle", "military"]]],
  animalTag: [["bear", ["bear"]], ["bird", ["bird"]], ["bull", ["bull"]], ["camel", ["camel"]], ["cat", ["cat"]], ["chicken", ["chicken"]], ["dinosaur", ["dinosaur"]], ["dog", ["dog"]], ["donkey", ["donkey"]], ["dragon", ["dragon"]], ["elephant", ["elephant"]], ["fish", ["fish"]], ["horse", ["horse"]], ["lion", ["lion"]], ["monster", ["monster"]], ["seahorse", ["seahorse"]], ["sheep", ["sheep"]], ["shrimp", ["shrimp"]], ["snail", ["snail"]], ["tiger", ["tiger"]], ["animal", ["animal", "bear", "bird", "bull", "camel", "cat", "chicken", "dinosaur", "dog", "donkey", "dragon", "elephant", "fish", "horse", "lion", "monster", "seahorse", "sheep", "shrimp", "snail", "tiger"]]],
  shape: [["ball", ["ball", "sphere"]], ["bowlshape", ["bowl"]], ["circle", ["circle", "ring", "round", "wheel"]], ["cross", ["cross"]], ["cube", ["cube"]], ["earth", ["earth", "globe", "world"]], ["square", ["square"]], ["star", ["star"]], ["triangle", ["triangle"]], ["verticle", ["vertical", "tower", "column", "obelisk"]], ["yshape", ["y-shape", "y shape"]]],
  colorTag: [["black", ["black"]], ["blue", ["blue"]], ["brown", ["brown"]], ["colorful", ["colorful", "colourful", "rainbow"]], ["golden", ["gold", "golden", "yellow"]], ["green", ["green"]], ["grey", ["grey", "gray"]], ["orange", ["orange"]], ["pink", ["pink"]], ["red", ["red"]], ["silver", ["silver"]]],
  religionTag: [["religion", ["religion", "jesus", "christ", "church", "cross"]], ["jesus", ["jesus", "christ"]]],
  sportTag: [["sport", ["sport", "basketball", "bicycle", "bike", "football", "soccer", "sword", "torch", "traffic"]], ["basketball", ["basketball"]], ["bicycle", ["bicycle", "bike"]], ["football", ["football", "soccer"]], ["sword", ["sword"]], ["torch", ["torch"]], ["traffic", ["traffic"]]],
  transportationTag: [["transportation", ["transport", "traffic", "boat", "ship", "cablecar", "cable car", "tram", "car", "plane", "airplane", "train"]], ["boat", ["boat", "ship"]], ["cablecar", ["cablecar", "cable car", "tram"]], ["car", ["car"]], ["plane", ["plane", "airplane"]], ["train", ["train"]]]
};

const tagTree = [
  { facet: "motif", key: "architecture", label: "Architecture" },
  { facet: "motif", key: "art", label: "art" },
  { facet: "motif", key: "clock", label: "clock" },
  { facet: "motif", key: "coastlife", label: "coastlife" },
  { facet: "colorTag", label: "Color", selectable: false, children: ["black", "blue", "brown", "colorful", "golden", "green", "grey", "orange", "pink", "red", "silver"] },
  { facet: "motif", key: "farm", label: "farm" },
  { facet: "motif", key: "flag", label: "flag" },
  { facet: "motif", key: "food", label: "Food" },
  { facet: "motif", key: "hand", label: "hand" },
  { facet: "motif", key: "human", label: "human" },
  { facet: "motif", key: "industrial", label: "industrial" },
  { facet: "motif", key: "kid", label: "kid" },
  { facet: "motif", key: "music", label: "music" },
  { facet: "motif", key: "number", label: "number" },
  { facet: "motif", key: "paint", label: "paint" },
  { facet: "motif", key: "plant", label: "Plant" },
  { facet: "motif", key: "product", label: "product" },
  { facet: "religionTag", key: "religion", label: "Religion", children: ["jesus"] },
  { facet: "motif", key: "rocket", label: "rocket" },
  { facet: "motif", key: "santa", label: "santa" },
  { facet: "shape", label: "Shape", selectable: false, children: ["ball", "bowlshape", "circle", "cross", "cube", "earth", "square", "star", "triangle", "verticle", "yshape"] },
  { facet: "sportTag", key: "sport", label: "Sport", children: ["basketball", "bicycle", "football", "sword", "torch", "traffic"] },
  { facet: "transportationTag", key: "transportation", label: "Transportation", children: ["boat", "cablecar", "car", "plane", "train"] },
  { facet: "motif", key: "war", label: "War" },
  { facet: "animalTag", key: "animal", label: "animal", children: ["bear", "bird", "bull", "camel", "cat", "chicken", "dinosaur", "dog", "donkey", "dragon", "elephant", "fish", "horse", "lion", "monster", "seahorse", "sheep", "shrimp", "snail", "tiger"] }
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

function tagText(record) {
  return [record.title, record.original_name, record.description, record.display_name, record.local_area, record.road, record.region, record.city, record.country].join(" ").toLowerCase();
}
function addKeywordTags(tags, facet, text) {
  (keywordRules[facet] || []).forEach(([key, words]) => {
    if (words.some((word) => text.includes(word))) tags[facet].push(key);
  });
}
function tagsFor(record) {
  const text = tagText(record);
  const tags = Object.fromEntries(Object.keys(taxonomy).map((facet) => [facet, []]));
  Object.keys(keywordRules).forEach((facet) => addKeywordTags(tags, facet, text));
  if (!tags.motif.length) tags.motif.push("art");
  return Object.fromEntries(Object.entries(tags).map(([facet, values]) => [facet, [...new Set(values)]]));
}
function facetMatches(record, facet) {
  return state[facet] === "all" || tagsFor(record)[facet].includes(state[facet]);
}
function activeFacetCount() {
  return Object.keys(taxonomy).filter((facet) => state[facet] !== "all").length;
}
function activeFilterChipsHtml() {
  const chips = [];
  if (state.search) chips.push(["search", `Search: ${state.search}`]);
  if (state.country !== "all") chips.push(["country", `Country: ${state.country}`]);
  if (state.city !== "all") chips.push(["city", `City: ${state.city}`]);
  if (state.mark !== "all") chips.push(["mark", `Mark: ${markLabel(state.mark)}`]);
  Object.entries(taxonomy).forEach(([facet, config]) => {
    if (state[facet] === "all") return;
    const label = config.items.find(([key]) => key === state[facet])?.[1] || state[facet];
    chips.push([facet, `${config.label}: ${label}`]);
  });
  if (!chips.length) return `<div class="active-filters empty">No active filters</div>`;
  return `<div class="active-filters">${chips.map(([key, label]) => `<button type="button" data-clear-facet="${attr(key)}">${esc(label)} ×</button>`).join("")}</div>`;
}
function markLabel(key) { return key === "all" ? "All" : labels[key] || key; }
function taxonomySelectHtml(facet, prefix = "") {
  const config = taxonomy[facet];
  const options = config.items.map(([key, label]) => `<option value="${key}" ${state[facet] === key ? "selected" : ""}>${label}</option>`).join("");
  return `<div><p class="filter-label">${config.label}</p><select id="${prefix}${facet}" class="select"><option value="all">All ${config.label.toLowerCase()}</option>${options}</select></div>`;
}
function taxonomyChipGroupHtml(facet) {
  const config = taxonomy[facet];
  return `<section class="tag-group"><div class="tag-group-head"><h3>${config.label}</h3><span>${config.items.length} tags</span></div><div class="tag-chip-grid">${config.items.map(([key, label]) => `<button class="tag-chip ${state[facet] === key ? "active" : ""}" type="button" data-tag-facet="${facet}" data-tag-value="${key}">${label}</button>`).join("")}</div></section>`;
}
function searchable(record) { return [record.id, record.title, record.original_name, record.folder, markFor(record), record.country, record.region, record.city, record.local_area, record.description, record.latitude, record.longitude].join(" ").toLowerCase(); }
function filteredRecords() {
  let visible = records.filter((record) =>
    (state.mark === "all" || record.interest_level === state.mark) &&
    (state.country === "all" || record.country === state.country) &&
    (state.city === "all" || record.city === state.city) &&
    Object.keys(taxonomy).every((facet) => facetMatches(record, facet)) &&
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
function baseLocationControlsHtml(prefix = "") {
  const countries = countBy(records, "country").map(([name, count]) => optionHtml(name, count, state.country)).join("");
  const citySource = state.country === "all" ? records.filter((r) => r.city) : records.filter((r) => r.country === state.country && r.city);
  const cities = countBy(citySource, "city").map(([name, count]) => optionHtml(name, count, state.city)).join("");
  return `<label class="filter-label" for="${prefix}search">Search</label><div class="search-wrap"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"></circle><path d="m20 20-3.5-3.5"></path></svg><input id="${prefix}search" class="search" type="search" value="${attr(state.search)}" placeholder="Search title, country, city, artist..." /></div><div class="filter-row"><div><p class="filter-label">Country</p><select id="${prefix}country" class="select"><option value="all">All countries</option>${countries}</select></div><div><p class="filter-label">City</p><select id="${prefix}city" class="select"><option value="all">All cities</option>${cities}</select></div></div>`;
}
function editorialMarkHtml() {
  return [["all","All"],["featured","Curious"],["normal","Archive"],["low_priority","Limited"]].map(([key, label]) => `<button class="chip ${state.mark === key ? "active" : ""}" data-mark="${key}" type="button">${label}</button>`).join("");
}
function atlasFilterControlsHtml(prefix = "") {
  return `<div class="filter-panel atlas-filter-panel"><div class="filter-mode-note"><strong>Explore the atlas</strong><span>Light filters for the map. Use Explore for the full tag system.</span></div>${baseLocationControlsHtml(prefix)}<div class="filter-row taxonomy-light-row">${taxonomySelectHtml("motif", prefix)}<div><p class="filter-label">Editorial mark</p><div class="chip-row compact">${editorialMarkHtml()}</div></div></div><a class="advanced-link" href="#explore">Open full Explore index →</a></div>`;
}
function archiveFilterControlsHtml(prefix = "") {
  return `<div class="filter-panel archive-filter-panel">${baseLocationControlsHtml(prefix)}<p class="filter-label" style="margin-top:14px">Editorial mark</p><div class="chip-row">${editorialMarkHtml()}</div><div class="taxonomy-select-grid">${Object.keys(taxonomy).map((facet) => taxonomySelectHtml(facet, prefix)).join("")}</div><details class="tag-taxonomy" open><summary>Full tag taxonomy</summary><div class="tag-taxonomy-body">${Object.keys(taxonomy).map(taxonomyChipGroupHtml).join("")}</div></details></div>`;
}

function termCount(facet, key) {
  return records.reduce((total, record) => total + (tagsFor(record)[facet].includes(key) ? 1 : 0), 0);
}
function facetIcon(facet, key) {
  const icons = {
    motif: { architecture: "🏛️", art: "🎨", clock: "🕒", coastlife: "🌊", farm: "🌾", flag: "🏳️", food: "🍽️", hand: "✋", human: "🧍", industrial: "⚙️", kid: "🧒", music: "🎵", number: "🔢", paint: "🎨", plant: "🌿", product: "🏷️", rocket: "🚀", santa: "🎅", war: "⚔️" },
    animalTag: { animalTag: "🐾", animal: "🐾", bear: "🐻", bird: "🐦", bull: "🐂", camel: "🐫", cat: "🐱", chicken: "🐔", dinosaur: "🦕", dog: "🐶", donkey: "🫏", dragon: "🐉", elephant: "🐘", fish: "🐟", horse: "🐎", lion: "🦁", monster: "👾", seahorse: "🫧", sheep: "🐑", shrimp: "🦐", snail: "🐌", tiger: "🐯" },
    shape: { shape: "◊", ball: "⚪", bowlshape: "🥣", circle: "⭕", cross: "✝️", cube: "◼️", earth: "🌍", square: "⬜", star: "⭐", triangle: "🔺", verticle: "▌", yshape: "Y" },
    colorTag: { colorTag: "◐" },
    religionTag: { religionTag: "✝️", religion: "✝️", jesus: "✝️" },
    sportTag: { sportTag: "🏅", sport: "🏅", basketball: "🏀", bicycle: "🚲", football: "⚽", sword: "🗡️", torch: "🔥", traffic: "🚦" },
    transportationTag: { transportationTag: "🧭", transportation: "🧭", boat: "⛴️", cablecar: "🚡", car: "🚗", plane: "✈️", train: "🚆" }
  };
  return icons[facet]?.[key] || "•";
}
function colorSwatch(key) {
  const swatches = { black: "#050505", blue: "#1976ff", brown: "#9b6b43", colorful: "linear-gradient(135deg,#ff3b2f,#d7ff00,#19a5ff)", golden: "#d7a800", green: "#39c66c", grey: "#8a949c", orange: "#ff8a1d", pink: "#ff67bf", red: "#ff3b2f", silver: "#c6ccd1" };
  const bg = swatches[key] || "#64707a";
  return `<span class="term-swatch" style="background:${bg}"></span>`;
}
function labelForTag(facet, key) {
  return taxonomy[facet]?.items.find(([itemKey]) => itemKey === key)?.[1] || key;
}
function treeRowHtml(node, childKey = null) {
  const facet = node.facet;
  const key = childKey || node.key;
  const label = childKey ? labelForTag(facet, childKey) : node.label;
  const count = key ? termCount(facet, key) : "";
  const isActive = key && state[facet] === key;
  const isChild = Boolean(childKey);
  const icon = facet === "colorTag" && key ? colorSwatch(key) : `<span class="tree-icon">${esc(facetIcon(facet, key || facet))}</span>`;
  return `<button class="tree-row ${isChild ? "child" : "parent"} ${isActive ? "active" : ""} ${count === 0 ? "empty" : ""}" type="button" data-tag-facet="${facet}" data-tag-value="${key}">${icon}<span class="tree-label">${esc(label)}</span><span class="tree-count">${typeof count === "number" ? count.toLocaleString() : ""}</span></button>`;
}
function treeFamilyHtml(node) {
  const hasChildren = Array.isArray(node.children) && node.children.length;
  if (!hasChildren) return `<div class="tree-line single"><span class="tree-arrow ghost"></span>${treeRowHtml(node)}</div>`;
  const id = `${node.facet}:${node.key || "group"}`;
  const isOpen = state.expandedTags[node.facet] !== false;
  const parentSelectable = node.selectable !== false && node.key;
  const parent = parentSelectable
    ? treeRowHtml(node)
    : `<button class="tree-row parent category" type="button" data-toggle-family="${attr(node.facet)}"><span class="tree-icon">${esc(facetIcon(node.facet, node.facet))}</span><span class="tree-label">${esc(node.label)}</span><span class="tree-count"></span></button>`;
  const children = node.children.map((childKey) => `<div class="tree-line child-line"><span class="tree-arrow ghost"></span>${treeRowHtml(node, childKey)}</div>`).join("");
  return `<section class="tree-family" data-family="${attr(id)}"><div class="tree-line"><button class="tree-arrow" type="button" data-toggle-family="${attr(node.facet)}" aria-label="Toggle ${attr(node.label)}">${isOpen ? "▾" : "▸"}</button>${parent}</div><div class="tree-children ${isOpen ? "open" : ""}">${children}</div></section>`;
}
function taxonomyTreeHtml() {
  return `<div class="tag-tree">${tagTree.map(treeFamilyHtml).join("")}</div>`;
}
function exploreControlsHtml(prefix = "explore") {
  const countries = countBy(records, "country").map(([name, count]) => optionHtml(name, count, state.country)).join("");
  const citySource = state.country === "all" ? records.filter((r) => r.city) : records.filter((r) => r.country === state.country && r.city);
  const cities = countBy(citySource, "city").map(([name, count]) => optionHtml(name, count, state.city)).join("");
  return `<div class="explore-controls index-finder"><div class="finder-line"><span class="finder-label">Find</span><div class="search-wrap"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"></circle><path d="m20 20-3.5-3.5"></path></svg><input id="${prefix}search" class="search" type="search" value="${attr(state.search)}" placeholder="title, country, city, artist..." /></div></div><div class="scope-row"><label><span>Country</span><select id="${prefix}country" class="select"><option value="all">All countries</option>${countries}</select></label><label><span>City</span><select id="${prefix}city" class="select"><option value="all">All cities</option>${cities}</select></label></div><div class="mark-strip"><span>Editorial mark</span><div class="chip-row compact">${editorialMarkHtml()}</div></div></div>`;
}
function miniResultHtml(record) {
  return `<button class="explore-image-card" type="button" data-detail="${attr(record.id)}"><span class="explore-image visual" style="${visualStyle(record)}"><span class="star">★</span></span><span class="explore-card-caption"><span>${esc(record.city || record.local_area || "Unknown city")}</span><strong>${esc(record.country || "Unknown country")}</strong></span></button>`;
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
  Object.keys(taxonomy).forEach((facet) => {
    const select = $(`${prefix}${facet}`);
    if (select) select.addEventListener("change", (event) => { state[facet] = event.target.value; renderRoute(false); });
  });
  if (bindGlobal) {
    document.querySelectorAll("[data-mark]").forEach((button) => button.addEventListener("click", () => { state.mark = button.dataset.mark; renderRoute(false); }));
    document.querySelectorAll("[data-tag-facet]").forEach((button) => button.addEventListener("click", () => { state[button.dataset.tagFacet] = button.dataset.tagValue; renderRoute(false); }));
    document.querySelectorAll("[data-toggle-family]").forEach((button) => button.addEventListener("click", (event) => { event.stopPropagation(); const facet = button.dataset.toggleFamily; state.expandedTags[facet] = state.expandedTags[facet] === false; renderRoute(false); }));
    document.querySelectorAll("[data-clear-facet]").forEach((button) => button.addEventListener("click", () => { clearFacet(button.dataset.clearFacet); renderRoute(false); }));
    document.querySelectorAll("[data-detail]").forEach((button) => button.addEventListener("click", () => { location.hash = `#sculpture/${button.dataset.detail}`; }));
    document.querySelectorAll("[data-view]").forEach((button) => button.addEventListener("click", () => { state.view = button.dataset.view; renderRoute(false); }));
  }
  const sort = $("sortSelect"); if (sort) sort.addEventListener("change", (event) => { state.sort = event.target.value; renderRoute(false); });
  const clear = $("clearFilters"); if (clear) clear.addEventListener("click", () => { resetFilters(); renderRoute(false); });
  const mobileFilter = $("mobileFilter"); if (mobileFilter) mobileFilter.addEventListener("click", () => toggleSheet(true));
  const backdrop = $("sheetBackdrop"); if (backdrop) backdrop.addEventListener("click", () => toggleSheet(false));
  const closeSheet = $("closeSheet"); if (closeSheet) closeSheet.addEventListener("click", () => toggleSheet(false));
  const saveStreetViewKey = $("saveStreetViewKey");
  if (saveStreetViewKey) saveStreetViewKey.addEventListener("click", () => {
    const input = $("streetViewKeyInput");
    setStreetViewKey(input ? input.value.trim() : "");
    renderRoute(false);
  });
  const streetViewKeyInput = $("streetViewKeyInput");
  if (streetViewKeyInput) streetViewKeyInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      setStreetViewKey(event.target.value.trim());
      renderRoute(false);
    }
  });
  const clearStreetViewKey = $("clearStreetViewKey");
  if (clearStreetViewKey) clearStreetViewKey.addEventListener("click", () => { setStreetViewKey(""); renderRoute(false); });
}
function toggleSheet(open) { state.sheet = open; const sheet = $("mobileSheet"), backdrop = $("sheetBackdrop"); if (sheet) sheet.classList.toggle("open", open); if (backdrop) backdrop.classList.toggle("open", open); }
function clearFacet(facet) {
  if (facet === "search") state.search = ""; else if (facet in state) state[facet] = "all";
  if (facet === "country") state.city = "all";
}
function resetFilters() {
  ["search", "country", "city", "mark", ...Object.keys(taxonomy)].forEach(clearFacet);
}
function renderAtlas() {
  const visible = filteredRecords();
  const featured = records.filter((r) => r.interest_level === "featured").slice(0, 10);
  $("appView").innerHTML = `<div class="atlas-page"><section class="atlas-hero"><div class="intro-panel"><div class="kicker"><span class="target-icon"></span> Global atlas</div><h1 class="page-title">Roundabout <span class="accent">Sculpture</span> Database</h1><p class="body-copy">The world's most comprehensive atlas of traffic-island sculpture, mapping public art at the intersection of movement and place.</p>${statsHtml(visible)}<details class="atlas-filter-drawer" open><summary>Filters</summary>${atlasFilterControlsHtml("atlas")}</details></div><div class="map-panel"><div id="atlasMap" class="map-canvas"></div><div class="map-badge"><span class="pin-dot"></span><span>${visible.length.toLocaleString()} locations mapped</span></div><div class="map-legend"><span>Sculptures per region</span><div class="legend-bar"></div><div class="legend-scale"><span>1</span><span>10</span><span>100</span><span>500+</span></div></div></div></section><div class="section-strip"><h2>Featured sculptures</h2><a class="link-arrow" href="#explore">View all sculptures →</a></div><div class="carousel">${featured.map(cardHtml).join("")}</div></div>`;
  activateBindings("atlas", true);
  setTimeout(() => initMap("atlasMap", visible.slice(0, 900)), 0);
}
function renderArchive() {
  const visible = filteredRecords();
  $("appView").innerHTML = `<div class="explore-page explore-split-page"><aside class="explore-filter-panel"><div class="explore-sticky"><div class="explore-intro"><div class="kicker"><span class="target-icon"></span> Cultural index</div><h1 class="explore-title">Explore <span>${visible.length.toLocaleString()} sculptures</span></h1><p class="body-copy">Browse by your original Lightroom-style tag tree. Some parent tags are also selectable, while Shape and Color work as classification folders.</p></div>${exploreControlsHtml("explore")}<div class="explore-head compact-head"><div><p class="filter-label">Active selection</p>${activeFilterChipsHtml()}</div><button id="clearFilters" class="clear-button clear-index" type="button">Clear all</button></div><div class="taxonomy-board explore-taxonomy-board">${taxonomyTreeHtml()}</div></div></aside><main class="explore-gallery-panel"><div class="gallery-toolbar"><div><p class="filter-label">Grid view</p><h2>${visible.length.toLocaleString()} results</h2></div><select id="sortSelect" class="select sort-select"><option value="newest" ${state.sort === "newest" ? "selected" : ""}>Newest first</option><option value="oldest" ${state.sort === "oldest" ? "selected" : ""}>Oldest first</option><option value="country" ${state.sort === "country" ? "selected" : ""}>Country A-Z</option><option value="highlighted" ${state.sort === "highlighted" ? "selected" : ""}>Highlighted</option></select></div><div class="explore-image-grid">${visible.slice(0, 80).map(miniResultHtml).join("")}</div></main></div>`;
  activateBindings("explore", true);
}
function getStreetViewKey() {
  try { return localStorage.getItem("roundaboutStreetViewKey") || ""; }
  catch { return ""; }
}
function setStreetViewKey(value) {
  try {
    if (value) localStorage.setItem("roundaboutStreetViewKey", value);
    else localStorage.removeItem("roundaboutStreetViewKey");
  } catch {}
}
function streetViewEmbedUrl(record) {
  const key = getStreetViewKey();
  const params = new URLSearchParams({
    key,
    location: `${record.latitude},${record.longitude}`,
    heading: "0",
    pitch: "0",
    fov: "80"
  });
  return `https://www.google.com/maps/embed/v1/streetview?${params.toString()}`;
}
function detailStreetViewHtml(record) {
  if (!getStreetViewKey()) {
    return `<div class="gallery-main streetview-missing"><div><div class="kicker"><span class="target-icon"></span> Street View</div><p>Paste your local Google Maps Embed API key to preview the live Street View here.</p><div class="streetview-key-row"><input id="streetViewKeyInput" class="search" type="password" autocomplete="off" placeholder="Paste Maps Embed API key" /><button id="saveStreetViewKey" class="ghost-button" type="button">Use key</button></div></div></div>`;
  }
  return `<iframe class="gallery-main detail-streetview-frame" loading="lazy" allowfullscreen referrerpolicy="no-referrer-when-downgrade" src="${attr(streetViewEmbedUrl(record))}"></iframe>`;
}
function emptyFieldButton(label) {
  return `<button class="field-add" type="button">Add ${esc(label)}</button>`;
}
function detailFieldValue(label, value) {
  const cleaned = String(value || "").trim();
  return cleaned ? `<strong>${esc(cleaned)}</strong>` : emptyFieldButton(label.toLowerCase());
}
function detailTagsHtml(record) {
  const tags = Object.entries(tagsFor(record)).flatMap(([facet, values]) => values.map((value) => labelForTag(facet, value)));
  const uniqueTags = [...new Set(tags)].slice(0, 10);
  if (!uniqueTags.length) return emptyFieldButton("tags");
  return `<div class="detail-tags">${uniqueTags.map((tag) => `<span>${esc(tag)}</span>`).join("")}</div>`;
}
function detailMetadataHtml(record) {
  const name = record.title || record.original_name || "";
  const artist = record.artist || "";
  const info = record.description || "";
  return `<div class="metadata detail-editorial-fields"><div class="meta-row"><span>Name</span>${detailFieldValue("name", name)}</div><div class="meta-row"><span>Artist</span>${detailFieldValue("artist", artist)}</div><div class="meta-row info-row"><span>Info</span>${info ? `<p>${esc(info)}</p>` : emptyFieldButton("info")}</div><div class="meta-row tags-row"><span>Tags</span>${detailTagsHtml(record)}</div><div class="meta-row"><span>Editorial mark</span><strong style="color:${colors[record.interest_level]}">${esc(markFor(record))}</strong></div></div>`;
}

function detailRecord(id) { return records.find((record) => record.id === id) || records.find((record) => record.interest_level === "featured") || records[0]; }
function renderDetail(id) {
  const record = detailRecord(id);
  const related = records.filter((item) => item.id !== record.id && (item.country === record.country || item.interest_level === record.interest_level)).slice(0, 6);
  $("appView").innerHTML = `<div class="detail-page"><a class="back-link" href="#explore">← Back to Explore</a><section class="detail-grid refined-detail-grid"><div class="detail-media-stack">${detailStreetViewHtml(record)}<div class="thumb-row">${[0,1,2,3].map((i) => `<div class="thumb visual" style="${visualStyle(record, i * 13)}"></div>`).join("")}</div></div><div class="detail-info-panel"><div class="kicker"><span class="target-icon"></span> Sculpture</div><h1 class="detail-title">${esc(titleFor(record))}</h1><div class="detail-subtitle">⌖ ${esc(placeFor(record))}</div><p class="card-meta">${record.title ? esc(record.title) : "Location-based archive record"}</p>${detailMetadataHtml(record)}<div class="action-row"><a class="ghost-button primary-map-link" href="${attr(record.google_maps_url)}" target="_blank" rel="noreferrer">Open in GoogleMaps</a></div></div></section><div class="section-strip"><h2>Related sculptures</h2><a class="link-arrow" href="#explore">View all →</a></div><div class="carousel">${related.map(cardHtml).join("")}</div></div>`;
  activateBindings();
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
  setActive(name === "sculpture" || name === "archive" ? "explore" : name);
  if (name === "archive" || name === "explore") renderArchive(); else if (name === "collections") renderCollections(); else if (name === "about") renderAbout(); else if (name === "sculpture") renderDetail(id); else renderAtlas();
}
window.addEventListener("hashchange", () => renderRoute(true));
renderRoute(true);
