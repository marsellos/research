// Wall of Student Research (wall.qmd).
// Posters come from the publications database: every student record with a
// poster link. Images (thumbnail, full-screen view, pixel size) come from
// data/poster_wall.json, written by scripts/build_poster_wall.py. A poster
// without images yet is simply left off the wall until that script is run.

(function () {
  const LEVELS = {
    hs: "High school",
    university: "University",
    both: "High school and university"
  };
  const ROW_H = window.innerWidth < 640 ? 120 : 190; // target row height, px

  const wall = document.getElementById("poster-wall");
  const countEl = document.getElementById("wall-count");
  const filtersEl = document.getElementById("wall-filters");
  const box = document.getElementById("wall-lightbox");
  const boxImg = box.querySelector(".wl-img");
  const boxCap = box.querySelector(".wl-caption");

  let all = [], shown = [], current = -1;
  const filter = { level: "all", year: "all" };

  const plain = html => {
    const d = document.createElement("div");
    d.innerHTML = html;
    return d.textContent.replace(/\s+/g, " ").trim();
  };

  // "Pasumarthi, S., Marsellos, A.E., 2026. Title here. Venue..." gives the
  // author list and the title; "... (2026, May). Title." occurs too. The first
  // author who is not Marsellos is the student named on the tile.
  function parseCitation(text) {
    const y = text.match(/\(?\b(19|20)\d\d[a-z]?(,[^)]*)?\)?\.\s*/);
    const authors = y ? text.slice(0, y.index) : "";
    const rest = y ? text.slice(y.index + y[0].length) : text;
    // "vs." and "U.S." inside a title are not the end of it.
    const safe = rest.replace(/\b(vs|U\.S)\./g, "$1<DOT>");
    const title = ((safe.match(/^(.+?[.?!])(\s|$)/) || [null, safe])[1])
      .replace(/<DOT>/g, ".");
    const surnames = authors.split(/,|&/)
      .map(a => a.replace(/(\s*[A-Z]\.\s*-?)+$/, "").trim())   // drop initials
      .filter(a => a && !/^([A-Z]\.?\s*)+$/.test(a) && !/^Marsellos$/i.test(a));
    return { title: title.replace(/[.]$/, ""), student: surnames[0] || "" };
  }

  Promise.all([
    fetch("data/publications.json").then(r => r.json()),
    fetch("data/poster_wall.json").then(r => r.json())
  ]).then(([pubs, imgs]) => {
    const seen = new Set();
    for (const p of pubs) {
      const poster = p.links && p.links.poster;
      if (!poster || !LEVELS[p.students] || !imgs[poster] || seen.has(poster)) continue;
      seen.add(poster);
      const c = parseCitation(plain(p.citation_html));
      all.push(Object.assign({ pub: p, poster: poster }, imgs[poster], c));
    }
    all.sort((a, b) => (b.pub.year || 0) - (a.pub.year || 0));
    buildFilters();
    render();
  }).catch(() => {
    wall.innerHTML = '<p class="text-muted">The posters could not be loaded.</p>';
  });

  function chip(group, value, label) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "wall-chip";
    b.textContent = label;
    b.setAttribute("aria-pressed", String(filter[group] === value));
    b.addEventListener("click", () => {
      filter[group] = value;
      filtersEl.querySelectorAll(`[data-group="${group}"] .wall-chip`)
        .forEach(x => x.setAttribute("aria-pressed", String(x === b)));
      render();
    });
    return b;
  }

  function buildFilters() {
    const groups = [
      ["level", "Level", [["all", "All levels"], ["hs", "High school"], ["university", "University"]]],
      ["year", "Year", [["all", "All years"]].concat(
        [...new Set(all.map(x => x.pub.year))].sort((a, b) => b - a).map(y => [String(y), String(y)]))]
    ];
    for (const [key, name, opts] of groups) {
      const g = document.createElement("div");
      g.className = "wall-chip-group";
      g.dataset.group = key;
      g.setAttribute("role", "group");
      g.setAttribute("aria-label", name);
      const l = document.createElement("span");
      l.className = "wall-chip-label";
      l.textContent = name;
      g.appendChild(l);
      for (const [v, t] of opts) g.appendChild(chip(key, v, t));
      filtersEl.appendChild(g);
    }
  }

  function matches(x) {
    const s = x.pub.students;
    const levelOk = filter.level === "all" || s === filter.level || s === "both";
    const yearOk = filter.year === "all" || String(x.pub.year) === filter.year;
    return levelOk && yearOk;
  }

  function render() {
    shown = all.filter(matches);
    countEl.textContent = shown.length === 1 ? "1 poster shown." : `${shown.length} posters shown.`;
    wall.innerHTML = "";
    shown.forEach((x, i) => {
      const ar = x.w / x.h;
      const b = document.createElement("button");
      b.type = "button";
      b.className = "wall-tile";
      b.style.flex = `${ar} 1 ${Math.round(ar * ROW_H)}px`;
      b.setAttribute("aria-label", `${x.title} (${x.student}, ${x.pub.year}). Open full screen.`);
      b.innerHTML =
        `<img src="${x.thumb}" alt="" loading="lazy" style="aspect-ratio:${x.w}/${x.h}">` +
        `<span class="wall-tile-cap"><strong>${x.student}</strong> ${x.pub.year}` +
        ` <em>${LEVELS[x.pub.students]}</em></span>`;
      b.addEventListener("click", () => open(i));
      wall.appendChild(b);
    });
    // Keeps the last row from stretching its few tiles across the page.
    const fill = document.createElement("span");
    fill.className = "wall-fill";
    wall.appendChild(fill);
  }

  // Lightbox ----------------------------------------------------------------
  function show(i) {
    current = (i + shown.length) % shown.length;
    const x = shown[current];
    boxImg.src = x.full;
    boxImg.alt = `Research poster: ${x.title}`;
    const order = ["poster", "paper", "doi", "abstract"];
    const links = order.filter(k => x.pub.links[k]).map(k => {
      const label = k === "poster" ? "Poster PDF (full resolution)" :
        k === "paper" ? "Paper" : k === "doi" ? "DOI" : "Abstract";
      return `<a href="${x.pub.links[k]}" target="_blank" rel="noopener">${label}</a>`;
    }).join("");
    boxCap.innerHTML =
      `<span class="wl-level">${LEVELS[x.pub.students]} research &middot; ${current + 1} of ${shown.length}</span>` +
      `<span class="wl-cite">${x.pub.citation_html}</span>` +
      `<span class="wl-links">${links}</span>`;
    // Warm the neighbours so the arrow keys feel instant.
    [current - 1, current + 1].forEach(j => {
      const n = shown[(j + shown.length) % shown.length];
      if (n) new Image().src = n.full;
    });
  }

  function open(i) {
    show(i);
    if (!box.open) box.showModal();
  }

  function close() {
    box.close();
  }

  box.addEventListener("close", () => {
    const tile = wall.querySelectorAll(".wall-tile")[current];
    if (tile) tile.focus();
  });
  // A click on the poster or the dark background returns to the wall;
  // clicks on the caption links and buttons do not.
  box.addEventListener("click", e => {
    if (e.target === box || e.target === boxImg || e.target.classList.contains("wl-figure")) close();
  });
  box.querySelector(".wl-close").addEventListener("click", close);
  box.querySelector(".wl-prev").addEventListener("click", () => show(current - 1));
  box.querySelector(".wl-next").addEventListener("click", () => show(current + 1));
  box.addEventListener("keydown", e => {
    if (e.key === "ArrowLeft") { e.preventDefault(); show(current - 1); }
    if (e.key === "ArrowRight") { e.preventDefault(); show(current + 1); }
  });

  let touchX = null;
  box.addEventListener("touchstart", e => { touchX = e.touches[0].clientX; }, { passive: true });
  box.addEventListener("touchend", e => {
    if (touchX === null) return;
    const dx = e.changedTouches[0].clientX - touchX;
    touchX = null;
    if (Math.abs(dx) > 50) show(current + (dx < 0 ? 1 : -1));
  });
})();
