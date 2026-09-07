/* ============================================================
   site.js — shared helpers, icons, and card building
   ============================================================ */

(function (global) {
  "use strict";

  var LANG_NAMES = { bn: "Bangla", hi: "Hindi", en: "English" };
  var cache = null;

  /* ---------- icons (24px grid, stroked, inherit colour) ---------- */
  var ICONS = {
    listen:  '<path d="M11 5 6 9H3v6h3l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M18.5 5.5a9 9 0 0 1 0 13"/>',
    stop:    '<rect x="6" y="6" width="12" height="12" rx="1.5"/>',
    speak:   '<path d="M4 15V9h3l1-3 2 6 2-9 2 12 2-6h4"/>',
    meaning: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3a15 15 0 0 1 0 18a15 15 0 0 1 0-18z"/>',
    copy:    '<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V6a2 2 0 0 1 2-2h9"/>',
    share:   '<path d="M12 4v11"/><path d="m8 8 4-4 4 4"/><path d="M5 14v4a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-4"/>',
    print:   '<path d="M7 9V4h10v5"/><rect x="4" y="9" width="16" height="7" rx="2"/><path d="M7 14h10v6H7z"/>',
    search:  '<circle cx="11" cy="11" r="7"/><path d="m20 20-4.5-4.5"/>',
    back:    '<path d="M15 19 8 12l7-7"/>',
    mail:    '<rect x="2.5" y="4.5" width="19" height="15" rx="2"/><path d="m3 6 9 6 9-6"/>',
    insta:   '<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.4" cy="6.6" r="1"/>'
  };

  function icon(name) {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" ' +
           'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (ICONS[name] || "") + "</svg>";
  }

  /* ---------- loading ---------- */

  function load() {
    if (cache) return cache;
    cache = Source.fetchPoems().then(function (data) {
      var poems = (data.poems || []).map(normalise).filter(Boolean);
      poems.sort(function (a, b) {
        if (!a.date && !b.date) return 0;
        if (!a.date) return 1;
        if (!b.date) return -1;
        return b.date.localeCompare(a.date);
      });
      return { poems: poems, poet: data.poet || {}, origin: data.origin };
    });
    return cache;
  }

  function normalise(p) {
    if (!p || !p.title) return null;
    var stanzas = p.stanzas || [];
    if (typeof stanzas === "string") stanzas = Source.toStanzas(stanzas);
    var lang = p.lang || "bn";
    /* A row typed into the sheet may have no slug. Build one from the
       romanisation so the address reads nodir-kachhe rather than a
       run of percent-encoded Bengali. */
    var basis = p.titleRoman ||
      (global.Translit && Translit.supports(lang) ? Translit.line(p.title) : p.title);
    return {
      slug: p.slug || slugify(basis),
      title: p.title,
      titleRoman: p.titleRoman || "",
      titleEnglish: p.titleEnglish || "",
      lang: lang,
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
    var out = String(s).trim().toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-+|-+$/g, "");
    return out || "poem";
  }

  /* ---------- titles ---------- */

  /* Bangla and Hindi titles carry their romanisation in brackets, so a
     reader who cannot read the script still has something to say aloud. */
  function romanTitle(poem) {
    if (poem.lang === "en") return "";
    if (poem.titleRoman) return poem.titleRoman;
    if (global.Translit && Translit.supports(poem.lang)) {
      var r = Translit.line(poem.title);
      // Title Case reads better than a run of lowercase in a bracket
      return r.replace(/\b[a-z]/g, function (c) { return c.toUpperCase(); });
    }
    return "";
  }

  function fullTitle(poem) {
    var r = romanTitle(poem);
    return r ? poem.title + " (" + r + ")" : poem.title;
  }

  /* Tag chips get the same treatment: প্রকৃতি (Prokriti) */
  function romanTag(tag) {
    if (!global.Translit) return "";
    var r = Translit.line(tag);
    if (!r || r === tag) return "";
    return r.replace(/\b[a-z]/g, function (c) { return c.toUpperCase(); });
  }

  /* ---------- text helpers ---------- */

  function lines(poem) {
    var out = [];
    poem.stanzas.forEach(function (st) { st.forEach(function (l) { out.push(l); }); });
    return out;
  }

  function plainText(poem) {
    return poem.stanzas.map(function (st) { return st.join("\n"); }).join("\n\n");
  }

  function excerpt(poem, max) {
    var text = lines(poem).filter(function (l) { return l.trim(); }).slice(0, 3).join(" · ");
    max = max || 110;
    return text.length > max ? text.slice(0, max).trim() + "…" : text;
  }

  function langName(c) { return LANG_NAMES[c] || c; }

  function formatDate(iso) {
    if (!iso) return "";
    var d = new Date(iso.length === 10 ? iso + "T00:00:00" : iso);
    if (isNaN(d)) return iso;
    return d.toLocaleDateString(undefined, { year: "numeric", month: "long" });
  }

  function el(tag, attrs, kids) {
    var n = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) {
      if (k === "text") n.textContent = attrs[k];
      else if (k === "html") n.innerHTML = attrs[k];
      else if (attrs[k] !== null && attrs[k] !== undefined && attrs[k] !== false) n.setAttribute(k, attrs[k]);
    });
    (kids || []).forEach(function (c) { if (c) n.appendChild(c); });
    return n;
  }

  function poemCard(poem) {
    var card = el("a", { class: "poem-card", href: "poem.html?p=" + encodeURIComponent(poem.slug) });

    var h = el("h3", { lang: poem.lang, text: poem.title });
    var r = romanTitle(poem);
    if (r) h.appendChild(el("span", { class: "roman", lang: "en", text: r }));
    card.appendChild(h);

    card.appendChild(el("p", { class: "excerpt", lang: poem.lang, text: excerpt(poem) }));

    var foot = el("div", { class: "card-foot" });
    foot.appendChild(el("span", { class: "stamp", "data-lang": poem.lang, text: langName(poem.lang) }));
    foot.appendChild(el("span", { text: poem.tags.length ? poem.tags[0] : formatDate(poem.date) }));
    card.appendChild(foot);
    return card;
  }

  function fail(container, message) {
    container.innerHTML = "";
    container.appendChild(el("p", { class: "notice", text: message }));
  }

  global.Site = {
    load: load, icon: icon, el: el, fail: fail, poemCard: poemCard,
    lines: lines, plainText: plainText, excerpt: excerpt,
    langName: langName, formatDate: formatDate, slugify: slugify,
    romanTitle: romanTitle, fullTitle: fullTitle, romanTag: romanTag
  };

})(window);
