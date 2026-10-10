# HIPL website

The website for HIPL — Hinduism in Public Life, on the Sabha identity (Direction A). Static and mobile-first; 28 pages generated from `src/` by `build.py` (Python standard library only).

```bash
python3 build.py                  # build into dist/
python3 -m http.server -d dist    # preview at http://localhost:8000
```

## What's here

| Path | What it is |
|---|---|
| `src/pages/` | One HTML fragment per page; folders mirror the URLs |
| `src/data/explorations.json` | The 3 series, 36 planned entries and the concept glossary |
| `assets/css/site.css` | Design tokens and every component |
| `assets/js/site.js` | Interactives, filters, forms, generative cover art, analytics hooks |
| `assets/brand/` | Logo family, outlined from the master artwork (`tools/make_logos.py`) |
| `build.py` | Layout, header and footer, card rendering, series pages, sitemap |
| `vercel.json` | Clean URLs and headers for Vercel |
| `EDITOR-GUIDE.md` | How to update content |

## Pages

Home · Dialogues + Dialogue 01 event page · Interviews + sample episode · The First 100 Questions · Explorations hub, 3 series pages, 5 sample entries (Dharma, Six Schools, Nachiketa, Arjuna's Dilemma, Many Ramayanas) and a concept page · Reading Circle + reading guide · Dispatch + sample issue · About · Write for HIPL · Voices + sample article + contributor page · Privacy · Corrections · Component library.

## Content rules

Sample content is labelled "Sample". People, dates and venues that aren't confirmed are `[PLACEHOLDERS]`. Quotations and verse numbers that need checking carry a `VERIFY` marker. Nothing is invented. See `../hipl-launch-kit/LAUNCH-CHECKLIST.md` before going live and `../hipl-launch-kit/DEPLOY.md` for hosting and forms.
