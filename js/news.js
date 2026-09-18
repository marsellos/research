// Shared client-side renderer for the homepage QNews box.
// Adding a news item means editing data/news.json only; newest goes first.

function loadNews() {
  return fetch("data/news.json").then(r => r.json());
}

function renderNews(containerId, items) {
  const el = document.getElementById(containerId);
  if (!el) return;
  el.innerHTML = items.map(item => {
    const body = item.link
      ? `<a href="${item.link}">${item.text}</a>`
      : item.text;
    return `<li><span class="news-date">${item.date}</span>${body}</li>`;
  }).join("");
}
