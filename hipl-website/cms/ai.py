"""The HIPL AI Composer: turns a topic plus whatever the editor has (notes, an
article, links, images, PDFs) into a draft Explorations entry built from the
site's interactive blocks. Optionally researches the web first.

Uses the official Anthropic Python SDK (pip install anthropic). The draft is
always saved with status "draft": a writer, a fact-checker and an editor must
still sign it off, and every quotation stays marked VERIFY until checked.
"""

import base64
import json
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from sitekit.schema import BLOCKS, block_json_schema, entry_json_schema  # noqa: E402

DEFAULT_MODEL = "claude-opus-5-5"
FALLBACK_BETA = "server-side-fallback-2026-07-01"

EDITORIAL_RULES = """You write for HIPL (Hinduism in Public Life), a modern ideas platform that makes Hindu thought interesting and credible for young people and serious readers. It is not a religious portal and not a political campaign. Voice: curious, confident, warm, evidence-led, open to disagreement; never preachy, defensive, outraged, jargon-heavy or holier-than-thou.

Editorial rules, which are not negotiable:
1. Separate the layers: original text, later retellings, regional traditions, historical evidence and modern interpretation are never mixed together.
2. Never invent anything: no made-up quotations, verses, verse numbers, dialogue, dates, people or "scholars agree" claims. If you are not certain of an exact verse number, translation or date, write it with a [VERIFY ...] marker, for example "Gita 2.47 [VERIFY]". Pull quotes must name a source and a translator, and have verify=true unless the exact wording came from a source you were given.
3. Name the version: say which text, edition, translation, tradition or region is meant ("Tulsidas's Ramcharitmanas", not "the Ramayana").
4. Many traditions: show more than one interpretation where they exist; no single reading speaks for all Hindus.
5. Explore, don't prescribe: modern connections are framed as questions; never claim ancient texts "proved" modern science.
6. Respect people: handle caste, gender and other hard topics honestly and without demeaning any community.
7. Put a claim label on key passages: text (directly from a named text and edition), tradition (belief or practice of a named tradition), historians (evidence-based historical scholarship), debate (a live disagreement among experts, both sides shown), asks (HIPL's own question to the reader).
8. Sources, in this order of preference: original texts and critical editions (BORI Mahabharata, Gita Supersite, GRETIL); named university-press translations; scholarly reference (Internet Encyclopedia of Philosophy, Brill's Encyclopedia of Hinduism, peer-reviewed books); lived tradition, labelled as one community's view. Never cite blogs, social media, WhatsApp forwards, quote sites or AI text; Wikipedia is never the citation. Dates are ranges with a confidence label, never false precision.

Writing: short pieces. Hook 40-80 words, context 150-300 words, 3-6 chapters of 80-200 words each, why-it-matters 100-200 words framed as a question. Plain words; explain each Sanskrit term the first time. Use [[term]] for glossary terms (e.g. [[dharma]], [[karma]], [[moksha]], [[atman]], [[bhakti]], [[seva]], [[svadharma]], [[ahimsa]], [[brahman]]), [^n] to cite source n, **bold** sparingly. No emoji."""


def block_catalogue():
    lines = []
    for k, b in BLOCKS.items():
        fields = ", ".join(fd["name"] for fd in b["fields"])
        lines.append(f"- {k}: {b['label']}. {b['help']} Fields: {fields}.")
    return "\n".join(lines)


SHAPES = {
    "explainer": "Explainer: hook -> context -> 3-6 chapters (each with a claim label) with a pull_quote and knowledge_cards along the way, optionally meaning_layers or compare or scenarios -> why -> poll.",
    "story": "Illustrated Story: hook -> characters -> 4-7 scene blocks (each scene's 'pause' can hold a 'Pause and think' question) with a dilemma or poll at the turning point -> interpretations (how different traditions read the story) -> why -> poll.",
    "interactive": "Interactive: short hook and context -> ONE strong interactive centrepiece (dilemma, map, timeline, scenarios or compare) -> a chapter or two of explanation -> interpretations -> why -> poll.",
}


class AIError(Exception):
    pass


def make_client(api_key=None):
    try:
        import anthropic
    except ImportError as e:
        raise AIError("The AI features need the Anthropic Python SDK. Install it with:  pip install anthropic") from e
    return anthropic.Anthropic(api_key=api_key) if api_key else anthropic.Anthropic()


def _call(client, log, **kw):
    """One streamed request with server-side refusal fallback; returns the final message."""
    import anthropic

    kw.setdefault("max_tokens", 64000)
    try:
        with client.beta.messages.stream(betas=[FALLBACK_BETA], fallbacks="default", **kw) as stream:
            return stream.get_final_message()
    except anthropic.AuthenticationError as e:
        raise AIError("The Anthropic API key was rejected. Check it under Settings.") from e
    except anthropic.PermissionDeniedError as e:
        raise AIError("This API key isn't allowed to use that model or feature.") from e
    except anthropic.RateLimitError as e:
        raise AIError("Rate limit reached. Wait a minute and try again.") from e
    except anthropic.BadRequestError as e:
        raise AIError(f"The request was rejected: {e.message}") from e
    except anthropic.APIStatusError as e:
        raise AIError(f"Claude API error ({e.status_code}). Try again shortly.") from e
    except anthropic.APIConnectionError as e:
        raise AIError("Couldn't reach the Claude API. Check the internet connection.") from e


def _text(msg):
    return "\n".join(b.text for b in msg.content if getattr(b, "type", "") == "text")


def _check(msg):
    if msg.stop_reason == "refusal":
        cat = getattr(getattr(msg, "stop_details", None), "category", None)
        raise AIError(f"Claude declined this request{f' ({cat})' if cat else ''}. Try rephrasing the brief.")
    if msg.stop_reason == "max_tokens":
        raise AIError("The draft was too long and got cut off. Try a narrower topic.")


def attachments_to_content(attachments):
    """Uploaded files become content blocks Claude can read."""
    content = []
    for a in attachments or []:
        mt, data, name = a.get("type", ""), a.get("data", ""), a.get("name", "file")
        if mt.startswith("image/") and mt in ("image/png", "image/jpeg", "image/gif", "image/webp"):
            content.append({"type": "image", "source": {"type": "base64", "media_type": mt, "data": data}})
            if a.get("url"):
                content.append({"type": "text", "text": f"(The image above is {name}, available on the site at {a['url']}. You may place it in an image or scene block with a precise description as alt text.)"})
        elif mt == "application/pdf":
            content.append({"type": "document", "source": {"type": "base64", "media_type": "application/pdf", "data": data}, "title": name})
        else:
            try:
                txt = base64.b64decode(data).decode("utf-8", "replace")
            except Exception:
                continue
            content.append({"type": "text", "text": f"<attached_file name=\"{name}\">\n{txt}\n</attached_file>"})
    return content


def research(client, brief, model, log):
    """Web research pass. Returns notes (with source URLs) for the composer."""
    log("Researching the topic on the web…")
    tools = [
        {"type": "web_search_20260209", "name": "web_search", "max_uses": 12},
        {"type": "web_fetch_20260209", "name": "web_fetch", "max_uses": 8},
    ]
    prompt = f"""Research this topic for a HIPL Explorations entry, then write research notes for the writer.

Topic: {brief['topic']}
Page type: {brief.get('type')}
Editor's notes: {brief.get('notes') or '(none)'}
Links the editor suggested: {brief.get('links') or '(none)'}

Prefer the source tiers in your instructions. For each key point give: the claim, what kind of claim it is (text / tradition / historians / debate), and the exact source (title, edition or translator, and URL). Record competing interpretations. Give dates as ranges with a confidence level. Quote a text only if you read its exact wording in a source you fetched, and give the location. Note anything that is contested or that you could not confirm. Finish with a numbered list of the best sources with URLs."""
    messages = [{"role": "user", "content": prompt}]
    for _ in range(6):
        msg = _call(client, log, model=model, system=EDITORIAL_RULES, messages=messages, tools=tools,
                    output_config={"effort": "high"})
        _check(msg)
        if msg.stop_reason == "pause_turn":
            log("Still researching…")
            messages = [{"role": "user", "content": prompt}, {"role": "assistant", "content": msg.content}]
            continue
        notes = _text(msg)
        n = sum(1 for b in msg.content if getattr(b, "type", "") == "web_search_tool_result")
        log(f"Research done ({n} searches).")
        return notes
    raise AIError("Research took too long. Try again, or turn off deep research.")


def compose(brief, api_key=None, model=None, log=print):
    """Return a draft entry dict: title, slug, hook, blocks, sources, editor_notes…"""
    model = model or DEFAULT_MODEL
    client = make_client(api_key)
    notes = research(client, brief, model, log) if brief.get("deep_research") else ""
    log("Composing the page from blocks…")
    page_type = brief.get("type") or "explainer"
    intro = f"""Draft a complete HIPL Explorations entry as structured data.

Topic: {brief['topic']}
Series: {brief.get('series_name') or brief.get('series')}
Page type: {page_type}. {SHAPES.get(page_type, '')}
Level: {brief.get('level') or 'Beginner'}. Target read time: about {brief.get('read') or 10} minutes.
Interactive element wanted: {brief.get('element') or 'choose what serves the topic best'}

Editor's notes:
{brief.get('notes') or '(none)'}

Links the editor suggested: {brief.get('links') or '(none)'}

Blocks you can use (each block is an object with a "type" and the listed fields; fill every field, using "" or [] when a field doesn't apply):
{block_catalogue()}

Requirements:
- Build an immersive, interactive page in the spirit of the samples: lead with the hook, use 8-16 blocks, and include at least two interactive blocks (knowledge_cards, meaning_layers, scenarios, dilemma, compare, characters, map, timeline or poll) that genuinely fit the topic.
- Dilemma and scenario perspectives present several readings; never score or name a "correct" answer.
- Map points need real latitude/longitude for the language region (South and Southeast Asia only); set on_map false for items with no single region.
- "sources" is the numbered list the [^n] markers point to. Mark verify=true on any source or quotation you have not confirmed.
- "editor_notes": a short checklist for the fact-checker: every VERIFY item, every sensitive point, and what an expert reviewer should look at.
- "slug": lowercase words joined by hyphens."""
    content = []
    if brief.get("article"):
        content.append({"type": "text", "text": f"<article_from_editor>\n{brief['article']}\n</article_from_editor>"})
    content += attachments_to_content(brief.get("attachments"))
    if notes:
        content.append({"type": "text", "text": f"<research_notes>\n{notes}\n</research_notes>"})
    content.append({"type": "text", "text": intro})
    try:
        msg = _call(client, log, model=model, system=EDITORIAL_RULES, messages=[{"role": "user", "content": content}],
                    output_config={"effort": "high", "format": {"type": "json_schema", "schema": entry_json_schema()}})
    except AIError as e:
        if "rejected" not in str(e):
            raise
        # Some accounts or schema limits refuse the large structured-output schema: ask for plain JSON instead.
        log("Retrying without a strict schema…")
        content[-1] = {"type": "text", "text": intro + "\n\nReply with only one JSON object with keys: title, slug, hook, level, read, topics, element, blocks, sources, editor_notes."}
        msg = _call(client, log, model=model, system=EDITORIAL_RULES, messages=[{"role": "user", "content": content}],
                    output_config={"effort": "high"})
    _check(msg)
    entry = parse_json(_text(msg))
    log("Draft ready.")
    return clean_entry(entry)


def assist_block(block, instruction, context, api_key=None, model=None):
    """Rewrite one block according to an editor's instruction, keeping its type."""
    btype = block.get("type")
    if btype not in BLOCKS:
        raise AIError("Unknown block type.")
    client = make_client(api_key)
    prompt = f"""Here is one block of the HIPL Explorations entry "{context.get('title', '')}" ({context.get('hook', '')}).

Block type: {btype} ({BLOCKS[btype]['label']}: {BLOCKS[btype]['help']})
Current block:
{json.dumps(block, ensure_ascii=False, indent=2)}

Editor's instruction: {instruction}

Return the revised block. Keep the same type. Follow the editorial rules; keep or add [VERIFY] markers where anything is uncertain."""
    msg = _call(client, print, model=model or DEFAULT_MODEL, system=EDITORIAL_RULES, max_tokens=16000,
                messages=[{"role": "user", "content": prompt}],
                output_config={"effort": "medium", "format": {"type": "json_schema", "schema": block_json_schema([btype])}})
    _check(msg)
    try:
        return clean_block(json.loads(_text(msg)))
    except json.JSONDecodeError as e:
        raise AIError("The revision came back in an unexpected shape. Please try again.") from e


def parse_json(text):
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        m = re.search(r"\{.*\}", text, re.S)
        if m:
            try:
                return json.loads(m.group(0))
            except json.JSONDecodeError:
                pass
    raise AIError("The draft came back in an unexpected shape. Please try again.")


def clean_block(b):
    t = b.get("type")
    if t not in BLOCKS:
        return None
    out = {"type": t}
    for fd in BLOCKS[t]["fields"]:
        out[fd["name"]] = b.get(fd["name"], [] if fd["kind"] == "list" else "")
    return out


def clean_entry(e):
    e["blocks"] = [b for b in (clean_block(b) for b in e.get("blocks") or []) if b]
    e["slug"] = re.sub(r"[^a-z0-9]+", "-", (e.get("slug") or e.get("title") or "draft").lower()).strip("-")[:60]
    e["status"] = "draft"
    e["made_with"] = "ai-composer"
    return e
