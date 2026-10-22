"""A small, safe Markdown renderer for HIPL content written in the CMS.

Supports: paragraphs, ## / ### headings, > quotes, - and 1. lists,
**bold**, *italic*, [links](url), [[concept]] pop-ups, [^n] footnotes and
[VERIFY] markers. All other HTML is escaped, so editors and the AI composer
cannot inject markup.
"""

import html
import re

CLAIM_KINDS = {"text", "tradition", "historians", "debate", "asks"}


def _link(url, root):
    url = url.strip()
    if re.match(r"^(https?:|mailto:|#)", url):
        return url
    if url.startswith("/"):
        return root + url.lstrip("/")
    if re.match(r"^[a-z]+:", url, re.I):  # javascript:, data: and friends
        return "#"
    return root + url


def inline(text, root="", concepts=None):
    s = html.escape(text, quote=True)
    s = re.sub(r"\[VERIFY[^\]]*\]", '<span class="verify">VERIFY</span>', s)
    s = re.sub(r"\[\^(\d+)\]", r'<sup class="fn"><a href="#src-\1">\1</a></sup>', s)

    def concept(m):
        label = m.group(1)
        key = label.split("|")[0].strip().lower()
        shown = label.split("|")[-1].strip()
        key = re.sub(r"[^a-z]", "", key.translate(str.maketrans("āīūṛṣśṇṃḥ", "aiurssnmh")))
        return f'<button class="concept" data-concept="{key}">{shown}</button>'

    s = re.sub(r"\[\[([^\]]+)\]\]", concept, s)
    s = re.sub(r"\[([^\]]+)\]\(([^)\s]+)\)", lambda m: f'<a href="{html.escape(_link(html.unescape(m.group(2)), root), quote=True)}">{m.group(1)}</a>', s)
    s = re.sub(r"\*\*(.+?)\*\*", r"<b>\1</b>", s)
    s = re.sub(r"(?<![\w*])\*(?!\s)(.+?)(?<!\s)\*(?![\w*])", r"<i>\1</i>", s)
    return s


def render(text, root="", concepts=None):
    if not text:
        return ""
    out = []
    blocks = re.split(r"\n\s*\n", text.strip().replace("\r\n", "\n"))
    for b in blocks:
        lines = b.split("\n")
        first = lines[0]
        if first.startswith("### "):
            out.append(f"<h3>{inline(first[4:], root)}</h3>")
            rest = "\n".join(lines[1:]).strip()
            if rest:
                out.append(render(rest, root))
        elif first.startswith("## "):
            out.append(f"<h2>{inline(first[3:], root)}</h2>")
            rest = "\n".join(lines[1:]).strip()
            if rest:
                out.append(render(rest, root))
        elif all(l.startswith(">") for l in lines):
            q = " ".join(l.lstrip("> ").strip() for l in lines)
            out.append(f'<blockquote class="pull"><p>{inline(q, root)}</p></blockquote>')
        elif all(re.match(r"^\s*[-*] ", l) for l in lines):
            items = "".join("<li>" + inline(re.sub(r"^\s*[-*] ", "", l), root) + "</li>" for l in lines)
            out.append(f"<ul>{items}</ul>")
        elif all(re.match(r"^\s*\d+[.)] ", l) for l in lines):
            items = "".join("<li>" + inline(re.sub(r"^\s*\d+[.)] ", "", l), root) + "</li>" for l in lines)
            out.append(f"<ol>{items}</ol>")
        else:
            out.append(f"<p>{inline(' '.join(l.strip() for l in lines), root)}</p>")
    return "\n".join(out)


def plain(text, limit=None):
    """Markdown to plain text, for excerpts and share cards."""
    t = re.sub(r"\[\[([^\]|]+\|)?([^\]]+)\]\]", r"\2", text or "")
    t = re.sub(r"\[([^\]]+)\]\([^)]+\)", r"\1", t)
    t = re.sub(r"\[\^\d+\]|\[VERIFY[^\]]*\]", "", t)
    t = re.sub(r"[*#>]+", "", t)
    t = re.sub(r"\s+", " ", t).strip()
    if limit and len(t) > limit:
        t = t[: limit - 1].rsplit(" ", 1)[0] + "…"
    return t
