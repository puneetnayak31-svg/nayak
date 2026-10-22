"""One definition of every Explorations block, shared by three consumers:

* sitekit.blocks renders each block into the interactive page,
* the CMS block editor builds its forms from FIELDS,
* the AI composer turns BLOCKS into a JSON schema for structured output.

Field kinds: text, md (markdown), select, claim, number, bool, image, list.
"""

CLAIMS = ["", "text", "tradition", "historians", "debate", "asks"]
CLAIM_LABELS = {
    "": "No label",
    "text": "The text says",
    "tradition": "Tradition holds",
    "historians": "Historians find",
    "debate": "Scholars debate",
    "asks": "HIPL asks",
}


def f(name, kind="text", label=None, **extra):
    d = {"name": name, "kind": kind, "label": label or name.replace("_", " ").capitalize()}
    d.update(extra)
    return d


BLOCKS = {
    "hook": {"label": "Hook", "help": "A surprising fact, question or dilemma that pulls the reader in (40–80 words).",
             "fields": [f("text", "md", "Hook")]},
    "context": {"label": "Context", "help": "The story, idea or historical background (150–300 words).",
                "fields": [f("body", "md", "Text")]},
    "chapter": {"label": "Chapter", "help": "One idea per chapter, 80–200 words. Numbered automatically.",
                "fields": [f("title"), f("claim", "claim", "Claim label"), f("body", "md", "Text")]},
    "pull_quote": {"label": "Pull quote", "help": "Won't publish without a named source and translator.",
                   "fields": [f("text", "md", "Quotation"), f("source", label="Source (text, chapter.verse, edition)"), f("translator"), f("verify", "bool", "Still needs checking")]},
    "knowledge_cards": {"label": "Knowledge cards", "help": "4–10 swipeable cards, one idea each (40–60 words). Readers can save each as an Instagram image.",
                        "fields": [f("title", label="Heading above the cards"),
                                   f("cards", "list", "Cards", fields=[f("kicker", label="Small label"), f("title"), f("deva", label="Devanagari (optional)"), f("text", "md", "Text"), f("source")])]},
    "meaning_layers": {"label": "Meaning layers", "help": "Tap through the layers of a word's meaning: literal → ethical → cosmic.",
                       "fields": [f("term", label="Term"),
                                  f("layers", "list", "Layers", fields=[f("label", label="Tab label"), f("eyebrow", label="Layer name"), f("title"), f("text", "md", "Text")])]},
    "scenarios": {"label": "Everyday scenarios", "help": "Several situations, several perspectives on each. No correct answer.",
                  "fields": [f("title"),
                             f("items", "list", "Scenarios", fields=[f("tab", label="Tab label"), f("scenario", "md", "The situation"),
                                                                     f("perspectives", "list", "Perspectives", fields=[f("title"), f("text", "md", "Text"), f("claim", "claim", "Claim label")])])]},
    "dilemma": {"label": "What would you do?", "help": "Reader picks an option, then sees a perspective on every option and the share of readers who chose each. No score.",
                "fields": [f("title", label="Heading"), f("scenario", "md", "The dilemma"),
                           f("options", "list", "Options", fields=[f("label", label="Option"), f("perspective_title", label="Perspective heading"), f("perspective", "md", "Perspective"), f("claim", "claim", "Claim label")])]},
    "compare": {"label": "Compare cards", "help": "Compare 2–6 items on the same questions. Table on desktop, swipe cards on mobile.",
                "fields": [f("title"), f("columns", "list", "Items being compared", fields=[f("name"), f("deva", label="Devanagari (optional)")]),
                           f("rows", "list", "Rows", fields=[f("label", label="Question"), f("cells", label="Answers, separated by |")])]},
    "characters": {"label": "Character cards", "help": "Tap a character to open their card.",
                   "fields": [f("title"), f("characters", "list", "Characters", fields=[f("name"), f("deva", label="Devanagari name"), f("role"), f("text", "md", "2–3 lines")])]},
    "scene": {"label": "Illustrated scene", "help": "For Illustrated Stories: a scene image with short text beside it.",
              "fields": [f("title"), f("text", "md", "Text"), f("image", "image", "Illustration (optional)"), f("alt", label="Image description"),
                         f("art", "select", "Placeholder art if no image", options=["1", "2", "3", "4", "5", "6"]), f("pause", label="Pause and think question (optional)")]},
    "map": {"label": "Explore the map", "help": "Points on a map of South and Southeast Asia. Keyboard-navigable, with a text version.",
            "fields": [f("title"), f("intro", "md", "Intro"),
                       f("points", "list", "Points", fields=[f("label", label="Map label"), f("title"), f("region", label="Language / region"), f("lat", "number", "Latitude"), f("lon", "number", "Longitude"),
                                                             f("on_map", "bool", "Show on map (off = list under the map)"), f("author"), f("period", label="Approximate period"), f("differs", "md", "How it differs"), f("claim", "claim", "Claim label")])]},
    "timeline": {"label": "Timeline", "help": "Date ranges with a confidence label. No false precision.",
                 "fields": [f("title"), f("events", "list", "Events", fields=[f("when", label="Date or range"), f("confidence", "select", options=["approximate", "debated", "firm"]), f("label", label="Event"), f("text", "md", "Text"), f("claim", "claim", "Claim label")])]},
    "poll": {"label": "Poll / reflection", "help": "Anonymous; results appear after voting.",
             "fields": [f("question"), f("options", "list", "Options", fields=[f("label", label="Option")])]},
    "interpretations": {"label": "Interpretations", "help": "How different traditions or readers see it.",
                        "fields": [f("title"), f("items", "list", "Readings", fields=[f("title"), f("text", "md", "Text"), f("claim", "claim", "Claim label")])]},
    "why": {"label": "Why it matters today", "help": "The bridge to modern life, framed as a question (100–200 words).",
            "fields": [f("title"), f("text", "md", "Text")]},
    "image": {"label": "Image", "help": "Illustration, photo or diagram. Alt text required.",
              "fields": [f("src", "image", "Image"), f("alt", label="Image description (alt text)"), f("caption"), f("credit", label="Credit / licence")]},
    "video": {"label": "Video", "help": "A YouTube video that loads only when clicked.",
              "fields": [f("youtube", label="YouTube video ID or link"), f("caption")]},
    "callout": {"label": "Callout", "help": "A highlighted note.",
                "fields": [f("title"), f("text", "md", "Text")]},
    "text": {"label": "Text section", "help": "A plain section with an optional heading.",
             "fields": [f("title"), f("body", "md", "Text")]},
}


def _field_schema(fd):
    k = fd["kind"]
    if k == "number":
        return {"type": "number"}
    if k == "bool":
        return {"type": "boolean"}
    if k == "claim":
        return {"type": "string", "enum": CLAIMS}
    if k == "select":
        return {"type": "string", "enum": fd["options"]}
    if k == "list":
        return {"type": "array", "items": _object(fd["fields"])}
    return {"type": "string"}


def _object(fields, extra=None):
    props = {fd["name"]: _field_schema(fd) for fd in fields}
    props.update(extra or {})
    return {"type": "object", "properties": props, "required": list(props), "additionalProperties": False}


def block_json_schema(types=None):
    """anyOf over every block type, each tagged with a const `type`."""
    types = types or list(BLOCKS)
    return {"anyOf": [_object(BLOCKS[t]["fields"], {"type": {"type": "string", "const": t}}) for t in types]}


ENTRY_FIELDS = [
    f("title"), f("slug", label="Web address (slug)"), f("hook", "md", "Hook (one line for cards)"),
    f("level", "select", options=["Beginner", "Deeper"]), f("read", "number", "Read time (minutes)"),
    f("element", label="Interactive element (one line)"),
]


def entry_json_schema():
    """The shape the AI composer must return."""
    props = {
        "title": {"type": "string"},
        "slug": {"type": "string"},
        "hook": {"type": "string"},
        "level": {"type": "string", "enum": ["Beginner", "Deeper"]},
        "read": {"type": "integer"},
        "topics": {"type": "array", "items": {"type": "string"}},
        "element": {"type": "string"},
        "blocks": {"type": "array", "items": block_json_schema()},
        "sources": {"type": "array", "items": _object([f("text"), f("url"), f("verify", "bool")])},
        "editor_notes": {"type": "string"},
    }
    return {"type": "object", "properties": props, "required": list(props), "additionalProperties": False}
