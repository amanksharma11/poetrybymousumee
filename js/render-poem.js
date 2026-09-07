/* ============================================================
   render-poem.js — one poem, with its reading aids
   ============================================================ */

(function () {
  "use strict";

  var el = Site.el, icon = Site.icon;
  var sheet = document.getElementById("sheet");
  var statusEl = document.getElementById("status");
  var pager = document.getElementById("pager");
  var neighbours = { prev: null, next: null };

  function say(msg, tone) {
    statusEl.textContent = msg || "";
    if (tone) statusEl.setAttribute("data-tone", tone); else statusEl.removeAttribute("data-tone");
  }

  function button(label, iconName, onClick, toggle) {
    var b = el("button", { class: "btn", type: "button" });
    if (toggle) {
      b.setAttribute("aria-pressed", "false");
      b.innerHTML = '<span class="dot"></span>' + icon(iconName) + "<span>" + label + "</span>";
    } else {
      b.innerHTML = icon(iconName) + "<span>" + label + "</span>";
    }
    b.addEventListener("click", function () { onClick(b); });
    return b;
  }

  function setPressed(b, on) {
    b.setAttribute("aria-pressed", String(on));
    b.classList.toggle("is-on", on);
  }

  /* ---------------- render ---------------- */

  function render(poem) {
    document.title = Site.fullTitle(poem) + " · Mousumee Ghosh";
    sheet.innerHTML = "";

    var head = el("div", { class: "poem-head" });
    var h1 = el("h1", { class: "display", lang: poem.lang, text: poem.title });
    var roman = Site.romanTitle(poem);
    if (roman) {
      h1.appendChild(el("span", {
        class: "roman", lang: "en",
        text: poem.titleEnglish ? roman + " · " + poem.titleEnglish : roman
      }));
    }
    head.appendChild(h1);

    var meta = el("div", { class: "poem-meta" });
    meta.appendChild(el("span", { class: "stamp", "data-lang": poem.lang, text: Site.langName(poem.lang) }));
    if (poem.date) meta.appendChild(el("span", { text: Site.formatDate(poem.date) }));
    poem.tags.forEach(function (t) {
      meta.appendChild(el("a", { href: "poems.html?tag=" + encodeURIComponent(t), lang: poem.lang, text: t }));
    });
    head.appendChild(meta);
    sheet.appendChild(head);

    if (poem.image) {
      sheet.appendChild(el("img", { src: poem.image, alt: "", loading: "lazy",
        style: "border:2px solid var(--ink);margin-bottom:1.75rem" }));
    }

    var body = el("div", { class: "poem-body", id: "body" });
    poem.stanzas.forEach(function (stanza, si) {
      var block = el("div", { class: "stanza" });
      stanza.forEach(function (text, li) {
        var p = el("p", { class: "line", "data-s": si, "data-l": li });
        p.appendChild(el("span", { lang: poem.lang, text: text }));
        block.appendChild(p);
      });
      body.appendChild(block);
    });
    sheet.appendChild(body);

    if (poem.note) {
      sheet.appendChild(el("p", { style: "margin-top:2rem;font-style:italic;color:var(--ink-2)", text: poem.note }));
    }

    sheet.appendChild(toolbar(poem));
    sheet.appendChild(statusEl);
    buildPager();
  }

  /* ---------------- toolbar ---------------- */

  function toolbar(poem) {
    var bar = el("div", { class: "toolbar" });

    /* group one: the three things that help you read the poem */
    var aids = el("div", { class: "tool-group" });
    aids.appendChild(el("p", { class: "tool-label", text: "Help me read this" }));

    var listenBtn = button("Listen", "listen", function (b) { toggleListen(poem, b); }, true);
    aids.appendChild(listenBtn);

    aids.appendChild(button("Pronunciation", "speak", function (b) {
      var on = b.getAttribute("aria-pressed") === "true";
      setPressed(b, !on);
      if (on) strip("aid-say"); else showSay(poem);
    }, true));

    aids.appendChild(button("English meaning", "meaning", function (b) {
      var on = b.getAttribute("aria-pressed") === "true";
      if (on) { setPressed(b, false); strip("aid-mean"); }
      else { setPressed(b, true); showMeaning(poem, b); }
    }, true));

    bar.appendChild(aids);

    /* group two: things you do with the poem afterwards */
    var acts = el("div", { class: "tool-group" });
    acts.appendChild(el("p", { class: "tool-label", text: "Take it with you" }));

    acts.appendChild(button("Copy", "copy", function () {
      var text = Site.fullTitle(poem) + "\n\n" + Site.plainText(poem) + "\n\n— Mousumee Ghosh";
      navigator.clipboard.writeText(text)
        .then(function () { say("Copied. Paste it wherever you like."); })
        .catch(function () { say("Copy did not work here. Select the poem and copy it by hand.", "warn"); });
    }));

    acts.appendChild(button("Share", "share", function () {
      var payload = { title: poem.title, text: Site.fullTitle(poem) + " — a poem by Mousumee Ghosh", url: location.href };
      if (navigator.share) navigator.share(payload).catch(function () {});
      else navigator.clipboard.writeText(location.href)
        .then(function () { say("Link copied."); })
        .catch(function () { say("Copy the address from your browser bar to share this.", "warn"); });
    }));

    acts.appendChild(button("Save as PDF", "print", function () { window.print(); }));

    bar.appendChild(acts);
    return bar;
  }

  function eachLine(fn) {
    Array.prototype.forEach.call(document.querySelectorAll(".line"), function (p) {
      fn(p, Number(p.dataset.s), Number(p.dataset.l));
    });
  }

  function strip(cls) {
    Array.prototype.forEach.call(document.querySelectorAll("." + cls), function (n) { n.remove(); });
  }

  /* ---------------- pronunciation ---------------- */

  function showSay(poem) {
    strip("aid-say");
    if (!Translit.supports(poem.lang)) {
      say("Pronunciation help covers Bangla and Hindi.", "warn");
      return;
    }
    eachLine(function (p, s, l) {
      var src = poem.stanzas[s][l];
      if (!src || !src.trim()) return;
      var manual = poem.translit && poem.translit[s] && poem.translit[s][l];
      p.appendChild(el("span", { class: "aid-say", lang: "en", text: manual || Translit.line(src) }));
    });
    say("Each line written out in English letters, following the sound rather than the spelling.");
  }

  /* ---------------- English meaning ---------------- */

  function showMeaning(poem, button) {
    strip("aid-mean");
    var stored = poem.translation && poem.translation.en;

    if (stored) {
      eachLine(function (p, s, l) {
        var t = stored[s] && stored[s][l];
        if (t) p.appendChild(el("span", { class: "aid-mean", lang: "en", text: t }));
      });
      say("Translated within the family, aiming at the sense rather than the music.");
      return;
    }

    button.disabled = true;
    say("Translating…");
    machineTranslate(poem)
      .then(function (map) {
        eachLine(function (p, s, l) {
          var t = map[s + ":" + l];
          if (t) p.appendChild(el("span", { class: "aid-mean", lang: "en", text: t }));
        });
        say("Machine translation. Poetry resists it, so read this as a doorway rather than the poem.");
      })
      .catch(function (err) {
        setPressed(button, false);
        say("Translation is unavailable just now — the free service caps how much it will do in a day. " +
            (err && err.message ? "(" + err.message + ")" : ""), "warn");
      })
      .then(function () { button.disabled = false; });
  }

  /* MyMemory: free, no key, about 5,000 words a day, 500 characters a call. */
  function machineTranslate(poem) {
    var jobs = [];
    poem.stanzas.forEach(function (st, s) {
      st.forEach(function (t, l) { if (t && t.trim()) jobs.push({ key: s + ":" + l, text: t.trim() }); });
    });
    var out = {}, pair = poem.lang + "|en";

    function step(i) {
      if (i >= jobs.length) return Promise.resolve(out);
      var job = jobs[i];
      return fetch("https://api.mymemory.translated.net/get?q=" +
                   encodeURIComponent(job.text.slice(0, 480)) + "&langpair=" + pair)
        .then(function (r) { return r.json(); })
        .then(function (d) {
          var t = d && d.responseData && d.responseData.translatedText;
          if (t) {
            if (/MYMEMORY WARNING|QUERY LENGTH LIMIT/i.test(t)) throw new Error("daily limit reached");
            out[job.key] = t;
          }
          return step(i + 1);
        });
    }
    return step(0);
  }

  /* ---------------- listening ---------------- */

  var speaking = false, keepAlive = null, audioEl = null;

  function setListenLabel(b, on) {
    b.innerHTML = '<span class="dot"></span>' + icon(on ? "stop" : "listen") +
                  "<span>" + (on ? "Stop" : "Listen") + "</span>";
    setPressed(b, on);
  }

  function toggleListen(poem, b) {
    if (speaking) { stopListening(b); return; }

    if (poem.audio) {
      audioEl = new Audio(poem.audio);
      audioEl.addEventListener("ended", function () { stopListening(b); });
      audioEl.addEventListener("error", function () {
        say("That recording would not play, so here is the device voice instead.", "warn");
        speakWithBrowser(poem, b);
      });
      audioEl.play().then(function () {
        speaking = true; setListenLabel(b, true);
        say("In her own voice.");
      }).catch(function () { speakWithBrowser(poem, b); });
      return;
    }
    speakWithBrowser(poem, b);
  }

  function stopListening(b) {
    speaking = false;
    setListenLabel(b, false);
    if (audioEl) { audioEl.pause(); audioEl = null; }
    if (window.speechSynthesis) speechSynthesis.cancel();
    if (keepAlive) { clearInterval(keepAlive); keepAlive = null; }
  }

  /* Voices arrive asynchronously and the first call returns nothing
     in Chrome and Safari, so wait for them properly. */
  function getVoices() {
    return new Promise(function (resolve) {
      if (!window.speechSynthesis) return resolve([]);
      var v = speechSynthesis.getVoices();
      if (v.length) return resolve(v);
      var settled = false;
      function done() {
        if (settled) return;
        settled = true;
        clearInterval(poll);
        speechSynthesis.removeEventListener("voiceschanged", done);
        resolve(speechSynthesis.getVoices());
      }
      speechSynthesis.addEventListener("voiceschanged", done);
      var poll = setInterval(function () { if (speechSynthesis.getVoices().length) done(); }, 120);
      setTimeout(done, 2500);
    });
  }

  function pickVoice(voices, lang) {
    var want = lang.toLowerCase();
    var hits = voices.filter(function (v) { return v.lang.toLowerCase().replace("_", "-").indexOf(want) === 0; });
    if (!hits.length) return null;
    var local = hits.filter(function (v) { return v.localService; });
    return local[0] || hits[0];
  }

  function speakWithBrowser(poem, b) {
    if (!window.speechSynthesis) {
      say("This browser cannot read text aloud. Chrome on Android or Edge on Windows can.", "warn");
      return;
    }
    say("Finding a voice…");

    getVoices().then(function (voices) {
      var voice = pickVoice(voices, poem.lang);
      if (!voice) { say(noVoiceHelp(poem.lang), "warn"); return; }

      var chunks = Site.lines(poem).filter(function (l) { return l && l.trim(); });
      speechSynthesis.cancel();
      speaking = true;
      setListenLabel(b, true);
      say("Read by the " + voice.name + " voice on this device.");

      chunks.forEach(function (text, i) {
        var u = new SpeechSynthesisUtterance(text);
        u.voice = voice; u.lang = voice.lang;
        u.rate = 0.86;                       // poetry wants a slower pace than prose
        if (i === chunks.length - 1) u.onend = function () { stopListening(b); };
        u.onerror = function () { stopListening(b); };
        speechSynthesis.speak(u);
      });

      // Chrome falls silent after about fifteen seconds unless nudged.
      if (keepAlive) clearInterval(keepAlive);
      keepAlive = setInterval(function () {
        if (!speaking) { clearInterval(keepAlive); keepAlive = null; return; }
        if (speechSynthesis.speaking && !speechSynthesis.paused) {
          speechSynthesis.pause(); speechSynthesis.resume();
        }
      }, 9000);
    });
  }

  function noVoiceHelp(lang) {
    if (lang === "bn") {
      return "No Bangla voice is installed here. Chrome on Android usually has one; on Windows add " +
             "Bengali under Settings › Time & language › Language. Apple devices have no Bangla voice yet.";
    }
    return "No " + Site.langName(lang) + " voice is installed here. Adding the language in your system " +
           "settings usually adds its voice too.";
  }

  /* ---------------- previous / next ---------------- */

  function buildPager() {
    pager.innerHTML = "";
    if (neighbours.prev) {
      var a = el("a", { href: "poem.html?p=" + encodeURIComponent(neighbours.prev.slug) });
      a.appendChild(el("span", { text: "Newer" }));
      a.appendChild(el("b", { lang: neighbours.prev.lang, text: neighbours.prev.title }));
      pager.appendChild(a);
    } else pager.appendChild(el("span"));

    if (neighbours.next) {
      var c = el("a", { href: "poem.html?p=" + encodeURIComponent(neighbours.next.slug), style: "text-align:right" });
      c.appendChild(el("span", { text: "Older" }));
      c.appendChild(el("b", { lang: neighbours.next.lang, text: neighbours.next.title }));
      pager.appendChild(c);
    }
  }

  /* ---------------- boot ---------------- */

  Site.load().then(function (data) {
    var slug = new URLSearchParams(location.search).get("p") || "";
    var i = data.poems.findIndex(function (p) { return p.slug === slug; });
    if (i < 0) {
      Site.fail(sheet, slug ? "There is no poem at this address. Try the collection."
                            : "Pick a poem from the collection to read it here.");
      return;
    }
    neighbours.prev = data.poems[i - 1] || null;
    neighbours.next = data.poems[i + 1] || null;
    render(data.poems[i]);
  }).catch(function (err) {
    Site.fail(sheet, "The poems could not be loaded. " + err.message);
  });

  window.addEventListener("beforeunload", function () {
    if (window.speechSynthesis) speechSynthesis.cancel();
  });

})();
