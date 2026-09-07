/* ============================================================
   render-archive.js — search and filter the whole collection
   Everything runs in the browser; there is nothing to query.
   ============================================================ */

(function () {
  "use strict";

  var el = Site.el;
  var grid = document.getElementById("archive-grid");
  var input = document.getElementById("search-input");
  var langRow = document.getElementById("lang-filters");
  var tagRow = document.getElementById("tag-filters");
  var count = document.getElementById("result-count");

  var all = [];
  var state = { q: "", lang: "", tag: "" };

  function haystack(p) {
    return [p.title, p.titleRoman, p.titleEnglish, p.tags.join(" "), Site.plainText(p),
            Translit.line(p.title)].join(" ").toLowerCase();
  }

  function matches(p) {
    if (state.lang && p.lang !== state.lang) return false;
    if (state.tag && p.tags.indexOf(state.tag) < 0) return false;
    if (state.q && p._hay.indexOf(state.q) < 0) return false;
    return true;
  }

  function apply() {
    var found = all.filter(matches);
    grid.innerHTML = "";

    if (!found.length) {
      count.textContent = "";
      Site.fail(grid, "Nothing matches that. Clear the filters or try a different word.");
      return;
    }

    count.textContent = found.length === all.length
      ? "Showing all " + all.length + " poems"
      : "Showing " + found.length + " of " + all.length + " poems";

    found.forEach(function (p) { grid.appendChild(Site.poemCard(p)); });
  }

  function chip(label, group, value) {
    var b = el("button", { class: "chip", type: "button", "aria-pressed": "false" });
    b.textContent = label;
    b.addEventListener("click", function () {
      var on = b.getAttribute("aria-pressed") === "true";
      var row = b.parentNode;
      Array.prototype.forEach.call(row.children, function (c) { c.setAttribute("aria-pressed", "false"); });
      b.setAttribute("aria-pressed", on ? "false" : "true");
      state[group] = on ? "" : value;
      apply();
    });
    return b;
  }

  Site.load().then(function (data) {
    all = data.poems;
    all.forEach(function (p) { p._hay = haystack(p); });

    if (!all.length) {
      Site.fail(grid, "No poems yet. Add the first one to content/poems.json.");
      return;
    }

    // language chips, built from what actually exists
    var langs = [];
    all.forEach(function (p) { if (langs.indexOf(p.lang) < 0) langs.push(p.lang); });
    if (langs.length > 1) {
      langs.forEach(function (l) { langRow.appendChild(chip(Site.langName(l), "lang", l)); });
    }

    // theme chips, most used first
    var counts = {};
    all.forEach(function (p) { p.tags.forEach(function (t) { counts[t] = (counts[t] || 0) + 1; }); });
    Object.keys(counts)
      .sort(function (a, b) { return counts[b] - counts[a]; })
      .slice(0, 12)
      .forEach(function (t) { tagRow.appendChild(chip(t, "tag", t)); });

    // a tag may arrive from a poem page link
    var wanted = new URLSearchParams(location.search).get("tag");
    if (wanted) {
      state.tag = wanted;
      Array.prototype.forEach.call(tagRow.children, function (c) {
        if (c.textContent === wanted) c.setAttribute("aria-pressed", "true");
      });
    }

    input.addEventListener("input", function () {
      state.q = input.value.trim().toLowerCase();
      apply();
    });

    apply();

  }).catch(function (err) {
    Site.fail(grid, "The poems could not be loaded. " + err.message);
  });

})();
