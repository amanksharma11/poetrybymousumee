/* ============================================================
   render-archive.js — search and filter, all in the browser
   ============================================================ */

(function () {
  "use strict";

  var el = Site.el;
  var grid = document.getElementById("grid");
  var input = document.getElementById("q");
  var langRow = document.getElementById("langs");
  var tagRow = document.getElementById("tags");
  var count = document.getElementById("count");

  var all = [], state = { q: "", lang: "", tag: "" };

  function haystack(p) {
    return [p.title, Site.romanTitle(p), p.titleEnglish, p.tags.join(" "),
            p.tags.map(Site.romanTag).join(" "), Site.plainText(p)].join(" ").toLowerCase();
  }

  function keep(p) {
    if (state.lang && p.lang !== state.lang) return false;
    if (state.tag && p.tags.indexOf(state.tag) < 0) return false;
    if (state.q && p._hay.indexOf(state.q) < 0) return false;
    return true;
  }

  function apply() {
    var found = all.filter(keep);
    grid.innerHTML = "";
    if (!found.length) {
      count.textContent = "";
      Site.fail(grid, "Nothing matches that. Clear a filter, or try another word.");
      return;
    }
    count.textContent = found.length === all.length
      ? "All " + all.length + " poems"
      : found.length + " of " + all.length + " poems";
    found.forEach(function (p) { grid.appendChild(Site.poemCard(p)); });
  }

  /* A chip shows the label in its own script with the romanisation
     beside it, so প্রকৃতি reads as প্রকৃতি (Prokriti). */
  function chip(label, roman, group, value, lang) {
    var b = el("button", { class: "chip", type: "button", "aria-pressed": "false" });
    b.appendChild(el("span", { lang: lang || "en", text: label }));
    if (roman) b.appendChild(el("span", { class: "rom", text: " (" + roman + ")" }));
    b.addEventListener("click", function () {
      var on = b.getAttribute("aria-pressed") === "true";
      Array.prototype.forEach.call(b.parentNode.children, function (c) {
        c.setAttribute("aria-pressed", "false"); c.classList.remove("is-on");
      });
      if (!on) { b.setAttribute("aria-pressed", "true"); b.classList.add("is-on"); }
      state[group] = on ? "" : value;
      apply();
    });
    return b;
  }

  Site.load().then(function (data) {
    all = data.poems;
    all.forEach(function (p) { p._hay = haystack(p); });

    if (!all.length) {
      Site.fail(grid, "No poems yet. Add the first row to the sheet, or to content/poems.json.");
      return;
    }

    var langs = [];
    all.forEach(function (p) { if (langs.indexOf(p.lang) < 0) langs.push(p.lang); });
    if (langs.length > 1) {
      langs.forEach(function (l) { langRow.appendChild(chip(Site.langName(l), "", "lang", l)); });
    }

    var counts = {};
    all.forEach(function (p) { p.tags.forEach(function (t) { counts[t] = (counts[t] || 0) + 1; }); });
    Object.keys(counts)
      .sort(function (a, b) { return counts[b] - counts[a]; })
      .slice(0, 12)
      .forEach(function (t) {
        var owner = all.find(function (p) { return p.tags.indexOf(t) >= 0; });
        tagRow.appendChild(chip(t, Site.romanTag(t), "tag", t, owner ? owner.lang : "bn"));
      });

    var wanted = new URLSearchParams(location.search).get("tag");
    if (wanted) {
      state.tag = wanted;
      Array.prototype.forEach.call(tagRow.children, function (c) {
        if (c.firstChild && c.firstChild.textContent === wanted) {
          c.setAttribute("aria-pressed", "true"); c.classList.add("is-on");
        }
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
