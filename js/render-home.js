/* ============================================================
   render-home.js — hero couplet and the recent poems grid
   ============================================================ */

(function () {
  "use strict";

  var el = Site.el;
  var grid = document.getElementById("recent-grid");
  var couplet = document.getElementById("hero-couplet");
  var attrib = document.getElementById("hero-attrib");
  var countNote = document.getElementById("collection-count");

  /* A poem chosen by the date, so everyone sees the same one today
     and it changes on its own each morning. */
  function poemOfTheDay(poems) {
    if (!poems.length) return null;
    var d = new Date();
    var seed = d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
    return poems[seed % poems.length];
  }

  Site.load().then(function (data) {
    var poems = data.poems;

    if (!poems.length) {
      Site.fail(grid, "No poems yet. Add the first one to content/poems.json.");
      return;
    }

    var today = poemOfTheDay(poems);
    var first = Site.lines(today).filter(function (l) { return l.trim(); }).slice(0, 2);

    couplet.setAttribute("lang", today.lang);
    couplet.innerHTML = "";
    first.forEach(function (line) { couplet.appendChild(el("span", { text: line })); });

    attrib.innerHTML = "";
    attrib.appendChild(document.createTextNode("From "));
    attrib.appendChild(el("a", {
      href: "poem.html?p=" + encodeURIComponent(today.slug),
      lang: today.lang,
      text: today.title
    }));
    attrib.appendChild(document.createTextNode(
      ". A different poem opens this page each day."
    ));

    if (countNote) {
      countNote.textContent = poems.length + (poems.length === 1 ? " poem" : " poems") + " in the collection";
    }

    grid.innerHTML = "";
    poems.slice(0, 6).forEach(function (p) { grid.appendChild(Site.poemCard(p)); });

  }).catch(function (err) {
    Site.fail(grid, "The poems could not be loaded. " + err.message);
  });

})();
