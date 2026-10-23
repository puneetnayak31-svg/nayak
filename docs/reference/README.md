# Reference: the owner's source documents

These are the documents the site was built from. The `.docx` and `.zip` files in `originals/` are the owner's originals. The `.md` files are faithful text conversions so that people and AI agents can read and search them.

| Document | What it defines | Read as |
|---|---|---|
| [what-were-building.md](what-were-building.md) (original: `originals/HIPL - What We're Building (Simple Plan).docx`) | The six things HIPL does (Dialogues, Interviews, 100 Questions, Explorations, Reading Circle, Dispatch): formats, rhythm, what people do, how they connect | The product plan |
| [explorations-and-write-spec.md](explorations-and-write-spec.md) (original: `originals/HIPL Explorations - Knowledge Library & Write for HIPL (Website Spec).docx`) | Explorations (3 series, 36 entries, templates, components, sample entries, sources, claim labels, editorial and review rules), Write for HIPL / Voices, website, CMS, accessibility and analytics requirements | The detailed website spec |
| [brand-guidelines.md](brand-guidelines.md) (original: `originals/A - Sabha - Brand Guidelines (html).zip`, open `Sabha.dc.html` with `python3 -m http.server`) | Sabha identity: idea, logo system, construction, clear space, colour, typography, examples, don'ts, voice | The brand rules |

**Precedence:** the owner's later decisions in [`../BRIEF.md`](../BRIEF.md) override these documents where they differ. For example, 100 Questions was simplified at the owner's request, and the CMS is built in rather than Payload. The implementation of the brand is [`../DESIGN-SYSTEM.md`](../DESIGN-SYSTEM.md).

Not included: the co-founder's two essays (PDFs), *Hindi, Hindu, Hindustan* and *The Hinduism We Deserve*. How they were used, and what was deliberately left out, is recorded in BRIEF.md (decision D3). Ask the owner for them if needed.

The owner also shared two screenshots during the build: the six In Person formats and the launch-evening poster. Their content is transcribed in BRIEF.md (Request 4) and lives in `hipl-website/src/data/programmes.json` and `events.json`.
