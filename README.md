# মৌসুমী ঘোষ — poems

A static site. No server, no build step, no paid services. GitHub Pages hosts it free and it
will keep working untouched for years.

Design era: 1970s Bengali little-magazine offset printing — ink layers that miss registration
by a hair, halftone dots, newsprint, poster lettering.

---

## 1. Put it online

1. Make a GitHub repository, e.g. `mousumee-poems`.
2. Upload everything here, keeping the folders as they are.
3. **Settings → Pages** → Source: *Deploy from a branch*, branch `main`, folder `/ (root)`.
4. A minute later it is live at `https://<username>.github.io/mousumee-poems/`.

If `.nojekyll` did not upload (GitHub's web uploader skips dotfiles), create it there with
**Add file → Create new file**, name it `.nojekyll`, leave it empty, commit.

---

## 2. Adding poems from a Google Sheet

This is the way to do it. She adds a row, the site shows the poem. Nobody touches code.

**Set the sheet up once**

1. Go to [sheets.new](https://sheets.new).
2. **File → Import → Upload**, choose `content/sheet-template.csv` from this folder,
   and pick *Replace spreadsheet*. That gives you the right columns and two example rows.
3. **File → Share → Publish to web.** Pick the sheet, format **Comma-separated values (.csv)**,
   press Publish, copy the URL. It looks like
   `https://docs.google.com/spreadsheets/d/e/2PACX-.../pub?gid=0&single=true&output=csv`
4. Open `js/source.js` and paste it into the first line:
   ```js
   var SHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-.../pub?output=csv";
   ```
   That is the one and only code edit, ever.

**After that**, adding a poem is: open the sheet, type a row, done. Google republishes within
a few minutes; a hard refresh shows it sooner.

### The columns

Only `title` and `poem` are required. Leave the rest blank and the site copes.

| Column | What to put |
|---|---|
| `slug` | Web address of the poem. Leave blank and one is made from the title. Once shared, don't change it. |
| `title` | Title in Bangla or Hindi. |
| `title_roman` | Title in English letters. Blank means the site works it out. |
| `title_english` | What the title means. |
| `lang` | `bn` or `hi`. Sets the font, the voice, and the language filter. |
| `date` | `YYYY-MM-DD`. Sorts the collection, newest first. |
| `tags` | Themes separated by commas. These become the filter buttons by themselves. |
| `audio` | `audio/nodir-kache.mp3` if there is a recording. |
| `image` | `images/nodir-kache.jpg` if there is a picture. |
| `note` | One line of context under the poem. |
| `poem` | The poem. **Alt+Enter** (Ctrl+Enter on Mac) for a new line, blank line between stanzas. |
| `translation_en` | Your own English version. Same line and stanza layout as the poem. |
| `translit` | Only if the automatic pronunciation gets a line wrong. Same layout again. |

### Safety net

`content/poems.json` holds a copy of the poems and is used automatically whenever the sheet
is unreachable or not yet configured. A bad afternoon at Google never takes the site down.
Keep it roughly in sync, or leave it as a small permanent sample — either is fine.

---

## 3. Recordings

The best thing you can add costs nothing: record her reading her own work. Any phone, saved as
MP3, dropped into `audio/`, then put the filename in the `audio` column. **Listen** plays the
recording instead of the synthetic voice, and it sidesteps the fact that Apple devices still
have no Bangla voice.

---

## What the site does

- Poems in Bangla and Hindi, in Tiro Bangla and Tiro Devanagari Hindi, with Baloo for display.
- Titles carry their romanisation in brackets everywhere — নদীর কাছে (Nodir Kache) — so a
  reader who cannot read the script still has something to say aloud. Theme filters too.
- **Help me read this**: Listen, Pronunciation, English meaning. All three look identical
  until pressed, then they fill with blue ink so you can see what is on.
- **Take it with you**: Copy, Share, Save as PDF.
- Search across script, romanisation and English; theme filters; a poem of the day shown in
  full on the home page; dark mode; keyboard navigation; and layouts that hold from a narrow
  phone to a wide desktop, on any operating system.

## Left out on purpose

- **AI image generation** — every dependable service wants an API key and a card. Make images
  once with any tool, drop them in `images/`, and use the `image` column. Free to serve.
- **Neural voice recitation** — also paid. The device voice stands in; a real recording beats
  both.
- **A comment form** — you asked to drop it, and it was the weakest option anyway. Contact is
  now two large plates, email and Instagram, with the space given over to what to write about.

## Before sharing the link

- `contact.html` — the email address and Instagram link.
- `about.html` — her biography, and a photograph in place of the drawn frame.
- `content/poems.json` — replace the samples, or point `SHEET_CSV_URL` at the real sheet.

## Previewing locally

Double-clicking `index.html` shows a blank page: browsers block one local file from reading
another, so the poems never load. Run a server instead —

```
cd poetry-v2
python3 -m http.server 8000
```

— and open `http://localhost:8000`. This does not happen on GitHub Pages.

## Files

```
index.html      home: poster hero, today's poem in full, recent work
poems.html      the collection, search and theme filters
poem.html       one poem; reads ?p=slug
about.html      biography
contact.html    email and Instagram
404.html        wrong address
content/        poems.json (fallback) and sheet-template.csv (import into Sheets)
css/style.css   one stylesheet
js/source.js    the sheet URL lives here — the only line you ever edit
js/translit.js  Bangla and Hindi romanisation, written from scratch
js/site.js      shared helpers, icons, cards
js/render-*.js  one per page
assets/ audio/ images/
```
