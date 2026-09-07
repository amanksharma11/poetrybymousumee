/* ============================================================
   site.js — shared helpers used by every page
   ============================================================ */

(function (global) {
  "use strict";

  var CONTENT_URL = "content/poems.json";
  var cache = null;

  var LANG_NAMES = { bn: "Bangla", hi: "Hindi" };

  /* Load and normalise the poem collection exactly once per page. */
  function load() {
    if (cache) return cache;
    cache = fetch(CONTENT_URL, { cache: "no-cache" })
      .then(function (r) {
        if (!r.ok) throw new Error("Could not load " + CONTENT_URL + " (" + r.status + ")");
        return r.json();
      })
      .then(function (data) {
        var poems = (data.poems || []).map(normalise).filter(Boolean);
        // newest first; poems without a date sink to the bottom
        poems.sort(function (a, b) {
          if (!a.date && !b.date) return 0;
          if (!a.date) return 1;
          if (!b.date) return -1;
          return b.date.localeCompare(a.date);
        });
        return { site: data.site || {}, poet: data.poet || {}, poems: poems };
      });
    return cache;
  }

  function normalise(p) {
    if (!p || !p.title) return null;
    var stanzas = p.stanzas || [];
    // tolerate a plain string body with blank lines between stanzas
    if (typeof stanzas === "string") {
      stanzas = stanzas.split(/\n\s*\n/).map(function (s) { return s.split(/\n/); });
    }
    return {
      slug: p.slug || slugify(p.title),
      title: p.title,
      titleRoman: p.titleRoman || "",
      titleEnglish: p.titleEnglish || "",
      lang: p.lang || "bn",
      date: p.date || "",
      tags: p.tags || [],
      note: p.note || "",
      audio: p.audio || "",
      image: p.image || "",
      stanzas: stanzas,
      translit: p.translit || null,
      translation: p.translation || null
    };
  }

  function slugify(s) {
    return String(s).trim().toLowerCase()
      .replace(/[^\p{L}\p{N}]+/gu, "-")
      .replace(/^-+|-+$/g, "");
  }

  function lines(poem) {
    var out = [];
    poem.stanzas.forEach(function (st) {
      st.forEach(function (l) { out.push(l); });
    });
    return out;
  }

  function plainText(poem) {
    return poem.stanzas.map(function (st) { return st.join("\n"); }).join("\n\n");
  }

  function excerpt(poem, max) {
    var all = lines(poem).filter(function (l) { return l.trim(); });
    var text = all.slice(0, 3).join(" / ");
    max = max || 120;
    return text.length > max ? text.slice(0, max).trim() + "…" : text;
  }

  function langName(code) {
    return LANG_NAMES[code] || code;
  }

  function formatDate(iso) {
    if (!iso) return "";
    var d = new Date(iso + (iso.length === 10 ? "T00:00:00" : ""));
    if (isNaN(d)) return iso;
    return d.toLocaleDateString(undefined, { year: "numeric", month: "long" });
  }

  function el(tag, attrs, children) {
    var node = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) {
      if (k === "text") node.textContent = attrs[k];
      else if (k === "html") node.innerHTML = attrs[k];
      else if (attrs[k] !== null && attrs[k] !== undefined && attrs[k] !== false) {
        node.setAttribute(k, attrs[k]);
      }
    });
    (children || []).forEach(function (c) { if (c) node.appendChild(c); });
    return node;
  }

  function poemCard(poem) {
    var card = el("a", { class: "poem-card", href: "poem.html?p=" + encodeURIComponent(poem.slug) });
    card.appendChild(el("h3", { lang: poem.lang, text: poem.title }));
    card.appendChild(el("p", { class: "excerpt", lang: poem.lang, text: excerpt(poem) }));

    var foot = el("div", { class: "card-foot" });
    foot.appendChild(el("span", { class: "lang-chip", "data-lang": poem.lang, text: langName(poem.lang) }));
    foot.appendChild(el("span", { text: poem.tags.length ? poem.tags[0] : formatDate(poem.date) }));
    card.appendChild(foot);
    return card;
  }

  function fail(container, message) {
    container.innerHTML = "";
    container.appendChild(el("p", { class: "notice", text: message }));
  }

  global.Site = {
    load: load,
    lines: lines,
    plainText: plainText,
    excerpt: excerpt,
    langName: langName,
    formatDate: formatDate,
    slugify: slugify,
    el: el,
    poemCard: poemCard,
    fail: fail
  };

})(window);
