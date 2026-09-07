# Mousumee Ghosh — poetry site

A static site. No server, no database, no build step, no paid services. Everything runs in
the visitor's browser, so GitHub Pages hosts it for free and it will keep working untouched
for years.

---

## Putting it online (about ten minutes, once)

1. Create a repository on GitHub named `mousumee-poems` (any name works).
2. Upload every file and folder from this directory into it, keeping the structure intact.
3. In the repository, go to **Settings → Pages**.
4. Under *Build and deployment*, set **Source** to `Deploy from a branch`, branch `main`,
   folder `/ (root)`. Save.
5. Wait a minute or two. The site appears at
   `https://<your-username>.github.io/mousumee-poems/`.

Nothing else needs configuring. To use a custom domain later, add it under the same Settings
→ Pages screen and point the domain's DNS at GitHub — still free.

---

### Previewing on your own machine first

Double-clicking `index.html` will show an empty page. Browsers block a local file from
reading another local file, so `poems.json` never loads. Run a small server instead:

```
cd mousumee-site
python3 -m http.server 8000
```

Then open `http://localhost:8000`. On GitHub Pages this does not arise.

---

## Adding a poem (no code)

Every poem lives in **`content/poems.json`**. That is the only file you touch.

On GitHub: open `content/poems.json` → click the pencil icon → add a block → **Commit
changes**. The site updates within a minute. This works from a phone.

Copy this block and change the parts in it:

```json
{
  "slug": "notun-kobita",
  "title": "নতুন কবিতা",
  "titleRoman": "Notun Kobita",
  "titleEnglish": "A New Poem",
  "lang": "bn",
  "date": "2026-09-07",
  "tags": ["প্রকৃতি", "স্মৃতি"],
  "audio": "",
  "image": "",
  "note": "",
  "stanzas": [
    ["first line", "second line"],
    ["a line in the next stanza"]
  ]
}
```

Put it inside the `"poems": [ ... ]` list, separated from its neighbours by a comma.

| Field | What it does |
|---|---|
| `slug` | The web address of the poem. Lowercase, no spaces. Never change it once shared. |
| `title` | The title in Bangla or Hindi. Required. |
| `titleRoman` | The title written in English letters. Optional. |
| `titleEnglish` | The meaning of the title. Optional. |
| `lang` | `bn` for Bangla, `hi` for Hindi. Controls the font, the voice, and the language filter. |
| `date` | `YYYY-MM-DD`. Sorts the archive, newest first. |
| `tags` | Themes. These become the filter buttons on the Poems page automatically. |
| `audio` | A recording, e.g. `audio/notun-kobita.mp3`. Leave `""` to use the device voice. |
| `image` | A picture, e.g. `images/notun-kobita.jpg`. Leave `""` for none. |
| `note` | A line of context shown under the poem. Optional. |
| `stanzas` | A list of stanzas. Each stanza is a list of lines. |

### Two optional extras

**Your own English translation** — far better than the machine one, and it replaces it:

```json
"translation": {
  "en": [
    ["first line in English", "second line in English"],
    ["the next stanza in English"]
  ]
}
```

**Correcting the pronunciation line** for a word the romaniser gets wrong:

```json
"translit": [
  ["notun kobita ...", "..."],
  ["..."]
]
```

Both mirror the shape of `stanzas` exactly — same number of stanzas, same number of lines.

### If the site goes blank after an edit

The file is JSON, so one missing comma or quote breaks it. Paste the file into
[jsonlint.com](https://jsonlint.com) and it will point at the line. The previous version is
always recoverable from the repository's History tab.

---

## Recordings

The best feature here costs nothing: record her reading her own poems.

Record on any phone, save as MP3, upload into the `audio/` folder, then set
`"audio": "audio/the-slug.mp3"` on that poem. The Listen button plays the recording instead
of the synthetic voice. Keep files under about 5 MB.

---

## What the site does

- **Poems** in Bangla and Hindi, set in Tiro Bangla and Tiro Devanagari Hindi.
- **Pronunciation** — each line romanised in the browser so a non-reader can say it aloud.
  It follows sound rather than spelling, so it is close rather than exact.
- **English** — your own translation where you have written one, otherwise a machine
  translation fetched on demand.
- **Listen** — a recording if one exists, otherwise the device's own voice.
- **Search and themes**, **poem of the day**, **save as PDF**, **share**, **copy**.
- **Dark mode**, keyboard navigation, and layouts that hold from a small phone up to a
  desktop. Nothing depends on a particular browser or operating system.

## What was left out, and why

- **AI image generation.** Every dependable service needs an API key and a card on file.
  Generate images once with whatever tool you like and drop them into `images/` instead —
  the `image` field will show them, and it costs nothing to serve.
- **Neural voice recitation.** Also paid. The device voice stands in, and a real recording
  beats both.
- **Threaded public comments.** The free options (Giscus, Utterances) store comments in
  GitHub, so every commenter needs a GitHub account. Her readers will not have one. The
  Contact page instead has a slot for a Google Form, which is free and unlimited and emails
  her each note — see the commented block in `contact.html`.

## Things to change before sharing the link

- `content/poems.json` → replace the four sample poems and set the real email and Instagram.
- `contact.html` → the email address and Instagram link appear here too.
- `about.html` → her biography, and a photograph in place of the drawn frame.

## Files

```
index.html      home: poem of the day, recent poems
poems.html      the archive, with search and theme filters
poem.html       one poem; reads ?p=slug from the address
about.html      biography
contact.html    email, Instagram, optional note form
404.html        shown for a wrong address
content/        poems.json — the only file you edit
css/            one stylesheet
js/             translit.js, site.js, and one script per page
assets/         logo and favicon
audio/          recordings
images/         photographs and artwork
.nojekyll       tells GitHub Pages to serve the files as they are
```
