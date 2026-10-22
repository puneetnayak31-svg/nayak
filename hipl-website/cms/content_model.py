"""What the CMS can edit. Each collection points at a JSON file in src/data and
describes its fields; the admin UI builds forms from these definitions, so adding
a field here is enough to make it editable.

Field kinds: text, md, select, claim, number, bool, image, date, time, strings
(a list of short texts), paragraphs (list of paragraphs edited as one text),
numbers (list of entry numbers), group (nested object), list (repeating
objects), blocks (Explorations blocks, see sitekit.schema).
"""

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from sitekit.schema import BLOCKS, CLAIM_LABELS, f  # noqa: E402


def grp(name, label, fields):
    return {"name": name, "kind": "group", "label": label, "fields": fields}


def lst(name, label, fields, help=""):
    return {"name": name, "kind": "list", "label": label, "fields": fields, "help": help}


EVENT_KINDS = ["launch", "dialogue", "salon", "heritage-walk", "seva", "culture-night", "campus", "reading-circle"]

COLLECTIONS = [
    {
        "id": "settings", "label": "Site settings & homepage", "group": "Site", "file": "site.json", "single": True,
        "help": "Homepage headline, announcement bar, ticker, partners, social links and contact details.",
        "fields": [
            grp("announcement", "Announcement bar (top of every page)", [f("active", "bool", "Show the bar"), f("text"), f("link_label", label="Link label"), f("link", label="Link (e.g. events/launch-2026.html)")]),
            grp("hero", "Homepage headline", [
                f("verse", label="Sanskrit line (Devanagari)"), f("verse_translation", label="Translation"), f("verse_ref", label="Reference"),
                f("line1", label="Headline line 1"), f("line2", label="Headline line 2"), f("line3", label="Headline line 3 (saffron)"),
                f("lede", "md", "Intro paragraph"), f("cta_primary_label", label="Main button"), f("cta_primary_link", label="Main button link"),
                f("cta_secondary_label", label="Second button"), f("cta_secondary_link", label="Second button link"),
                f("floating_questions", "strings", "Questions floating round the sun (3)")]),
            f("ticker", "strings", "Ticker questions"),
            f("tagline"), f("working_test", label="Working test (shown on Home and About)"),
            f("description", "md", "Site description (search engines)"),
            f("site_url", label="Website address (https://…)"), f("contact_email", label="Contact email"),
            grp("social", "Social links", [f("instagram"), f("x", label="X"), f("youtube", label="YouTube"), f("linkedin", label="LinkedIn"), f("whatsapp_channel", label="WhatsApp channel")]),
            lst("partners", "Partners", [f("name"), f("role"), f("url", label="Website"), f("logo", "image")]),
            f("forms_endpoint", label="Forms endpoint (leave as /api/forms/ when hosted with this CMS)"),
        ],
    },
    {
        "id": "events", "label": "Events & Dialogues", "group": "Take part", "file": "events.json", "path": "events", "key": "slug", "title": "title",
        "summary": ["kind", "date", "status"], "statuses": ["upcoming", "planned", "past", "draft", "cancelled"],
        "help": "Every event: the launch, Dialogues, Salons, Heritage Walks, Seva Saturdays, Campus Circles. Give an event a Dialogue number to list it under Dialogues.",
        "fields": [
            f("title"), f("slug", label="Web address (slug)"), f("status", "select", options=["upcoming", "planned", "past", "draft", "cancelled"]),
            f("featured", "bool", "Feature on the homepage"), f("kind", "select", options=EVENT_KINDS), f("dialogue_number", "number", "Dialogue number (blank if not a Dialogue)"),
            f("kicker", label="Small line above the title"), f("date", "date"), f("start", "time", "Start time"), f("time_label", label="Time as shown (e.g. 5 PM onwards)"),
            f("date_label", label="If no date yet: what to show"), f("venue"), f("address"), f("city"),
            f("company", "strings", "In the company of"),
            lst("programme", "The evening (programme)", [f("label"), f("detail")]),
            f("motion", label="Debate motion"), f("hosted_by", label="Debate hosted by (partner name)"),
            f("description", "md"), f("brief", "md", "Background brief"),
            lst("speakers", "Speakers", [f("name"), f("role"), f("side", "select", options=["proposition", "opposition", "panel"]), f("photo", "image")]),
            f("moderator"), f("rsvp", "bool", "Take RSVPs"), f("image", "image", "Share image (optional)"),
            f("video_id", label="YouTube video (after the event)"),
            lst("key_moments", "Key moments", [f("time"), f("label"), f("text")]),
            grp("vote_before", "Vote before", [f("for", "number"), f("against", "number"), f("undecided", "number")]),
            grp("vote_after", "Vote after", [f("for", "number"), f("against", "number"), f("undecided", "number")]),
            f("summary", "md", "Summary (after the event)"), f("transcript", "md"),
        ],
    },
    {
        "id": "programmes", "label": "In Person programmes", "group": "Take part", "file": "programmes.json", "path": "programmes", "key": "slug", "title": "name",
        "summary": ["group", "status"],
        "help": "The formats on the In Person page: Salons, Heritage Walks, Culture Nights, Seva Saturdays, Campus Circles, Voices.",
        "fields": [
            f("name"), f("slug"), f("group", "select", "Section", options=["live", "seva"]), f("line", label="One line"),
            f("status", "select", options=["starting", "active", "coming", "paused"]), f("cadence"), f("event_kind", "select", "Events of this kind", options=[""] + EVENT_KINDS),
            f("description", "md"), f("how", "strings", "How it works"), f("cta", label="Button label"), f("link", label="Button link (blank = interest form)"),
        ],
    },
    {
        "id": "inperson_intro", "label": "In Person page intro", "group": "Take part", "file": "programmes.json", "single": True,
        "fields": [f("intro", "md", "Intro paragraph")],
    },
    {
        "id": "questions", "label": "100 Questions", "group": "Take part", "file": "questions.json", "path": "questions", "key": "n", "title": "q",
        "summary": ["status", "theme"], "statuses": ["received", "answering", "answered", "hidden"],
        "help": "Approve new questions from the Inbox; they arrive here. Add who is answering, then the answer.",
        "fields": [
            f("n", "number", "Number"), f("q", label="Question"), f("asked_by", label="Asked by"),
            f("theme", "select", options=["Belief and self", "Texts and stories", "Society and caste", "Gender", "Ritual", "Science", "Public life"]),
            f("status", "select", options=["received", "answering", "answered", "hidden"]),
            grp("answerer", "Answered by", [f("name"), f("title", label="Title, institution"), f("bio", "md"), f("photo", "image")]),
            f("video", "bool", "Has a video answer"), f("video_id", label="YouTube video"), f("answered_on", label="Answered on"),
            f("answer", "paragraphs", "Answer (blank line between paragraphs)"),
            lst("comments", "Approved comments", [f("name"), f("place"), f("text", "md")]),
        ],
    },
    {
        "id": "explorations", "label": "Explorations", "group": "Library", "file": "explorations.json", "path": "entries", "key": "n", "title": "title",
        "summary": ["series", "type", "status"], "studio": True, "statuses": ["planned", "draft", "fact-check", "expert-review", "ready", "published", "sample"],
        "help": "The 36-entry library. Open an entry in the Studio to build it from blocks, or let the AI Composer draft it.",
        "fields": [
            f("n", "number", "Number"), f("title"), f("slug", label="Web address (slug)"),
            f("series", "select", options=["hindu-universe", "stories-that-stay", "ancient-ideas-modern-life"]),
            f("type", "select", "Page type", options=["explainer", "story", "interactive"]),
            f("status", "select", options=["planned", "draft", "fact-check", "expert-review", "ready", "published", "sample"]),
            f("priority", "select", options=["start", "later"]), f("level", "select", options=["Beginner", "Deeper"]), f("read", "number", "Read time (minutes)"),
            f("topics", "strings"), f("hook", "md"), f("element", label="Interactive element (one line)"),
            f("featured", "bool", "Feature on Home"), f("sensitive", "bool", "Sensitive: needs an outside expert reader"),
            f("expert_reviewer", label="Expert reviewer"), f("review_due", "date", "Re-check due"), f("cover_image", "image", "Cover illustration (optional)"),
            {"name": "blocks", "kind": "blocks", "label": "Page blocks"},
            lst("sources", "Sources", [f("text"), f("url", label="Link"), f("verify", "bool", "Still needs checking")]),
            f("related", "numbers", "Related entries (numbers)"),
        ],
    },
    {
        "id": "concepts", "label": "Concept glossary", "group": "Library", "file": "explorations.json", "path": "concepts", "key": "term", "title": "iast",
        "fields": [f("term", label="Key (lowercase, no accents)"), f("iast", label="Transliteration"), f("deva", label="Devanagari"), f("short", "md", "Short definition (about 40 words)"), f("page", "bool", "Has a full concept page")],
    },
    {
        "id": "interviews", "label": "Interviews", "group": "Watch & read", "file": "interviews.json", "path": "episodes", "key": "slug", "title": "title",
        "summary": ["theme", "status"], "statuses": ["planned", "draft", "published", "sample"],
        "fields": [
            f("title"), f("slug"), f("status", "select", options=["planned", "draft", "published", "sample"]), f("series"),
            f("theme", "select", options=["texts", "arts", "practice", "generations", "work"]),
            lst("guests", "Guests", [f("name"), f("bio", "md"), f("tag", label="Avatar label (e.g. 72)")]),
            f("host"), f("runtime"), f("video_id", label="YouTube video"), f("summary", "md"),
            lst("key_moments", "Key moments", [f("time"), f("label"), f("text")]), f("transcript", "md"), f("related", "numbers", "Related Explorations"),
            f("color", "select", "Card colour", options=["marigold", "saffron", "lotus", "midnight", "midnight-2", "chalk"]),
        ],
    },
    {
        "id": "voices", "label": "Voices articles", "group": "Watch & read", "file": "voices.json", "path": "articles", "key": "slug", "title": "title",
        "summary": ["format", "status"], "statuses": ["planned", "draft", "in-edit", "writer-approval", "published", "sample"],
        "fields": [
            f("title"), f("slug"), f("status", "select", options=["planned", "draft", "in-edit", "writer-approval", "published", "sample"]),
            f("featured", "bool"), f("dek", "md", "Standfirst"), f("format", "select", options=["essay", "my-hinduism", "response", "review", "local"]),
            f("topics", "strings"), grp("writer", "Writer", [f("name"), f("slug", label="Contributor page slug"), f("city"), f("bio", "md"), f("photo", "image")]),
            f("date"), f("read", "number", "Read time"), f("body", "md", "Article"), f("sources", "strings"), f("related", "numbers", "Related Explorations"),
        ],
    },
    {
        "id": "dispatch", "label": "Weekly Dispatch", "group": "Watch & read", "file": "dispatch.json", "path": "issues", "key": "number", "title": "subject",
        "summary": ["date", "status"], "statuses": ["draft", "published", "sample"],
        "fields": [
            f("number", "number"), f("status", "select", options=["draft", "published", "sample"]), f("date"), f("subject"),
            f("idea_title", label="01 · Idea title"), f("idea", "md", "01 · One idea worth thinking about"), f("this_week", "md", "02 · This week"),
            f("positive_story", "md", "03 · One positive story"), f("from_hipl", "md", "04 · From HIPL"), f("three_things", "md", "05 · Three things"),
            f("question", label="06 · One question for you"),
        ],
    },
    {
        "id": "circle", "label": "Reading Circle", "group": "Take part", "file": "reading_circle.json", "path": "months", "key": "slug", "title": "text",
        "summary": ["month", "status"], "statuses": ["current", "past", "planned"],
        "fields": [
            f("text", label="Text"), f("slug"), f("status", "select", options=["current", "past", "planned"]), f("month"), f("question", label="Guiding question"),
            f("why", "md", "Why this text"), f("translation"), lst("sessions", "Sessions", [f("type"), f("when"), f("where")]), f("facilitator"),
            lst("guide", "Reading guide sections", [f("title"), f("text", "md")]), f("related_entry", "number", "Related Exploration"), f("summary", "md", "Summary afterwards"),
        ],
    },
    {
        "id": "team", "label": "Team", "group": "Site", "file": "team.json", "path": "team", "key": "name", "title": "name", "summary": ["role"],
        "fields": [f("name"), f("role"), f("founder", "bool", "Founder"), f("bio", "md"), f("photo", "image"), lst("links", "Links", [f("label"), f("url")])],
    },
]

BY_ID = {c["id"]: c for c in COLLECTIONS}

FORM_KINDS = {
    "dispatch": "Dispatch sign-ups", "question": "Questions", "comment": "Comments", "rsvp": "RSVPs", "dialogue-question": "Questions for speakers",
    "circle": "Reading Circle sign-ups", "pitch": "Voices pitches", "guest": "Guest suggestions", "correction": "Corrections", "interest": "In Person interest",
}


def public_schema():
    return {
        "collections": COLLECTIONS,
        "blocks": BLOCKS,
        "claims": CLAIM_LABELS,
        "forms": FORM_KINDS,
    }
