/* ============================================================
   translit.js — approximate romanisation for Bangla + Hindi
   ------------------------------------------------------------
   Runs entirely in the browser. No library, no network, no key.

   This is a PRONUNCIATION aid, not a scholarly transliteration.
   It follows how a line is spoken rather than how it is spelled:

     • Bangla's inherent vowel is written "o"   (মন   -> mon)
     • a final inherent vowel is dropped        (ঘর   -> ghor)
     • Bangla ্য (jo-phola) is treated as silent (সন্ধ্যা -> sondha)
     • Hindi drops its medial schwa             (लौटना -> lautna)

   A few words will still come out slightly off. To correct any
   line by hand, add a "translit" array to that poem in
   content/poems.json, shaped exactly like its "stanzas" array.
   ============================================================ */

(function (global) {
  "use strict";

  var BN = {
    virama: "\u09CD",
    inherent: "o",
    deleteMedialSchwa: false,
    silentAfterVirama: "\u09AF\u09AC",   // jo-phola, bo-phola
    cons: {
      "\u0995": "k",  "\u0996": "kh", "\u0997": "g",  "\u0998": "gh", "\u0999": "ng",
      "\u099A": "ch", "\u099B": "chh","\u099C": "j",  "\u099D": "jh", "\u099E": "n",
      "\u099F": "t",  "\u09A0": "th", "\u09A1": "d",  "\u09A2": "dh", "\u09A3": "n",
      "\u09A4": "t",  "\u09A5": "th", "\u09A6": "d",  "\u09A7": "dh", "\u09A8": "n",
      "\u09AA": "p",  "\u09AB": "ph", "\u09AC": "b",  "\u09AD": "bh", "\u09AE": "m",
      "\u09AF": "j",  "\u09B0": "r",  "\u09B2": "l",
      "\u09B6": "sh", "\u09B7": "sh", "\u09B8": "s",  "\u09B9": "h",
      "\u09DC": "r",  "\u09DD": "rh", "\u09DF": "y",  "\u09CE": "t"
    },
    vowels: {
      "\u0985": "o",  "\u0986": "a",  "\u0987": "i",  "\u0988": "i",
      "\u0989": "u",  "\u098A": "u",  "\u098B": "ri",
      "\u098F": "e",  "\u0990": "oi", "\u0993": "o",  "\u0994": "ou"
    },
    matra: {
      "\u09BE": "a",  "\u09BF": "i",  "\u09C0": "i",  "\u09C1": "u",
      "\u09C2": "u",  "\u09C3": "ri", "\u09C7": "e",  "\u09C8": "oi",
      "\u09CB": "o",  "\u09CC": "ou"
    },
    signs: { "\u0982": "ng", "\u0983": "h", "\u0981": "n" }
  };

  var HI = {
    virama: "\u094D",
    inherent: "a",
    deleteMedialSchwa: true,
    silentAfterVirama: "",
    cons: {
      "\u0915": "k",  "\u0916": "kh", "\u0917": "g",  "\u0918": "gh", "\u0919": "ng",
      "\u091A": "ch", "\u091B": "chh","\u091C": "j",  "\u091D": "jh", "\u091E": "n",
      "\u091F": "t",  "\u0920": "th", "\u0921": "d",  "\u0922": "dh", "\u0923": "n",
      "\u0924": "t",  "\u0925": "th", "\u0926": "d",  "\u0927": "dh", "\u0928": "n",
      "\u092A": "p",  "\u092B": "ph", "\u092C": "b",  "\u092D": "bh", "\u092E": "m",
      "\u092F": "y",  "\u0930": "r",  "\u0932": "l",  "\u0933": "l",  "\u0935": "v",
      "\u0936": "sh", "\u0937": "sh", "\u0938": "s",  "\u0939": "h",
      "\u0958": "q",  "\u0959": "kh", "\u095A": "g",  "\u095B": "z",
      "\u095C": "r",  "\u095D": "rh", "\u095E": "f",  "\u095F": "y"
    },
    vowels: {
      "\u0905": "a",  "\u0906": "a",  "\u0907": "i",  "\u0908": "i",
      "\u0909": "u",  "\u090A": "u",  "\u090B": "ri",
      "\u090F": "e",  "\u0910": "ai", "\u0913": "o",  "\u0914": "au"
    },
    matra: {
      "\u093E": "a",  "\u093F": "i",  "\u0940": "i",  "\u0941": "u",
      "\u0942": "u",  "\u0943": "ri", "\u0947": "e",  "\u0948": "ai",
      "\u094B": "o",  "\u094C": "au"
    },
    signs: { "\u0902": "n", "\u0903": "h", "\u0901": "n" }
  };

  var DIGITS = {
    "\u09E6": "0", "\u09E7": "1", "\u09E8": "2", "\u09E9": "3", "\u09EA": "4",
    "\u09EB": "5", "\u09EC": "6", "\u09ED": "7", "\u09EE": "8", "\u09EF": "9",
    "\u0966": "0", "\u0967": "1", "\u0968": "2", "\u0969": "3", "\u096A": "4",
    "\u096B": "5", "\u096C": "6", "\u096D": "7", "\u096E": "8", "\u096F": "9"
  };

  /* Unicode excludes the Bengali and Devanagari nukta letters from
     NFC composition, so য + ় never becomes য় on its own. Compose
     them by hand before parsing, then drop any nukta left over. */
  var NUKTA_PAIRS = [
    ["\u09A1\u09BC", "\u09DC"], ["\u09A2\u09BC", "\u09DD"], ["\u09AF\u09BC", "\u09DF"],
    ["\u0915\u093C", "\u0958"], ["\u0916\u093C", "\u0959"], ["\u0917\u093C", "\u095A"],
    ["\u091C\u093C", "\u095B"], ["\u0921\u093C", "\u095C"], ["\u0922\u093C", "\u095D"],
    ["\u092B\u093C", "\u095E"], ["\u092F\u093C", "\u095F"]
  ];
  var LEFTOVER_NUKTA = /[\u09BC\u093C]/g;

  function composeNukta(s) {
    for (var i = 0; i < NUKTA_PAIRS.length; i++) {
      s = s.split(NUKTA_PAIRS[i][0]).join(NUKTA_PAIRS[i][1]);
    }
    return s;
  }

  function scriptOf(ch) {
    var c = ch.charCodeAt(0);
    if (c >= 0x0980 && c <= 0x09FF) return BN;
    if (c >= 0x0900 && c <= 0x097F) return HI;
    return null;
  }

  function isIndic(ch) { return scriptOf(ch) !== null; }

  /* ------------------------------------------------------------
     Parse one run of Indic letters into syllable units, so schwa
     deletion can inspect neighbours before anything becomes text.
     ------------------------------------------------------------ */
  function parse(src, S) {
    var units = [];
    var i = 0, n = src.length;

    while (i < n) {
      var ch = src[i];

      if (DIGITS[ch]) { units.push({ raw: DIGITS[ch] }); i++; continue; }

      if (S.vowels[ch]) {
        var v = { raw: S.vowels[ch] };
        i++;
        while (i < n && S.signs[src[i]]) { v.raw += S.signs[src[i]]; i++; }
        units.push(v);
        continue;
      }
      if (S.matra[ch]) { units.push({ raw: S.matra[ch] }); i++; continue; }
      if (S.signs[ch]) { units.push({ raw: S.signs[ch] }); i++; continue; }
      if (ch === S.virama) { i++; continue; }

      var base = S.cons[ch];
      if (!base) { i++; continue; }

      var unit = { cons: base, vowel: null, explicit: false, tail: "", initial: units.length === 0 };
      i++;

      var next = i < n ? src[i] : "";

      if (next === S.virama) {
        var after = i + 1 < n ? src[i + 1] : "";
        if (after && S.silentAfterVirama.indexOf(after) >= 0) {
          // Bangla ্য / ্ব: written, but not sounded as its own letter
          i += 2;
          var m = i < n ? src[i] : "";
          if (S.matra[m]) { unit.vowel = S.matra[m]; unit.explicit = true; i++; }
          else if (i < n) { unit.vowel = S.inherent; }
          while (i < n && S.signs[src[i]]) { unit.tail += S.signs[src[i]]; i++; }
        } else {
          i++;                       // true conjunct: no vowel here
        }
        units.push(unit);
        continue;
      }

      if (S.matra[next]) {
        unit.vowel = S.matra[next];
        unit.explicit = true;
        i++;
        while (i < n && S.signs[src[i]]) { unit.tail += S.signs[src[i]]; i++; }
        units.push(unit);
        continue;
      }

      if (S.signs[next]) {
        unit.vowel = S.inherent;
        while (i < n && S.signs[src[i]]) { unit.tail += S.signs[src[i]]; i++; }
        units.push(unit);
        continue;
      }

      // bare consonant: sound the inherent vowel unless this ends the word
      if (i < n) unit.vowel = S.inherent;
      units.push(unit);
    }

    return units;
  }

  /* Hindi loses the inherent vowel of a consonant that is neither
     word-initial nor followed by a consonant carrying its own vowel:
     लौटना -> lautna, अपने -> apne, while नमस्ते stays namaste. */
  function deleteSchwa(units, S) {
    for (var i = 0; i < units.length; i++) {
      var u = units[i];
      if (!u.cons || u.explicit || u.initial || u.vowel !== S.inherent) continue;
      var next = null;
      for (var j = i + 1; j < units.length; j++) {
        if (units[j].cons) { next = units[j]; break; }
      }
      if (next && next.explicit) u.vowel = null;
    }
  }

  function render(units) {
    var out = "";
    units.forEach(function (u) {
      if (u.raw !== undefined) { out += u.raw; return; }
      out += u.cons + (u.vowel || "") + (u.tail || "");
    });
    return out.replace(/([aeiou])\1{2,}/g, "$1$1");
  }

  function word(src, S) {
    var units = parse(src, S);
    if (S.deleteMedialSchwa) deleteSchwa(units, S);
    return render(units);
  }

  /**
   * Romanise a line of Bangla or Hindi. Anything that is not an
   * Indic letter — spaces, punctuation, Latin text, ASCII digits —
   * passes through untouched.
   */
  function line(text) {
    if (!text) return "";
    var src = composeNukta(String(text).normalize("NFC")).replace(LEFTOVER_NUKTA, "");
    var out = "", buf = "", S = null;

    function flush() {
      if (buf) { out += word(buf, S || BN); buf = ""; }
    }

    for (var i = 0; i < src.length; i++) {
      var ch = src[i];
      if (isIndic(ch)) {
        var s = scriptOf(ch);
        if (S && s !== S) flush();
        S = s;
        buf += ch;
      } else {
        flush();
        if (ch === "\u0964" || ch === "\u0965") out += ".";
        else out += ch;
      }
    }
    flush();
    return out.replace(/[ \t]+/g, " ").trim();
  }

  global.Translit = {
    line: line,
    supports: function (lang) { return /^(bn|hi|sa|mr|ne)/.test(String(lang || "")); }
  };

})(window);
