/* ============================================================
   render-home.js — hero, the poem of the day in full, recent work
   ============================================================ */

(function () {
  "use strict";

  var el = Site.el;
  var featured = document.getElementById("featured");
  var grid = document.getElementById("recent");
  var count = document.getElementById("count");

  /* Keyed to the date so everyone sees the same poem today,
     and a different one tomorrow without anybody touching it. */
  function poemOfTheDay(poems) {
    var d = new Date();
    var seed = d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
    return poems[seed % poems.length];
  }

  Site.load().then(function (data) {
    var poems = data.poems;
    if (!poems.length) {
      Site.fail(grid, "No poems yet. Add the first row to the sheet, or to content/poems.json.");
      return;
    }

    /* ---- today's poem, shown whole ---- */
    var p = poemOfTheDay(poems);
    featured.innerHTML = "";

    featured.appendChild(el("div", { class: "featured-side", text: "Today's poem" }));

    var main = el("div");
    var h = el("h3", { class: "display", lang: p.lang, text: p.title });
    var roman = Site.romanTitle(p);
    if (roman) h.appendChild(el("span", { class: "roman", lang: "en", text: roman }));
    main.appendChild(h);

    var verse = el("div", { class: "verse", lang: p.lang });
    p.stanzas.slice(0, 2).forEach(function (st) {
      var block = el("div", { style: "margin-bottom:1rem" });
      st.forEach(function (line) { block.appendChild(el("p", { text: line })); });
      verse.appendChild(block);
    });
    main.appendChild(verse);

    var row = el("div", { class: "btn-row" });
    var read = el("a", { class: "btn", href: "poem.html?p=" + encodeURIComponent(p.slug) });
    read.innerHTML = Site.icon("listen") + "<span>Read it, hear it</span>";
    row.appendChild(read);
    main.appendChild(row);

    featured.appendChild(main);

    /* ---- recent ---- */
    if (count) count.textContent = poems.length + (poems.length === 1 ? " poem" : " poems") + " so far";
    grid.innerHTML = "";
    poems.slice(0, 6).forEach(function (poem) { grid.appendChild(Site.poemCard(poem)); });

  }).catch(function (err) {
    Site.fail(grid, "The poems could not be loaded. " + err.message);
  });

})();
