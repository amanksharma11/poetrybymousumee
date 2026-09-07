/* ============================================================
   source.js — where the poems come from
   ------------------------------------------------------------
   Two sources, tried in order:

     1. A Google Sheet published as CSV. Set SHEET_CSV_URL below
        and the site reads the sheet on every page load, so adding
        a row publishes a poem. Nothing else to do.

     2. content/poems.json, used when the sheet URL is blank, or
        if the sheet is unreachable. This means a network hiccup
        at Google never takes the site down.

   TO PUBLISH FROM A SHEET
     File -> Share -> Publish to web
     Choose the poems sheet, format "Comma-separated values (.csv)"
     Publish, copy the URL, paste it between the quotes below.

   The URL should look like:
     https://docs.google.com/spreadsheets/d/e/2PACX-.../pub?gid=0&single=true&output=csv

   COLUMNS the sheet should have, as the first row, in any order.
   Only "title" and "poem" are required.

     slug | title | title_roman | title_english | lang | date |
     tags | audio | image | note | poem | translation_en | translit

   In the "poem" cell press Alt+Enter (Windows) or Ctrl+Enter (Mac)
   for a new line, and leave a blank line between stanzas.
   "tags" is a comma separated list. "lang" is bn or hi.
   ============================================================ */

var SHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQFGTCu8Gyu72v80NnK8faZIIaoEA_kw81EkB7SmfsAq7p6X4jhGPkMvciUZVkgornIIj759XBZmoBh/pub?gid=490640914&single=true&output=csv";

var JSON_URL = "content/poems.json";

(function (global) {
  "use strict";

  /* ---------- a CSV reader that survives real spreadsheets ----------
     Quoted fields may contain commas, doubled quotes, and newlines,
     which they will, because poems are full of newlines. */
  function parseCSV(text) {
    var rows = [], row = [], field = "", i = 0, inQuotes = false;
    text = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

    while (i < text.length) {
      var c = text[i];
      if (inQuotes) {
        if (c === '"') {
          if (text[i + 1] === '"') { field += '"'; i += 2; continue; }
          inQuotes = false; i++; continue;
        }
        field += c; i++; continue;
      }
      if (c === '"') { inQuotes = true; i++; continue; }
      if (c === ",") { row.push(field); field = ""; i++; continue; }
      if (c === "\n") { row.push(field); rows.push(row); row = []; field = ""; i++; continue; }
      field += c; i++;
    }
    row.push(field);
    if (row.length > 1 || row[0] !== "") rows.push(row);
    return rows;
  }

  function key(s) {
    return String(s || "").trim().toLowerCase().replace(/[\s-]+/g, "_");
  }

  /* Split a cell of text into stanzas of lines. */
  function toStanzas(text) {
    if (!text) return [];
    return String(text)
      .replace(/\r\n/g, "\n").replace(/\r/g, "\n")
      .split(/\n\s*\n/)
      .map(function (block) {
        return block.split("\n").map(function (l) { return l.trim(); })
                    .filter(function (l, idx, arr) { return l !== "" || idx < arr.length; });
      })
      .filter(function (st) { return st.join("").trim() !== ""; });
  }

  function rowsToPoems(rows) {
    if (!rows.length) return [];
    var head = rows[0].map(key);
    var out = [];

    rows.slice(1).forEach(function (cells) {
      var r = {};
      head.forEach(function (h, i) { r[h] = (cells[i] || "").trim(); });
      if (!r.title || !r.poem) return;          // skip blank or unfinished rows

      out.push({
        slug: r.slug || "",
        title: r.title,
        titleRoman: r.title_roman || "",
        titleEnglish: r.title_english || "",
        lang: (r.lang || "bn").toLowerCase(),
        date: r.date || "",
        tags: r.tags ? r.tags.split(",").map(function (t) { return t.trim(); }).filter(Boolean) : [],
        audio: r.audio || "",
        image: r.image || "",
        note: r.note || "",
        stanzas: toStanzas(r.poem),
        translit: r.translit ? toStanzas(r.translit) : null,
        translation: r.translation_en ? { en: toStanzas(r.translation_en) } : null
      });
    });

    return out;
  }

  function fromSheet() {
    if (!SHEET_CSV_URL) return Promise.reject(new Error("no sheet configured"));
    return fetch(SHEET_CSV_URL, { cache: "no-cache" })
      .then(function (r) {
        if (!r.ok) throw new Error("sheet responded " + r.status);
        return r.text();
      })
      .then(function (text) {
        if (/^\s*</.test(text)) throw new Error("sheet is not published as CSV");
        var poems = rowsToPoems(parseCSV(text));
        if (!poems.length) throw new Error("sheet has no usable rows");
        return { poems: poems, origin: "sheet" };
      });
  }

  function fromJSON() {
    return fetch(JSON_URL, { cache: "no-cache" })
      .then(function (r) {
        if (!r.ok) throw new Error("could not load " + JSON_URL + " (" + r.status + ")");
        return r.json();
      })
      .then(function (data) {
        return { poems: data.poems || [], poet: data.poet || {}, origin: "json" };
      });
  }

  global.Source = {
    fetchPoems: function () {
      return fromSheet().catch(function (err) {
        if (SHEET_CSV_URL) console.warn("Sheet unavailable, using the local file instead:", err.message);
        return fromJSON();
      });
    },
    parseCSV: parseCSV,
    toStanzas: toStanzas
  };

})(window);
