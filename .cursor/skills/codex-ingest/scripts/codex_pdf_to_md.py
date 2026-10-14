"""Geometry pass for Alignos codex PDFs -> house-style markdown draft + review report.

Handles only what the PDF geometry states as fact:
  paragraph vs. hard break vs. word wrap, heading tiers, bold/italic spans,
  bullets, rules, and removal of print-layout furniture.
Everything that needs judgment (print-only prose, tables, registry layout,
heading semantics) is surfaced in the report for the AI/human review pass.

Usage:
  python codex_pdf_to_md.py <in.pdf> <out.md> [--title "Title"] [--speakers Sovereign,Lumina]
Writes <out.md> and <out>.report.md next to it.
"""
import argparse
import re
import sys
from collections import Counter
from pathlib import Path

import fitz

ZW = "\u200b"
WEIGHTS = {"thin": 0, "extralight": 0, "light": 1, "regular": 2, "book": 2, "medium": 3,
           "semibold": 4, "demibold": 4, "bold": 5, "extrabold": 6, "black": 7}
BULLETS = {"●", "•", "◦", "▪", "■", "–"}
LABEL_RE = re.compile(r"^(?:(?:Section|Part|Chapter|Movement)\s+)?[IVXLC]+\.?$|^(?:Section|Part|Chapter)\s+\d+$", re.I)
TOC_HEAD_RE = re.compile(r"^(table of )?contents$", re.I)
NOTE_HEAD_RE = re.compile(r"^note to (the )?readers?$", re.I)
PROMO_RE = re.compile(r"alignos\.io|coherenceacrossscales|cosmiccreation|can be found on|over \d+ codices|"
                      r"download|printable|print edition|see page|on page \d+|\bpage \d+\b", re.I)
FOOTER_RE = re.compile(r"^(page\s*)?\d+(\s*(of|/)\s*\d+)?$", re.I)


def font_style(font, flags):
    name = font.split("+")[-1]
    family, _, suffix = name.partition("-")
    s = suffix.lower()
    italic = "italic" in s or "oblique" in s or bool(flags & 2)
    s = s.replace("italic", "").replace("oblique", "")
    weight = WEIGHTS.get(s or "regular", 2)
    if bool(flags & 16) and weight < 5:
        weight = max(weight, 5)
    return family, weight, italic


class Line:
    def __init__(self, page, bbox, spans):
        self.page = page
        self.spans = spans          # list of dict(text, size, family, weight, italic, x0, x1, chars)
        self.ends_marker = False
        raw = "".join(s["text"] for s in spans)
        self.ends_marker = raw.rstrip(" ").endswith(ZW)
        self.text = re.sub(r"\s+", " ", raw.replace(ZW, "")).strip()
        vis = [c for s in spans for c in s["chars"] if c[0].strip() and c[0] != ZW]
        self.x0 = min(c[1] for c in vis)
        self.x1 = max(c[3] for c in vis)
        self.y0, self.y1 = bbox[1], bbox[3]
        texty = [s for s in spans if s["text"].replace(ZW, "").strip() and not s["symbol"]]
        self.size = max((s["size"] for s in texty), default=max(s["size"] for s in spans))
        self.texty = texty
        self.kind = "body"
        self.level = None

    def first_word_width(self):
        chars = [c for s in self.spans for c in s["chars"] if c[0] != ZW]
        while chars and not chars[0][0].strip():
            chars.pop(0)
        if not chars:
            return 0
        end = chars[0][3]
        for c in chars:
            if not c[0].strip():
                break
            end = c[3]
        return end - chars[0][1]

    def all_italic(self):
        return bool(self.texty) and all(s["italic"] for s in self.texty)

    def max_weight(self):
        return max((s["weight"] for s in self.texty), default=0)


def extract(doc):
    pages = []
    for pno, page in enumerate(doc):
        lines = []
        for b in page.get_text("rawdict")["blocks"]:
            for ln in b.get("lines", []):
                spans = []
                for s in ln["spans"]:
                    chars = [(c["c"], c["bbox"][0], c["bbox"][1], c["bbox"][2], c["bbox"][3]) for c in s["chars"]]
                    text = "".join(c[0] for c in chars)
                    if not text:
                        continue
                    family, weight, italic = font_style(s["font"], s["flags"])
                    spans.append(dict(text=text, size=round(s["size"], 1), family=family, weight=weight,
                                      italic=italic, chars=chars, symbol=False))
                if not spans:
                    continue
                if not "".join(s["text"] for s in spans).replace(ZW, "").strip():
                    if lines and ZW in "".join(s["text"] for s in spans):
                        lines[-1].ends_marker = True
                    continue
                lines.append(Line(pno, ln["bbox"], spans))
        lines.sort(key=lambda l: (round(l.y0), l.x0))
        rules = []
        for d in page.get_drawings():
            r = d["rect"]
            if r.width > page.rect.width * 0.4 and r.height < 4:
                rules.append(r.y0)
        img_area = 0
        for info in page.get_image_info():
            bb = fitz.Rect(info["bbox"]) & page.rect
            img_area += bb.width * bb.height
        pages.append(dict(lines=lines, rules=sorted(rules), h=page.rect.height, w=page.rect.width,
                          img_frac=img_area / (page.rect.width * page.rect.height)))
    return pages


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("pdf")
    ap.add_argument("out")
    ap.add_argument("--title")
    ap.add_argument("--speakers", default="Sovereign,Lumina,You said,Lumina said,James")
    a = ap.parse_args()

    doc = fitz.open(a.pdf)
    pages = extract(doc)
    report = {"removed": [], "flags": []}
    speakers = {s.strip().lower() for s in a.speakers.split(",") if s.strip()}

    # Dominant family = text font; other families (MS-PGothic, ArialMT, ...) are glyph/symbol fonts.
    fam = Counter()
    for p in pages:
        for l in p["lines"]:
            for s in l.spans:
                fam[s["family"]] += len(s["text"].strip())
    text_family = fam.most_common(1)[0][0]
    for p in pages:
        for l in p["lines"]:
            for s in l.spans:
                s["symbol"] = s["family"] != text_family
            l.texty = [s for s in l.spans if s["text"].replace(ZW, "").strip() and not s["symbol"]]
            if l.texty:
                l.size = max(s["size"] for s in l.texty)

    sizes = Counter()
    weights = Counter()
    for p in pages:
        for l in p["lines"]:
            for s in l.texty:
                sizes[s["size"]] += len(s["text"])
                if not s["italic"]:
                    weights[s["weight"]] += len(s["text"])
    body = sizes.most_common(1)[0][0]
    body_w = weights.most_common(1)[0][0]

    # ---- print-layout furniture -------------------------------------------------
    head_counts = Counter(l.text for p in pages for l in p["lines"] if l.y0 < 80 and l.size < body - 1)
    running = {t for t, n in head_counts.items() if n >= max(3, len(pages) // 3)}
    title = a.title or (sorted(running, key=len)[-1].removeprefix("Codex:").strip() if running else Path(a.pdf).stem)

    def drop(p, l, why):
        report["removed"].append((l.page + 1, why, l.text))

    norm = lambda s: re.sub(r"[^a-z0-9]+", " ", s.lower().removeprefix("codex:")).strip()
    # The TOC is print-only, but it is the author's own outline: its entries are the top-level sections.
    toc_entries = set()
    for p in pages:
        if any(TOC_HEAD_RE.match(l.text) for l in p["lines"]):
            for l in p["lines"]:
                t = re.sub(r"\s*\d+$", "", l.text)
                t = re.sub(r"^(?:(?:section|part|chapter)\s+)?[IVXLC]+\.?\s+|^\d+\.?\s+", "", t, flags=re.I)
                if t and not TOC_HEAD_RE.match(t) and not FOOTER_RE.match(t):
                    toc_entries.add(norm(t))

    for pno, p in enumerate(pages):
        keep = []
        texts = [l.text for l in p["lines"]]
        if p["img_frac"] > 0.5:
            for l in p["lines"]:
                if l.text not in running and not FOOTER_RE.match(l.text):
                    drop(p, l, "cover page")
            p["lines"] = []
            report["removed"].append((pno + 1, "cover page", "[full-page image]"))
            continue
        toc = any(TOC_HEAD_RE.match(t) for t in texts)
        note = False
        for l in p["lines"]:
            if l.text in running and l.y0 < 80:
                continue
            if l.y0 > p["h"] * 0.82 and l.size < body and FOOTER_RE.match(l.text):
                continue
            if toc:
                drop(p, l, "table of contents page")
                continue
            if NOTE_HEAD_RE.match(l.text):
                note = True
            if note:
                drop(p, l, "note to readers")
                continue
            keep.append(l)
        p["lines"] = keep

    # ---- classify ---------------------------------------------------------------
    tnorm = norm(title)
    seen_heading = False
    head_sizes = set()
    for p in pages:
        for l in p["lines"]:
            if l.spans[0]["text"].replace(ZW, "").strip() in BULLETS:
                l.kind = "bullet"
                continue
            if l.text.rstrip(":").lower() in speakers and len(l.text) < 20:
                l.kind = "speaker"
                continue
            big = l.size >= body + 0.9
            # Large all-italic lines are epigraphs/subtitles, not headings.
            if big and not l.all_italic():
                if LABEL_RE.match(l.text):
                    l.kind = "label"
                elif norm(l.text) == tnorm and not seen_heading:
                    l.kind = "title"
                else:
                    l.kind = "heading"
                    if norm(l.text) not in toc_entries:
                        head_sizes.add(l.size)
                seen_heading = True
    tiers = sorted(head_sizes, reverse=True)
    first = 3 if toc_entries else 2
    level_of = {s: min(first + i, 4) for i, s in enumerate(tiers)}

    def heading_level(text, size, last_level):
        if norm(text) in toc_entries:
            return 2
        return level_of.get(size, 4)

    # ---- stream with rules ------------------------------------------------------
    stream = []
    for pno, p in enumerate(pages):
        items = [("line", l.y0, l) for l in p["lines"]] + [("rule", y, None) for y in p["rules"]]
        items.sort(key=lambda it: it[1])
        for kind, _, l in items:
            stream.append((kind, pno, l))

    right = sorted(l.x1 for p in pages for l in p["lines"] if l.kind == "body" and abs(l.size - body) < 0.5)
    right_margin = right[int(len(right) * 0.97)] if right else 500
    space_w = body * 0.28

    def is_wrap(prev, nxt):
        if prev.ends_marker:
            return False
        return prev.x1 + space_w + nxt.first_word_width() > right_margin - 1.5

    # ---- build blocks -----------------------------------------------------------
    blocks = []          # dict(kind, lines=[[runs]], level, text)
    cur = None
    prev = None
    unmarked_breaks = []

    def runs_of(l, styled=True):
        out = []
        for s in l.spans:
            t = s["text"].replace(ZW, "")
            if not t:
                continue
            if s["symbol"] or not styled:
                st = (False, False)
            elif s["size"] > body + 0.5:
                st = (s["italic"], False)
            else:
                st = (s["italic"], s["weight"] > body_w)
            out.append([t, st])
        return out

    def render_line(runs):
        merged = []
        for t, st in runs:
            if merged and merged[-1][1] == st:
                merged[-1][0] += t
            else:
                merged.append([t, st])
        out = ""
        for t, (it, bd) in merged:
            t = re.sub(r"\s+", " ", t)
            core = t.strip()
            if not core or not (it or bd):
                out += t
                continue
            mark = "***" if it and bd else ("**" if bd else "*")
            lead = t[: len(t) - len(t.lstrip())]
            trail = t[len(t.rstrip()):]
            out += f"{lead}{mark}{core}{mark}{trail}"
        out = re.sub(r" {2,}", " ", out).strip()
        return out

    def heading_text(l):
        # Headings carry only inline italics (a fully italic heading is just the heading's typeface).
        if l.all_italic():
            return l.text
        return render_line([[t, (it, False)] for t, (it, _) in runs_of(l)])

    def close():
        nonlocal cur
        if cur:
            blocks.append(cur)
        cur = None

    pending_label = None
    last_level = 1
    for kind, pno, l in stream:
        if kind == "rule":
            close()
            blocks.append(dict(kind="rule"))
            prev = None
            continue
        if l.kind in ("label", "title", "heading", "speaker"):
            close()
            if l.kind == "label":
                if pending_label:
                    blocks.append(dict(kind="heading", level=2, text=pending_label))
                pending_label = l.text
                prev = None
                continue
            if l.kind == "speaker":
                blocks.append(dict(kind="speaker", text=l.text.rstrip(":")))
                prev = None
                continue
            level = 2 if l.kind == "title" else heading_level(l.text, l.size, last_level)
            text = heading_text(l)
            if pending_label:
                sep = ": " if re.match(r"^(section|part|chapter|movement)\b", pending_label, re.I) else ". "
                text = pending_label.rstrip(".") + sep + text
                report["flags"].append(f"p{pno + 1}: merged label + heading -> `{text}`")
                pending_label = None
            last = blocks[-1] if blocks else None
            if (last and last["kind"] == "heading" and prev is not None and prev.kind in ("heading", "title")
                    and prev.page == l.page and l.y0 - prev.y1 < body * 0.6 and abs(prev.size - l.size) < 0.5
                    and prev.x1 + l.size * 0.28 + l.first_word_width() > right_margin - 1.5):
                last["text"] += " " + text
            else:
                blocks.append(dict(kind="heading", level=level, text=text))
                last_level = level
            prev = l
            continue
        if pending_label:
            blocks.append(dict(kind="heading", level=2, text=pending_label))
            pending_label = None

        if l.kind == "bullet":
            close()
            r = runs_of(l)
            while r and (r[0][0].strip() in BULLETS or not r[0][0].strip()):
                r.pop(0)
            while r and r[0][0].lstrip().startswith(tuple(BULLETS)):
                r[0][0] = r[0][0].lstrip()[1:]
            while r and not r[0][0].strip():
                r.pop(0)
            if r:
                r[0][0] = r[0][0].lstrip()
            cur = dict(kind="bullet", lines=[r])
            prev = l
            continue

        cont = (cur is not None and prev is not None and prev.kind in ("body", "bullet"))
        if cont:
            if prev.page == l.page:
                gap = l.y0 - prev.y1
                same_row = gap < -2
                para = gap > body * 0.6
            else:
                same_row = False
                para = not prev.ends_marker and not is_wrap(prev, l)
            if same_row:
                cur["lines"][-1].append([" | ", (False, False)])
                cur["lines"][-1].extend(runs_of(l))
                cur["table"] = True
                prev = l
                continue
            if para:
                close()
            elif is_wrap(prev, l):
                tail = cur["lines"][-1]
                nr = runs_of(l)
                st = tail[-1][1] if tail and nr and tail[-1][1] == nr[0][1] else (False, False)
                tail.append([" ", st])
                tail.extend(nr)
                prev = l
                continue
            else:
                if not prev.ends_marker:
                    unmarked_breaks.append(f"p{l.page + 1}: `{prev.text[-40:]}` / `{l.text[:40]}`")
                if cur["kind"] == "bullet":
                    close()
                else:
                    cur["lines"].append(runs_of(l))
                    prev = l
                    continue
        else:
            close()
        cur = dict(kind="para", lines=[runs_of(l)])
        prev = l
    close()
    if pending_label:
        blocks.append(dict(kind="heading", level=2, text=pending_label))

    # ---- render -----------------------------------------------------------------
    md = [f"# {title}"]
    for i, b in enumerate(blocks):
        if b["kind"] == "rule":
            if md[-1] != "---":
                md.append("---")
        elif b["kind"] == "heading":
            md.append("#" * b["level"] + " " + b["text"])
        elif b["kind"] == "speaker":
            md.append(f"**{b['text']}:**")
        elif b["kind"] == "bullet":
            item = "- " + render_line(b["lines"][0])
            if md and md[-1].startswith("- ") and i > 0 and blocks[i - 1]["kind"] == "bullet":
                md[-1] += "\n" + item
            else:
                md.append(item)
        else:
            text = "  \n".join(render_line(r) for r in b["lines"] if render_line(r))
            if b.get("table"):
                report["flags"].append(f"same-row text (table/columns?) -> `{text[:80]}`")
            if text:
                md.append(text)

    out = "\n\n".join(md).strip() + "\n"
    Path(a.out).write_text(out, encoding="utf-8", newline="\n")

    # ---- report -----------------------------------------------------------------
    for l in (l for p in pages for l in p["lines"]):
        if PROMO_RE.search(l.text):
            report["flags"].append(f"p{l.page + 1}: possible print-only/promo -> `{l.text}`")
    for pno, p in enumerate(pages):
        if 0.02 < p["img_frac"] <= 0.5:
            report["flags"].append(f"p{pno + 1}: inline image ({p['img_frac']:.0%} of page) - check for baked text")
    if "*" in "".join(l.text for p in pages for l in p["lines"]):
        report["flags"].append("literal `*` in source text - check emphasis rendering")
    rp = Path(a.out).with_suffix(".report.md")
    with rp.open("w", encoding="utf-8", newline="\n") as f:
        f.write(f"# Conversion report: {Path(a.pdf).name}\n\n")
        f.write(f"- title: {title}\n- text family: {text_family}; body {body}pt weight {body_w}; right margin {right_margin:.1f}\n")
        f.write(f"- heading tiers (pt -> level): {', '.join(f'{s}->h{level_of[s]}' for s in tiers)}\n")
        f.write(f"- running header(s) stripped: {sorted(running)}\n\n## Removed as print-only\n\n")
        for pg, why, t in report["removed"]:
            f.write(f"- p{pg} [{why}] {t}\n")
        f.write("\n## Flags for review\n\n")
        for fl in report["flags"]:
            f.write(f"- {fl}\n")
        f.write(f"\n## Hard breaks without a U+200B marker ({len(unmarked_breaks)})\n\n")
        for u in unmarked_breaks:
            f.write(f"- {u}\n")
    print(f"wrote {a.out} ({out.count(chr(10))} lines) and {rp.name}", file=sys.stderr)


if __name__ == "__main__":
    main()
