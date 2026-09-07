/* ============================================================
   render-poem.js — the single poem page
   Romanisation, translation, and recitation.
   ============================================================ */

(function () {
  "use strict";

  var el = Site.el;
  var sheet = document.getElementById("poem-sheet");
  var status = document.getElementById("poem-status");
  var current = null;
  var neighbours = { prev: null, next: null };

  function say(msg, tone) {
    status.textContent = msg || "";
    if (tone) status.setAttribute("data-tone", tone);
    else status.removeAttribute("data-tone");
  }

  function slugFromUrl() {
    return new URLSearchParams(location.search).get("p") || "";
  }

  /* ---------------- render ---------------- */

  function render(poem) {
    document.title = poem.title + " · Mousumee Ghosh";
    sheet.innerHTML = "";

    var head = el("div", { class: "poem-header" });
    head.appendChild(el("h1", { class: "poem-title", lang: poem.lang, text: poem.title }));
    if (poem.titleEnglish || poem.titleRoman) {
      head.appendChild(el("p", {
        class: "poem-meta",
        text: [poem.titleRoman, poem.titleEnglish].filter(Boolean).join(" · ")
      }));
    }

    var meta = el("div", { class: "poem-meta" });
    meta.appendChild(el("span", { class: "lang-chip", "data-lang": poem.lang, text: Site.langName(poem.lang) }));
    if (poem.date) meta.appendChild(el("span", { text: Site.formatDate(poem.date) }));
    poem.tags.forEach(function (t) {
      meta.appendChild(el("a", {
        href: "poems.html?tag=" + encodeURIComponent(t),
        lang: poem.lang,
        text: t
      }));
    });
    head.appendChild(meta);
    sheet.appendChild(head);

    if (poem.image) {
      sheet.appendChild(el("img", {
        src: poem.image,
        alt: "",
        loading: "lazy",
        style: "margin-bottom:1.5rem;border:1px solid rgba(42,33,26,.2)"
      }));
    }

    var body = el("div", { class: "poem-body", id: "poem-body" });
    poem.stanzas.forEach(function (stanza, si) {
      var block = el("div", { class: "poem-stanza" });
      stanza.forEach(function (text, li) {
        var p = el("p", { class: "poem-line", "data-s": si, "data-l": li });
        p.appendChild(el("span", { class: "orig", lang: poem.lang, text: text }));
        block.appendChild(p);
      });
      body.appendChild(block);
    });
    sheet.appendChild(body);

    if (poem.note) {
      sheet.appendChild(el("p", {
        class: "poem-meta",
        style: "margin-top:2rem;font-style:italic",
        text: poem.note
      }));
    }

    sheet.appendChild(buildTools(poem));
    sheet.appendChild(status);

    buildNav();
  }

  /* ---------------- tools ---------------- */

  function buildTools(poem) {
    var tools = el("div", { class: "poem-tools" });

    var listen = el("button", { class: "btn btn-primary", type: "button", id: "btn-listen" });
    listen.textContent = "Listen";
    listen.addEventListener("click", function () { toggleListen(poem, listen); });
    tools.appendChild(listen);

    var roman = el("button", { class: "btn", type: "button", "aria-pressed": "false" });
    roman.textContent = "Pronunciation";
    roman.addEventListener("click", function () {
      var on = roman.getAttribute("aria-pressed") === "true";
      roman.setAttribute("aria-pressed", String(!on));
      if (on) removeLayer("translit");
      else showTranslit(poem);
    });
    tools.appendChild(roman);

    var trans = el("button", { class: "btn", type: "button", "aria-pressed": "false" });
    trans.textContent = "English";
    trans.addEventListener("click", function () {
      var on = trans.getAttribute("aria-pressed") === "true";
      if (on) { trans.setAttribute("aria-pressed", "false"); removeLayer("translation"); }
      else { trans.setAttribute("aria-pressed", "true"); showTranslation(poem, trans); }
    });
    tools.appendChild(trans);

    var copy = el("button", { class: "btn", type: "button" });
    copy.textContent = "Copy";
    copy.addEventListener("click", function () {
      var text = poem.title + "\n\n" + Site.plainText(poem) + "\n\n— Mousumee Ghosh";
      navigator.clipboard.writeText(text)
        .then(function () { say("Poem copied to your clipboard."); })
        .catch(function () { say("Copy did not work. Select the text and copy it by hand.", "warn"); });
    });
    tools.appendChild(copy);

    var share = el("button", { class: "btn", type: "button" });
    share.textContent = "Share";
    share.addEventListener("click", function () {
      var payload = { title: poem.title, text: poem.title + " — a poem by Mousumee Ghosh", url: location.href };
      if (navigator.share) {
        navigator.share(payload).catch(function () { /* dismissed */ });
      } else {
        navigator.clipboard.writeText(location.href)
          .then(function () { say("Link copied. Paste it anywhere you like."); })
          .catch(function () { say("Copy the address from your browser bar to share this poem.", "warn"); });
      }
    });
    tools.appendChild(share);

    var print = el("button", { class: "btn", type: "button" });
    print.textContent = "Save as PDF";
    print.addEventListener("click", function () { window.print(); });
    tools.appendChild(print);

    return tools;
  }

  function eachLine(fn) {
    Array.prototype.forEach.call(document.querySelectorAll(".poem-line"), function (p) {
      fn(p, Number(p.dataset.s), Number(p.dataset.l));
    });
  }

  function removeLayer(cls) {
    Array.prototype.forEach.call(document.querySelectorAll("." + cls), function (n) { n.remove(); });
  }

  /* ---------------- romanisation ---------------- */

  function showTranslit(poem) {
    removeLayer("translit");
    if (!Translit.supports(poem.lang)) {
      say("Pronunciation help is available for Bangla and Hindi only.", "warn");
      return;
    }
    eachLine(function (p, s, l) {
      var source = poem.stanzas[s][l];
      if (!source || !source.trim()) return;
      var manual = poem.translit && poem.translit[s] && poem.translit[s][l];
      p.appendChild(el("span", { class: "translit", text: manual || Translit.line(source) }));
    });
    say("Romanised for reading aloud. It follows the sound, not the spelling, so it is close rather than exact.");
  }

  /* ---------------- translation ---------------- */

  function showTranslation(poem, button) {
    removeLayer("translation");

    var stored = poem.translation && poem.translation.en;
    if (stored) {
      eachLine(function (p, s, l) {
        var text = stored[s] && stored[s][l];
        if (text) p.appendChild(el("span", { class: "translation", lang: "en", text: text }));
      });
      say("Translation by the poet's family.");
      return;
    }

    button.disabled = true;
    say("Translating…");

    machineTranslate(poem)
      .then(function (map) {
        eachLine(function (p, s, l) {
          var text = map[s + ":" + l];
          if (text) p.appendChild(el("span", { class: "translation", lang: "en", text: text }));
        });
        say("Machine translation — rough by nature, since poetry resists it. Treat it as a doorway, not the poem.");
      })
      .catch(function (err) {
        button.setAttribute("aria-pressed", "false");
        say("Translation is unavailable right now. The free service limits how much it will translate in a day. " +
            (err && err.message ? "(" + err.message + ")" : ""), "warn");
      })
      .then(function () { button.disabled = false; });
  }

  /* MyMemory: free, no API key, roughly 5,000 words a day per address.
     Requests are capped at 500 characters, so lines are batched. */
  function machineTranslate(poem) {
    var jobs = [];
    poem.stanzas.forEach(function (st, s) {
      st.forEach(function (text, l) {
        if (text && text.trim()) jobs.push({ key: s + ":" + l, text: text.trim() });
      });
    });

    var out = {};
    var pair = poem.lang + "|en";

    function step(i) {
      if (i >= jobs.length) return Promise.resolve(out);
      var job = jobs[i];
      var url = "https://api.mymemory.translated.net/get?q=" +
                encodeURIComponent(job.text.slice(0, 480)) + "&langpair=" + pair;
      return fetch(url)
        .then(function (r) { return r.json(); })
        .then(function (data) {
          if (data && data.responseData && data.responseData.translatedText) {
            var t = data.responseData.translatedText;
            if (!/MYMEMORY WARNING|QUERY LENGTH LIMIT/i.test(t)) out[job.key] = t;
            else throw new Error("daily limit reached");
          }
          return step(i + 1);
        });
    }

    return step(0);
  }

  /* ---------------- recitation ---------------- */

  var speaking = false;
  var keepAlive = null;
  var audioEl = null;

  function toggleListen(poem, button) {
    if (speaking) { stopListening(button); return; }

    if (poem.audio) {
      audioEl = new Audio(poem.audio);
      audioEl.addEventListener("ended", function () { stopListening(button); });
      audioEl.addEventListener("error", function () {
        say("That recording would not play. Falling back to the built-in voice.", "warn");
        speakWithBrowser(poem, button);
      });
      audioEl.play().then(function () {
        speaking = true;
        button.textContent = "Stop";
        say("Recited by the poet.");
      }).catch(function () {
        speakWithBrowser(poem, button);
      });
      return;
    }

    speakWithBrowser(poem, button);
  }

  function stopListening(button) {
    speaking = false;
    button.textContent = "Listen";
    if (audioEl) { audioEl.pause(); audioEl = null; }
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    if (keepAlive) { clearInterval(keepAlive); keepAlive = null; }
  }

  /* Voices load asynchronously in every browser, and are empty on the
     first call in Chrome and Safari. Wait for them properly. */
  function getVoices() {
    return new Promise(function (resolve) {
      if (!window.speechSynthesis) return resolve([]);
      var voices = speechSynthesis.getVoices();
      if (voices.length) return resolve(voices);

      var settled = false;
      function done() {
        if (settled) return;
        settled = true;
        clearInterval(poll);
        speechSynthesis.removeEventListener("voiceschanged", done);
        resolve(speechSynthesis.getVoices());
      }
      speechSynthesis.addEventListener("voiceschanged", done);
      var poll = setInterval(function () {
        if (speechSynthesis.getVoices().length) done();
      }, 120);
      setTimeout(done, 2500);
    });
  }

  function pickVoice(voices, lang) {
    var want = lang.toLowerCase();
    var exact = voices.filter(function (v) { return v.lang.toLowerCase().replace("_", "-").indexOf(want) === 0; });
    if (exact.length) {
      // prefer a local voice; it will not cut out on a slow connection
      var local = exact.filter(function (v) { return v.localService; });
      return (local[0] || exact[0]);
    }
    return null;
  }

  function speakWithBrowser(poem, button) {
    if (!window.speechSynthesis) {
      say("This browser cannot read text aloud. Chrome on Android or Edge on Windows both can.", "warn");
      return;
    }

    say("Finding a voice…");

    getVoices().then(function (voices) {
      var voice = pickVoice(voices, poem.lang);

      if (!voice) {
        say(missingVoiceHelp(poem.lang), "warn");
        return;
      }

      var chunks = Site.lines(poem).filter(function (l) { return l && l.trim(); });
      speechSynthesis.cancel();
      speaking = true;
      button.textContent = "Stop";
      say("Reading aloud with the " + voice.name + " voice on your device.");

      chunks.forEach(function (text, i) {
        var u = new SpeechSynthesisUtterance(text);
        u.voice = voice;
        u.lang = voice.lang;
        u.rate = 0.86;      // poetry wants a slower pace than prose
        u.pitch = 1;
        if (i === chunks.length - 1) {
          u.onend = function () { stopListening(button); };
        }
        u.onerror = function () { stopListening(button); };
        speechSynthesis.speak(u);
      });

      // Chrome stops speaking after roughly fifteen seconds unless it is
      // nudged. Pausing and resuming on a timer keeps the queue alive.
      if (keepAlive) clearInterval(keepAlive);
      keepAlive = setInterval(function () {
        if (!speaking) { clearInterval(keepAlive); keepAlive = null; return; }
        if (speechSynthesis.speaking && !speechSynthesis.paused) {
          speechSynthesis.pause();
          speechSynthesis.resume();
        }
      }, 9000);
    });
  }

  function missingVoiceHelp(lang) {
    var name = Site.langName(lang);
    if (lang === "bn") {
      return "No " + name + " voice is installed on this device. Chrome on Android usually has one. " +
             "On Windows, add Bengali under Settings › Time & language › Language. " +
             "iPhone and iPad do not offer a Bangla voice yet.";
    }
    return "No " + name + " voice is installed on this device. Adding the language in your system settings will add its voice too.";
  }

  /* ---------------- previous / next ---------------- */

  function buildNav() {
    var nav = document.getElementById("poem-nav");
    nav.innerHTML = "";
    if (neighbours.prev) {
      nav.appendChild(el("a", {
        href: "poem.html?p=" + encodeURIComponent(neighbours.prev.slug),
        lang: neighbours.prev.lang,
        text: "← " + neighbours.prev.title
      }));
    } else { nav.appendChild(el("span", {})); }
    if (neighbours.next) {
      nav.appendChild(el("a", {
        href: "poem.html?p=" + encodeURIComponent(neighbours.next.slug),
        lang: neighbours.next.lang,
        text: neighbours.next.title + " →"
      }));
    }
  }

  /* ---------------- boot ---------------- */

  Site.load().then(function (data) {
    var slug = slugFromUrl();
    var idx = data.poems.findIndex(function (p) { return p.slug === slug; });

    if (idx < 0) {
      Site.fail(sheet, slug
        ? "There is no poem at this address. Try the archive."
        : "Choose a poem from the archive to read it here.");
      return;
    }

    current = data.poems[idx];
    neighbours.prev = data.poems[idx - 1] || null;
    neighbours.next = data.poems[idx + 1] || null;
    render(current);
  }).catch(function (err) {
    Site.fail(sheet, "The poems could not be loaded. " + err.message);
  });

  window.addEventListener("beforeunload", function () {
    if (window.speechSynthesis) speechSynthesis.cancel();
  });

})();
