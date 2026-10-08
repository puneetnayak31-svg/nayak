# Statics: posts, carousels, stories, banners and print

Each piece is `src/pieces/<piece>.html`: a plain JS body that builds one or more `.frame` elements with the
helpers in `src/statics.js` (frame, txt, box, dotField, wordmarkAt, footer, exTag, swipeHint, endSpark) and
`src/deck.js` (the example-brand deck and `tradingCard`). The brand code (fonts, wordmark, sparks, example
logos and looks) comes from `../video/src`, so the statics match the videos.

    python3 build.py              # build and render every piece to ../output/statics/<piece>/
    python3 build.py cards        # just one piece

`render.js` screenshots each frame at its exact size in Chromium (`data-scale` sets the pixel density);
frames with `data-pdf` are also printed as vector PDFs. `{{QR_SVG}}` in a piece is replaced with a QR code
to https://gobrandtoday.com (needs `segno`).

Pieces: cards, one-sentence (+ A3 poster), grid-mural, graveyard, checklist, stories, banners, three-am.
