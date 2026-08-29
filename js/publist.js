// Shared client-side renderer for the publications database.
// Every page loads data/publications.json and renders through these helpers,
// so adding a publication means editing one JSON file only.

const PUB_AREAS = {
  "sustainability": "Sustainability, Environment & Resilience",
  "ai-ml": "Artificial Intelligence & Machine Learning",
  "time-series": "Time Series, Forecasting & Signal Detection",
  "geospatial": "GIS, Remote Sensing & Geospatial Analytics",
  "tectonics": "Earthquakes, Tectonics & Geodesy",
  "volcano": "Volcano Monitoring & Hazards",
  "water": "Floods, Groundwater & Water Resources",
  "climate": "Climate & Solar Signals",
  "petrology": "Petrology, Geochemistry & Thermochronology",
  "biomedical": "Biomedical Signal Analysis",
  "business": "Business & Financial Analytics",
  "education": "Geoscience & AI Education"
};

const PUB_SECTIONS = {
  "journal": "Journal Article",
  "proceedings": "Conference Proceedings",
  "abstract": "Conference Abstract",
  "book": "Book / Chapter",
  "thesis": "Thesis",
  "hs": "High School Research"
};

function loadPubs() {
  return fetch("data/publications.json").then(r => r.json());
}

function pubItemHtml(p) {
  let badges = "";
  if (p.students === "hs") {
    badges += ' <span class="pub-badge pub-badge-hs">High School</span>';
  } else if (p.students === "university") {
    badges += ' <span class="pub-badge pub-badge-uni">Student co-authored</span>';
  }
  let links = "";
  const order = ["doi", "paper", "abstract", "poster", "presentation"];
  const keys = Object.keys(p.links).sort(
    (a, b) => order.indexOf(a) - order.indexOf(b));
  for (const k of keys) {
    const ext = p.links[k].startsWith("http") ? ' target="_blank" rel="noopener"' : ' target="_blank"';
    // Link keys name the FILE a visitor gets (paper, poster, presentation).
    // For a book or chapter entry the "paper" PDF is the chapter itself.
    const label = (k === "paper" && p.section === "book") ? "chapter" : k;
    links += `<a href="${p.links[k]}"${ext}>${label}</a>`;
  }
  if (links) links = `<div class="pub-links">${links}</div>`;
  return `<div class="pub-item">${p.citation_html}${badges}${links}</div>`;
}

// Render a list grouped by year (descending) into the element with id elId.
function renderPubList(elId, pubs, opts) {
  opts = opts || {};
  const el = document.getElementById(elId);
  if (!el) return;
  if (!pubs.length) {
    el.innerHTML = '<p class="text-muted">No publications match the current filters.</p>';
    return;
  }
  pubs = [...pubs].sort((a, b) => (b.year || 0) - (a.year || 0));
  let html = "", lastYear = null;
  for (const p of pubs) {
    if (!opts.noYearHeadings && p.year !== lastYear) {
      html += `<h3 class="pub-year-heading">${p.year || "Undated"}</h3>`;
      lastYear = p.year;
    }
    html += pubItemHtml(p);
  }
  el.innerHTML = html;
}
